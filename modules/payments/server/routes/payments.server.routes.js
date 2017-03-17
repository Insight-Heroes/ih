'use strict';

/**
 * Module dependencies
 */
var paymentsPolicy = require('../policies/payments.server.policy'),
  path = require('path'),
  utils = require(path.resolve('./modules/core/server/utilities/utils.server')),
  payments = require('../controllers/payments.server.controller');

module.exports = function(app) {
  // Payments Routes
  app.route('/api/checkout', utils.authenticate)
    .get(payments.list)
    .post(payments.checkout);

  app.route('/api/payments').all(utils.authenticate)
    .get(payments.clientToken);

  app.route('/api/payments/bt_webhook')
    .post(payments.bt_webhook);

  app.route('/api/listcontactsPublished').all(utils.authenticate)
    .get(payments.listcontactsPublished);

  app.route('/api/userResponses').all(utils.authenticate)
    .get(payments.userResponses);

  app.route('/api/payments/order-histories').all(utils.authenticate)
    .get(payments.orderHistories);

  app.route('/api/payments/:orderHistoryId/download-invoice').all(utils.authenticate)
    .get(payments.downloadInvoice);

  app.route('/api/payments/:payHistoryId/paymentHistory-pdf').all(utils.authenticate)
    .get(payments.paymentExportToPdf);

  app.route('/api/payments/:historyId/cancel-subscription').all(utils.authenticate)
    .get(payments.cancelSubscription);

  app.route('/api/payments/:historyId/details').all(utils.authenticate)
    .get(payments.read);

};
