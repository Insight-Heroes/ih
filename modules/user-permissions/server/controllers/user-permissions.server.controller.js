'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
    mongoose = require('mongoose'),
    UserPermission = mongoose.model('UserPermission'),
    errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
    _ = require('lodash');

/**
 * Create a User permission
 */
exports.create = function(req, res) {
    var userPermission = new UserPermission(req.body);
    userPermission.user = req.user;

    userPermission.save(function(err) {
    if (err) {
        return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
        });
    } else {
        res.jsonp(userPermission);
    }
    });
};

/**
 * Show the current User permission
 */
exports.read = function(req, res) {
    // convert mongoose document to JSON
    var userPermission = req.userPermission ? req.userPermission.toJSON() : {};

    // Add a custom field to the Article, for determining if the current User is the "owner".
    // NOTE: This field is NOT persisted to the database, since it doesn't exist in the Article model.
    userPermission.isCurrentUserOwner = req.user && userPermission.user && userPermission.user._id.toString() === req.user._id.toString();

    res.jsonp(userPermission);
};

/**
 * Update a User permission
 */
exports.update = function(req, res) {
    var userPermission = req.userPermission;

    userPermission = _.extend(userPermission, req.body);

    userPermission.save(function(err) {
    if (err) {
        return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
        });
    } else {
        res.jsonp(userPermission);
    }
    });
};

/**
 * Delete an User permission
 */
exports.delete = function(req, res) {
    var userPermission = req.userPermission;

    userPermission.remove(function(err) {
    if (err) {
        return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
        });
    } else {
        res.jsonp(userPermission);
    }
    });
};

/**
 * List of User permissions
 */
exports.list = function(req, res) {
    UserPermission.find().sort('-created').populate('user', 'displayName').exec(function(err, userPermissions) {
    if (err) {
        return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
        });
    } else {
        res.jsonp(userPermissions);
    }
    });
};

/**
 * User permission middleware
 */
exports.userPermissionByID = function(req, res, next, id) {

    if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
        message: 'User permission is invalid'
    });
    }

    UserPermission.findById(id).populate('user', 'displayName').exec(function (err, userPermission) {
    if (err) {
        return next(err);
    } else if (!userPermission) {
        return res.status(404).send({
        message: 'No User permission with that identifier has been found'
        });
    }
    req.userPermission = userPermission;
    next();
    });
};
