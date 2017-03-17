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
 * Survey Schema
 */
var AnswerSchema = new Schema({
  created: {
    type: Date,
    default: Date.now
  },
  question: {
    type: Schema.ObjectId,
    required: 'Question can not be blank'
  },
  userResponse: {
    type: Schema.ObjectId,
    required: 'User response can not be blank'
  },
  singleAnswer: {
    type: String,
    trim: true
  },
  multipleAnswers: {
    type: String,
    trim: true
  },

  // For uploading a new image by User
  mediaFile: {
    url: {
      type: String,
      trim: true
    },
    name: {
      type: String,
      trim: true
    }
  },

  // For storing answers af Rank Order, Matrix, Pairing questions
  joinAnswers: {
    type: Object
  },

  // For time & date question
  ansDate: {
    type: String
  },
  ansTime: {
    type: String
  }

});

AnswerSchema.index({ question: 1 });
AnswerSchema.index({ singleAnswer: 'text' });
AnswerSchema.index({ multipleAnswers: 'text' });
AnswerSchema.index({ userResponse: 1 });

mongoose.model('Answer', AnswerSchema);
