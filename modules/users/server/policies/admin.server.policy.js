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
    console.log(chalk.red(roles));
    if (_.includes(['hero', 'user', 'mainUser'], req.user.roles)) {
      // Access granted! Invoke next middleware
      return next();
    } else {
      // An authorization error occurred
      return res.status(403).json({
          message: 'Access Denied! User is not authorized to access the given module'
      });
    }
};
