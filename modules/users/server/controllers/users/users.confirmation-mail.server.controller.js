'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
  config = require(path.resolve('./config/config')),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  nodemailer = require('nodemailer'),
  async = require('async'),
  crypto = require('crypto');

var smtpTransport = nodemailer.createTransport(config.mailer.options);

// Send confirmation email
var deliverEmail = function(req, res, next, user, signup, callback) {

  // Generate random token
  var token = crypto.randomBytes(20).toString('hex');
  var inviterName;
  var httpTransport = 'http://';
  if (config.secure && config.secure.ssl === true) {
    httpTransport = 'https://';
  }
  async.waterfall([
    function(done) {
      if (user.user) {
        User.findOne({
          _id: user.user
        }, function(e, u) {
          inviterName = u.displayName();
          done(e);
        });
      } else {
        done();
      }
    },
    function(done) {
      user.confirmationToken = token;
      user.confirmationTokenExpires = Date.now() + 3600000;
      user.save(function (err) {
        done(err);
      });
    },
    function (done) {
      var subject,
      pathUrl;
      if (user.user) {
        subject = 'New sidekick on board!';
        pathUrl = 'modules/users/server/templates/invitation-email';
      } else {
        subject = user.firstName + ', activate your account';
        pathUrl = 'modules/users/server/templates/confirmation-email';
      }
      res.render(path.resolve(pathUrl), {
        name: user.displayName(),
        firstName: user.firstName,
        appName: config.app.title,
        url: httpTransport + req.headers.host + '/api/auth/confirm_mail/' + token,
        email: user.email,
        password: user.tmpPassword,
        inviterName: inviterName
      }, function (err, emailHTML) {
        done(err, subject, emailHTML, user);
      });
    },
    function (subject, emailHTML, user, done) {
      var mailOptions = {
        to: user.email,
        from: config.mailer.from,
        subject: subject,
        html: emailHTML
      };
      smtpTransport.sendMail(mailOptions, function (err, sendMailResponse) {
        // Don't respond to sign up request
        // Email will be sent in background in signup api.
        if (!signup) {
          if (!err) {
            res.send({
              message: 'We have sent you an email with account confirmation link. Please check your mailbox.'
            });
          } else {
            return res.status(400).send({
              message: errorHandler.getErrorMessage(err)
            });
          }
        }
        done(err, sendMailResponse);
      });
    }
  ], function (err, response) {
    /* if (err) {
      return next(err);
    } */
    callback(err, response);
  });

};

/**
 * Export deliverEmail for use in sending confirmation mail
 * after user signup
 */
exports.deliverEmail = deliverEmail;

/**
 * Resend confirmation email (resendConfirmation POST)
 */
exports.resendConfirmationMail = function (req, res, next) {
  // Lookup user by email
  if (req.body.email) {
    User.findOne({
      email: req.body.email.toLowerCase()
    }, function (err, user) {
      if (err || !user) {
        return res.status(400).send({
          message: 'No account with that email has been found'
        });
      } else if (user.provider !== 'local') {
        return res.status(400).send({
          message: 'It seems like you signed up using your ' + user.provider + ' account'
        });
      } else if (user.confirmedAt) {
        return res.status(400).send({
          message: 'Account is already confirmed'
        });
      } else {
        deliverEmail(req, res, next, user);
      }
    });
  } else {
    return res.status(400).send({
      message: 'Email field must not be blank'
    });
  }
};

/**
 * Reset password GET from email token
 */
exports.confirmEmail = function (req, res) {
  User.findOne({
    confirmationToken: req.params.token
  }, function (err, user) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    if (!user) {
      return res.redirect('/confirmation-email/reply/invalid-token');
    }
    if (user.confirmationTokenExpires < Date.now()) {
      return res.redirect('/confirmation-email/reply/token-expired');
    }

    user.confirmationToken = null;
    user.confirmationTokenExpires = null;
    user.confirmedAt = Date.now();
    user.save(function (err) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      res.redirect('/confirmation-email/reply/account-confirmed');
    });
  });
};
