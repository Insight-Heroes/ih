'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  path = require('path'),
  Schema = mongoose.Schema;

var utils = require(path.resolve('./modules/core/server/utilities/utils.server'));

/**
 * A Validation function which checks for user and project name validation
 */
var validateUserAndNameUniqueness = function (name, callback) {
  this.model('Project').count({ name: name, user: this.user._id, _id: { $ne: this._id } }, function(err, count) {
    callback(!(count > 0));
  });
};

function validateQuestionType(questionType) {
  if (utils.questionTypes(true).indexOf(questionType) < 0) {
    return false;
  } else {
    return true;
  }
}

/**
 * Project Schema
 */
var ProjectSchema = new Schema({
  created: {
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
  client: {
    type: String,
    trim: true,
    required: 'Client Name cannot be blank'
  },
  division: {
    type: String,
    trim: true,
    required: 'Division Name cannot be blank'
  },
  round: {
    type: Number,
    // required: 'Please fill in number of analysts',
    min: [1, 'Round must be greater than 0'],
    max: [100, 'Round must be less than or equal to 100']
  },
  frequency: {
    type: String,
    trim: true,
    enum: ['One Time', 'Weekly', 'Fortnightly', 'Monthly', 'Quarterly', 'Six Monthly', 'Yearly'],
    default: [],
    required: 'Frequency cannot be blank'
  },
  logo: {
    type: String
  },
  tmpLogo: {
    type: String
  },
  respondantType: {
    type: String,
    enum: ['Customer', 'Employee', 'Supply Chain', 'Sales Channel', 'Vendor', 'Competitor', 'Other'],
    default: ['Customer'],
    required: 'Please select respondant type'
  },
  country: {
    type: String,
    required: 'Please select country to be surveyed'
  },
  stateProvincesCovered: {
    type: String
  },
  sampleToBeCovered: {
    type: Number,
    required: 'SampleToBeCovered cannot be blank'
  },
  methodOfDataCollection: {
    type: String,
    enum: ['Email', 'Web/Embed Links', 'CATI', 'FOS'],
    required: 'MethodOfDataCollection cannot be blank'
  },
  ValueOfProject: {
    type: String
  },
  startDate: {
    type: Date
    // required: 'Please select the Start Date'
  },
  estimatedEndDate: {
    type: Date
  },
  clientCoordinator: {
    type: String
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    required: 'Please fill in email'
  },
  mobileNo: {
    type: String,
    trim: true,
    validate: [{
      validator: function(v) {
        if (!/^\d+$/.test(v)) {
          if (/^$/.test(v)) {
            return true;
          }
          return false;
        }
      },
      message: 'Mobile number should be numeric'
    }, {
      validator: function(v) {
        if (v.length < 10) {
          if (/^$/.test(v)) {
            return true;
          }
          return false;
        }
      },
      message: 'Mobile number must be minimum 10 digit'
    }]
  },
  skypeID: {
    type: String
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User',
    required: 'User cannot be blank'
  },
  lastOpenedOn: {
    type: Date,
    default: Date.now
  },
  surveys: [{
    type: Schema.ObjectId,
    ref: 'Survey'
  }]
});

ProjectSchema.index({ name: 1, user: 1 }, { unique: true });

mongoose.model('Project', ProjectSchema);
