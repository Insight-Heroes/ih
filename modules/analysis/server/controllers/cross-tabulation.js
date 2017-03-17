'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
    async = require('async'),
    mongoose = require('mongoose'),
    Answer = mongoose.model('Answer'),
    Question = mongoose.model('Question'),
    UserResponse = mongoose.model('UserResponse'),
    Survey = mongoose.model('Survey'),
    utils = require(path.resolve('./modules/core/server/utilities/utils.server')),
    errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
    uploader = require(path.resolve('./modules/core/server/utilities/uploader.server')),
    questionToken = 'rawData.q-',
    _ = require('lodash');


/**
 * Find cross tabulation stats of question
 * @param  {Object}   survey - Survey
 * @param  {Object}   srcQuestion - Question
 * @param  {Array}   targetQuestions - Questions array
 * @param  {Function} mainCallback - Callback function, first argument error, second argument stats
 */
exports.getStats = function(survey, srcQuestion, targetQuestions, mainCallback) {
    var sourceParams = generateSearchQueryParams(srcQuestion);
    var results = {};
    async.each(Object.keys(sourceParams), function (mainLabel, outerDone) {
        var outerQuery = sourceParams[mainLabel];
        async.each(targetQuestions, function(q, done) {
            var subResults = {};
            var targetParams = generateSearchQueryParams(q);
            async.forEach(Object.keys(targetParams), function (innerLabel, innerDone) {
                var innerQuery = targetParams[innerLabel];
                var finalQuery = _.merge(innerQuery, outerQuery);
                UserResponse.aggregate([
                    {
                        $match: finalQuery
                    }, {
                        $group: {
                            _id: null,
                            count: { $sum: 1 }
                        }
                    }])
                    .exec(function(e, response) {
                        if (e) return innerDone(e);
                        if (response && response.length > 0) {
                            console.log(finalQuery, ': ', response[0].count);
                            subResults[innerLabel] = response[0].count;
                        } else {
                            console.log(finalQuery, ': ', 0);
                            subResults[innerLabel] = 0;
                        }
                        innerDone();
                    });
            }, function(innerErr) {
                if (!results[mainLabel]) {
                    results[mainLabel] = [subResults];
                } else {
                    results[mainLabel].push(subResults);
                }
                done(innerErr);
            });
        }, function(err) {
            outerDone(err);
        });
    }, function(outerError) {
        console.log('\nCross Tabulation: ', results, '\n');
        mainCallback(outerError, results);
    });
};

/**
 * generateSearchQueryParams - Generates search query params which can be used in mongoose aggregation pipeline
 * @param  {Object} question - Object
 */
function generateSearchQueryParams(question) {
    switch (question.questionType) {
        case 'multiChoice':
            return getChoiceQuestionQuery(question, question.radioButtons, 'choices', 'text');

        case 'imageChoice':
            return getChoiceQuestionQuery(question, question.radioButtons, 'mediaFiles', 'name');

        case 'dropdown':
            return getChoiceQuestionQuery(question, true, 'choices', 'text');

        case 'slider':
            return getChoiceQuestionQuery(question, true, 'choices', 'text');

        case 'rankOrder':
            return getRankOrderQuery(question);

        case 'matrix':
            return getMatrixOrPairingQuestionQuery(question, 'rows', 'columns');

        case 'pairing':
            return getMatrixOrPairingQuestionQuery(question, 'leftChoices', 'rightChoices');

        default:
            // Unmatched question type
            console.log('Question Type: ', question.questionType);
            return {};
    }

    // Search Query for question - multiChoice, imageChoice, dropdown, slider
    function getChoiceQuestionQuery(question, singleChoice, questionAttr, subAttr) {
        var params = {};
        question[questionAttr].forEach(function(ch) {
            var query = {};
            if (singleChoice) {
                query[questionToken + question._id] = ch.slug;
            } else {
                query[questionToken + question._id] = new RegExp(ch.slug, 'i');
            }
            params[ch[subAttr]] = query;
        });
        return params;
    }

    // Search Query for question - rank order
    function getRankOrderQuery(question) {
        var params = {};
        question.choices.forEach(function(ch) {
            var ranks = new Array(question.choices.length);
            _.each(ranks, function(r, i) {
                var rank = i + 1,
                    key = questionToken + question._id;
                params[ch.text + '- Rank' + rank] = {};
                params[ch.text + '- Rank' + rank][key] = new RegExp((ch.slug + '-' + rank), 'i');
            });
        });
        return params;
    }

    // Search Query for questions - matrix, pairing
    function getMatrixOrPairingQuestionQuery(question, leftAttr, rightAttr) {
        var params = {};
        question[leftAttr].forEach(function(l) {
            question[rightAttr].forEach(function(r) {
                var key = questionToken + question._id;
                params[l.text + '-' + r.text] = {};
                params[l.text + '-' + r.text][key] = new RegExp((l.slug + '-' + r.slug), 'i');
            });
        });
        return params;

    }
}
