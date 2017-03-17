'use strict';

/**
 * Module dependencies
 */
var acl = require('acl');

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke User permissions Permissions
 */
exports.invokeRolesPolicies = function () {
    acl.allow([{
        roles: ['admin'],
        allows: [{
            resources: '/api/user-permissions',
            permissions: '*'
        }, {
            resources: '/api/user-permissions/:userPermissionId',
            permissions: '*'
        }]
    }, {
        roles: ['user'],
        allows: [{
            resources: '/api/user-permissions',
            permissions: ['get', 'post']
        }, {
            resources: '/api/user-permissions/:userPermissionId',
            permissions: ['get']
        }]
    }, {
        roles: ['guest'],
        allows: [{
            resources: '/api/user-permissions',
            permissions: ['get']
        }, {
            resources: '/api/user-permissions/:userPermissionId',
            permissions: ['get']
        }]
    }]);
};

/**
 * Check If User permissions Policy Allows
 */
exports.isAllowed = function (req, res, next) {
    var roles = (req.user) ? req.user.roles : ['guest'];

    // If an User permission is being processed and the current user created it then allow any manipulation
    if (req.userPermission && req.user && req.userPermission.user && req.userPermission.user.id === req.user.id) {
        return next();
    }

    // Check for user roles
    acl.areAnyRolesAllowed(roles, req.route.path, req.method.toLowerCase(), function (err, isAllowed) {
        if (err) {
            // An authorization error occurred
            return res.status(500).send('Unexpected authorization error');
        } else {
            if (isAllowed) {
                // Access granted! Invoke next middleware
                return next();
            } else {
                return res.status(403).json({
                    message: 'User is not authorized'
                });
            }
        }
    });
};
