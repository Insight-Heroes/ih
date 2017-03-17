'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  crypto = require('crypto'),
  validator = require('validator'),
  generatePassword = require('generate-password'),
  owasp = require('owasp-password-strength-test');

/**
 * A Validation function for local strategy properties
 */
var validateLocalStrategyProperty = function (property) {
  return ((this.provider !== 'local' && !this.updated) || property.length);
};

/**
 * A Validation function for local strategy email
 */
var validateEmailUniqueness = function (email, callback) {
  this.model('User').count({
    email: email,
    _id: { $ne: this._id }
  }, function(err, count) {
    callback(!(count > 0));
  });
};

/**
 * User Schema
 */
var UserSchema = new Schema({
  firstName: {
    type: String,
    trim: true,
    default: '',
    validate: [validateLocalStrategyProperty, 'Please fill in your first name']
  },
  lastName: {
    type: String,
    trim: true,
    default: '',
    validate: [validateLocalStrategyProperty, 'Please fill in your last name']
  },
  mobileNo: {
    type: String,
    trim: true,
    required: 'Please fill in your mobile number',
    validate: [{
      validator: function(v) {
        if (!/^\d+$/.test(v)) {
          return false;
        }
      },
      message: 'Mobile number should be numeric'
    }, {
      validator: function(v) {
        if (v.length < 10) {
          return false;
        }
      },
      message: 'Mobile number must be minimum 10 digit'
    }]
  },
  address: {
    type: String,
    trim: true,
    required: 'Please fill in your address'
  },
  zipcode: {
    type: String,
    trim: true,
    required: 'Please fill in your pincode/zip code',
    validate: [{
      validator: function(v) {
        if (!/^[a-z\d\--\s]+$/i.test(v)) {
          return false;
        }
      },
      message: 'Pincode/zipcode should be numeric'
    }, {
      validator: function(v) {
        if (v.length < 4 || v.length > 6) {
          return false;
        }
      },
      message: 'Pincode/zipcode must be minimum 4 digit short and maximum 6 digit long'
    }]
  },
  state: {
    type: String,
    trim: true,
    required: 'Please fill in your state/privince'
  },
  country: {
    type: String,
    trim: true,
    required: 'Please fill in your country'
  },
  email: {
    type: String,
    unique: true,
    index: {
      unique: true,
      sparse: true // For this to work on a previously indexed field, the index must be dropped & the application restarted.
    },
    lowercase: true,
    trim: true,
    required: 'Please fill in email',
    validate: [validateEmailUniqueness, 'This email is already taken']
  },
  profileImage: {
    type: String,
    default: 'modules/users/client/img/profile/default.png'
  },
  tmpProfileImage: {
    type: String
  },
  provider: {
    type: String,
    required: 'Provider is required'
  },
  providerData: {},
  additionalProvidersData: {},
  roles: {
    type: String,
    enum: ['user', 'mainUser', 'warrior', 'hero', 'client', 'gatherer'],
    default: ['user'],
    required: 'Please provide at least one role'
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
   // required: 'User cannot be blank'
  },
  updated: {
    type: Date
  },
  created: {
    type: Date,
    default: Date.now
  },
  /* For subscription and payment */
  braintreeCustomerId: {
    type: String
  },
  isSubscribed: {
    type: Boolean,
    default: false
  },
  subscriptionType: {
    type: String,
    enum: ['M', 'Y', 'Free'],
    default: ['Free']
  },
  orderHistoryId: {
    type: Schema.ObjectId,
    ref: 'OrderHistory'
  },
  totalNoOfRespondants: {
    type: Number,
    default: 100
  },
  receivedUserResponses: {
    type: Number,
    default: 0
  },
  balanceUserResponses: {
    type: Number,
    default: 100
  },
  subscriptionExpiryDate: {
    type: Date
  },

  /* For storing and resetting password */
  password: {
    type: String,
    default: ''
  },
  salt: {
    type: String
  },
  tmpPassword: {
    type: String
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  },

  /* For confirmation email */
  confirmationToken: {
    trim: true,
    type: String
  },
  confirmationTokenExpires: {
    type: Date
  },
  confirmedAt: {
    type: Date
  },

  /* Company Parameters */
  company: {
    name: {
      type: String,
      trim: true
      // required: 'Please fill in your company name'
    },
    designation: {
      type: String,
      trim: true
      // required: 'Please fill in your designation'
    },
    numberOfEmployees: {
      type: Number,
      // required: 'Please fill in number of employees',
      min: [1, 'Number of employees must be greater than 0'],
      max: [500, 'Number of employees must be less than or equal to 500']
    },
    numberOfAnalysts: {
      type: Number,
      // required: 'Please fill in number of analysts',
      min: [1, 'Number of analysts must be greater than 0'],
      max: [100, 'Number of analysts must be less than or equal to 100']
    },
    website: {
      type: String,
      trim: true,
      // required: 'Please enter your website url',
      validate: [{
        validator: function(v) {
          if (!/^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/|www\.)[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/.test(v)) {
            return false;
          }
        },
        message: 'Website url is invalid. Please enter valid website url'
      }]
    },
    domain: {
      type: String,
      trim: true
      // required: 'Please fill in your domain for whitelabeling'
    },
    languages: {
      type: String,
      trim: true
      // required: 'Please fill in your languages'
    },
    monthlyRespondents: {
      type: Number
      // required: 'Please fill in monthly respondents'
    },
    currency: {
      type: String
      // required: 'Please fill in your currency'
    },
    skypeID: {
      type: String
      // required: 'Please fill in your Skype ID'
    },
    logo: {
      type: String
    },
    tmpLogo: {
      type: String
    }
  },
  permissions: {
    allowedModules: {
      type: Array
    },
    allowedProjects: {
      type: Array
    }
  },
  publishedSurveys: [{
      type: Schema.ObjectId,
      ref: 'Survey'
  }],
  lastSignInAt: {
    type: Date
  }
});

/**
 * Hook a pre save method to hash the password
 */
UserSchema.pre('save', function (next) {
  if (this.password && this.isModified('password')) {
    this.salt = crypto.randomBytes(16).toString('base64');
    this.password = this.hashPassword(this.password);
  }

  next();
});

// /**
//  * Hook a pre validate method to test the local password
//  */
// UserSchema.pre('validate', function (next) {
//   if (this.provider === 'local' && this.password && this.isModified('password')) {
//     var result = owasp.test(this.password);
//     if (result.errors.length) {
//       var error = result.errors.join(' ');
//       this.invalidate('password', error);
//     }
//   }

//   next();
// });

/**
 * Create instance method for hashing a password
 */
UserSchema.methods.hashPassword = function (password) {
  if (this.salt && password) {
    return crypto.pbkdf2Sync(password, new Buffer(this.salt, 'base64'), 10000, 64, 'SHA1').toString('base64');
  } else {
    return password;
  }
};

/**
 * Create instance method which will return  display name of user
 * by concating firstName and lastName field values
 */
UserSchema.methods.displayName = function() {
  return (this.firstName + ' ' + this.lastName);
};

/**
 * Instance method which will return parent user id
 * or self id
 */
UserSchema.methods.parentId = function() {
  return (this.user ? this.user : this._id);
};

/**
 * Create instance method for authenticating user
 */
UserSchema.methods.authenticate = function (password) {
  return this.password === this.hashPassword(password);
};

/**
* Generates a random passphrase that passes the owasp test
* Returns a promise that resolves with the generated passphrase, or rejects with an error if something goes wrong.
* NOTE: Passphrases are only tested against the required owasp strength tests, and not the optional tests.
*/
UserSchema.statics.generateRandomPassphrase = function () {
  return new Promise(function (resolve, reject) {
    var password = '';
    var repeatingCharacters = new RegExp('(.)\\1{2,}', 'g');

    // iterate until the we have a valid passphrase
    // NOTE: Should rarely iterate more than once, but we need this to ensure no repeating characters are present
    while (password.length < 20 || repeatingCharacters.test(password)) {
      // build the random password
      password = generatePassword.generate({
        length: Math.floor(Math.random() * (20)) + 20, // randomize length between 20 and 40 characters
        numbers: true,
        symbols: false,
        uppercase: true,
        excludeSimilarCharacters: true
      });

      // check if we need to remove any repeating characters
      password = password.replace(repeatingCharacters, '');
    }

    // Send the rejection back if the passphrase fails to pass the strength test
    if (owasp.test(password).errors.length) {
      reject(new Error('An unexpected problem occured while generating the random passphrase'));
    } else {
      // resolve with the validated passphrase
      resolve(password);
    }
  });
};

mongoose.model('User', UserSchema);
