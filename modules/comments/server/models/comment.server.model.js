'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Comment Schema
 */
var CommentSchema = new Schema({
  comment: {
    type: String,
    default: '',
    required: 'Please fill Comment first',
    trim: true
  },
  created: {
    type: Date,
    default: Date.now
  },
  presentation: {
    type: Schema.ObjectId,
    ref: 'Presentation'
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  userDisplayName: {
    type: String
  },
  graphId: {
    type: Schema.ObjectId
  }
});

mongoose.model('Comment', CommentSchema);
