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
 * PublishedHistory Schema
 */
var PublishedHistorySchema = new Schema({
  created: {
    type: Date,
    default: Date.now
  },
  survey: {
    type: Schema.ObjectId,
    ref: 'Survey'
  },
  publishType: {
    type: String,
    trim: true
  },
  list: {
    type: Schema.ObjectId,
    ref: 'List'
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  }
});

mongoose.model('PublishedHistory', PublishedHistorySchema);
