'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * OrderHistory Schema
 */
var OrderHistorySchema = new Schema({
  status: {
    type: String,
    default: '',
    enum: ['pending', 'success', 'failed', 'rejected']
  },
  braintreeStatus: {
    type: String,
    default: null
  },
  amount: {
    type: Number
    // required: 'Please fill in amount'
  },
  created: {
    type: Date,
    default: Date.now
  },
  gatewayResponse: {
    type: Object
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  code: {
    type: String
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
  billingPeriodEndDate: {
    type: Date
  },
  planType: {
    type: String
  },
  numberOfRespondant: {
    type: Number
  }
});

mongoose.model('OrderHistory', OrderHistorySchema);
