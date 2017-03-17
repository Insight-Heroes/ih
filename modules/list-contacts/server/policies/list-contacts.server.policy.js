'use strict';

/**
 * Module dependencies
 */
var acl = require('acl');

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke List contacts Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: ['admin'],
    allows: [{
      resources: '/api/list-contacts',
      permissions: '*'
    }, {
      resources: '/api/list-contacts/:listContactId',
      permissions: '*'
    }]
  }, {
    roles: ['user'],
    allows: [{
      resources: '/api/list-contacts',
      permissions: ['get', 'post']
    }, {
      resources: '/api/list-contacts/:listContactId',
      permissions: ['get']
    }]
  }, {
    roles: ['guest'],
    allows: [{
      resources: '/api/list-contacts',
      permissions: ['get']
    }, {
      resources: '/api/list-contacts/:listContactId',
      permissions: ['get']
    }]
  }]);
};

/**
 * Check If List contacts Policy Allows
 */
exports.isAllowed = function (req, res, next) {
  var roles = (req.user) ? req.user.roles : ['guest'];

  // If an List contact is being processed and the current user created it then allow any manipulation
  if (req.listContact && req.user && req.listContact.user && req.listContact.user.id === req.user.id) {
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
