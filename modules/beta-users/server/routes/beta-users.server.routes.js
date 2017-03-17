'use strict';

/**
 * Module dependencies
 */
var betaUsers = require('../controllers/beta-users.server.controller'),
    path = require('path');

module.exports = function (app) {
    // Projects collection routes
    app.route('/api/beta-users')
        .post(betaUsers.create);

};
