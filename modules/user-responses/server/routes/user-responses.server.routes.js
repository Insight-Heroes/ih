'use strict';

/**
 * Module dependencies
 */
var userResponsesPolicy = require('../policies/user-responses.server.policy'),
  userResponses = require('../controllers/user-responses.server.controller');

module.exports = function(app) {
  // User responses Routes
  app.route('/api/user-responses')
    .get(userResponses.list)
    .post(userResponses.create);

  app.route('/api/user-responses/delete')
    .post(userResponses.delete);

  app.route('/api/user-responses/:userResponseId')
    .put(userResponses.update);
    // .delete(userResponses.delete);

  // Finish by binding the User response middleware
  app.param('userResponseId', userResponses.userResponseByID);
};
