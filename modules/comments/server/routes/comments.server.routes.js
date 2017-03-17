'use strict';

/**
 * Module dependencies
 */
var commentsPolicy = require('../policies/comments.server.policy'),
  comments = require('../controllers/comments.server.controller');
  var path = require('path'),
  utils = require(path.resolve('./modules/core/server/utilities/utils.server'));

module.exports = function(app) {
  // Comments Routes
  app.route('/api/comments').all(utils.authenticate)
    .get(comments.list)
    .post(comments.create);

  app.route('/api/comments/:graphId').all(utils.authenticate)
    .get(comments.read)
    .put(comments.update)
    .delete(comments.delete);

  // Finish by binding the Comment middleware
  app.param('commentId', comments.commentByID);
};
