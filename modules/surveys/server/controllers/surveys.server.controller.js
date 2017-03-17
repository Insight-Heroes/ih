'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
    async = require('async'),
    chalk = require('chalk'),
    mongoose = require('mongoose'),
    Survey = mongoose.model('Survey'),
    UserResponse = mongoose.model('UserResponse'),
    PublishedHistory = mongoose.model('PublishedHistory'),
    ListContact = mongoose.model('ListContact'),
    Project = mongoose.model('Project'),
    Present = mongoose.model('Present'),
    Question = mongoose.model('Question'),
    Page = mongoose.model('Page'),
    LogicJump = mongoose.model('LogicJump'),
    User = mongoose.model('User'),
    randomString = require('randomstring'),
    _ = require('lodash'),
    parameters = require('strong-params').Parameters,
    uploader = require(path.resolve('./modules/core/server/utilities/uploader.server')),
    errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

/**
 * Function to whitelist survey parameters from a request
 * @param  {Object} req request object
 * @return {Object}     Whitelisted survey parameter hash(object)
 */
function surveyParams(rawParams) {
    var params = parameters(rawParams);
    return params.permit('name', 'description', 'project').value();
}

function generateUniqueToken(callback) {
    var uniqueCode = null,
        gotUniqueCode = false;
    async.whilst(
        function () {
            return (!gotUniqueCode);
        },
        function (callback) {
            uniqueCode = randomString.generate(10);
            Survey.findOne({ randomCode: uniqueCode }).count(function(err, c) {
                console.log('RandomCode: %s, Count: ', uniqueCode, c);
                if (err) {
                    console.log('There was an error executing the database query.');
                    callback(err);
                }
                gotUniqueCode = (c === 0);
                callback();
            });
        },
        function (err) {
            console.log('Callback OF RANDOM CODE Generation: ', uniqueCode);
            callback(err, uniqueCode);
        }
    );
}

/**
 * Create a survey
 */

exports.create = function (req, res) {
    var survey = new Survey(surveyParams(req.body));
    survey.user = req.user.parentId();
    generateUniqueToken(function(err, uniqueToken) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            console.log('Generated unique token: ', uniqueToken);
            survey.randomCode = uniqueToken;
            survey.save(function (err) {
                if (err) {
                    return res.status(400).send({
                        message: errorHandler.getErrorMessage(err)
                    });
                } else {
                    Project.findOneAndUpdate({ _id: req.body.project }, { $push: { surveys: survey._id } }, function(err, res) {
                        if (err) {
                            console.log('Something wrong when updating data!');
                        }
                        // console.log(res);
                    });
                    console.log('survey : ', survey);
                    res.json(survey);
                }
            });
        }
    });
};

/**
 * List of Surveys
 */
exports.list = function (req, res) {
    Survey.find({ user: req.user.parentId(), project: req.query.projectId }).sort('-created').populate('user', '-password -confirmationToken -confirmationTokenExpires').exec(function (err, surveys) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            surveys.forEach(function(survey) {
                UserResponse.find({ survey: survey._id }).count(function (err, userResponsesCount) {
                    if (err) {
                        return res.status(400).send({
                            message: errorHandler.getErrorMessage(err)
                        });
                    } else {
                        // console.log('userResponsesCount : ', userResponsesCount);
                        survey.userResponses = userResponsesCount;
                        survey.save(function (err) {
                            if (err) {
                                return res.status(400).send({
                                    message: errorHandler.getErrorMessage(err)
                                });
                            }
                        });
                        // console.log('survey : ', survey);
                        // return userResponsesCount;
                    }
                });
            });
            console.log('surveys : ', surveys);
            res.json(surveys);
        }
    });
};
/**
 * Survey middleware
 */
exports.surveyByID = function (req, res, next, id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send({
            message: 'Survey id is invalid'
        });
    }
    Survey.findOne({ _id: id, user: req.user.parentId() }).populate('user questions pages').exec(function (err, s) {
        if (err) {
            return next(err);
        } else if (!s) {
            return res.status(404).send({
                message: 'Survey not found'
            });
        } else {
            req.survey = s;
            next();
        }
    });
};

/**
 * Show the current survey
 */
exports.read = function (req, res) {
    // convert mongoose document to JSON
    var survey = req.survey ? req.survey : {},
        pages,
        questions,
        jumps;
    var surv = survey;
    survey.lastOpenedOn = Date.now();
    async.waterfall([function(done) {
        survey.save(function (err, s) {
            done(err, s);
        });
    }, function(s, done) {
        Question.find({
            survey: s._id
        }, function(err, qs) {
            questions = qs;
            done(err, s);
        });
    }, function(s, done) {
        Page.find({
            survey: s._id
        }, function(err, pgs) {
            pages = pgs;
            done(err, s);
        });
    }, function(s, done) {
        LogicJump.find({ survey: survey._id }).populate(' jumps ').exec(function (err, jmps) {
            jumps = jmps;
           done(err);
        });
    }], function(err) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        }
        var surveyJson = JSON.parse(JSON.stringify(survey));
        surveyJson.jumps = jumps;
        surveyJson.questions = questions;
        surveyJson.pages = pages;
        res.json(surveyJson);
    });
};

/**
 * Update an survey
 */
exports.update = function (req, res) {
    var survey = req.survey,
        filteredParams = surveyParams(req.body);

    for (var key in filteredParams) {
        if (filteredParams.hasOwnProperty(key))
            survey[key] = filteredParams[key];
    }

    generateUniqueToken(function(err, uniqueToken) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            if (!survey.randomCode) {
                console.log('Generated unique token: ', uniqueToken);
                survey.randomCode = uniqueToken;
            }
            survey.save(function (err) {
                if (err) {
                    return res.status(400).send({
                        message: errorHandler.getErrorMessage(err)
                    });
                } else {
                    res.json(survey);
                }
            });
        }
    });
};

/**
 * Delete a survey
 */
exports.delete = function (req, res) {
    var survey = req.survey;

    survey.remove(function (err) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            /* find each questions by id and remove with s3 images */
            survey.questions.forEach(function(quesIds) {
                /* Find each question under survey and delete with images from s3 */
                Question.findOne({ _id: quesIds }).exec(function (err, quesdata) {
                    if (quesdata !== null) {
                        var quesdatajs = JSON.parse(JSON.stringify(quesdata));
                        async.each(quesdatajs.mediaFiles, function(file, callback) {
                            if (file.url) {
                            uploader.delete(file.url, function(err, deleteResponse) {
                               callback(err, deleteResponse);
                            });
                            } else {
                               callback();
                            }
                        }, function(err) {
                            // done(err);
                        });
                        quesdata.remove();
                    }
                });
            });

            Project.findOneAndUpdate({ _id: req.survey.project }, { $pull: { surveys: survey._id } }, function(err, res) {
                if (err) {
                    console.log('Error when deleting survey from project!');
                }
            });

            Present.find({ survey: survey._id }).remove().exec(function (err, response) {
                if (err) {
                    console.log('Error when deleting storyboards of survey!');
                }
            });

            LogicJump.find({ survey: survey._id }).remove().exec(function (err, response) {
                if (err) {
                    console.log('Error when deleting LogicJumps of survey!');
                }
            });

            res.json(survey);
        }
    });
};

var saveOrdering = exports.saveOrdering = function(s, positions, mainCallback) {
    var survey;
    console.log(chalk.red.bold('Positions:'), positions);
    async.waterfall([function(done) {
        Question.find({
            survey: s._id
        }, function(err, questions) {
            done(err, questions);
        });
    }, function(questions, done) {
        Page.find({
            survey: s._id
        }, function(err, pages) {
            done(err, questions, pages);
        });
    }, function(questions, pages, done) {
        survey = {
            questions: questions,
            pages: pages
        };
        done();
    }, function(done) {
        // Questions reordering
        async.forEach(survey.questions, function (question, callback) {
            var questionID = question._id.toString();
            if (positions.questions.hasOwnProperty(questionID)) {
                question.position = positions.questions[questionID];
                question.save(function(err, s) {
                    callback(err);
                });
            } else {
                callback();
            }
        }, function(err) {
            done(err);
        });
    }, function(done) {
        // Pages in Questions reordering
        async.forEach(survey.pages, function (page, callback) {
            var pageID = page._id.toString();
            if (positions.customPages.hasOwnProperty(pageID)) {
                page.position = positions.customPages[pageID];
                page.inQuestions = true;
                page.save(function(err, s) {
                    callback(err);
                });
            } else {
                callback();
            }
        }, function(err) {
            done(err);
        });

    }, function(done) {
        // Pages in pages reordering
        async.forEach(survey.pages, function (page, callback) {
            var pageID = page._id.toString();
            if (positions.pages.hasOwnProperty(pageID)) {
                page.position = positions.pages[pageID];
                page.inQuestions = false;
                page.save(function(err, s) {
                    callback(err);
                });
            } else {
                callback();
            }
        }, function(err) {
            done(err);
        });

    }], function(err) {
        mainCallback(err);
    });
};

/**
 * Reorder questions of Survey
 */
exports.reorderQuestions = function(req, res) {
    var survey = req.survey,
        positions = req.body.positions;
    function callback(err) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        }
        res.json(survey);
    }
    saveOrdering(survey, positions, callback);
};

/**
 * Get status of Survey
 * @param  {Object} req - req object contains all information of request
 * @param  {Object} res [description]
 */
exports.getStatus = function(req, res) {
    res.json({
        status: req.survey.status
    });
};

/**
 * Change status of Survey
 * @param  {Object} req - req object contains all information of request
 * @param  {Object} res [description]
 */
exports.updateStatus = function(req, res) {
    var survey = req.survey;
    survey.status = req.query.status;
    if (survey.status === 'published' && survey.questions.length === 0) {
        return res.status(400).send({
            message: 'Can not publish survey. There are no questions in the survey'
        });
    }
    survey.save(function(err, s) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        }
        res.json(s);
    });
};


exports.publishToGatherers = function (req, res) {
    var usersToPublish = req.body;
    var surveyId = req.params.surveyId;

    if (!mongoose.Types.ObjectId.isValid(surveyId)) {
        return res.status(400).send({
          message: 'Survey is invalid'
        });
    }

    User.find({ _id: { $in: usersToPublish }, roles: 'gatherer' }).exec(function(err, gathererUsers) {
        if (err) {
            console.log('Something wrong when getting lists of gatherer users!');
        }
        gathererUsers.forEach(function(users) {
            if (!(users.publishedSurveys.indexOf(surveyId) > -1)) {
                users.publishedSurveys.push(surveyId);
                users.save();

                Survey.findOneAndUpdate({ _id: surveyId }, { publish: true }, { upsert: true }, function(err, result) { });

                var publishedData = {};
                publishedData.survey = surveyId;
                publishedData.publishType = 'user';
                publishedData.user = users._id;
                var publishedHistory = new PublishedHistory(publishedData);
                publishedHistory.save();
            }
        });
    });

    res.json({});
};

exports.distributeHistory = function (req, res) {
    var surveyId = req.params.surveyId;
    var users,
        lists;
    async.waterfall([
        function (done) {
            PublishedHistory.find({ survey: surveyId }).populate('list user').exec(function(err, distributeHistory) {
                done(err, distributeHistory);
            });
        }, function(distributeHistory, done) {
            users = distributeHistory.filter(function(n) { return (n.publishType === 'user' && n.user !== null); });
            lists = distributeHistory.filter(function(n) { return (n.publishType === 'list' && n.list !== null); });
           done(null, users, lists);
        }, function(users, lists, done) {
            var newlists = [];
            async.each(lists, function(listObj, callback) {
                var newlistObj = JSON.parse(JSON.stringify(listObj));
                ListContact.find({ list: newlistObj.list._id }).count(function (err, listsCount) {
                    if (err) {
                        callback(err);
                    } else {
                        newlistObj.list.respondants = listsCount;
                        newlists.push(newlistObj);
                        callback();
                    }
                });
            }, function(err) {
                done(err, users, newlists);
            });
        }
    ], function(err, users, newlists) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            res.json({ users: users, lists: newlists });
        }
    });

};
