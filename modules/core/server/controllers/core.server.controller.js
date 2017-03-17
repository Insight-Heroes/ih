'use strict';

var validator = require('validator'),
    mongoose = require('mongoose'),
    User = mongoose.model('User'),
    path = require('path');
var utils = require(path.resolve('./modules/core/server/utilities/utils.server')),
    uploader = require(path.resolve('./modules/core/server/utilities/uploader.server'));

/**
 * Render the main application page
 */
exports.renderIndex = function (req, res) {
  if (req.user) {
    var query = User.findOne({ _id: req.user.parentId() }).select('isSubscribed subscriptionType totalNoOfRespondants balanceUserResponses receivedUserResponses orderHistoryId');
    query.exec(function(err, accountOwner) {
      if (err) {
        return res.status(500).render('modules/core/server/views/500', {
          error: 'Oops! Something went wrong...'
        });
      }
      sendResponse(accountOwner);
    });
  } else {
    sendResponse();
  }
  function sendResponse(owner) {
    var safeUserObject = null;
    if (req.user) {
      safeUserObject = {
        _id: validator.escape(req.user._id.toString()),
        displayName: validator.escape(req.user.displayName()),
        created: req.user.created.toString(),
        roles: req.user.roles,
        profileImage: req.user.profileImage,
        email: validator.escape(req.user.email),
        lastName: validator.escape(req.user.lastName),
        firstName: validator.escape(req.user.firstName),
        plan: owner
      };
    }

    res.render('modules/core/server/views/index', {
      user: JSON.stringify(safeUserObject),
      questionTypes: JSON.stringify(utils.questionTypes()),
      maxFileSize: JSON.stringify(uploader.maxFileSize()),
      pageTypes: JSON.stringify(utils.pageTypes()),
      userTypes: JSON.stringify(utils.userTypes()),
      dataCollectionTypes: JSON.stringify(utils.dataCollectionTypes()),
      defaultPlanTypes: JSON.stringify(utils.defaultPlanTypes())
    });

  }
};

/**
 * Render the server error page
 */
exports.renderServerError = function (req, res) {
  res.status(500).render('modules/core/server/views/500', {
    error: 'Oops! Something went wrong...'
  });
};

/**
 * Render the server not found responses
 * Performs content-negotiation on the Accept HTTP header
 */
exports.renderNotFound = function (req, res) {

  res.status(404).format({
    'text/html': function () {
      res.render('modules/core/server/views/404', {
        url: req.originalUrl
      });
    },
    'application/json': function () {
      res.json({
        error: 'Path not found'
      });
    },
    'default': function () {
      res.send('Path not found');
    }
  });
};
