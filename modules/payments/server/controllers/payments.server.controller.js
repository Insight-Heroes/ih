'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  Payment = mongoose.model('Payment'),
  User = mongoose.model('User'),
  UserResponse = mongoose.model('UserResponse'),
  OrderHistory = mongoose.model('OrderHistory'),
  UserRespondentHistoryCount = mongoose.model('UserRespondentHistoryCount'),
  GatewayResponses = mongoose.model('GatewayResponses'),
  ListContactPublished = mongoose.model('ListContactPublished'),
  async = require('async'),
  uuid = require('node-uuid'),
  utils = require(path.resolve('./modules/core/server/utilities/utils.server')),
  pdf = require('html-pdf'),
  shortid = require('shortid'),
  fs = require('fs'),
  moment = require('moment'),
  config = require(path.resolve('./config/config')),
  nodemailer = require('nodemailer'),
  smtpTransport = nodemailer.createTransport(config.mailer.options),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  _ = require('lodash');
  var braintree = require('braintree');
  var environment = process.env.BT_ENVIRONMENT.charAt(0).toUpperCase() + process.env.BT_ENVIRONMENT.slice(1),
  MERCHANT_ID = process.env.BT_MERCHANT_ID,
  PUBLIC_KEY = process.env.BT_PUBLIC_KEY,
  PRIVATE_KEY = process.env.BT_PRIVATE_KEY;
  var gateway = braintree.connect({
    environment: braintree.Environment[environment],
    merchantId: MERCHANT_ID,
    publicKey: PUBLIC_KEY,
    privateKey: PRIVATE_KEY
  });

/* exports.createCustomer = function (req, res) {
  gateway.customer.create({
    firstName: "asd",
    lastName: "sd"
  }, function (err, result) {
    result.success;
    // true

    result.customer.id;
    // e.g. 494019
    console.log('result.customer.id : ', result.customer.id);
    req.user.braintreeCustomerId = result.customer.id;
    console.log('req.user.braintreeCustomerId : ', req.user);
    res.jsonp(result);
  });
    gateway.customer.find('22311395', function(err, customer) {
      console.log('customer : ', customer);
      res.jsonp(customer);
    });
}; */

/**
 * Get client Token
 */
exports.clientToken = function (req, res) {
    /* gateway.clientToken.generate({}, function (err, response) {
    console.log('response : ', response);
    res.json(response.clientToken);
}); */
    async.waterfall([
    function(done) {
        var nonceFromTheClient = req.body.payment_method_nonce;
        if (req.user.braintreeCustomerId) {
            done(null, req.user.braintreeCustomerId);
        } else {
            gateway.customer.create({
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                company: req.user.company.name,
                email: req.user.email,
                phone: req.user.mobileNo,
                website: req.user.company.website,
                paymentMethodNonce: nonceFromTheClient
            }, function (err, custResult) {
                var user = req.user;
                user.braintreeCustomerId = custResult.customer.id;
                user.save(function(err, user) {
                    // console.log('user : ', user);
                });
                console.log('req.user.braintreeCustomerId : ', req.user.braintreeCustomerId);
                // console.log('custResult : ', custResult);
                done(err, custResult.customer.id);
            });
        }
    },
    function(custId, done) {
        console.log('custId : ', custId);
        gateway.clientToken.generate({ customerId: custId.toString() }, function (err, response) {
            // console.log('response : ', response);
            done(err, response.clientToken);
        });
    }
    ], function(err, result) {
        console.error('Payment Error: ==========>', err);
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            console.log('result : ', result);
            res.json(result);
        }
        /* var custId = req.user.braintreeCustomerId;
        gateway.customer.find(custId.toString(), function(err, customer) {
            // console.log('customer : ', customer);
        }); */
    });
};
var createGatewayResponse = function(req, gatewayResponse, done) {
    console.log('gatewayResponse : ', gatewayResponse);
    var gatewayResponses = new GatewayResponses();
    gatewayResponses.user = req.user.parentId();
    gatewayResponses.gatewayResponse = gatewayResponse;

    gatewayResponses.save(function(err, gatewayResponse) {
        if (err) {
            done(err, null);
        } else {
            done(null, gatewayResponse);
        }
    });
};

var createOrderHistory = function(req, gatewayResponse, done) {
    var planType = req.body.planType;
    var defaultPlanTypes = utils.defaultPlanTypes();
    var orderHistory = new OrderHistory();

    orderHistory.user = req.user.parentId();
    orderHistory.gatewayResponse = gatewayResponse;

    if (gatewayResponse.success) {
        orderHistory.status = 'success';
        if (planType === 'A') {
            orderHistory.amount = gatewayResponse.transaction.amount;
            orderHistory.planType = planType;
            orderHistory.transactionId = gatewayResponse.transaction.id;
            orderHistory.numberOfRespondant = req.body.noOfRespondants;
            orderHistory.braintreeStatus = gatewayResponse.transaction.status;
        } else {
            orderHistory.amount = gatewayResponse.subscription.price;
            orderHistory.planType = planType;
            orderHistory.subscriptionId = gatewayResponse.subscription.id;
            orderHistory.billingPeriodStartDate = gatewayResponse.subscription.billingPeriodStartDate;
            orderHistory.billingPeriodEndDate = gatewayResponse.subscription.billingPeriodEndDate;
            orderHistory.braintreeStatus = gatewayResponse.subscription.status;
            if (planType === 'M') {
                orderHistory.numberOfRespondant = defaultPlanTypes.M.noOfRespondants;
            } else {
                orderHistory.numberOfRespondant = defaultPlanTypes.Y.noOfRespondants;
            }
        }
    } else {
        orderHistory.status = 'failed';
        if (planType === 'A') {
            orderHistory.amount = gatewayResponse.transaction.amount;
            orderHistory.planType = planType;
            orderHistory.transactionId = gatewayResponse.transaction.id;
            orderHistory.numberOfRespondant = req.body.noOfRespondants;
            orderHistory.braintreeStatus = gatewayResponse.message;
        } else {
            orderHistory.amount = gatewayResponse.transaction.amount;
            orderHistory.planType = planType;
            orderHistory.subscriptionId = gatewayResponse.transaction.id;
            orderHistory.braintreeStatus = gatewayResponse.message;
            // orderHistory.billingPeriodStartDate = gatewayResponse.subscription.billingPeriodStartDate;
            // orderHistory.billingPeriodEndDate = gatewayResponse.subscription.billingPeriodEndDate;
            if (planType === 'M') {
                orderHistory.numberOfRespondant = defaultPlanTypes.M.noOfRespondants;
            } else {
                orderHistory.numberOfRespondant = defaultPlanTypes.Y.noOfRespondants;
            }
        }
    }
    orderHistory.save(function(err, oh) {
        if (err) {
            done(err, null);
        } else {
            done(null, oh);
        }
    });
};

var getSubscription = function(req, callback) {
    var nonceFromTheClient = req.body.payment_method_nonce;
    var defaultPlanTypes = utils.defaultPlanTypes();
    var planId;

    if (req.body.planType === 'M') {
        planId = defaultPlanTypes.M.braintreePlanId;
    } else if (req.body.planType === 'Y') {
        planId = defaultPlanTypes.Y.braintreePlanId;
    }
    async.waterfall([
        function(done) {
            gateway.paymentMethod.create({
                customerId: req.user.braintreeCustomerId,
                paymentMethodNonce: nonceFromTheClient
            }, function (err, paymentMethodResponse) {
                console.log('paymentMethodResponse : ', paymentMethodResponse);
                done(err, paymentMethodResponse);
            });
        },
        function (paymentMethodResponse, done) {
            gateway.subscription.create({
                paymentMethodToken: paymentMethodResponse.paymentMethod.token,
                planId: planId
            }, function (err, gatewaySubscriptionResponse) {
                done(err, gatewaySubscriptionResponse);
            });
        },
        function (gatewaySubscriptionResponse, done) {
            createGatewayResponse(req, gatewaySubscriptionResponse, function(err, gatewayResponse) {
                done(err, gatewaySubscriptionResponse);
            });
        },
        function (gatewaySubscriptionResponse, done) {
            createOrderHistory(req, gatewaySubscriptionResponse, function(err, orderHistory) {
                done(err, orderHistory);
            });
        }
    ], function (err, response) {
        callback(err, response);
    });
};

var getAddOn = function(req, callback) {
    var nonceFromTheClient = req.body.payment_method_nonce;
    var amount = req.body.amount;
    amount = amount.replace(/,/g, '');
    console.log(' amount : ', amount);
    async.waterfall([
        function (done) {
            gateway.transaction.sale({
              amount: amount,
              paymentMethodNonce: nonceFromTheClient,
              options: {
                submitForSettlement: true
              }
            }, function (err, gatewayTransactionResponse) {
                done(err, gatewayTransactionResponse);
            });
        },
        function (gatewayTransactionResponse, done) {
            createGatewayResponse(req, gatewayTransactionResponse, function(err, gatewayResponse) {
                console.log('gatewayResponse : ', gatewayResponse);
                done(err, gatewayTransactionResponse);
            });
        },
        function (gatewayTransactionResponse, done) {
            createOrderHistory(req, gatewayTransactionResponse, function(err, orderHistory) {
                done(err, orderHistory);
            });
        }
    ], function (err, response) {
        callback(err, response);
    });
};

/**
 * Create a Payment
 */
exports.checkout = function (req, res) {
    console.log('req : ', req.body);
    var nonceFromTheClient = req.body.payment_method_nonce;
    var planId,
    isSubscribed;

    async.waterfall([
        function(done) {
            var userId = req.user.parentId();
            User.findById(userId).exec(function(err, user) {
                done(err, user);
            });
        },
        function(user, done) {
            isSubscribed = user.isSubscribed;
            if (req.body.planType === 'M' || req.body.planType === 'Y') {
                if (isSubscribed) {
                    // res.jsonp({ 'status': 'already_subscribed' });
                    res.redirect('/payments/transaction/failed?reason=already_subscribed');
                } else {
                    getSubscription(req, function(err, subscriptionResponse) {
                        // console.log('subscriptionResponse : ', subscriptionResponse);
                        done(err, user, subscriptionResponse, null);
                    });
                }
            } else {
                // for addOn plan
                // console.log('inside addOn else');
                if (isSubscribed) {
                    getAddOn(req, function(err, addOnResponse) {
                        // console.log('addOnResponse : ', addOnResponse);
                        done(err, user, null, addOnResponse);
                    });
                } else {
                    // res.jsonp({ 'status': 'not_subscribed' });
                    res.redirect('/payments/transaction/failed?reason=not_subscribed');
                }
            }
        },
        function(user, subscriptionResponse, addOnResponse, done) {
            if (subscriptionResponse) {
                UserRespondentHistoryCount.findOne({ subscriptionId: subscriptionResponse.subscriptionId, billingPeriodStartDate: subscriptionResponse.billingPeriodStartDate }, function(err, uRespondentHistoryCount) {
                    if (err) {
                        return res.status(400).send({
                            message: errorHandler.getErrorMessage(err)
                        });
                    } else {
                        done(err, user, uRespondentHistoryCount, subscriptionResponse, null);
                    }
                });
            } else {
                UserRespondentHistoryCount.findOne({ transactionId: addOnResponse.transactionId, billingPeriodStartDate: addOnResponse.billingPeriodStartDate }, function(err, uRespondentHistoryCount) {
                    if (err) {
                        return res.status(400).send({
                            message: errorHandler.getErrorMessage(err)
                        });
                    } else {
                        done(err, user, uRespondentHistoryCount, null, addOnResponse);
                    }
                });
            }
        },
        function(user, uRespondentHistoryCount, subscriptionResponse, addOnResponse, done) {
            console.log('userRespondentHistoryCount in checkout: ', uRespondentHistoryCount);
            if (uRespondentHistoryCount) {
                // console.log('inside userRespondentHistoryCount if');
                if (subscriptionResponse) {
                    uRespondentHistoryCount.orderHistoryId = subscriptionResponse._id;
                    uRespondentHistoryCount.user = user;
                    uRespondentHistoryCount.planType = subscriptionResponse.planType;
                    uRespondentHistoryCount.respondentCount = subscriptionResponse.numberOfRespondant;
                    uRespondentHistoryCount.save(function(err, uRHCountResponse) {
                        done(err, user, uRHCountResponse, subscriptionResponse, null);
                    });
                } else {
                    uRespondentHistoryCount.orderHistoryId = addOnResponse._id;
                    uRespondentHistoryCount.transactionId = addOnResponse.transactionId;
                    uRespondentHistoryCount.user = user;
                    uRespondentHistoryCount.planType = addOnResponse.planType;
                    uRespondentHistoryCount.respondentCount = addOnResponse.numberOfRespondant;
                    // userRespondentHistoryCount.billingPeriodStartDate = subscriptionResponse.billingPeriodStartDate;
                    uRespondentHistoryCount.save(function(err, uRHCountResponse) {
                        done(err, user, uRHCountResponse, null, addOnResponse);
                    });
                }
            } else {
                // console.log('inside userRespondentHistoryCount else');
                var userRespondentHistoryCount = new UserRespondentHistoryCount();
                if (subscriptionResponse) {
                    userRespondentHistoryCount.orderHistoryId = subscriptionResponse._id;
                    userRespondentHistoryCount.subscriptionId = subscriptionResponse.subscriptionId;
                    userRespondentHistoryCount.user = user;
                    userRespondentHistoryCount.planType = subscriptionResponse.planType;
                    userRespondentHistoryCount.respondentCount = subscriptionResponse.numberOfRespondant;
                    userRespondentHistoryCount.billingPeriodStartDate = subscriptionResponse.billingPeriodStartDate;
                    userRespondentHistoryCount.save(function(err, uRHCountResponse) {
                        done(err, user, uRHCountResponse, subscriptionResponse, null);
                    });
                } else {
                    userRespondentHistoryCount.orderHistoryId = addOnResponse._id;
                    userRespondentHistoryCount.transactionId = addOnResponse.transactionId;
                    userRespondentHistoryCount.user = user;
                    userRespondentHistoryCount.planType = addOnResponse.planType;
                    userRespondentHistoryCount.respondentCount = addOnResponse.numberOfRespondant;
                    // userRespondentHistoryCount.billingPeriodStartDate = subscriptionResponse.billingPeriodStartDate;
                    userRespondentHistoryCount.save(function(err, uRHCountResponse) {
                        done(err, user, uRHCountResponse, null, addOnResponse);
                    });
                }
            }
        },
        function(user, uRHCountResponse, subscriptionResponse, addOnResponse, done) {
            if (subscriptionResponse) {
                if (subscriptionResponse.status === 'success') {
                    user.orderHistoryId = subscriptionResponse._id;
                    user.isSubscribed = true;
                    user.subscriptionType = subscriptionResponse.planType;
                    user.totalNoOfRespondants = user.totalNoOfRespondants + uRHCountResponse.respondentCount;
                    user.subscriptionExpiryDate = subscriptionResponse.billingPeriodEndDate;
                    user.save(function(err, user) {
                        console.log('user in checkout after update: ', user);
                        done(err, user, subscriptionResponse, null);
                    });
                } else {
                    done(null, user, subscriptionResponse, null);
                }
            } else {
                if (addOnResponse.status === 'success') {
                    user.totalNoOfRespondants = user.totalNoOfRespondants + uRHCountResponse.respondentCount;
                    user.save(function(err, user) {
                        console.log('user in checkout after update: ', user);
                        done(err, user, null, addOnResponse);
                    });
                } else {
                    done(null, user, null, addOnResponse);
                }
            }
        },
        function(user, subscriptionResponse, addOnResponse, done) {
            var reqData = {};
            reqData.userId = req.user.parentId();
            reqData.host = req.headers.host;
            reqData.fromApi = false;
            if (subscriptionResponse) {
                if (subscriptionResponse.status === 'success') {
                    reqData.historyId = subscriptionResponse._id;
                    paymentToPdf(reqData, res);
                    console.log('final subscriptionResponse : ', subscriptionResponse);
                    done(null, subscriptionResponse);
                } else {
                    console.log('final subscriptionResponse : ', subscriptionResponse);
                    done(null, subscriptionResponse);
                }
            } else {
                if (addOnResponse.status === 'success') {
                    reqData.historyId = addOnResponse._id;
                    paymentToPdf(reqData, res);
                    console.log('final addOnResponse : ', addOnResponse);
                    done(null, addOnResponse);
                } else {
                    console.log('final addOnResponse : ', addOnResponse);
                    done(null, addOnResponse);
                }
            }
        }
    ], function(err, response) {
        if (err) {
            console.log('Error Occured : ', err);
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
             if (response.status === 'success') {
                res.redirect('/payments/transaction/success?order_id=' + response._id);
             } else {
                res.redirect('/payments/transaction/failed?reason=transaction_failed');
             }
        }
    });
};

/**
 * webhook for subscription events
 */
exports.bt_webhook = function(req, res) {
    console.log('inside webhook api call');
    var sampleNotification = gateway.webhookTesting.sampleNotification(
        braintree.WebhookNotification.Kind.SubscriptionChargedSuccessfully,
        '4t6kyb'
    );
    gateway.webhookNotification.parse(
        // sampleNotification.bt_signature,
        // sampleNotification.bt_payload,
        req.body.bt_signature,
        req.body.bt_payload,
    function (err, webhookNotification) {
        // console.log('[Webhook Received ' + webhookNotification.timestamp + '] | Kind: ' + webhookNotification.kind);
        // console.log('webhookNotification :=================', webhookNotification);
        var gatewayResponses = new GatewayResponses();
        // console.log('webhookNotification.subscription.id : ', webhookNotification.subscription.id);
        var subscriptionId = webhookNotification.subscription.id;
        var billingPeriodStartDate = webhookNotification.subscription.billingPeriodStartDate;
        if (subscriptionId) {
            UserRespondentHistoryCount.findOne({ subscriptionId: subscriptionId, billingPeriodStartDate: billingPeriodStartDate }, function(err, uRHCount) {
                if (err) {
                    return res.status(400).send({
                        message: errorHandler.getErrorMessage(err)
                    });
                } else {
                    if (uRHCount) {
                        console.log('found UserRespondentHistoryCount in webhook: ', uRHCount);
                        OrderHistory.findOne({ subscriptionId: subscriptionId }, function(err, orderHistory) {
                            if (err) {
                                return res.status(400).send({
                                    message: errorHandler.getErrorMessage(err)
                                });
                            } else {
                                if (orderHistory) {
                                    gatewayResponses.user = orderHistory.user;
                                    gatewayResponses.kind = webhookNotification.kind;
                                    gatewayResponses.timestamp = webhookNotification.timestamp;
                                    gatewayResponses.bt_webhookResponse = webhookNotification;

                                    gatewayResponses.save(function(err, gatewayResponse) {
                                        if (err) {
                                            return res.status(400).send({
                                                message: errorHandler.getErrorMessage(err)
                                            });
                                        } else {
                                            console.log('************************************************************************************************************************');
                                            console.log('gatewayResponse in webhook call: ', gatewayResponse);
                                        }
                                    });
                                    orderHistory.braintreeStatus = webhookNotification.subscription.status;
                                    orderHistory.save(function(err, orderHistory) {
                                        if (err) {
                                            return res.status(400).send({
                                                message: errorHandler.getErrorMessage(err)
                                            });
                                        } else {
                                            console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
                                            console.log('orderHistory  after save in webhook call: ', orderHistory);
                                        }
                                    });
                                } else {
                                    gatewayResponses.subscriptionId = webhookNotification.subscription.id;
                                    gatewayResponses.kind = webhookNotification.kind;
                                    gatewayResponses.timestamp = webhookNotification.timestamp;
                                    gatewayResponses.bt_webhookResponse = webhookNotification;

                                    gatewayResponses.save(function(err, gatewayResponse) {
                                        if (err) {
                                            return res.status(400).send({
                                                message: errorHandler.getErrorMessage(err)
                                            });
                                        } else {
                                            console.log('************************************************************************************************************************');
                                            console.log('gatewayResponse in webhook call: ', gatewayResponse);
                                        }
                                    });
                                }
                            }
                        });
                    } else {
                        if (subscriptionId) {
                            OrderHistory.findOne({ subscriptionId: subscriptionId }, function(err, orderHistory) {
                                if (err) {
                                    return res.status(400).send({
                                        message: errorHandler.getErrorMessage(err)
                                    });
                                } else {
                                    if (orderHistory) {
                                        orderHistory.braintreeStatus = webhookNotification.subscription.status;
                                        if (webhookNotification.kind === 'subscription_expired' || webhookNotification.kind === 'subscription_charged_unsuccessfully') {
                                            console.log('================================================================================');
                                            console.log('Inside subscription_expired if');
                                            orderHistory.status = 'failed';
                                        } else if (webhookNotification.kind === 'subscription_charged_successfully') {
                                            orderHistory.status = 'success';
                                            orderHistory.billingPeriodStartDate = webhookNotification.subscription.billingPeriodStartDate;
                                            orderHistory.billingPeriodEndDate = webhookNotification.subscription.billingPeriodEndDate;
                                            // recurring userRespondentHistoryCount
                                            var uRHistoryCount = new UserRespondentHistoryCount();
                                            uRHistoryCount.subscriptionId = subscriptionId;
                                            uRHistoryCount.billingPeriodStartDate = billingPeriodStartDate;
                                            uRHistoryCount.orderHistoryId = orderHistory._id;
                                            uRHistoryCount.user = orderHistory.user;
                                            uRHistoryCount.planType = orderHistory.planType;
                                            uRHistoryCount.respondentCount = orderHistory.numberOfRespondant;
                                            uRHistoryCount.save(function(err, uRHistoryCount) {
                                                console.log('userRespondentHistoryCount in recurring: ', uRHistoryCount);
                                                // update user model here
                                                User.findById(uRHistoryCount.user).exec(function(err, user) {
                                                    if (err) {
                                                        return res.status(400).send({
                                                            message: errorHandler.getErrorMessage(err)
                                                        });
                                                    } else {
                                                        /* user.totalNoOfRespondants = user.totalNoOfRespondants + uRHistoryCount.respondentCount;
                                                        user.save(function(err, user) {
                                                            if (err) {
                                                                return res.status(400).send({
                                                                    message: errorHandler.getErrorMessage(err)
                                                                });
                                                            } else {
                                                                console.log('user after update in recurring : ', user);
                                                            }
                                                        }); */
                                                        UserRespondentHistoryCount.aggregate([
                                                            {
                                                                $match: {
                                                                    user: uRHistoryCount.user
                                                                }
                                                            }, {
                                                                $group: {
                                                                    _id: null,
                                                                    totalNoOfRespondants: { '$sum': '$respondentCount' }
                                                                }
                                                            }
                                                        ],
                                                        function(err, results) {
                                                            console.log('results user update in bt_webhook: ', results);
                                                            user.totalNoOfRespondants = results[0].totalNoOfRespondants + 100;
                                                            user.save(function(err, user) {
                                                                if (err) {
                                                                    return res.status(400).send({
                                                                        message: errorHandler.getErrorMessage(err)
                                                                    });
                                                                } else {
                                                                    console.log('user after update in recurring : ', user);
                                                                }
                                                            });
                                                        });
                                                    }
                                                });
                                            });
                                        }
                                        // console.log('orderHistory b4 save : ', orderHistory);
                                        orderHistory.save(function(err, orderHistory) {
                                            if (err) {
                                                return res.status(400).send({
                                                    message: errorHandler.getErrorMessage(err)
                                                });
                                            } else {
                                                console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
                                                console.log('orderHistory  after save: ', orderHistory);
                                                var reqData = {};
                                                reqData.userId = orderHistory.user;
                                                reqData.host = req.headers.host;
                                                reqData.fromApi = false;
                                                reqData.historyId = orderHistory._id;
                                                paymentToPdf(reqData, res);
                                            }
                                        });
                                        // console.log('orderHistory : ', orderHistory.user);
                                        gatewayResponses.user = orderHistory.user;
                                        gatewayResponses.kind = webhookNotification.kind;
                                        gatewayResponses.timestamp = webhookNotification.timestamp;
                                        gatewayResponses.bt_webhookResponse = webhookNotification;
                                        gatewayResponses.save(function(err, gatewayResponse) {
                                            if (err) {
                                                return res.status(400).send({
                                                    message: errorHandler.getErrorMessage(err)
                                                });
                                            } else {
                                                console.log('************************************************************************************************************************');
                                                console.log('gatewayResponse : ', gatewayResponse);
                                            }
                                        });
                                    } else {
                                        var uRHisCount = new UserRespondentHistoryCount();
                                        if (subscriptionId) {
                                            uRHisCount.subscriptionId = subscriptionId;
                                            uRHisCount.billingPeriodStartDate = billingPeriodStartDate;
                                            uRHisCount.save(function(err, userRespondentHistoryCount) {
                                                console.log('userRespondentHistoryCount in webhook: ', userRespondentHistoryCount);
                                            });
                                        } else {
                                           /* userRespondentHistoryCount.orderHistoryId = addOnResponse._id;
                                            userRespondentHistoryCount.transactionId = addOnResponse.transactionId;
                                            userRespondentHistoryCount.user = user;
                                            userRespondentHistoryCount.planType = addOnResponse.planType;
                                            userRespondentHistoryCount.respondentCount = addOnResponse.numberOfRespondant;
                                            // userRespondentHistoryCount.billingPeriodStartDate = subscriptionResponse.billingPeriodStartDate;
                                            userRespondentHistoryCount.save(function(err, userRespondentHistoryCount) {
                                                // done(err, user, userRespondentHistoryCount, null, addOnResponse);
                                            }); */
                                            console.log('addOn');
                                        }
                                    }
                                }
                            });
                        } else {
                           /* userRespondentHistoryCount.orderHistoryId = addOnResponse._id;
                            userRespondentHistoryCount.transactionId = addOnResponse.transactionId;
                            userRespondentHistoryCount.user = user;
                            userRespondentHistoryCount.planType = addOnResponse.planType;
                            userRespondentHistoryCount.respondentCount = addOnResponse.numberOfRespondant;
                            // userRespondentHistoryCount.billingPeriodStartDate = subscriptionResponse.billingPeriodStartDate;
                            userRespondentHistoryCount.save(function(err, uRHCountResponse) {
                                done(err, user, uRHCountResponse, null, addOnResponse);
                            }); */
                            console.log('addOn');
                        }
                    }
                }
            });
        } else {
            /* UserRespondentHistoryCount.findOne({ transactionId: addOnResponse.transactionId, billingPeriodStartDate: addOnResponse.billingPeriodStartDate }, function(err, URHCount) {
                if (err) {
                    return res.status(400).send({
                        message: errorHandler.getErrorMessage(err)
                    });
                } else {
                    console.log('URHCount : ', URHCount);
                }
            }); */
            console.log('addOn');
        }
    }
    );
    res.status(200).send();
};

exports.create = function(req, res) {
  var payment = new Payment(req.body);
  payment.user = req.user;

  payment.save(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(payment);
    }
  });
};

/**
 * Show the current Payment
 */
exports.read = function(req, res) {
  // convert mongoose document to JSON
  var payment = req.payment ? req.payment.toJSON() : {};

  // Add a custom field to the Article, for determining if the current User is the "owner".
  // NOTE: This field is NOT persisted to the database, since it doesn't exist in the Article model.
  payment.isCurrentUserOwner = req.user && payment.user && payment.user._id.toString() === req.user._id.toString();

  res.jsonp(payment);
};

/**
 * Update a Payment
 */
exports.update = function(req, res) {
  var payment = req.payment;

  payment = _.extend(payment, req.body);

  payment.save(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(payment);
    }
  });
};

/**
 * Delete an Payment
 */
exports.delete = function(req, res) {
  var payment = req.payment;

 /* var custId = req.user.braintreeCustomerId;
  console.log('custId : ', custId);
  gateway.customer.find(custId.toString(), function(err, customer) {
    console.log('customer.paymentMethod : ', customer.paymentMethods.CreditCard.token);

  });
 gateway.paymentMethod.delete(token, function (err, result) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      console.log('paymentMethod result : ', result);
      res.jsonp(result);
    }
  }); */
  payment.remove(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(payment);
    }
  });
};

/**
 * Count of listcontactsPublished
 */
exports.listcontactsPublished = function(req, res) {
  ListContactPublished.find().count(function(err, count) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      console.log('Number of listcontactsPublished: ', count);
      res.jsonp(count);
    }
});
};

/**
 * Count of userResponses
 */
exports.userResponses = function(req, res) {
  UserResponse.find({ user: req.user.parentId() }).count(function(err, count) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      console.log('Number of UserResponse: ', count);
      res.jsonp(count);
    }
});
};

/**
 * List of Payments
 */
exports.list = function(req, res) {
  Payment.find().sort('-created').populate('user', 'displayName').exec(function(err, payments) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(payments);
    }
  });
};

/**
 * DOwnload invoice of payment done
 * @param  {Object} req - request object
 * @param  {Object} res - response object
 */
exports.downloadInvoice = function(req, res) {
  var params = {
    historyId: req.params.orderHistoryId,
    userId: req.user.parentId(),
    host: req.headers.host,
    downloadInvoice: true
  };
  paymentToPdf(params, res);
};

/*
  Generate pdf with payment
*/
exports.paymentExportToPdf = function(req, res) {
    var reqData = {};
    reqData.historyId = req.params.payHistoryId;
    reqData.userId = req.user.parentId();
    reqData.host = req.headers.host;
    reqData.fromApi = true;
    paymentToPdf(reqData, res);
};

function paymentToPdf(reqData, res) {

  var extUser;
  var fileName = 'IH-Invoice-' + reqData.historyId;
  var pdfHTML = '';
  var oh;
  var showHistory = {};
  var httpTransport = 'http:';
  if (config.secure && config.secure.ssl === true) {
      httpTransport = 'https:';
  }

  var planDetails = utils.defaultPlanTypes();
    async.waterfall([
        function (done) {
            OrderHistory.find({ _id: reqData.historyId, user: reqData.userId }).populate('user').exec(function(err, history) {
              oh = history;
              done(err, history);
            });
        }, function(history, done) {
            var noRepondants = 0;
            history.forEach(function(hist) {
              extUser = hist.user;
              if (hist._id.toString() === reqData.historyId.toString()) {
                  var sd = moment(hist.billingPeriodStartDate);
                  var ed = moment(hist.billingPeriodEndDate);
                  var cd = moment(hist.created);

                  showHistory.invoice = hist._id;
                  showHistory.planType = planDetails[hist.planType].name;
                  showHistory.price = hist.amount;
                  showHistory.companyName = hist.user.company.name;
                  showHistory.invoiceDate = cd.format('Do MMMM YYYY');
                  showHistory.address = hist.user.address;
                  showHistory.state = hist.user.state;
                  showHistory.zipcode = hist.user.zipcode;
                  showHistory.country = hist.user.country;
                  showHistory.noRepondants = hist.numberOfRespondant;

                  if (hist.planType !== 'A') {
                    showHistory.duration = '<br>' + sd.format('DD-MMM-YYYY') + '  to ' + ed.format('DD-MMM-YYYY');
                    showHistory.featureProj = 'Unlimited Projects';
                    showHistory.featureSur = 'Unlimited Surveys';
                  } else {
                    showHistory.duration = 'N/A';
                  }
              }
            });

            res.render(path.resolve('modules/payments/server/templates/invoice-pdf'), {
                protocol: httpTransport,
                host: reqData.host,
                showHistory: showHistory
            }, function (err, pdfHTML) {
                pdfHTML = pdfHTML.replace(/&lt;br&gt;/g, '<br/>');
                done(err, pdfHTML);
            });
        }, function(pdfHTML, done) {
              var configs = {
                'type': 'pdf',
                'format': 'Letter',
                'timeout': 4000,
                'quality': '75',
                'phantomArgs': ['--ignore-ssl-errors=yes'],
                'header': {
                  'height': '8mm'
                },
                'footer': {
                  'height': '8mm'
                },
                'border': {
                  'top': '0.5in', // default is 0, units: mm, cm, in, px
                  'right': '0.5in',
                  'bottom': '0.5in',
                  'left': '0.5in'
                }
            };

            /* ------- to check html uncomment bellow code and run url in browser -----------*/
            /* http://0.0.0.0:4000/api/payments/58980fc90345e88119b1078b/paymentHistory-pdf */

            // res.writeHead(200, {
            //   'Content-Type': 'text/html',
            //   'Content-Length': pdfHTML.length,
            //   'Expires': new Date().toUTCString()
            // });
            // res.end(pdfHTML);
            // pdfHTML = false;
            // return false;

            /* ------- to check html uncomment above code -----------*/

            if (pdfHTML) {
                pdf.create(pdfHTML, configs).toStream(function(err, stream) {
                  if (err) {
                        console.log(err);
                    } else {
                        // console.log('stream : ', stream);
                        var resp = stream.pipe(fs.createWriteStream('./public/pdf/' + fileName));
                        resp.on('finish', function() {
                            done();
                        });
                    }
                });
            } else {
                done(null);
            }
        }
    ], function(err, resp) {
        if (err) {
            console.log(err);
        } else {
          if (reqData.fromApi) {
            res.json({ message: 'Pdf payment history generated successfully!!' });
          } else if (reqData.downloadInvoice) {
            var order = oh[0];
            var downloadFileName = 'IH-' + utils.defaultPlanTypes()[order.planType].name + '-Plan-Invoice-' + moment(order.billingPeriodStartDate).format('YYYY-MM-DD') + '.pdf';
            res.set('Content-Type', 'application/pdf');
            res.set('Content-Disposition', 'attachment');
            res.download('./public/pdf/' + fileName, downloadFileName, function(err) {
              fs.unlink('./public/pdf/' + fileName);
            });
          } else {
            triggerPaymentMail(extUser, showHistory, fileName, res);
          }
        }
    });
}

/*
    Email pdf with order details.
*/
function triggerPaymentMail(user, showHistory, fileName, res) {
  async.waterfall([
    function (done) {
      res.render(path.resolve('modules/payments/server/templates/invoice-email'), {
        appName: config.app.title,
        invoiceId: showHistory.invoice,
        companyName: showHistory.companyName,
        email: user.email,
        invoiceDate: showHistory.invoiceDate
      }, function (err, emailHTML) {
        done(err, emailHTML, user);
      });
    },
    function (emailHTML, user, done) {
        var mailOptions = {
          to: user.email,
          from: config.mailer.from,
          subject: 'Invoice ' + showHistory.invoice + ' from ' + user.firstName,
          html: emailHTML,
          attachments: [
              {
                  filename: fileName,
                  path: './public/pdf/' + fileName,
                  contentType: 'application/pdf'
              }
          ]
        };
        smtpTransport.sendMail(mailOptions, function (err, res) {
            done(err, res);
        });
    },
    function (res, done) {
        fs.unlink('./public/pdf/' + fileName, function(err) {
            done(err, res);
        });
    }
  ], function (err, res) {
      if (err) {
        console.log(err, 'Error sending order history email');
      }
  });
}

/**
 * Cancel subscription
 * gatway api call with subscription Id
 * update order history 'gatewayResponse'
 * update user 'isSubscribed' to false
 */
exports.cancelSubscription = function(req, res) {
  var historyId = req.params.historyId;

  async.waterfall([
    function (done) {
        OrderHistory.findOne({ user: req.user.parentId(), _id: historyId }, function(err, history) {
            if (!history) {
              done({ message: 'Subscription not found' }, history);
            } else {
              done(err, history);
            }
        });
    },
    function (history, done) {
        gateway.subscription.cancel(history.subscriptionId, function (err, responseCancel) {
            console.log('responseCancel', responseCancel);
            done(err, responseCancel, history);
        });
    },
    function (responseCancel, history, done) {
        if (!responseCancel.errors) {
            history.gatewayResponse = responseCancel;
            history.braintreeStatus = responseCancel.subscription.status;
            history.save(function(err, savedHistory) {
                done(err, savedHistory);
            });
        } else {
            var historySaved = false;
            done(null, historySaved);
        }
    },
    function (savedHistory, done) {
      if (savedHistory !== false) {
        User.findOne({ _id: req.user.parentId() }).exec(function(err, user) {
            user.isSubscribed = false;
            if (err) {
                done(err, savedHistory);
            } else {
                user.save(function(err, res) {
                    done(null, res);
                });
            }
        });
      } else {
          done(null, savedHistory);
      }
    }
  ], function (err, savedHistory) {
      if (err) {
          errorHandler.errorResponse(err, res);
      } else {
         res.json();
      }
  });
};


exports.orderHistories = function(req, res) {
  OrderHistory.find({ user: req.user.parentId() }, function(err, orderHistories) {
    if (err) {
      return errorHandler.errorResponse(err, res);
    }
    res.json({
      orderHistories: orderHistories
    });

  });
};

/**
 * Get order details
 * @param  {Object} req - Request object
 * @param  {[type]} res - Response object
 */
exports.read = function(req, res) {
  OrderHistory.findOne({ user: req.user.parentId(), _id: req.params.historyId }, function(err, history) {
    if (err) {
      return errorHandler.errorResponse(err, res);
    }
    res.json({
      orderHistory: history
    });
  });
};
