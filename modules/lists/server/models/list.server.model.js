'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * A Validation function which checks for user and survey name validation
 */
var validateUserAndNameUniqueness = function (name, callback) {
  this.model('List').count({
    name: name,
    user: this.user._id,
    _id: { $ne: this._id }
  }, function(err, count) {
    console.log('List count for given name: ', count, !(count > 0));
    callback(!(count > 0));
  });
};


/**
 * List Schema
 */
var ListSchema = new Schema({
  name: {
    type: String,
    default: '',
    required: 'Please fill List name',
    trim: true,
    validate: [validateUserAndNameUniqueness, 'List with given name already exists']
  },
  created: {
    type: Date,
    default: Date.now
  },
  project: {
    type: Schema.ObjectId,
    ref: 'Project'
    // required: 'Project can not be blank'
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User',
    required: 'User can not be blank'
  },
  // survey: {
  //   type: Schema.ObjectId,
  //   ref: 'Survey',
  //   required: 'Survey can not be blank'
  // },
  contactHeaders: {
    type: Object,
    default: {
      email: 'Email',
      firstname: 'First Name',
      lastname: 'Last Name'
    }
  },
  fromEmail: {
    type: String
  },
  fromName: {
    type: String
  },
  companyName: {
    type: String
  },
  address: {
    type: String
  },
  zipcode: {
    type: String
  },
  state: {
    type: String
  },
  country: {
    type: String
  },
  mobileNo: {
    type: String
  }
});

mongoose.model('List', ListSchema);
