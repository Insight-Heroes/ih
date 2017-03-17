'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  UserResponse = mongoose.model('UserResponse');

/**
 * Globals
 */
var user,
  userResponse;

/**
 * Unit tests
 */
describe('User response Model Unit Tests:', function() {
  beforeEach(function(done) {
    user = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test@test.com',
      username: 'username',
      password: 'password'
    });

    user.save(function() {
      userResponse = new UserResponse({
        name: 'User response Name',
        user: user
      });

      done();
    });
  });

  describe('Method Save', function() {
    it('should be able to save without problems', function(done) {
      this.timeout(0);
      return userResponse.save(function(err) {
        should.not.exist(err);
        done();
      });
    });

    it('should be able to show an error when try to save without name', function(done) {
      userResponse.name = '';

      return userResponse.save(function(err) {
        should.exist(err);
        done();
      });
    });
  });

  afterEach(function(done) {
    UserResponse.remove().exec(function() {
      User.remove().exec(function() {
        done();
      });
    });
  });
});
