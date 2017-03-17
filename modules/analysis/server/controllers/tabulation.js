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
 * Find tabulation stats of question
 * @param  {Object}   q - Question
 * @param  {Function} done - Callback function, first argument error, second argument stats
 */
exports.getStats = function(question, done) {
    switch (question.questionType) {
        case 'multiChoice':
            getChoicesStats(question, question.radioButtons, 'choices', 'text', done);
            break;

        case 'imageChoice':
            getChoicesStats(question, question.radioButtons, 'mediaFiles', 'name', done);
            break;

        case 'dropdown':
            getChoicesStats(question, true, 'choices', 'text', done);
            break;

        case 'rankOrder':
            getRankOrderStats(question, done);
            break;

        case 'slider':
            getChoicesStats(question, true, 'choices', 'text', done);
            break;

        case 'matrix':
            getMatrixOrPairingStats(question, 'rows', 'columns', question.radioButtons, done);
            break;

        case 'pairing':
            getMatrixOrPairingStats(question, 'leftChoices', 'rightChoices', true, done);
            break;

        default:
            // Pairing & Martix question saving
            done();
    }
};

// ======================== Rank Order ========================
function getRankOrderStats(question, mainCallback) {
    var ranks = [],
        slugs = [],
        choices = [],
        data = [];
    question.choices.forEach(function(ch, i) {
        ranks.push(i + 1);
        slugs.push(ch.slug);
        choices.push(ch.text);
    });
    async.each(slugs, function(slug, done) {
        var ranksData = [];
        async.each(ranks, function(rank, cb) {
            var params = {
                question: question._id
            };
            params['joinAnswers.' + slug] = rank;

            Answer.aggregate([
                {
                    $match: params
                }, {
                    $group: {
                        _id: null,
                        count: { $sum: 1 }
                    }
                }])
                .exec(function(err, response) {
                    if (err) return done(err);
                    if (response && response.length > 0) {
                        console.log('joinAnswers.' + slug, '=', rank, ': ', response[0].count);
                        ranksData.push(response[0].count);
                    } else {
                        console.log('joinAnswers.' + slug, '=', rank, ': ', 0);
                        ranksData.push(0);
                    }
                    cb(err);
                });
        }, function(e) {
            if (e) return done(e);
            data.push(ranksData);
            done();
        });
    }, function(err) {
        if (err) return mainCallback(err);
        mainCallback(null, {
            question: question,
            labels: choices,
            series: ranks.map(function(r) { return ('Rank ' + r); }),
            data: data
        });
    });
}

// ======================== Matrix/Pairing ========================
function getMatrixOrPairingStats(question, attr1, attr2, single, mainCallback) {
    var stats = [];
    var data = [];
    console.log('++++++++', question.questionType, '++++++++');
    async.each(question[attr1], function(row, done) {
        var seriesData = [];
        async.each(question[attr2], function(col, cb) {
            var params = {
                question: question._id
            };
            if (single) {
                params['joinAnswers.' + row.slug] = col.slug;
            } else {
                params.multipleAnswers = new RegExp((row.slug + '-' + col.slug), 'i');
            }
            console.log('Params', params);
            Answer.aggregate([
                {
                    $match: params
                }, {
                    $group: {
                        _id: null,
                        count: { $sum: 1 }
                    }
                }])
                .exec(function(err, response) {
                    if (err) return cb(err);
                    if (response && response.length > 0) {
                        console.log('joinAnswers.' + row.slug, '=', col.slug, ': ', response[0].count);
                        seriesData.push(response[0].count);
                    } else {
                        console.log('joinAnswers.' + row.slug, '=', col.slug, ': ', 0);
                        seriesData.push(0);
                    }
                    cb(err);
                });
        }, function(e) {
            if (e) return done(e);
            data.push(seriesData);
            done();
        });
    }, function(err) {
        if (err) return mainCallback(err);
        mainCallback(null, {
            question: question,
            labels: _.map(question[attr1], 'text'),
            series: _.map(question[attr2], 'text'),
            data: data
        });
    });
}

// ======================== Multichoice, Imagechoice, Dropdown, Slider ========================
function getChoicesStats(question, singleChoice, questionAttr, subAttr, callback) {
    var stats = [];
    async.each(question[questionAttr], function (ch, done) {
        var st = { title: ch[subAttr], url: ch.url },
            searchParams;
        // Single selection
        if (singleChoice) {
            searchParams = {
                question: question._id,
                singleAnswer: ch.slug
            };
        // Multi selection
        } else {
            searchParams = {
                question: question._id,
                multipleAnswers: new RegExp(ch.slug, 'i')
            };
        }
        Answer.find(searchParams).count(function(err, count) {
            if (err) return done(err);
            st.count = count;
            stats.push(st);
            done();
        });
    }, function(err) {
        if (err) return callback(err);
        callback(null, {
            question: question,
            // stats: stats,
            data: _.map(stats, 'count'),
            labels: _.map(stats, 'title')
        });
    });
}
