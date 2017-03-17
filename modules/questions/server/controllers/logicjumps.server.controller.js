'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
    mongoose = require('mongoose'),
    Question = mongoose.model('Question'),
    // Survey = mongoose.model('Survey'),
    LogicJump = mongoose.model('LogicJump'),
    User = mongoose.model('User'),
    async = require('async'),
    _ = require('lodash'),
    parameters = require('strong-params').Parameters,
    utils = require(path.resolve('./modules/core/server/utilities/utils.server')),
    uploader = require(path.resolve('./modules/core/server/utilities/uploader.server')),
    chalk = require('chalk'),
    errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

/**
 * Function to whitelist logic jumps parameters from a request
 * @param  {Object} req request object
 * @return {Object}     Whitelisted logic jumps parameter hash(object)
 */
function logicjumpParams(rawParams) {
    var params = parameters(rawParams);
    return params.permit('logic', 'jumptoQuestion').value();
}

/**
 * Create a Question
 */
exports.create = function (req, res) {
    var logicJumpeach;
    var logicjump;
    req.body.forEach(function(logicdata, li) {
        logicJumpeach = JSON.parse(JSON.stringify(logicdata));
        if (logicJumpeach._id) {
            LogicJump.findOneAndUpdate({ _id: logicJumpeach._id }, {
                logic: logicJumpeach.logic,
                jumptoQuestion: logicJumpeach.jumptoQuestion,
                logicPosition: logicJumpeach.logicPosition
            }, function(err, doc) {
                if (err) {
                    console.log('Something wrong when updating LogicJump!');
                }
            });

            // to remove logic jump from all ques and then update again..
            Question.update({ survey: logicJumpeach.survey }, { $pull: { logicJumps: logicJumpeach._id } }, { multi: true }, function(err, res) {
                if (err) {
                    console.log('Something wrong when deleting logic jump from questions!');
                }
            });
            // update logic jump id to questions
            var logicQues = JSON.parse(JSON.stringify(logicJumpeach.logic));
            logicQues.forEach(function(l, i) {
                Question.findOneAndUpdate({ _id: l.question }, { $addToSet: { logicJumps: logicJumpeach._id } }, { upsert: true }, function(err, res) {
                    if (err) {
                        console.log('Something wrong when updating logic jump id to questions!');
                    }
                });
            });
            if ((req.body.length - 1) === li) {
                removeDuplicateJumps(req);
            }
        } else {
            logicjump = new LogicJump(logicJumpeach);
            saveLogicJump(logicjump, req, res);
        }
    });
    res.json(LogicJump);
};

function saveLogicJump(logicjump, req, res) {
    var savedlogicjump;
    async.waterfall([
        function (done) {
          Question.find({ _id: logicjump.jumptoQuestion }, { survey: 1 }, function (err, surveyId) {
            done(null, surveyId);
          });
        }, function(surveyId, done) {
            logicjump.survey = surveyId[0].survey;
            logicjump.save(function (err, q) {
                done(err, q);
            });
        }, function(q, done, err) {
            // update question with logic jump id
            savedlogicjump = q;
            var logicQues = JSON.parse(JSON.stringify(logicjump.logic));
            logicQues.forEach(function(l, i) {
                Question.findOneAndUpdate({ _id: l.question }, { $addToSet: { logicJumps: q._id } }, { upsert: true }, function(err, res) {
                    if (err) {
                        console.log('Something wrong when updating data!');
                        done(err);
                    }
                });
            });
            done(err, q);
        }], function(status, savedlogicjump, err) {
            if (err) {
                return res.status(400).send({
                    message: errorHandler.getErrorMessage(err)
                });
            } else {
                removeDuplicateJumps(req);
            }
        });
}

function removeDuplicateJumps(req) {
    var q;
    var surveyId;
    if (req.body.length > 0) {
        var question = req.body[0].jumptoQuestion;
        async.waterfall([
        function (done) {
          Question.find({ _id: question }, { survey: 1 }, function (err, surveyData) {
            done(err, surveyData);
          });
        }, function(surveyData, done) {
            surveyId = surveyData[0].survey;
            LogicJump.find({ survey: surveyId }, function (err, logicJumpData) {
                done(err, logicJumpData);
            });
        }, function(logicJumpData, done, err) {
            q = logicJumpData;
            // console.log('alljumpto--->', logicJumpData);
            var newJumpArr = [];
            for (var i = 0; i < logicJumpData.length; i++) {
                var nobj = {};
                var aLogic = [];
                var jumpLogc = JSON.parse(JSON.stringify(logicJumpData[i].logic));
                for (var j = 0; j < jumpLogc.length; j++) {
                    var obj = {};
                    obj.choice = jumpLogc[j].choice;
                    obj.question = jumpLogc[j].question;
                    aLogic.push(obj);
                }
                nobj.logic = aLogic;
                nobj.jumptoQuestion = logicJumpData[i].jumptoQuestion;

                if (newJumpArr.length > 0) {
                    for (var s = 0; s < newJumpArr.length; s++) {
                        if (String(newJumpArr[s].jumptoQuestion) === String(nobj.jumptoQuestion)) {
                            var a1 = _.orderBy(newJumpArr[s].logic, ['choice', 'question'], ['asc', 'ase']);
                            var a2 = _.orderBy(nobj.logic, ['choice', 'question'], ['asc', 'ase']);
                            var res = _.isEqual(a1, a2);
                            if (res === true) {
                                console.log('duplicate--->', logicJumpData[i]._id);
                                LogicJump.find({ _id: logicJumpData[i]._id }).remove().exec();
                            }
                        }
                    }
                }
                newJumpArr.push(nobj);
            }
            done(err, q);
        }], function(status, q, err) {
            if (err) {
                console.log('Error in function removeDuplicateJumps !!');
            }
        });
    }
}

/**
 * Question middleware
 */
exports.logicjumpByID = function (req, res, next, id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send({
            message: 'logic jump id is invalid'
        });
    }

    LogicJump.findOne({ _id: id }, function(e, q) {
        if (e) {
            return next(e);
        } else if (!q) {
            return res.status(404).send({
                message: 'LogicJump not found'
            });
        }
        req.logicjump = q;
        next();
    });
};

exports.read = function (req, res) {
    var LogicJump = req.logicjump ? req.logicjump.toJSON() : {};
    res.json(LogicJump);
};

/**
 * Get list of logic jumps related to given question
 * @param  {Object} req Object containing details of request
 * @param  {Object} res Response object
 */
exports.listLogicJumps = function(req, res) {
    // console.log(req);
    var question = req.question;
    if (question.logicJumps.length) {
        LogicJump.find({
            '_id': { $in: req.question.logicJumps }
        }, function(err, logicJumps) {
            // console.log(chalk.green.bgGreen(JSON.stringify(logicJumps)));
            res.json(logicJumps);
        }).sort({ logicPosition: 1 });
    } else {
        res.json({
            jumps: []
        });
    }
};

/**
* Delete logic jumps
*/
exports.deleteLogicJumps = function(req, res) {
    var deletelogicJump = JSON.parse(JSON.stringify(req.body));
    deletelogicJump.forEach(function(logicdata, i) {
        logicdata.logic.forEach(function(quesdata, j) {
            Question.findOneAndUpdate({ _id: quesdata.question }, { $pull: { logicJumps: logicdata._id } }, function(err, doc) {
                if (err) {
                    console.log('Something wrong when updating LogicJump!');
                }
            });
        });
        LogicJump.find({ _id: logicdata._id }).remove().exec();
    });
    res.json(deletelogicJump);
};

exports.remLogicFromQues = function(req, res) {
    var remLogicFromQues = JSON.parse(JSON.stringify(req.body));
    remLogicFromQues.forEach(function(dataDel, key) {
        Question.findOneAndUpdate({ _id: dataDel.questionId }, { $pull: { logicJumps: dataDel.logicId } }, { 'new': true }, function(err, doc) {
            if (err) {
                console.log('Something wrong when deleting logic from question!');
            } else {
                // console.log('Response ==> ', JSON.parse(JSON.stringify(doc)));
            }
        });
    });
    res.json(remLogicFromQues);
};
