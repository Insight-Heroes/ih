'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  path = require('path'),
  Schema = mongoose.Schema;

var utils = require(path.resolve('./modules/core/server/utilities/utils.server'));

/**
 * Logic Jump Schema
 */
var LogicJumpSchema = new Schema({
  created: {
    type: Date,
    default: Date.now
  },
  jumptoQuestion: {
    type: Schema.ObjectId,
    ref: 'Question',
    required: 'Jump to Question cannot be empty'
  },
  logic: [{
    question: {
      type: Schema.ObjectId,
      ref: 'Question',
      required: 'Logic question cannot be blank'
    },
    choice: {
      type: Schema.ObjectId,
      trim: true
    }
  }],
  survey: {
    type: Schema.ObjectId,
    ref: 'Survey',
    default: null
  },
  logicPosition: {
    type: String,
    default: 0
  }
});

LogicJumpSchema.index({ target_question: 1 });

mongoose.model('LogicJump', LogicJumpSchema);
