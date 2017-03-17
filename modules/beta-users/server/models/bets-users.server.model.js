'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  path = require('path'),
  Schema = mongoose.Schema;

/**
 * A Validation function which checks for user and project name validation
 */
var validateEmailUniqueness = function (email, callback) {
  this.model('BetaUser').count({ email: email, _id: { $ne: this._id } }, function(err, count) {
    callback(!(count > 0));
  });
};

/**
 * Project Schema
 */
var BetaUserSchema = new Schema({
  created: {
    type: Date,
    default: Date.now
  },
  email: {
    type: String,
    trim: true,
    required: 'Email can not be blank',
    validate: [validateEmailUniqueness, 'Email is already registered']
  }
});

mongoose.model('BetaUser', BetaUserSchema);
