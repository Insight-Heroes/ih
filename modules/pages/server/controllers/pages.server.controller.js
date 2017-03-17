'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
    mongoose = require('mongoose'),
    Page = mongoose.model('Page'),
    Question = mongoose.model('Question'),
    Survey = mongoose.model('Survey'),
    User = mongoose.model('User'),
    async = require('async'),
    _ = require('lodash'),
    parameters = require('strong-params').Parameters,
    utils = require(path.resolve('./modules/core/server/utilities/utils.server')),
    uploader = require(path.resolve('./modules/core/server/utilities/uploader.server')),
    surveyController = require(path.resolve('./modules/surveys/server/controllers/surveys.server.controller')),
    chalk = require('chalk'),
    errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

/**
 * Function to whitelist page parameters from a request
 * @param  {Object} req request object
 * @return {Object}     Whitelisted page parameter hash(object)
 */
function pageParams(rawParams) {
    var params = parameters(rawParams);
    return params.permit('title', 'description', 'slug', 'position', 'survey', 'inQuestions').value();
}

/**
 * S3 file upload callback
 * req contains a status object using which we decide if upload is successfull
 * or not
 */
exports.s3UploadCallback = function(req, res) {
    var page = req.page;
    var successUrls = req.body.successUrls;
    var deleteIndices = [];
    page.tmpMediaFiles.forEach(function(f, i) {
        if ((successUrls.indexOf(f.url) > -1) && (_.map(page.mediaFiles, 'url').indexOf(f.url) < 0)) {
            page.mediaFiles.push({ url: f.url, name: f.name });
            deleteIndices.push(i);
        }
    });
    _.reverse(deleteIndices);
    deleteIndices.forEach(function(i) {
        page.tmpMediaFiles.splice(i, 1);
    });
    page.save(function(err, q) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            res.json(page);
        }
    });
};
/**
 * Upload files to S3 or local system based on environment
 * @param  {Object}   req - Request object
 * @param  {Object}   page - page object
 * @param  {Object}   s3Data - Object containing s3 upload policy
 * @param  {Function} done     Callback function
 */
function uploadPageFiles(req, page, s3Data, done) {
    if (req.body.mediaFiles.length === 0) {
        return done(null, []);
    }
    var mediaFiles = [];
    async.each(req.body.mediaFiles, function(img, callback) {
        if (img.file) {
            uploader.upload('page-', page, page._id, img.file, function(err, uploadResponse) {
                if (err) {
                    callback(err);
                } else {
                    if (process.env.NODE_ENV === 'development') {
                        mediaFiles.push({
                            url: uploadResponse.url,
                            name: uploadResponse.name
                        });
                    } else {
                        s3Data[img.file] = uploadResponse.s3Policy;
                        mediaFiles.push({
                            tmpUrl: uploadResponse.url,
                            name: uploadResponse.name
                        });
                    }
                    callback();
                }
            });
        } else {
            if (img.url) {
                mediaFiles.push({
                    url: img.url,
                    name: img.name
                });
            }
            callback();
        }
    }, function(err) {
        done(err, mediaFiles);
    });
}

/**
 * Deletes uploaded files either from local directory or from Amazon S3
 * @param  {Object}   req  request object
 * @param  {Function} done Callback function, takes first parameter error object
 */
function deletePageFiles(req, done) {
    if (req.body.deletedMediaFiles.length === 0) {
        return done(null);
    }
    async.each(req.body.deletedMediaFiles, function(file, callback) {
        if (file.url) {
            uploader.delete(file.url, function(err, deleteResponse) {
                callback(err, deleteResponse);
            });
        } else {
            callback();
        }
    }, function(err) {
        done(err);
    });
}

/**
 * Create a Page
 */
exports.create = function (req, res) {
    var positions = req.body.positions;
    var page = new Page(pageParams(req.body));
    var savedPage,
        savedSurvey,
        s3Data = {};
    async.waterfall([
        // Save page
        function(done) {
            page.save(function (err, q) {
                done(err, q);
            });
        // Find survey of Page
        }, function(p, done) {
            savedPage = p;
            Survey.findOne({
                _id: p.survey
            }, null, done);
        // update survey with Page id
        }, function(s, done) {
            s.pages.push(savedPage._id);
            s.save(function(err, s) {
                done(err, s);
            });
        // Set positioning of other question which got modified because of this
        // new question creation
        }, function(survey, done) {
            Survey.findOne({ _id: page.survey }).exec(function (err, s) {
                done(err, s);
            });
        }, function(s, done) {
            surveyController.saveOrdering(s, positions, done);
        // upload media files if there are any
        }, function(done) {
            uploadPageFiles(req, savedPage, s3Data, done);
        // update media file URL in Page
        }, function(mediaFiles, done) {
            savedPage.mediaFiles = mediaFiles;
            savedPage.save(function(err, q) {
                savedPage = q;
                done(err, q);
            });
        }], function(err, status, page) {
            if (err) {
                return res.status(400).send({
                    message: errorHandler.getErrorMessage(err)
                });
            } else {
                res.json({
                    page: savedPage,
                    s3Data: s3Data
                });
            }
        });
};

/**
 * Page middleware
 */
exports.pageByID = function (req, res, next, id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send({
            message: 'Page id is invalid'
        });
    }

    Page.findOne({ _id: id }, function(e, q) {
        if (e) {
            return next(e);
        } else if (!q) {
            return res.status(404).send({
                message: 'Page not found'
            });
        }
        req.page = q;
        next();
    });
};

/**
 * Show the current page
 */
exports.read = function (req, res) {
    // convert mongoose document to JSON
    var page = req.page ? req.page.toJSON() : {};
    res.json(page);
};

/**
 * Update a page
 */
exports.update = function (req, res) {
    var page = req.page,
        filteredParams = pageParams(req.body),
        s3Data = {},
        savedPage;
    for (var key in filteredParams) {
        if (filteredParams.hasOwnProperty(key))
            page[key] = filteredParams[key];
    }

    async.waterfall([
        function(done) {
            page.save(done);
        }, function(q, saved, done) {
            savedPage = q;
            uploadPageFiles(req, q, s3Data, done);
        }, function(mediaFiles, done) {
            savedPage.mediaFiles = mediaFiles;
            savedPage.save(done);
        }, function(q, saved, done) {
            savedPage = q;
            deletePageFiles(req, done);
        }], function(err) {
            // console.log(chalk.green.bold(JSON.stringify(err)));
            if (err) {
                return res.status(400).send({
                    message: errorHandler.getErrorMessage(err)
                });
            } else {
                res.json({
                    page: savedPage,
                    s3Data: s3Data
                });
            }
        });
};

/**
 * Delete a page
 */
exports.delete = function (req, res) {
    var page = req.page;
    // req.body.deletedMediaFiles = page.mediaFiles;

    async.waterfall([
        // Delete page
        function(done) {
            page.remove(done);

            async.each(page.mediaFiles, function(file, callback) {
                if (file.url) {
                    uploader.delete(file.url, function(err, deleteResponse) {
                        // callback(err, deleteResponse);
                    });
                }
            });
        // Find survey of page
        }, function(q, done) {
            Survey.findOne({
                _id: q.survey
            }, null, done);
        }, function(survey, done) {
            _.remove(survey.pages, function(pageID) {
              return (pageID.toString() === page._id.toString());
            });
            survey.save(done);
        }
    ], function(err, survey) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            res.json(page);
        }

    });

};
