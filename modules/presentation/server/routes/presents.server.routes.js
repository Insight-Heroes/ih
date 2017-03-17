'use strict';

/**
 * Module dependencies
 */
var presentsPolicy = require('../policies/presents.server.policy'),
    path = require('path'),
    presents = require('../controllers/presents.server.controller');
var utils = require(path.resolve('./modules/core/server/utilities/utils.server'));

module.exports = function(app) {
  // Presents Routes
  app.route('/api/presentation').all(utils.authenticate, presentsPolicy.isAllowed)
    .get(presents.list)
    .post(presents.create);

  app.route('/api/presentation/pdf/:presentId').all(utils.authenticate, presentsPolicy.isAllowed)
        .post(presents.generatePdf);

   app.route('/api/presentation/updateSlidePosition/:presentId').all(utils.authenticate, presentsPolicy.isAllowed)
    .put(presents.updateSlidePosition);

  app.route('/api/presentation/:presentId').all(utils.authenticate, presentsPolicy.isAllowed)
    .get(presents.read)
    .put(presents.update)
    .delete(presents.delete);

  app.route('/api/presentation/survey/:surveyId').all(utils.authenticate, presentsPolicy.isAllowed)
    .get(presents.readPresentBySurvey);

  app.route('/api/presentation/:presentId/:graphId').all(utils.authenticate, presentsPolicy.isAllowed)
    .delete(presents.deleteGraph);

  // Finish by binding the Present middleware
  app.param('presentId', presents.presentByID);
};
