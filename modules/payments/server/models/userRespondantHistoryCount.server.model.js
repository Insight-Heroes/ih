'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * OrderHistory Schema
 */
var UserRespondentHistoryCountSchema = new Schema({
  created: {
    type: Date,
    default: Date.now
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  orderHistoryId: {
    type: Schema.ObjectId,
    ref: 'OrderHistory'
  },
  subscriptionId: {
    type: String
  },
  transactionId: {
    type: String
  },
  billingPeriodStartDate: {
    type: Date
  },
  planType: {
    type: String
  },
  respondentCount: {
    type: Number
  }
});

mongoose.model('UserRespondentHistoryCount', UserRespondentHistoryCountSchema);
