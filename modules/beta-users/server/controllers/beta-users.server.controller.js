'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
    mongoose = require('mongoose'),
    Project = mongoose.model('Project'),
    BetaUser = mongoose.model('BetaUser'),
    parameters = require('strong-params').Parameters,
    errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));


/**
 * Create a beta user record
 */
exports.create = function (req, res) {
    var user = new BetaUser({ email: req.body.email });
    user.save(function (err) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            res.json(user);
        }
    });
};
