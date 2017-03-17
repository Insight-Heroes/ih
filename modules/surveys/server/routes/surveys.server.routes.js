'use strict';

/**
 * Module dependencies
 */
var surveys = require('../controllers/surveys.server.controller'),
    path = require('path');
var utils = require(path.resolve('./modules/core/server/utilities/utils.server'));

module.exports = function (app) {
    // Surveys collection routes
    app.route('/api/surveys').all(utils.authenticate)
        .get(surveys.list)
        .post(surveys.create);

    // Single Survey routes
    app.route('/api/surveys/:surveyId').all(utils.authenticate)
        .get(surveys.read)
        .put(surveys.update)
        .delete(surveys.delete);

    // Reorder questions
    app.route('/api/surveys/:surveyId/reorder_questions')
        .put(utils.authenticate, surveys.reorderQuestions);

    app.route('/api/surveys/:surveyId/publish_to_gatherers')
        .post(utils.authenticate, surveys.publishToGatherers);

    app.route('/api/surveys/:surveyId/distribute-history')
        .get(utils.authenticate, surveys.distributeHistory);
    // Change Survey of Survey
    // publish/unpublish/pause
    app.route('/api/surveys/:surveyId/status')
        .get(utils.authenticate, surveys.getStatus)
        .put(utils.authenticate, surveys.updateStatus);

    // Finish by binding the survey middleware
    app.param('surveyId', surveys.surveyByID);
};
