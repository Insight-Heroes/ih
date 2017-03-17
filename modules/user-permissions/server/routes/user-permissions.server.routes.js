'use strict';

/**
 * Module dependencies
 */
var userPermissionsPolicy = require('../policies/user-permissions.server.policy'),
    userPermissions = require('../controllers/user-permissions.server.controller');

module.exports = function(app) {
    // User permissions Routes
    app.route('/api/user-permissions').all(userPermissionsPolicy.isAllowed)
        .get(userPermissions.list)
        .post(userPermissions.create);

    app.route('/api/user-permissions/:userPermissionId').all(userPermissionsPolicy.isAllowed)
        .get(userPermissions.read)
        .put(userPermissions.update)
        .delete(userPermissions.delete);

    // Finish by binding the User permission middleware
    app.param('userPermissionId', userPermissions.userPermissionByID);
};
