'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  confirmationMailer = require(path.resolve('./modules/users/server/controllers/users/users.confirmation-mail.server.controller')),
  _ = require('lodash'),
  async = require('async'),
  mongoose = require('mongoose'),
  passport = require('passport'),
  generatePassword = require('password-generator'),
  parameters = require('strong-params').Parameters,
  utils = require(path.resolve('./modules/core/server/utilities/utils.server')),
  uploader = require(path.resolve('./modules/core/server/utilities/uploader.server')),
  User = mongoose.model('User');

// URLs for which user can't be redirected on signin
var noReturnUrls = [
  '/authentication/signin',
  '/authentication/signup'
];

/**
 * Filter company params from request body
 * @param  {Object} req request object
 * @return {Object}     Filtered paramters
 */
var companyParams = function(req) {
  var params = parameters(req.body);
  return params.require('company').permit('name', 'designation', 'numberOfEmployees', 'numberOfAnalysts', 'website', 'domain', 'languages', 'monthlyRespondents', 'currency', 'skypeID').value();
};

/**
 * Filter user params from request body
 * @param  {Object} req request object
 * @return {Object}     Filtered paramters
 */
var userParams = function(req) {
  var params = parameters(req.body);
  var tmpPassword = generatePassword();
  return _.assignIn({
    provider: 'local',
    company: companyParams(req)
  }, params.permit('firstName', 'lastName', 'email', 'mobileNo', 'address', 'zipcode', 'state', 'country', 'password').value());
};

/**
 * Signup
 */
exports.signup = function (req, res, next) {
  // For security measurement we remove the roles from the req.body object
  delete req.body.roles;
  var savedUser,
    s3Data = {};

  // Init user and add missing fields
  var user = new User(userParams(req));

  async.waterfall([
    function(done) {
      user.save(function(err, u) {
        done(err, u);
      });
    },
    function(u, done) {
      user = u;
      confirmationMailer.deliverEmail(req, res, next, user, true);
      uploader.upload('user-', user, user._id, req.body.profileImage, done);
    },
    function(uploadResponse, done) {
      s3Data.profileImageS3Policy = uploadResponse.s3Policy;
      user = uploadResponse.modelObject;
      if (process.env.NODE_ENV === 'development') {
        user.profileImage = uploadResponse.url;
      } else {
        user.tmpProfileImage = uploadResponse.url;
      }
      uploader.upload('user-company-logo-', user.company, user._id, req.body.companyLogo, done);
    },
    function (uploadResponse, done) {
      s3Data.companyLogoS3Policy = uploadResponse.s3Policy;
      user.company = uploadResponse.modelObject;
      if (process.env.NODE_ENV === 'development') {
        user.company.logo = uploadResponse.url;
      } else {
        user.company.tmpLogo = uploadResponse.url;
      }
      user.save(function(err, u) {
        done(err, u);
      });
    },
    function (u, done) {
      var whitelistedUser = utils.clone(u, ['firstName', 'lastName', 'address', 'mobileNo', 'state', 'country', '_id', 'zipcode', 'email', 'tmpProfileImage', 'company'], ['displayName']);
      done(null, _.assign(whitelistedUser, s3Data));
    }
  ], function(err, whitelistedUser) {
    console.error('User Signup Error: ==========>', err);
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    res.json(whitelistedUser);
  });

};

exports.avatarS3Callback = function(req, res, next) {
  User.findOne({
    _id: req.params.userId
  }, function(err, user) {
    if (err || !user) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    if (req.body.upload) {
      user.profileImage = user.tmpProfileImage;
    } else {
      user.profileImage = undefined;
    }
    user.tmpProfileImage = undefined;
    user.save(function(error, u) {
      if (error) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(error)
        });
      }
      res.json(u);
    });
  });
};

exports.companyLogoS3Callback = function(req, res, next) {
  User.findOne({
    _id: req.params.userId
  }, function(err, user) {
    if (err || !user) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    if (req.body.upload) {
      user.company.logo = user.company.tmpLogo;
    } else {
      user.company.logo = undefined;
    }
    user.company.tmpLogo = undefined;
    user.save(function(error, u) {
      if (error) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(error)
        });
      }
      res.json(u);
    });
  });
};

// Delete password in first login
var clearTmpPasswordAndSaveSignInTime = function(res, user, accountOwner) {
  var updateParams = { tmpPassword: undefined, lastSignInAt: Date.now() };
  User.update({ _id: user.id }, updateParams,
    function(err) {
      if (err) {
        res.status(400).send(err);
      } else {
        var userUpdated = JSON.parse(JSON.stringify(user));
        userUpdated.plan = accountOwner;
        res.json(userUpdated);
      }
    });
};

/**
 * Signin after passport authentication
 */
exports.signin = function (req, res, next) {
  passport.authenticate('local', function (err, user, info) {
    if (err || !user) {
      res.status(400).send(info);
    } else if (user.confirmationToken) {
      res.status(400).send({
        message: 'Account is not confirmed'
      });
    } else {
      // Remove sensitive data before login
      user.password = undefined;
      user.salt = undefined;
      var query = User.findOne({ _id: user.parentId() }).select('isSubscribed subscriptionType totalNoOfRespondants balanceUserResponses receivedUserResponses orderHistoryId');
      query.exec(function(e, accountOwner) {
        user.plan = accountOwner;
        if (err) {
          res.status(400).send(e);
        } else {
          req.login(user, function (err) {
            if (err) {
              res.status(400).send(err);
            } else {
              clearTmpPasswordAndSaveSignInTime(res, user, accountOwner);
            }
          });
        }
      });
    }
  })(req, res, next);
};


/**
 * Signout
 */
exports.signout = function (req, res) {
  req.logout();
  res.json();
};

/**
 * OAuth provider call
 */
exports.oauthCall = function (strategy, scope) {
  return function (req, res, next) {
    // Set redirection path on session.
    // Do not redirect to a signin or signup page
    if (noReturnUrls.indexOf(req.query.redirect_to) === -1) {
      req.session.redirect_to = req.query.redirect_to;
    }
    // Authenticate
    passport.authenticate(strategy, scope)(req, res, next);
  };
};

/**
 * OAuth callback
 */
exports.oauthCallback = function (strategy) {
  return function (req, res, next) {
    // Pop redirect URL from session
    var sessionRedirectURL = req.session.redirect_to;
    delete req.session.redirect_to;

    passport.authenticate(strategy, function (err, user, info) {
      if (err) {
        return res.redirect('/authentication/signin?err=' + encodeURIComponent(errorHandler.getErrorMessage(err)));
      }
      if (!user) {
        return res.redirect('/authentication/signin');
      }
      req.login(user, function (err) {
        if (err) {
          return res.redirect('/authentication/signin');
        }

        return res.redirect(info || sessionRedirectURL || '/');
      });
    })(req, res, next);
  };
};

/**
 * Helper function to save or update a OAuth user profile
 */
exports.saveOAuthUserProfile = function (req, providerUserProfile, done) {
  if (!req.user) {
    // Define a search query fields
    var searchMainProviderIdentifierField = 'providerData.' + providerUserProfile.providerIdentifierField;
    var searchAdditionalProviderIdentifierField = 'additionalProvidersData.' + providerUserProfile.provider + '.' + providerUserProfile.providerIdentifierField;

    // Define main provider search query
    var mainProviderSearchQuery = {};
    mainProviderSearchQuery.provider = providerUserProfile.provider;
    mainProviderSearchQuery[searchMainProviderIdentifierField] = providerUserProfile.providerData[providerUserProfile.providerIdentifierField];

    // Define additional provider search query
    var additionalProviderSearchQuery = {};
    additionalProviderSearchQuery[searchAdditionalProviderIdentifierField] = providerUserProfile.providerData[providerUserProfile.providerIdentifierField];

    // Define a search query to find existing user with current provider profile
    var searchQuery = {
      $or: [mainProviderSearchQuery, additionalProviderSearchQuery]
    };

    User.findOne(searchQuery, function (err, user) {
      if (err) {
        return done(err);
      } else {
        if (!user) {
          var possibleUsername = providerUserProfile.username || ((providerUserProfile.email) ? providerUserProfile.email.split('@')[0] : '');

          User.findUniqueUsername(possibleUsername, null, function (availableUsername) {
            user = new User({
              firstName: providerUserProfile.firstName,
              lastName: providerUserProfile.lastName,
              username: availableUsername,
              displayName: providerUserProfile.displayName,
              email: providerUserProfile.email,
              profileImageURL: providerUserProfile.profileImageURL,
              provider: providerUserProfile.provider,
              providerData: providerUserProfile.providerData
            });

            // And save the user
            user.save(function (err) {
              return done(err, user);
            });
          });
        } else {
          return done(err, user);
        }
      }
    });
  } else {
    // User is already logged in, join the provider data to the existing user
    var user = req.user;

    // Check if user exists, is not signed in using this provider, and doesn't have that provider data already configured
    if (user.provider !== providerUserProfile.provider && (!user.additionalProvidersData || !user.additionalProvidersData[providerUserProfile.provider])) {
      // Add the provider data to the additional provider data field
      if (!user.additionalProvidersData) {
        user.additionalProvidersData = {};
      }

      user.additionalProvidersData[providerUserProfile.provider] = providerUserProfile.providerData;

      // Then tell mongoose that we've updated the additionalProvidersData field
      user.markModified('additionalProvidersData');

      // And save the user
      user.save(function (err) {
        return done(err, user, '/settings/accounts');
      });
    } else {
      return done(new Error('User is already connected using this provider'), user);
    }
  }
};

/**
 * Remove OAuth provider
 */
exports.removeOAuthProvider = function (req, res, next) {
  var user = req.user;
  var provider = req.query.provider;

  if (!user) {
    return res.status(401).json({
      message: 'User is not authenticated'
    });
  } else if (!provider) {
    return res.status(400).send();
  }

  // Delete the additional provider
  if (user.additionalProvidersData[provider]) {
    delete user.additionalProvidersData[provider];

    // Then tell mongoose that we've updated the additionalProvidersData field
    user.markModified('additionalProvidersData');
  }

  user.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      req.login(user, function (err) {
        if (err) {
          return res.status(400).send(err);
        } else {
          return res.json(user);
        }
      });
    }
  });
};

/**
 * User middleware
 */
exports.userByID = function (req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'User is invalid'
    });
  }

  User.findOne({
    _id: id
  }).exec(function (err, user) {
    if (err) {
      return next(err);
    } else if (!user) {
      return next(new Error('Failed to load User ' + id));
    }

    req.profile = user;
    next();
  });
};
