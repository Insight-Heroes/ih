'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
    async = require('async'),
    mongoose = require('mongoose'),
    Answer = mongoose.model('Answer'),
    Question = mongoose.model('Question'),
    Survey = mongoose.model('Survey'),
    utils = require(path.resolve('./modules/core/server/utilities/utils.server')),
    errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
    uploader = require(path.resolve('./modules/core/server/utilities/uploader.server')),
    questionToken = 'q-',
    _ = require('lodash');

/**
 * Find cross tabulation stats of question
 * @param  {Object}   survey - Survey
 * @param  {Object}   srcQuestion - Question
 * @param  {Array}   targetQuestions - Questions array
 * @param  {Function} mainCallback - Callback function, first argument error, second argument stats
 */
exports.getCrossTabStats = function(survey, srcQuestion, targetQuestions, mainCallback) {
    mainCallback();
};


// ===================================================================================================
exports.saveAnswer = function(res, params, userResponse, done) {
    Question.findOne({
        _id: params.questionId
    }, function(err, question) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.errorResponse(err)
            });
        }

        var answerNew;
        var answer = {};
        if (params._id) {
            Answer.findOne({ _id: params._id }, function (err, respAns) {
                if (err || !respAns) {
                    return res.status(400).send({
                        message: errorHandler.errorResponse(err)
                    });
                }
                switchedtoAnswer(respAns, answer, question, params, userResponse, done);
            });
        } else {
            answer = new Answer({
                question: question._id,
                userResponse: userResponse._id
            });
            switchedtoAnswer(answerNew, answer, question, params, userResponse, done);
        }

        function switchedtoAnswer(answerNew, answer, question, params, userResponse, done) {
            // console.log(answer);
            switch (question.questionType) {
                case 'multiChoice':
                    saveMultichoice(answerNew, answer, question, params, userResponse, done);
                    break;

                case 'imageChoice':
                    saveImagechoice(answerNew, answer, question, params, userResponse, done);
                    break;

                case 'dropdown':
                    saveDropdown(answerNew, answer, question, params, userResponse, done);
                    break;

                case 'rankOrder':
                    saveRankOrder(answerNew, answer, question, params, userResponse, done);
                    break;

                case 'slider':
                    saveSlider(answerNew, answer, question, params, userResponse, done);
                    break;

                case 'timeAndDate':
                    saveTimeAndDate(answerNew, answer, question, params, userResponse, done);
                    break;

                case 'picture':
                    savePicture(answerNew, answer, question, params, userResponse, done);
                    break;

                case 'pairing':
                    savePairing(answerNew, answer, question, params, userResponse, done);
                    break;

                case 'matrix':
                    saveMatrix(answerNew, answer, question, params, userResponse, done);
                    break;

                case 'descriptiveText':
                    saveDescriptive(answerNew, answer, question, params, userResponse, done);
                    break;

                default:
                    // Pairing & Martix question saving
                    done();
            }
        }
    });
};

// ======================== Singlechoice / Multichoice ========================
function saveMultichoice(answerNew, answer, question, params, userResponse, done) {
    // Allow single choice selection
    if (question.radioButtons) {
        answer.singleAnswer = params.choices[0].slug;
        if (question._id) {
        userResponse.rawData[questionToken + question._id] = answer.singleAnswer;
        }
        answer = _.extend(answerNew, answer);
        answer.save(function(err, answer) {
            done(err, answer, userResponse);
        });
    } else {
        saveChoices(answerNew, question, answer, params, 'choices', userResponse, done);
    }
}

// ======================== Imagechoice ========================
function saveImagechoice(answerNew, answer, question, params, userResponse, done) {
    if (question.radioButtons) {
        answer.singleAnswer = params.mediaFiles[0].slug;
        if (question._id) {
        userResponse.rawData[questionToken + question._id] = answer.singleAnswer;
        }
        answer = _.extend(answerNew, answer);
        answer.save(function(err, answer) {
            done(err, answer, userResponse);
        });
    } else {
        saveChoices(answerNew, question, answer, params, 'mediaFiles', userResponse, done);
    }
}

// ======================== Descriptive ========================
function saveDescriptive(answerNew, answer, question, params, userResponse, done) {
    answer.singleAnswer = params.resDescription;
    if (question._id) {
    userResponse.rawData[questionToken + question._id] = answer.singleAnswer;
    }
    answer = _.extend(answerNew, answer);
    answer.save(function(err, answer) {
        done(err, answer, userResponse);
    });
}

// ======================== Dropdown ========================
function saveDropdown(answerNew, answer, question, params, userResponse, done) {
    answer.singleAnswer = params.choices[0].slug;
    if (question._id) {
    userResponse.rawData[questionToken + question._id] = answer.singleAnswer;
    }
    answer = _.extend(answerNew, answer);
    answer.save(function(err, answer) {
        done(err, answer, userResponse);
    });
}

// ======================== Slider ========================
function saveSlider(answerNew, answer, question, params, userResponse, done) {
    answer.singleAnswer = params.choices[0].slug;
    if (question._id) {
    userResponse.rawData[questionToken + question._id] = answer.singleAnswer;
    }
    answer = _.extend(answerNew, answer);
    answer.save(function(err, answer) {
        done(err, answer, userResponse);
    });
}

// ======================== Rank Order ========================
function saveRankOrder(answerNew, answer, question, params, userResponse, done) {
    answer.singleAnswer = params.choices[0].slug;
    var joinAnswers = {},
        rawAnswers = [];
    params.choices.forEach(function(ranks, i) {
        joinAnswers[ranks.slug] = i + 1;
        rawAnswers.push(ranks.slug + '-' + (i + 1));
    });
    answer.joinAnswers = joinAnswers;
    if (question._id) {
    userResponse.rawData[questionToken + question._id] = rawAnswers.join(' ');
    }
    saveChoices(answerNew, question, answer, params, 'choices', userResponse, done);
}

// ======================== Date & Time ========================
function saveTimeAndDate(answerNew, answer, question, params, userResponse, done) {
    answer.ansDate = params.ansDate;
    answer.ansTime = params.ansTime;
    if (question._id) {
        if (params.ansTime) {
            userResponse.rawData[questionToken + question._id] = params.ansDate + '-' + params.ansTime;
        } else {
            userResponse.rawData[questionToken + question._id] = params.ansDate;
        }
    }
    answer = _.extend(answerNew, answer);
    answer.save(function(err, answer) {
        done(err, answer, userResponse);
    });
}

// ======================== Picture ========================
function savePicture(answerNew, answer, question, params, userResponse, done) {
    var fileObj = params.mediaFiles[0] || {};
    if (answerNew) {  // check already saved
        if (fileObj.file) {  // check if new image to upload is not empty
            s3deleteFiles(answerNew.mediaFile.url); // delete old image
        }
        answer = _.extend(answerNew, answer);
    }

    if (!fileObj.file) {
        answer.mediaFile.url = params.pictureUrl;
        if (question._id) {
        userResponse.rawData[questionToken + question._id] = params.pictureUrl;
        }
        answer.save(function (err, a) {
            done(err, a, userResponse);
        });
    } else {
        uploader.uploadBase64(fileObj.file, 'answer', answer, function(err, mediaFile) {
            if (err) {
                return done(err);
            }
            answer.mediaFile = mediaFile;
            if (question._id) {
            userResponse.rawData[questionToken + question._id] = mediaFile.url;
            }
            answer.save(function (err, a) {
                done(err, a, userResponse);
            });
        });
    }
}

// Common function used in case of saving multiple choices
function saveChoices(answerNew, question, answer, params, attrName, userResponse, done) {
    var choices = [];
    params[attrName].forEach(function(ch) {
        choices.push(ch.slug);
    });
    answer.multipleAnswers = choices.join('-');
    if (question._id) {
        userResponse.rawData[questionToken + question._id] = choices.join(' ');
    }
    answer = _.extend(answerNew, answer);
    answer.save(function(err, answer) {
        done(err, answer, userResponse);
    });
}

// ======================== Pairing ========================
function savePairing(answerNew, answer, question, params, userResponse, done) {
    var newParams = JSON.parse(JSON.stringify(params)),
        rawAnswers = [],
        paired = {};
    newParams.pairing.forEach(function(pair, key) {
        if (pair.left && pair.right) {
            rawAnswers.push(pair.left.slug + '-' + pair.right.slug);
            paired[pair.left.slug] = pair.right.slug;
        }
    });
    answer.joinAnswers = paired;
    if (question._id) {
    userResponse.rawData[questionToken + question._id] = rawAnswers.join(' ');
    }
    answer = _.extend(answerNew, answer);
    answer.save(function(err, answer) {
        done(err, answer, userResponse);
    });
}

// ======================== Matrix ========================
function saveMatrix(answerNew, answer, question, params, userResponse, done) {
    var newParams = JSON.parse(JSON.stringify(params)),
        rawAnswers = [],
        matrix;
    if (question.radioButtons) {
        matrix = {};
        newParams.matrix.forEach(function(mtx) {
            if (mtx.row && mtx.col) {
                rawAnswers.push(mtx.row.slug + '-' + mtx.col.slug);
                matrix[mtx.row.slug] = mtx.col.slug;
            }
        });
        answer.joinAnswers = matrix;
    } else {
        matrix = [];
        newParams.matrix.forEach(function(mtx) {
            if (mtx.row && mtx.col) {
                rawAnswers.push(mtx.row.slug + '-' + mtx.col.slug);
                matrix.push(mtx.row.slug + '-' + mtx.col.slug);
            }
        });
        answer.multipleAnswers = matrix.join(' ');
    }
    if (question._id) {
    userResponse.rawData[questionToken + question._id] = rawAnswers.join(' ');
    }
    answer = _.extend(answerNew, answer);
    answer.save(function(err, answer) {
        done(err, answer, userResponse);
    });
}

/**
* Deletes uploaded files either from local directory or from Amazon S3
*/
function s3deleteFiles(url) {
    if (!url) {
        return;
    }
    uploader.delete(url, function(err, deleteResponse) {
        console.log('file deleted!!');
    });
}
