'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
    fs = require('fs'),
    mongoose = require('mongoose'),
    Question = mongoose.model('Question'),
    Survey = mongoose.model('Survey'),
    Page = mongoose.model('Page'),
    LogicJump = mongoose.model('LogicJump'),
    User = mongoose.model('User'),
    async = require('async'),
    shortid = require('shortid'),
    _ = require('lodash'),
    parameters = require('strong-params').Parameters,
    utils = require(path.resolve('./modules/core/server/utilities/utils.server')),
    uploader = require(path.resolve('./modules/core/server/utilities/uploader.server')),
    surveyController = require(path.resolve('./modules/surveys/server/controllers/surveys.server.controller')),
    chalk = require('chalk'),
    errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

    var aws = require('aws-sdk');
    var AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID;
    var AWS_SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY;
    var AWS_REGION = process.env.AWS_REGION;
    var S3_BUCKET = process.env.AWS_S3_BUCKET;

/**
 * Function to whitelist survey parameters from a request
 * @param  {Object} req request object
 * @return {Object}     Whitelisted survey parameter hash(object)
 */
function questionParams(rawParams) {
    var params = parameters(rawParams);
    return params.permit('questionType', 'title', 'description', 'survey', 'isCompulsary', 'alignVertically', 'randomizeOrder', 'radioButtons', 'randomizeLeft', 'randomizeRight', 'position', 'videoUrl', {
            choices: ['text', 'position'],
            rows: ['text', 'position'],
            columns: ['text', 'position'],
            leftChoices: ['text', 'position'],
            rightChoices: ['text', 'position'],
            timeDate: ['type', {
                dateOptions: ['futureDates', 'pastDates']
            }, {
                timeOptions: ['hourStep', 'minuteStep', 'amPm']
            }]
        }).value();
}

/**
 * Create a Question
 */
exports.create = function (req, res) {
    var question = new Question(questionParams(req.body));
    var savedQuestion,
        savedSurvey,
        positions = req.body.positions,
        s3Data = {};
    async.waterfall([
        // Save question
        function(done) {
            question.save(function (err, q) {
                done(err, q);
            });
        // Find survey of question
        }, function(q, done) {
            savedQuestion = q;
            Survey.findOne({
                _id: q.survey
            }, null, done);
        // update survey with question id
        }, function(s, done) {
            s.questions.push(savedQuestion._id);
            s.save(done);
        // Set positioning of other question which got modified because of this
        // new question creation
        }, function(s, status, done) {
            Survey.findOne({ _id: s._id }).populate('user questions pages').exec(function (err, s) {
                done(err, s);
            });
        }, function(s, done) {
            surveyController.saveOrdering(s, positions, done);
        // upload media files if there are any
        }, function(done) {
            uploadFiles(req, savedQuestion, s3Data, done);
        // update media file URL in question
        }, function(mediaFiles, done) {
            savedQuestion.mediaFiles = mediaFiles;
            savedQuestion.save(function(err, q) {
                savedQuestion = q;
                done(err, q);
            });
        }], function(status, question, err) {
            if (err) {
                return res.status(400).send({
                    message: errorHandler.getErrorMessage(err)
                });
            } else {
                res.json({
                    question: savedQuestion,
                    s3Data: s3Data
                });
            }
        });
};

/**
 * S3 file upload callback
 * req contains a status object using which we decide if upload is successfull
 * or not
 */
exports.s3UploadCallback = function(req, res) {
    var question = req.question;
    var successUrls = req.body.successUrls;
    var deleteIndices = [];
    question.tmpMediaFiles.forEach(function(f, i) {
        if ((successUrls.indexOf(f.url) > -1) && (_.map(question.mediaFiles, 'url').indexOf(f.url) < 0)) {
            question.mediaFiles.push({ url: f.url, name: f.name });
            deleteIndices.push(i);
        }
    });
    _.reverse(deleteIndices);
    deleteIndices.forEach(function(i) {
        question.tmpMediaFiles.splice(i, 1);
    });
    question.save(function(err, q) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            res.json(question);
        }
    });
};

/**
 * Upload files to S3 or local system based on environment
 * @param  {Object}   req - Request object
 * @param  {Object}   question - question object
 * @param  {Object}   s3Data - Object containing s3 upload policy
 * @param  {Function} done     Callback function
 */
function uploadFiles(req, question, s3Data, done) {
    if (req.body.mediaFiles.length === 0) {
        return done(null, []);
    }
    var mediaFiles = [];
    async.each(req.body.mediaFiles, function(img, callback) {
        if (img.file) {
            uploader.upload('question-', question, question._id, img.file, function(err, uploadResponse) {
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
function deleteFiles(req, done) {

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
 * Question middleware
 */
exports.questionByID = function (req, res, next, id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send({
            message: 'Question id is invalid'
        });
    }

    Question.findOne({ _id: id }, function(e, q) {
        if (e) {
            return next(e);
        } else if (!q) {
            return res.status(404).send({
                message: 'Question not found'
            });
        }
        req.question = q;
        next();
    });
};

/**
 * Show the current question
 */
exports.read = function (req, res) {
    // convert mongoose document to JSON
    var question = req.question ? req.question.toJSON() : {};
    res.json(question);
};

/**
 * Update an question
 */
exports.update = function (req, res) {
    var question = req.question,
        filteredParams = questionParams(req.body),
        s3Data = {},
        savedQuestion;
    for (var key in filteredParams) {
        if (filteredParams.hasOwnProperty(key))
            question[key] = filteredParams[key];
    }

    async.waterfall([
        function(done) {
            question.save(done);
        }, function(q, saved, done) {
            savedQuestion = q;
            uploadFiles(req, q, s3Data, done);
        }, function(mediaFiles, done) {
            savedQuestion.mediaFiles = mediaFiles;
            savedQuestion.save(done);
        }, function(q, saved, done) {
            savedQuestion = q;
            deleteFiles(req, done);
        }], function(err) {
            if (err) {
                return res.status(400).send({
                    message: errorHandler.getErrorMessage(err)
                });
            } else {
                res.json({
                    question: savedQuestion,
                    s3Data: s3Data
                });
            }
        });
};

/**
 * Delete a question
 */
exports.delete = function (req, res) {
    var question = req.question;
    // console.log('quesdata', question.mediaFiles);
    async.waterfall([
        // Delete question
        function(done) {
            question.remove(done);
            async.each(question.mediaFiles, function(file, callback) {
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
        // Find survey of question
        }, function(q, done) {
            Survey.findOne({
                _id: q.survey
            }, null, done);
        }, function(survey, done) {
            survey.questions.splice(_.indexOf(survey.questions, question._id), 1);
            survey.save(done);
        }
    ], function(err, survey) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            res.json(question);
        }

    });

};

/**
 * Create Copy of a question
 */
exports.copy = function(req, res) {
    var question,
        newQuestion;
    async.waterfall([
        // Find question
        function(done) {
            Question.findOne({
                _id: req.params.questionId
            }, done);
        // Find questions with last position in all questions of current questions survey
        }, function(q, done) {
            question = q;
            Question.findOne({ survey: q.survey }).sort({ position: -1 }).exec(done);
        // Create copy of current question,
        // set position=latest question position + 1
        // and save the question
        }, function(q, done) {
            var questionCopy = JSON.parse(JSON.stringify(question));
            var oldKeys = questionCopy.mediaFiles;
            questionCopy = _.omit(questionCopy, ['_id', 'created', '_v', 'logicJumps']);
            questionCopy.position = q.position + 1;
            questionCopy.title = question.title + ' - Copy';
            var newQuestion = new Question(questionCopy);
            if (oldKeys.length !== 0) {
                copyFiles(oldKeys, newQuestion._id, function(err, mFiles) {
                    newQuestion.mediaFiles = mFiles;
                    newQuestion.save(function(err, q) {
                        done(err, q);
                    });
                });
            } else {
                newQuestion.save(function(err, q) {
                    done(err, q);
                });
            }
        // Find all questions of current survey and return as response
        }, function(newQuestion, done) {
            Survey.findOne({
                _id: newQuestion.survey
            }, function(err, s) {
                done(err, s, newQuestion);
            });
        }, function(survey, newQuestion, done) {
            survey.questions.push(newQuestion._id);
            _.uniq(survey.questions);
            survey.save(function(err, s) {
                done(err, s);
            });
        }, function(s, done) {
            Question.find({
                survey: s._id
            }, function(err, questions) {
                done(err, questions, s);
            });
        }, function(questions, s, done) {
            Page.find({
                survey: s._id
            }, function(err, pages) {
                done(err, questions, pages);
            });
        }], function(err, questions, pages) {
            if (err) {
                return res.status(400).send({
                    message: errorHandler.getErrorMessage(err)
                });
            } else {
                res.json({
                    questions: questions,
                    pages: pages
                });
            }
        });
};

function copyFiles(oldKeys, questionId, done) {
    var mediaFiles = oldKeys;
    async.each(mediaFiles, function(img, callback) {
        if (img) {
            var ext,
            fileName;
            if (process.env.NODE_ENV === 'development') {
                console.log('development env');
                ext = img.name.split('.').pop();
                fileName = 'question-' + questionId + '-' + shortid.generate() + '.' + ext.toLowerCase();
                var filePath = path.join('public', img.url);
                var newFilePath = filePath;
                newFilePath = newFilePath.replace(_.last(newFilePath.split('/')), fileName);
                var stream = fs.createReadStream(filePath).pipe(fs.createWriteStream(newFilePath));
                stream.on('finish', function() {
                    img.url = newFilePath;
                    img.url = img.url.replace('public', '');
                    callback(null, img);
                });
            } else {
                ext = img.name.split('.').pop();
                fileName = 'question-' + questionId + '-' + shortid.generate() + '.' + ext.toLowerCase();
                var s3 = new aws.S3();
                var oldKey = _.last(img.url.split('/'));
                var newKey = fileName;
                var params = {
                        Bucket: S3_BUCKET,
                        CopySource: S3_BUCKET + '/' + oldKey,
                        Key: newKey,
                        ACL: 'public-read'
                    };
                s3.copyObject(params, function(err, data) {
                  if (err) {
                    console.log('err : ', err);
                    callback(err);
                  } else {
                        img.url = img.url.replace(oldKey, params.Key); // successful response
                        callback(err, img);
                  }
                });
            }
        }
    }, function(err) {
        done(err, mediaFiles);
    });
}

/**
 * Get list of logic jumps related to given question
 * @param  {Object} req Object containing details of request
 * @param  {Object} res Response object
 */
exports.listLogicJumps = function(req, res) {
    var question = req.question;
    if (question.logicJumps.length) {
        LogicJump.find({
            '_id': { $in: req.question.logicJumps }
        }, function(err, logicJumps) {
            console.log(chalk.green.bgGreen(JSON.stringify(logicJumps)));
            res.json(logicJumps);
        });
    } else {
        res.json({
            jumps: []
        });
    }
};

/**
 * Set/Update logic jumps related of a question
 * @param  {Object} req Object containing details of request
 * @param  {Object} res Response object
 */
exports.updateLogicJumps = function(req, res) {
    console.log('request=>', req);
    res.json(req);
};
