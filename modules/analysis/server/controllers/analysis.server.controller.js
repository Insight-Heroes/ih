'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
    mongoose = require('mongoose'),
    async = require('async'),
    Question = mongoose.model('Question'),
    UserResponse = mongoose.model('UserResponse'),
    Survey = mongoose.model('Survey'),
    answerModule = require(path.resolve('./modules/user-responses/server/controllers/answer-module')),
    tabulation = require('./tabulation'),
    crossTabulation = require('./cross-tabulation'),
    errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
    json2csv = require('json2csv'),
    striptags = require('striptags'),
    utils = require(path.resolve('./modules/core/server/utilities/utils.server')),
    moment = require('moment'),
    fs = require('fs'),
    _ = require('lodash');

/**
 * Update question names - i.e. update variable names
 */
exports.updateQuestions = function(req, res) {
    var survey = req.survey,
        updates = req.body.questions;

    var questionFetchQuery = {
        _id: { $in: _.keys(updates) },
        survey: survey._id
    };
    Question.find(questionFetchQuery, function(err, questions) {
        if (err) {
            return errorHandler.errorResponse(err, res);
        }
        async.each(questions, function(q, done) {
            q.varName = updates[q._id.toString()];
            q.save(function(err, qs) {
                done(err, qs);
            });
        }, function(err) {
            if (err) {
                return errorHandler.errorResponse(err, res);
            }
            res.json();
        });
    });
};

/**
 * List of Analysis
 */
exports.questionList = function(req, res) {
    var survey = req.survey;
    Question.find({
        survey: survey._id,
        questionType: { $nin: ['timeAndDate', 'media', 'picture', 'descriptiveText'] }
    }, function(err, questions) {
        if (err) {
           return errorHandler.errorResponse(err, res);
        }
        res.jsonp({
            questions: questions,
            survey: survey
        });
    });
};

/**
 * Get question stats(Tabulation) for analyze
 * @param  {Object} req - Request object
 * @param  {Object} res - Response object
 */
exports.questionTabStatistics = function(req, res) {
    console.log('Query params:', req.query, '\n');
    var questionID = req.query.questionID;
    if (!questionID) {
        return res.status(400).json({
            message: 'Please select question'
        });
    }
    UserResponse.find({
        survey: req.survey._id
    }).count(function(err, totalCount) {
        Question.findOne({
            _id: questionID
        }, function(e, q) {
            if (err) {
                return errorHandler.errorResponse(e, res);
            }
            tabulation.getStats(q, function(err, questionStat) {
                console.log(q.questionType, questionStat);
                if (err) {
                    return errorHandler.errorResponse(err, res);
                }
                res.json({
                    tabStat: questionStat,
                    totalResponses: totalCount
                });
            });
        });
    });
};

/**
 * Get questions Cross Tabulation stats for analyze
 * @param  {Object} req - Request object
 * @param  {Object} res - Response object
 */
exports.questionCrossTabStatistics = function(req, res) {
    console.log('Query params:', req.query, '\n');
    var sourceQuestionId = req.query.sourceQuestion,
        targetQuestionsIds = req.query.targetQuestions,
        responseCount,
        sourceQuestion;
    if (!sourceQuestionId || !targetQuestionsIds || targetQuestionsIds.length === 0) {
        return res.status(400).send({
            message: 'Questions missing'
        });
    }
    async.waterfall([function(done) {
        UserResponse.find({
            survey: req.survey._id
        }).count(function(err, totalCount) {
            responseCount = totalCount;
            done(err);
        });
    }, function(done) {
        Question.findOne({
            _id: sourceQuestionId
        }, function(err, q) {
            sourceQuestion = q;
            done(err);
        });
    }, function(done) {
        Question.find({
            _id: {
                $in: targetQuestionsIds
            }
        }, function(err, questions) {
            crossTabulation.getStats(req.survey, sourceQuestion, questions, done);
        });
    }], function(err, stats) {
        if (err) {
            return errorHandler.errorResponse(err, res);
        }
        res.json({
            stats: stats,
            totalResponses: responseCount
        });
    });
};


/* FORMAT REQUIRED TO DOWNLOAD CSV
    var fields = ['Variable1', 'Variable2', 'Variable3'];
    var answerData =
    [
      {
        'Variable1': 'Audi',
        'Variable2': '40000',
        'Variable3': 'blue'
      }
    ];
*/
exports.csvResponses = function(req, res) {

    var survey = req.survey,
        questions,
        quesToken = 'q-',
        fields = [],
        fstRowCol = 'Respondant / Questions',
        answerData = [];

    async.waterfall([
        function (done) {
            Survey.findOne({ _id: survey._id }).populate('questions').exec(function (err, survey) {
                questions = JSON.parse(JSON.stringify(survey.questions));
                fields.push(fstRowCol);
                questions = _.sortBy(questions, ['position']);
                questions = questions.filter(function(n) {
                    if (n.questionType !== 'media') {
                        fields.push(utils.removeHtmlTags(n.title));
                        return true;
                    } else { return false; }
                });
                done(err, questions);
            });
        }, function(questions, done) {
            UserResponse.find({ survey: survey._id }, function (err, userResponses) {
                done(err, userResponses);
            }).sort({ _id: -1 });
        }, function(userResponses, done) {

            var nonSlug = ['descriptiveText', 'picture'];
            var joinSlug = ['matrix', 'pairing'];

            userResponses.forEach(function(userresponse, urkey) {
                var ansobj = {};
                ansobj[fstRowCol] = 'Respondant ' + (urkey + 1);
                for (var queskey in userresponse.rawData) {
                    if (userresponse.rawData.hasOwnProperty(queskey)) {
                        var lineArr = [];
                        var quesId = queskey.replace(quesToken, '');
                        var quesData = reduceQues(questions, quesId);
                        var answers = userresponse.rawData[queskey].split(' ');

                        for (var i = 0; i < answers.length; i++) {
                            var ans = answers[i];

                            if (nonSlug.indexOf(quesData.questionType) > -1) {
                                lineArr.push(userresponse.rawData[queskey]);
                                break;
                            } else if (quesData.questionType === 'timeAndDate') {
                                var dt = moment(userresponse.rawData[queskey]);
                                var ndt = dt.format('MMM D, YYYY');
                                lineArr.push(ndt);
                                break;
                            } else if (joinSlug.indexOf(quesData.questionType) > -1) {
                                var join = ans.split('-');
                                var combineAns = quesData.slugHistory[join[0]] + '<=>' + quesData.slugHistory[join[1]];
                                lineArr.push(combineAns);
                            } else {
                                lineArr.push(quesData.slugHistory[ans]);
                            }
                        }
                        ansobj[utils.removeHtmlTags(quesData.title)] = lineArr.join('\r');
                    }
                }
                answerData.push(ansobj);
            });

            var csvdata = json2csv({ data: answerData, fields: fields });
            csvdata = csvdata.replace(/\\r/g, ',\r');

            done(null, csvdata);
        }
    ], function(err, csvdata) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {

            res.set('Content-Type', 'application/octet-stream');
            // res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.set('Content-Disposition', 'attachment');
            res.attachment('Survey-' + survey.randomCode + '-' + new Date().toISOString().slice(0, 10) + '.csv');
            res.send(csvdata);

            // res.json({ data: csvdata }); // for testing uncomment & comment above 4 lines.
        }
    });

    function reduceQues(questions, quesId) {
        var ques = _.reduce(questions.filter(function(n) {
            return (n._id === quesId);
        }));
        return ques;
    }
};

/**
 * Survey finding middleware
 */
exports.surveyByID = function(req, res, next, id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send({
            message: 'Survey id is invalid'
        });
    }
    Survey.findOne({ _id: id, user: req.user.parentId() }, function (err, s) {
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
