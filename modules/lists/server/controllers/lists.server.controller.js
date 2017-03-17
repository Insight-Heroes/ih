'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
    mongoose = require('mongoose'),
    async = require('async'),
    List = mongoose.model('List'),
    ListContact = mongoose.model('ListContact'),
    ListContactPublished = mongoose.model('ListContactPublished'),
    PublishedHistory = mongoose.model('PublishedHistory'),
    Project = mongoose.model('Project'),
    Survey = mongoose.model('Survey'),
    chalk = require('chalk'),
    config = require(path.resolve('./config/config')),
    nodemailer = require('nodemailer'),
    parameters = require('strong-params').Parameters,
    // pdf = require('html-pdf'),
    http = require('http'),
    utils = require(path.resolve('./modules/core/server/utilities/utils.server')),
    errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
    _ = require('lodash');


var smtpTransport = nodemailer.createTransport(config.mailer.options);

exports.generatePdf = function(req, res) {
    var httpTransport = 'http://';
    if (config.secure && config.secure.ssl === true) {
        httpTransport = 'https://';
    }
    async.waterfall([
    function (done) {
        res.render(path.resolve('modules/lists/server/templates/publishSurvey-email'), {
            name: 'Test Generate Pdf',
            appName: config.app.title,
            url: httpTransport + 'www.npmjs.com/package/html-pdf'
        }, function (err, pdfHTML) {
            done(err, pdfHTML);
        });
    },
    function (pdfHTML, done) {
        var pdf;
        console.log(pdfHTML);
        if (pdfHTML) {
            pdf.create(pdfHTML).toFile('./public/pdf/testpdf.pdf', function(err, resp) {
                console.log(resp); // { filename: '/app/businesscard.pdf' }
                done(err, resp);
            });
        } else {
            done(null);
        }
    }
    ], function (err, resp) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            res.json({ msg: 'Pdf generated successfully' });
        }
    });
};

/**
 * Function to whitelist list parameters from request
 * @param  {Object} req request object
 * @return {Object}     Whitelisted list parameter hash(object)
 */
function listParams(rawParams) {
        var params = parameters(rawParams);
        return params.permit('name', 'fromEmail', 'fromName', 'companyName', 'address', 'zipcode', 'state', 'country', 'mobileNo').value();
}

/**
 * Create a List
 */
exports.create = function(req, res) {
    var list = new List(listParams(req.body));
    list.user = req.user.parentId();

    list.save(function(err) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            res.jsonp(list);
        }
    });
};

/**
 * Show the current List
 */
exports.read = function(req, res) {
    // convert mongoose document to JSON
    var list = req.list ? req.list.toJSON() : {};
    res.jsonp(list);
};

/**
 * Update a List
 */
exports.update = function(req, res) {
    var list = req.list;

    list = _.extend(list, listParams(req.body));

    list.save(function(err) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            res.jsonp(list);
        }
    });
};

/**
 * Delete an List
 */
exports.delete = function(req, res) {
    var list = req.list;
    removeListContacts(null, list, callback);

    /**
     * Delete contacts of list callback
     * @param  {Object}   err error/exception description
     * @param  {Array}   deletedContacts Deleted contacts
     */
    function callback(err, deletedContacts) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        }
        list.remove(function(e) {
            if (e) {
                return res.status(400).send({
                    message: errorHandler.getErrorMessage(e)
                });
            } else {
                res.jsonp(list);
            }
        });
    }
};

/**
 * List of Lists
 */
exports.list = function(req, res) {
    List.find({ user: req.user.parentId() }).lean().sort('-created').populate('user').exec(function(err, lists) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        }
        // Fetch count of list contacts
        ListContact.aggregate(
           { $group: { _id: { list: '$list' }, count: { $sum: 1 } } }
        ).exec(function(e, listContactCount) {
            var counts = getObjectOfCount(listContactCount);
            attachListContactCountToList(counts);
            if (e) {
                return res.status(400).send({
                    message: errorHandler.getErrorMessage(err)
                });
            } else {
                res.jsonp(lists);
            }
        });

        /**
         * Format the count object
         * @param  {Array} array which contains list if and contact count for list
         * @return {Object} Properly formatted object which will contain list id as key and value will be count
         */
        function getObjectOfCount(listContactCount) {
            var counts = {};
            listContactCount.forEach(function(countObj) {
                counts[countObj._id.list] = countObj.count;
            });
            return counts;
        }

        /**
         * Copies count of list contact to lists
         * @param  {Object} counts Output object of function getObjectOfCount
         */
        function attachListContactCountToList(counts) {
            lists.forEach(function(l) {
                if (counts[String(l._id)]) {
                    console.log(l.name, counts[String(l._id)]);
                    l.contactCount = counts[String(l._id)];
                } else {
                    l.contactCount = 0;
                }
            });
        }

    });
};

/**
 * Get contacts of this list
 */
exports.getContacts = function(req, res) {
    ListContact.findAll({
        user: req.user.parentId()
    }, function(err, contacts) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            res.jsonp(contacts);
        }
    });
};

/**
 * add contacts to list
 * req.query expected parameters format
 * {
 *   listHeaders: {designation: 'Designation'},
 *   contacts: [
 *     { designation: 'Tech Lead', email: 'kalpesh@promobitech.com', firstname: 'Kalpesh', lastname: 'Fulpagare' }
 *     { designation: 'UI Developer', email: 'sibu@promobitech.com', firstname: 'Sibu', lastname: 'Stephen' }
 *   ]
 * }
 */
exports.addContacts = function(req, res) {
    var headers = req.body.headers,
        respondentType = req.body.respondentType;
    var list = req.list;
    if (_.size(headers) > 0) {
        if (_.size(list.contactHeaders) === 0) {
            list.contactHeaders = utils.defaultCSVColumns;
        }
        _.merge(headers, list.contactHeaders);
        list.contactHeaders = headers;
        list.save(function(err, l) {
            if (err) {
                console.log('ERROR: ', chalk.red.bold(JSON.stringify));
            }
        });
    }

    var contacts = req.body.contacts;
    // console.log('contacts', contacts);
    if (contacts.length === 0) {
        return res.status(400).send({
            message: 'Can not create contact. No contact supplied.'
        });
    }
    var contactsArray = [];
    contacts.forEach(function(c) {
        var contact = {};
        utils.defaultCSVColumns().forEach(function(k, i) {
            contact[k] = c[k];
            delete c[k];
        });
        contact.data = c;
        contact.user = req.user.parentId();
        contact.list = list._id;
        contact.respondentType = respondentType;
        contactsArray.push(contact);
    });

    async.each(contactsArray, function(c, callback) {
        // Perform operation on contact here.
        // console.log('Processing contact ' + c);
        console.log('Saving contact: ', c);
        ListContact.findOne({
            user: list.user,
            list: list._id,
            email: c.email
        }, function(err, lc) {
            if (err) callback(err);
            if (lc) {
                _.each(c, function(val, key) {
                    lc[key] = val;
                });
            } else {
                lc = new ListContact(c);
            }
            lc.save(function(err, listContact) {
                callback(err, listContact);
            });
        });
    }, function(err) {
        if (err) {
            res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            res.json({
                contacts: contactsArray
            });
        }
    });

};

/**
 * delete contacts from list
 * req.query expected parameters format
 * {
 *   contactIds: ['abcd', 'efg', 'ghij', 'klm']
 * }
 */
exports.deleteContacts = function(req, res) {
    var list = req.list;
    var callback = function(err, records) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            res.jsonp(records);
        }
    };
    removeListContacts(req, list, callback);
};

/**
 * Empty list i.e. delete contacts of the list
 * @param  {Object}   list - list object
 * @param  {Function} callback Callback function when delete operation is completed
 */
function removeListContacts(req, list, callback) {
    var conditions = {
        list: list._id
    };
    if (req) {
        conditions._id = {
            $in: req.contactIds
        };
    }
    ListContact.find(conditions).remove(function(err, records) {
        callback(err, records);
    });
}

/**
 * List middleware
 */
exports.listByID = function(req, res, next, id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send({
            message: 'List is invalid'
        });
    }
    List.findOne({
        _id: id,
        user: req.user.parentId()
    }).populate('user', 'project').exec(function (err, list) {
        if (err) {
            return next(err);
        } else if (!list) {
            return res.status(404).send({
                message: 'No List with that identifier has been found'
            });
        }
        req.list = list;
    console.log(chalk.bold.red(JSON.stringify(req.list)));
        next();
    });
};

exports.published = function(req, res) {
    var currentUser = req.user.parentId();
    var listsPublishedProj = [];
    async.waterfall([
    function (done) {
        Project.find({ user: currentUser }).exec(function(err, projects) {
            done(err, projects);
        });
    },
    function (projects, done) {
        if (projects.length > 0) {
            projects.forEach(function(proj, key) {
                ListContactPublished.find({ surveyId: { $in: proj.surveys } }).exec(function(err, publishedList) {
                    var obj = {};
                    obj.project = proj._id;
                    obj.publishedCnt = publishedList.length;
                    listsPublishedProj.push(obj);
                    if ((projects.length - 1) === key) {
                        done(err, listsPublishedProj);
                    }
                });
            });
        } else {
            done(null, listsPublishedProj);
        }
    }
    ], function (err, listsPublishedProj) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            res.json(listsPublishedProj);
        }
    });
};

// Get selected list and email to contacts
exports.processPublishSurvey = function(req, res) {
    var httpTransport = 'http://';
    if (config.secure && config.secure.ssl === true) {
        httpTransport = 'https://';
    }

    var surveyId = req.body.surveyId;
    var surveyToken = req.body.surveyToken;
    var mailSent = false;
    var allLists = [];
    var surveyName;

    async.each(req.body.processPublishArr, function(listsContacts, mainCallback) {
        var surveyPublished = {};
        surveyPublished.surveyId = surveyId;
        surveyPublished.listContactsId = listsContacts._id;
        surveyPublished.listId = listsContacts.list;

        if (allLists.indexOf(listsContacts.list) < 0) {
            allLists.push(listsContacts.list);
        }

        async.waterfall([
        function (done) {
            Survey.findById(surveyId).exec(function (err, survey) {
                if (err) {
                  done(err, null);
                } else {
                    surveyName = survey.name;
                    console.log('surveyName : ', surveyName);
                    done(null, surveyName);
                }
            });
        },
        function (surveyName, done) {
            var displayName;
            if (listsContacts.firstname && listsContacts.lastname) {
                displayName = 'Dear ' + listsContacts.firstname + ' ' + listsContacts.lastname + ',';
            } else if (listsContacts.firstname && !listsContacts.lastname) {
                displayName = 'Dear ' + listsContacts.firstname + ',';
            } else if (!listsContacts.firstname && listsContacts.lastname) {
                displayName = 'Dear ' + listsContacts.lastname + ',';
            } else {
                displayName = 'Dear User,';
            }

            res.render(path.resolve('modules/lists/server/templates/publishSurvey-email'), {
                name: displayName,
                surveyName: surveyName,
                appName: config.app.title,
                url: httpTransport + req.headers.host + '/r/' + surveyToken
            }, function (err, emailHTML) {
                done(err, emailHTML);
            });
        },
        function (emailHTML, done) {
            var mailOptions = {
            to: listsContacts.email,
            from: config.mailer.from,
            subject: 'New Project Alert!',
            html: emailHTML
            };

            smtpTransport.sendMail(mailOptions, function (err) {
                ListContactPublished.find({ surveyId: surveyId, listContactsId: listsContacts._id }).exec(function(err, result) {
                    if (result.length > 0) {
                        mailSent = true;
                    } else {
                        var contPublish = new ListContactPublished(surveyPublished);
                        contPublish.save(function(err) {
                            if (!err) {
                                mailSent = true;
                            }
                        });
                        allLists.forEach(function(list) {
                            PublishedHistory.findOne({ list: list }).exec(function(err, resp) {
                                if (!resp) {
                                    var publishedData = {};
                                    publishedData.survey = surveyId;
                                    publishedData.publishType = 'list';
                                    publishedData.list = list;
                                    var publishedHistory = new PublishedHistory(publishedData);
                                    publishedHistory.save();
                                }
                            });
                        });
                    }
                    done(err, mailSent);
                });
            });
        }],
        function (err) {
            mainCallback(err);
        });
    }, function(err) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            if (mailSent) {
                Survey.findOneAndUpdate({ _id: surveyId }, { publish: true }, { upsert: true }, function(err, result) { });

                return res.json({
                    message: 'Email sent successfully!!'
                });
            } else {
                return res.json({
                    message: 'Email sent successfully!!'
                });
            }
        }
    });
};

// Get lists of respondants types and their counts with different types
exports.publishSurvey = function(req, res) {
    var listsIds = [];
    var newResp = [];
    var publisedArr = [];
    for (var i = 0; i < req.body.lists.length; i++) {
        var neele = new mongoose.Types.ObjectId(req.body.lists[i]);
        listsIds.push(neele);
    }
    var surveyId = req.body.surveyId;
    async.waterfall([
    function(done) {
        ListContactPublished.find({ surveyId: surveyId, listId: { $in: listsIds } }).exec(function(err, publishedList) {
            done(err, publishedList);
        });
    }, function (publishedList, done) {
        for (var n = 0; n < publishedList.length; n++) {
            publisedArr.push(publishedList[n].listContactsId);
        }
        ListContact.aggregate({ $match: { list: { $in: listsIds } } }, { $group: { _id: '$respondentType', count: { $sum: 1 } } }
        ).exec(function(err, resp) {
                if (resp) {
                    for (var j = 0; j < resp.length; j++) {
                        var obj = {};
                        obj.respondentType = resp[j]._id;
                        obj.count = resp[j].count;
                        newResp.push(obj);
                    }
                }
                done(err, newResp);
        });
    }, function(newResp, done) {
        ListContact.find({ list: { $in: listsIds }, _id: { $nin: publisedArr } }).sort('respondentType').exec(function(err, respContacts) {
            done(err, respContacts);
        });
    }, function(respContacts, done) {
        // q = respContacts;
        ListContact.find({ _id: { $in: publisedArr } }).sort('respondentType').exec(function(err, rep) {
            var newrepsConts = _.concat(respContacts, rep);
            done(err, newrepsConts);
        });
    }
    ], function(err, newrepsConts) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            res.json({
                respondentCounts: newResp,
                listsData: newrepsConts
            });
        }
    });
};
