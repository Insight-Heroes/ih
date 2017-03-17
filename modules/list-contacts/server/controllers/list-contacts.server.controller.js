'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  parameters = require('strong-params').Parameters,
  ListContact = mongoose.model('ListContact'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  _ = require('lodash');

/**
 * Create a List contact
 */
exports.create = function(req, res) {
  var listContact = new ListContact(req.body);
  listContact.user = req.user.parentId();

  listContact.save(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(listContact);
    }
  });
};

/**
 * Show the current List contact
 */
exports.read = function(req, res) {
  // convert mongoose document to JSON
  var listContact = req.listContact ? req.listContact.toJSON() : {};

  // Add a custom field to the Article, for determining if the current User is the "owner".
  // NOTE: This field is NOT persisted to the database, since it doesn't exist in the Article model.
  listContact.isCurrentUserOwner = req.user && listContact.user && listContact.user._id.toString() === req.user._id.toString();

  res.jsonp(listContact);
};

/**
 * Update a List contact
 */
exports.update = function(req, res) {
  var listContact = req.listContact;

  listContact = _.extend(listContact, req.body);

  listContact.save(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(listContact);
    }
  });
};

/**
 * Delete an List contact
 */
exports.delete = function(req, res) {
  var listContact = req.listContact;

  listContact.remove(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(listContact);
    }
  });
};

/**
 * List of List contacts
 */
exports.list = function(req, res) {
  ListContact.find().sort('-created').populate('user', 'displayName').exec(function(err, listContacts) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(listContacts);
    }
  });
};

/**
 * List contact middleware
 */
exports.listContactByID = function(req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'List contact is invalid'
    });
  }

  ListContact.findById(id).populate('user', 'displayName').exec(function (err, listContact) {
    if (err) {
      return next(err);
    } else if (!listContact) {
      return res.status(404).send({
        message: 'No List contact with that identifier has been found'
      });
    }
    req.listContact = listContact;
    next();
  });
};
