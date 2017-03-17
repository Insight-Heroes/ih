'use strict';

/**
 * Check If User is Allowed to access a module
 */
exports.isAllowed = function (req, res, next) {
    console.log('Reqest Route Path: ', req.route.path);
    console.log('Reqest method: ', req.method.toLowerCase());
    console.log('Reqest User: ', req.user);
    var roles = (req.user) ? req.user.roles : ['guest'];

    // Access granted! Invoke next middleware
    // return next();
    // An authorization error occurred
    return res.status(403).json({
        message: 'Access Denied! User is not authorized to access the given module'
    });
};
