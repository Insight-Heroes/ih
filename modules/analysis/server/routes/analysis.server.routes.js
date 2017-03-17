'use strict';

/**
 * Module dependencies
 */
var analysisPolicy = require('../policies/analysis.server.policy'),
  analysis = require('../controllers/analysis.server.controller'),
  path = require('path'),
  utils = require(path.resolve('./modules/core/server/utilities/utils.server'));

module.exports = function(app) {
  // Analysis Routes

  app.route('/api/analysis/:currentSurvey/update-variables')
    .put(utils.authenticate, analysis.updateQuestions);
  app.route('/api/analysis/:currentSurvey/variable-lists')
    .get(utils.authenticate, analysis.questionList);
  app.route('/api/analysis/:currentSurvey/tab-statistics')
    .get(utils.authenticate, analysis.questionTabStatistics);

  app.route('/api/analysis/:currentSurvey/crosstab-statistics')
    .get(utils.authenticate, analysis.questionCrossTabStatistics);

  app.route('/api/analysis/rawData/:currentSurvey')
    .get(utils.authenticate, analysis.csvResponses);

  // Finish by binding the Analysis middleware
  app.param('currentSurvey', analysis.surveyByID);
};
