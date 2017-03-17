'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * OrderHistory Schema
 */
var GatewayResponsesSchema = new Schema({
    user: {
        type: Schema.ObjectId,
        ref: 'User'
    },
    subscriptionId: {
        type: String
    },
    gatewayResponse: {
        type: Object
    },
    kind: {
        type: String
    },
    timestamp: {
        type: Date
    },
    bt_webhookResponse: {
        type: Object
    }

});

GatewayResponsesSchema.index({ user: 1 });

mongoose.model('GatewayResponses', GatewayResponsesSchema);
