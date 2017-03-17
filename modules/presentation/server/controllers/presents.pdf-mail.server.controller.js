'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
  config = require(path.resolve('./config/config')),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  mongoose = require('mongoose'),
  Present = mongoose.model('Present'),
  User = mongoose.model('User'),
  nodemailer = require('nodemailer'),
  async = require('async'),
  crypto = require('crypto');

var smtpTransport = nodemailer.createTransport(config.mailer.options);

// Send confirmation email
var deliverEmail = function(req, res, next, user, fileName, generatePdf, mainCallback) {
  var pdfSendToSelf = req.body.pdfSendToSelf;
  console.log('pdfSendToSelf : ', pdfSendToSelf);
  var inviterName;
  var httpTransport = 'http://';
  if (config.secure && config.secure.ssl === true) {
    httpTransport = 'https://';
  }
  async.waterfall([
    function(done) {
      if (user._id) {
        User.findOne({
          _id: user._id
        }, function(e, u) {
          inviterName = u.displayName();
          done(e);
        });
      } else {
        done();
      }
    },
    function (done) {
      res.render(path.resolve('modules/presentation/server/templates/pdf-email'), {
        name: user.displayName(),
        appName: config.app.title,
        inviterName: inviterName
      }, function (err, emailHTML) {
        done(err, emailHTML, user);
      });
    },
    function (emailHTML, user, done) {
      var mailOptions = {};
      if (pdfSendToSelf === true) {
        mailOptions = {
          to: req.body.emailId,
          cc: user.email,
          from: config.mailer.from,
          subject: 'PDF of storyBoard slide',
          html: emailHTML,
          attachments: [
              {   // filename and content type is derived from path
                  filename: fileName,
                  path: './public/pdf/' + fileName,
                  contentType: 'application/pdf'
              }
          ]
        };
    } else {
        mailOptions = {
          to: req.body.emailId,
          from: config.mailer.from,
          subject: 'PDF of storyBoard slide',
          html: emailHTML,
          attachments: [
              {   // filename and content type is derived from path
                  filename: fileName,
                  path: './public/pdf/' + fileName,
                  contentType: 'application/pdf'
              }
          ]
        };
    }
      console.error('---------------------------Sending Storyboard email---------------------------');
      smtpTransport.sendMail(mailOptions, function (err, res) {
          console.error('Email Sending Done: ', err, res);
          console.error('------------------------------------------------------');
          /* if (!generatePdf) {
            if (!err) {
              res.send({
                message: 'We have sent you an email with pdf attachments. Please check your mailbox.'
              });
            } else {
              return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
              });
            }
          } */
          // console.log('res in send mail : ', res);
          done(err, res);
      });
    }
  ], function (err, res) {
    /* if (err) {
      return next(err);
    } */
    mainCallback(err, res);
  });

};

/**
 * Export deliverEmail for use in sending confirmation mail
 * after user signup
 */
exports.deliverEmail = deliverEmail;
