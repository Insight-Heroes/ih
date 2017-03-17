'use strict';

/**
 * Module dependencies
 */
var projects = require('../controllers/projects.server.controller'),
    path = require('path'),
    policy = require('../policies/project.server.policy');
var utils = require(path.resolve('./modules/core/server/utilities/utils.server'));

module.exports = function (app) {
    // Projects collection routes
    app.route('/api/projects').all(utils.authenticate, policy.isAllowed)
        .get(projects.list)
        .post(projects.create);

    // Single Project routes
    app.route('/api/projects/:projectId').all(utils.authenticate, policy.isAllowed)
        .get(projects.read)
        .put(projects.update)
        .delete(projects.delete);

    // Finish by binding the project middleware
    app.param('projectId', projects.projectByID);
};
