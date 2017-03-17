'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * User response Schema
 */
var UserResponseSchema = new Schema({
  survey: {
    type: Schema.ObjectId,
    ref: 'Survey',
    required: 'Question type cannot be blank'
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  accountOwner: {
    type: Schema.ObjectId,
    ref: 'User',
    required: 'Account owner cannot be blank'
  },
  isMobile: {
    type: Boolean,
    default: false
  },
  clientOs: {
    type: String
  },
  clientBrowser: {
    type: String
  },
  clientIp: {
    type: String
  },
  rawData: {
    type: Object
  },
  created: {
    type: Date,
    default: Date.now
  }
});

UserResponseSchema.index({ survey: 1 });
UserResponseSchema.index({ accountOwner: 1 });
UserResponseSchema.index({ rawData: 1 });

mongoose.model('UserResponse', UserResponseSchema);
