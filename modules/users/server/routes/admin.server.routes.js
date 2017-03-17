'use strict';


module.exports = function (app) {
  // User Routes
  var users = require('../controllers/admin.server.controller'),
      path = require('path');
  var utils = require(path.resolve('./modules/core/server/utilities/utils.server')),
      adminPolicy = require('../policies/admin.server.policy');

  // Setting up the users profile api
  app.route('/api/admin/users').all(utils.authenticate, adminPolicy.isAllowed)
      .get(users.list)
      .post(users.create);
  app.route('/api/admin/users/:userId').all(utils.authenticate, adminPolicy.isAllowed)
      .get(users.read)
      .put(users.update)
      .delete(users.delete);

  // list of surveys published to the current user
  app.route('/api/admin/:userId/users-surveys').all(utils.authenticate)
    .get(users.publishedSurveysUsers);

  // Gathers lists
  app.route('/api/admin/gatherer').all(utils.authenticate, adminPolicy.isAllowed)
      .get(users.gathererList);


  app.route('/api/admin/users/:userId/assign-project').all(utils.authenticate, adminPolicy.isAllowed)
      .put(users.assignProject);

  // Finish by binding the user middleware
  app.param('userId', users.userByID);
};
