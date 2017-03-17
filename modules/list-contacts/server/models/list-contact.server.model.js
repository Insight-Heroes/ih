'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  _ = require('lodash'),
  path = require('path'),
  utils = require(path.resolve('./modules/core/server/utilities/utils.server')),
  Schema = mongoose.Schema;

/**
 * List contact Schema
 */
var ListContactSchema = new Schema({
  email: {
    type: String,
    required: 'Please fill list contact email',
    trim: true
  },
  firstname: {
    type: String,
    trim: true
  },
  lastname: {
    type: String,
    trim: true
  },
  respondentType: {
    type: String,
    enum: _.keys(utils.dataCollectionTypes())
  },
  data: {
    type: Object
  },
  created: {
    type: Date,
    default: Date.now
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User',
    required: 'Please fill user details for contact'
  },
  list: {
    type: Schema.ObjectId,
    ref: 'List',
    required: 'Please fill list details for contact'
  }
});

var ListContactPublishedSchema = new Schema({
  surveyId: {
    type: Schema.ObjectId
  },
  listId: {
    type: Schema.ObjectId
  },
  listContactsId: {
    type: Schema.ObjectId
  }
});

// mongoose.model('ListContact', ListContactSchema);

mongoose.model('ListContact', ListContactSchema, 'listcontacts');
mongoose.model('ListContactPublished', ListContactPublishedSchema, 'listcontactsPublished');

