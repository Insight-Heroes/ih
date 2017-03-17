'use strict';

var _ = require('lodash'),
  chalk = require('chalk');

/**
 * Check If User is Allowed to access a module
 */
exports.isAllowed = function (req, res, next) {
    console.log('Reqest Route Path: ', req.route.path);
    console.log('Reqest method: ', req.method.toLowerCase());
    console.log('Roles', req.user.roles);
    var roles = (req.user) ? req.user.roles : ['guest'];
    console.log(req.user.roles);
    if (_.includes(['hero', 'user', 'mainUser', 'warrior', 'client'], req.user.roles)) {
      if ((req.route.path === '/api/projects/:projectId' && req.method.toLowerCase() === 'put') || (req.route.path === '/api/projects' && req.method.toLowerCase() === 'post') || (req.route.path === '/api/projects/:projectId' && req.method.toLowerCase() === 'delete')) {
        if (_.includes(['warrior', 'client'], req.user.roles)) {
          // An authorization error occurred
          return res.status(403).json({
              message: 'Access Denied! User is not authorized to access the given module'
          });
        } else {
          return next();
        }
      } else {
        return next();
      }
    } else {
      // An authorization error occurred
      return res.status(403).json({
          message: 'Access Denied! User is not authorized to access the given module'
      });
    }
};
