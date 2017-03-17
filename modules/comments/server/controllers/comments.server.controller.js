'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  parameters = require('strong-params').Parameters,
  Comment = mongoose.model('Comment'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  _ = require('lodash');

/**

 */
function commentParams(rawParams) {
    var params = parameters(rawParams);
    return params.permit('comment', 'presentation', 'graphId').value();
}

/**
 * Create a Comment
 */
exports.create = function(req, res) {
  var comment = new Comment(commentParams(req.body));
  // console.log('req.body : ', req.body);
  comment.user = req.user;
  comment.userDisplayName = req.user.displayName();
  // console.log('comment : ', comment);

  comment.save(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(comment);
    }
  });
};

/**
 * Show the current Comment
 */
/* exports.read = function(req, res) {
  // convert mongoose document to JSON
  var comment = req.comment ? req.comment.toJSON() : {};

  // Add a custom field to the Article, for determining if the current User is the "owner".
  // NOTE: This field is NOT persisted to the database, since it doesn't exist in the Article model.
  comment.isCurrentUserOwner = req.user && comment.user && comment.user._id.toString() === req.user._id.toString();

  res.jsonp(comment);
}; */

exports.read = function(req, res) {
  var graphId = req.params.graphId;
  // console.log('slideNo : ', slideNo);
  Comment.find({ graphId: graphId }).exec(function (err, comments) {
    if (err) {
      return res.status(404).send({
        message: 'No Comment with that identifier has been found'
      });
    } else {
      res.jsonp(comments);
    }
  });
};

/**
 * Update a Comment
 */
exports.update = function(req, res) {
  var comment = req.comment;

  comment = _.extend(comment, req.body);

  comment.save(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(comment);
    }
  });
};

/**
 * Delete an Comment
 */
exports.delete = function(req, res) {
  var comment = req.comment;

  comment.remove(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(comment);
    }
  });
};

/**
 * List of Comments
 */
exports.list = function(req, res) {
  Comment.find().sort('-created').populate('user', 'displayName').exec(function(err, comments) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(comments);
    }
  });
};

/*
  exports.listBySlide = function(req, res) {
  Comment.find({slide: '586213b3790dad4f1622c305'}).sort('-created').populate('user', 'displayName').exec(function(err, comments) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(comments);
    }
  });
};
*/

/**
 * Comment middleware
 */
exports.commentByID = function(req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Comment is invalid'
    });
  }

  Comment.findById(id).populate('user', 'displayName').exec(function (err, comment) {
    if (err) {
      return next(err);
    } else if (!comment) {
      return res.status(404).send({
        message: 'No Comment with that identifier has been found'
      });
    }
    req.comment = comment;
    next();
  });
};
