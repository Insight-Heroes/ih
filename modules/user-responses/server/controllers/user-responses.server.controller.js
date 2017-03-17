'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  async = require('async'),
  UserResponse = mongoose.model('UserResponse'),
  User = mongoose.model('User'),
  Answer = mongoose.model('Answer'),
  Question = mongoose.model('Question'),
  OrderHistory = mongoose.model('OrderHistory'),
  Survey = mongoose.model('Survey'),
  LogicJump = mongoose.model('LogicJump'),
  answerModule = require('./answer-module'),
  utils = require(path.resolve('./modules/core/server/utilities/utils.server')),
  uploader = require(path.resolve('./modules/core/server/utilities/uploader.server')),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  questionToken = 'q-',
  _ = require('lodash');


function getUserEnvironment(req) {
    var ip = req.ip || req.connection.remoteAddress;
    var ua = req.headers['user-agent'];
    var isMobile = /mobile/i.test(ua),
        params;
    if (isMobile) {
        params = {
            isMobile: true
        };
        if (/Android/.test(ua)) {
            params.clientOs = 'android';
        } else if (/iPhone/.test(ua)) {
            params.clientOs = 'iOs';
        } else if (/Win/.test(ua)) {
            params.clientOs = 'WindowsPhone';
        }
    } else {
        params = {
            isMobile: false
        };
        if (/Windows NT/.test(ua)) {
            params.clientOs = 'Windows';
        } else if (/Linux/.test(ua)) {
            params.clientOs = 'Linux';
        } else if (/Macintosh/.test(ua)) {
            params.clientOs = 'Macintosh';
        }
    }
    if (/Edge/.test(ua)) {
        params.clientBrowser = 'Microsoft Edge';
    } else if (/Firefox/.test(ua)) {
        params.clientBrowser = 'Firefox';
    } else if (/Chrome/.test(ua)) {
        params.clientBrowser = 'Google Chrome';
    } else if (/AppleWebkit/.test(ua)) {
        params.clientBrowser = 'Safari';
    } else if (/MSIE/.test(ua)) {
        params.clientBrowser = 'Internet Explorer';
    }
    params.rawData = {};
    params.clientIp = ip;
    return params;
}

/**
 * List of User responses
 */
exports.list = function(req, res) {
    var randomCode = req.query.id,
        surveyJson,
        surveyQuestions = [],
        history = {},
        logicJumpJson;
    async.waterfall([
        function (done) {
            Survey.findOne({ randomCode: randomCode }).populate('user pages project').exec(function (err, survey) {
                surveyJson = JSON.parse(JSON.stringify(survey));
                done(null, survey);
            });
        }, function(survey, done) {
            Question.find({
                survey: survey._id
            }, function (err, qs) {
                if (err) return done(err);
                surveyQuestions = qs;
                done(null, survey);
            });
        }, function(survey, done) {
            LogicJump.find({
                survey: survey._id
            }, function(err, jumps) {
                done(err, JSON.parse(JSON.stringify(jumps)), survey);
            });
        }, function (jumps, survey, done) {
            var questions = [];
            surveyQuestions.forEach(function(qes) {
                var q = JSON.parse(JSON.stringify(qes));
                q.jumps = _.filter(jumps, function(jump) {
                    return (q.logicJumps.indexOf(jump._id.toString()) >= 0);
                });
                questions.push(q);
            });
            done(null, questions, survey);
        }, function(questions, survey, done) {
            if (survey.user.orderHistoryId) {
                OrderHistory.find({
                    _id: survey.user.orderHistoryId
                }, function(err, orderHistory) {
                    if (orderHistory) {
                        orderHistory = _.reduce(orderHistory.filter(function(n) {
                            return (n._id);
                        }));
                        history.billingPeriodEndDate = orderHistory.billingPeriodEndDate;
                    }
                    done(err, history, questions);
                });
            } else {
                done(null, history, questions);
            }
        }
    ], function(err, orderHistory, questions) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        }
        res.json({
            survey: surveyJson,
            questions: questions,
            ownerOrder: orderHistory
        });
    });
};

/**
 * Create User responses
 */
exports.create = function(req, res) {

    var surveyID = req.body.surveyidobj.surveyId;
    var userID;

    if (req.user) {
        userID = req.user._id;
    }
    var urParams = getUserEnvironment(req);
    urParams.survey = surveyID;
    urParams.user = userID;

    var userResponse = new UserResponse(urParams);
    Survey.findOne({ _id: surveyID }).populate({ path: 'user',
      model: 'User',
      populate: {
        path: 'orderHistoryId',
        model: 'OrderHistory'
      } }).exec(function(e, survey) {
        if (e) return res.status(400).send({
          message: errorHandler.errorResponse(e)
        });
        // console.log('userpopulated--->', survey);
        var history = survey.user.orderHistoryId;
        var dateExpired = false;
        if (history && (history.planType !== 'A')) {
            var endDate = Date.parse(history.billingPeriodEndDate);
            if (Date.now() > endDate) {
                dateExpired = true;
            }
        }
        var balanceResponses = (survey.user.totalNoOfRespondants - survey.user.receivedUserResponses);

        if (balanceResponses <= 0 || dateExpired === true) {
            return res.json({ subscriptionExpired: true, responseMaster: [],
                answer: [] });
        }

        userResponse.accountOwner = survey.user._id;
        userResponse.save(function(err, ur) {
            if (err) {
                return res.status(400).send({
                  message: errorHandler.errorResponse(err)
                });
            }
            // save receivedUserResponses in user
            UserResponse.find({ accountOwner: ur.accountOwner }).count(function(err, count) {
                if (err) {
                  return res.status(400).send({
                    message: errorHandler.getErrorMessage(err)
                  });
                } else {
                  console.log('Number of UserResponse: ', count);
                  // res.jsonp(count);
                  var user = ur.accountOwner;
                    User.findById(user).exec(function (err, user) {
                        if (err) {
                            console.log('Error Occured : ', err);
                            return res.status(400).send({
                                message: errorHandler.getErrorMessage(err)
                            });
                        } else {
                            user.receivedUserResponses = count;
                            user.balanceUserResponses = user.totalNoOfRespondants - user.receivedUserResponses;
                            user.save(function(err, user) {
                                if (err) {
                                    console.log('Error Occured : ', err);
                                    return res.status(400).send({
                                        message: errorHandler.getErrorMessage(err)
                                    });
                                }
                                console.log('user.receivedUserResponses : ', user.receivedUserResponses);
                                console.log('user.balanceUserResponses : ', user.balanceUserResponses);
                            });
                        }
                    });

                }
            });
            saveAllQuestions(ur);
        });
    });


    function saveAllQuestions(ur) {
        var answer;
        async.each(req.body.allQuestions, function(question, done) {
            if (!question) {
                return done();
            }
            answerModule.saveAnswer(res, question, ur, function(err, resp) {
                answer = JSON.parse(JSON.stringify(resp));
                done();
            });

        }, function(err) {
            if (err) {
                errorHandler.errorResponse(err);
            } else {
                updateUserResponse(ur, answer);
            }
        });
    }

    function updateUserResponse(ur, answer) {
        ur.markModified('rawData');
        ur.save(function(err, savedUR) {
            if (err) {
                errorHandler.errorResponse(err);
            }

            UserResponse.find({ survey: surveyID }).count(function (err, userResponsesCount) {
                Survey.findOne({ _id: surveyID }).exec(function(err, survey) {
                    survey.userResponses = userResponsesCount;
                    survey.save();
                    console.log('userResponsesCount: ', userResponsesCount);
                });
            });

            return res.json({
                subscriptionExpired: false,
                responseMaster: userResponse,
                answer: answer
            });
        });
    }
};

/**
 * Update UserResponse's Answers and update rawData of UserResponse
 */
exports.update = function(req, res) {

    var userResponse = req.userResponse;
    var surveyID = req.body.surveyidobj.surveyId;

    userResponse.save(function(err, ur) {
        if (err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        }
        saveAllQuestions(ur);
    });

    function saveAllQuestions(ur) {
        var answer;
        async.each(req.body.allQuestions, function(question, done) {
            if (!question) {
                return done();
            }
            if (req.body.answer) {
                question._id = req.body.answer._id;
            }
            answerModule.saveAnswer(res, question, ur, function(err, resp) {
                answer = JSON.parse(JSON.stringify(resp));
                done();
            });

        }, function(err) {
            if (err) {
                errorHandler.errorResponse(err);
            } else {
                updateUserResponse(ur, answer);
            }
        });
    }

    function updateUserResponse(ur, answer) {
        ur.markModified('rawData');
        ur.save(function(err, savedUR) {
            if (err) {
                errorHandler.errorResponse(err);
            }

            UserResponse.find({ survey: surveyID }).count(function (err, userResponsesCount) {
                Survey.findOne({ _id: surveyID }).exec(function(err, survey) {
                    survey.userResponses = userResponsesCount;
                    survey.save();
                    console.log('userResponsesCount: ', userResponsesCount);
                });
            });

            return res.json({
                responseMaster: userResponse,
                answer: answer
            });
        });
    }
};

/**
 * Delete an UserResponse's answers and update rawData of UserResponse
 */
exports.delete = function(req, res) {
    var answerIds = req.body.answer;
    var userResponse = req.body.userResponse;
    var questions = req.body.questions;
    Answer.find({ _id: { $in: answerIds }, userResponse: userResponse }).remove().exec(function(err, resp) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            UserResponse.findOne({ _id: userResponse }, function (err, ur) {
                if (err || !ur) {
                    return res.status(400).send({
                        message: errorHandler.errorResponse(err)
                    });
                }
                removeFromRawData(ur, questions);
            });
        }
    });

    function removeFromRawData(ur, questions) {
        questions.forEach(function(quesId, key) {
            delete ur.rawData[questionToken + quesId];
        });
        updateUserResponse(ur);
    }

    function updateUserResponse(ur) {
        ur.markModified('rawData');
        ur.save(function(err, savedUR) {
            if (err) {
                errorHandler.errorResponse(err);
            }
            return res.json({
                message: 'Answer deleted successfully!!!'
            });
        });
    }
};

/**
 * User response middleware
 */
exports.userResponseByID = function(req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'User response is invalid'
    });
  }

  UserResponse.findById(id).populate('user', 'displayName').exec(function (err, userResponse) {
    if (err) {
      return next(err);
    } else if (!userResponse) {
      return res.status(404).send({
        message: 'No User response with that identifier has been found'
      });
    }
    req.userResponse = userResponse;
    next();
  });
};
