'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  path = require('path'),
  _ = require('lodash'),
  Schema = mongoose.Schema;

var utils = require(path.resolve('./modules/core/server/utilities/utils.server'));

/**
 * A Validation function which checks for user and survey name validation
 */
var validateUserAndNameUniqueness = function (name, callback) {
  // console.log('this.user._id', this.user._id, 'this.user: ', this.user, 'this.project: ', this.project);
  this.model('Survey').count({
    name: name,
    user: this.user._id,
    _id: { $ne: this._id },
    project: this.project
  }, function(err, count) {
    // console.log('Survey count for given project: ', count, !(count > 0));
    callback(!(count > 0));
  });
};

/**
 * A Validation function which checks if status in correct or not
 */
var validateStatus = function (status) {
  _.includes(['draft', 'published'], status);
};


/**
 * Survey Schema
 */
var SurveySchema = new Schema({
  created: {
    type: Date,
    default: Date.now
  },
  lastOpenedOn: {
    type: Date,
    default: Date.now
  },
  name: {
    type: String,
    trim: true,
    required: 'Name cannot be blank',
    validate: [validateUserAndNameUniqueness, 'Name is already taken']
  },
  description: {
    type: String,
    trim: true,
    required: 'Description cannot be blank'
  },
  randomCode: {
    type: String,
    trim: true
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User',
    required: 'User cannot be blank'
  },
  project: {
    type: Schema.ObjectId,
    ref: 'Project',
    required: 'Project cannot be blank'
  },
  questions: [{
      type: Schema.ObjectId,
      ref: 'Question'
  }],
  userResponses: {
    type: Number
  },
  pages: [{
      type: Schema.ObjectId,
      ref: 'Page'
  }],
  status: {
    type: String,
    default: 'draft',
    required: ['Status can not be blank'],
    validate: [validateStatus, 'Status is invalid']
  },
  publish: {
    type: Boolean,
    default: false
  }
});

SurveySchema.index({ name: 1, user: 1, project: 1 }, { unique: true });

mongoose.model('Survey', SurveySchema);
