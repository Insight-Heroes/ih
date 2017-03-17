'use strict';

var should = require('should'),
  request = require('supertest'),
  path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  UserResponse = mongoose.model('UserResponse'),
  express = require(path.resolve('./config/lib/express'));

/**
 * Globals
 */
var app,
  agent,
  credentials,
  user,
  userResponse;

/**
 * User response routes tests
 */
describe('User response CRUD tests', function () {

  before(function (done) {
    // Get application
    app = express.init(mongoose);
    agent = request.agent(app);

    done();
  });

  beforeEach(function (done) {
    // Create user credentials
    credentials = {
      username: 'username',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    // Create a new user
    user = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test@test.com',
      username: credentials.username,
      password: credentials.password,
      provider: 'local'
    });

    // Save a user to the test db and create new User response
    user.save(function () {
      userResponse = {
        name: 'User response name'
      };

      done();
    });
  });

  it('should be able to save a User response if logged in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new User response
        agent.post('/api/userResponses')
          .send(userResponse)
          .expect(200)
          .end(function (userResponseSaveErr, userResponseSaveRes) {
            // Handle User response save error
            if (userResponseSaveErr) {
              return done(userResponseSaveErr);
            }

            // Get a list of User responses
            agent.get('/api/userResponses')
              .end(function (userResponsesGetErr, userResponsesGetRes) {
                // Handle User responses save error
                if (userResponsesGetErr) {
                  return done(userResponsesGetErr);
                }

                // Get User responses list
                var userResponses = userResponsesGetRes.body;

                // Set assertions
                (userResponses[0].user._id).should.equal(userId);
                (userResponses[0].name).should.match('User response name');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to save an User response if not logged in', function (done) {
    agent.post('/api/userResponses')
      .send(userResponse)
      .expect(403)
      .end(function (userResponseSaveErr, userResponseSaveRes) {
        // Call the assertion callback
        done(userResponseSaveErr);
      });
  });

  it('should not be able to save an User response if no name is provided', function (done) {
    // Invalidate name field
    userResponse.name = '';

    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new User response
        agent.post('/api/userResponses')
          .send(userResponse)
          .expect(400)
          .end(function (userResponseSaveErr, userResponseSaveRes) {
            // Set message assertion
            (userResponseSaveRes.body.message).should.match('Please fill User response name');

            // Handle User response save error
            done(userResponseSaveErr);
          });
      });
  });

  it('should be able to update an User response if signed in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new User response
        agent.post('/api/userResponses')
          .send(userResponse)
          .expect(200)
          .end(function (userResponseSaveErr, userResponseSaveRes) {
            // Handle User response save error
            if (userResponseSaveErr) {
              return done(userResponseSaveErr);
            }

            // Update User response name
            userResponse.name = 'WHY YOU GOTTA BE SO MEAN?';

            // Update an existing User response
            agent.put('/api/userResponses/' + userResponseSaveRes.body._id)
              .send(userResponse)
              .expect(200)
              .end(function (userResponseUpdateErr, userResponseUpdateRes) {
                // Handle User response update error
                if (userResponseUpdateErr) {
                  return done(userResponseUpdateErr);
                }

                // Set assertions
                (userResponseUpdateRes.body._id).should.equal(userResponseSaveRes.body._id);
                (userResponseUpdateRes.body.name).should.match('WHY YOU GOTTA BE SO MEAN?');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should be able to get a list of User responses if not signed in', function (done) {
    // Create new User response model instance
    var userResponseObj = new UserResponse(userResponse);

    // Save the userResponse
    userResponseObj.save(function () {
      // Request User responses
      request(app).get('/api/userResponses')
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Array).and.have.lengthOf(1);

          // Call the assertion callback
          done();
        });

    });
  });

  it('should be able to get a single User response if not signed in', function (done) {
    // Create new User response model instance
    var userResponseObj = new UserResponse(userResponse);

    // Save the User response
    userResponseObj.save(function () {
      request(app).get('/api/userResponses/' + userResponseObj._id)
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Object).and.have.property('name', userResponse.name);

          // Call the assertion callback
          done();
        });
    });
  });

  it('should return proper error for single User response with an invalid Id, if not signed in', function (done) {
    // test is not a valid mongoose Id
    request(app).get('/api/userResponses/test')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'User response is invalid');

        // Call the assertion callback
        done();
      });
  });

  it('should return proper error for single User response which doesnt exist, if not signed in', function (done) {
    // This is a valid mongoose Id but a non-existent User response
    request(app).get('/api/userResponses/559e9cd815f80b4c256a8f41')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'No User response with that identifier has been found');

        // Call the assertion callback
        done();
      });
  });

  it('should be able to delete an User response if signed in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new User response
        agent.post('/api/userResponses')
          .send(userResponse)
          .expect(200)
          .end(function (userResponseSaveErr, userResponseSaveRes) {
            // Handle User response save error
            if (userResponseSaveErr) {
              return done(userResponseSaveErr);
            }

            // Delete an existing User response
            agent.delete('/api/userResponses/' + userResponseSaveRes.body._id)
              .send(userResponse)
              .expect(200)
              .end(function (userResponseDeleteErr, userResponseDeleteRes) {
                // Handle userResponse error error
                if (userResponseDeleteErr) {
                  return done(userResponseDeleteErr);
                }

                // Set assertions
                (userResponseDeleteRes.body._id).should.equal(userResponseSaveRes.body._id);

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to delete an User response if not signed in', function (done) {
    // Set User response user
    userResponse.user = user;

    // Create new User response model instance
    var userResponseObj = new UserResponse(userResponse);

    // Save the User response
    userResponseObj.save(function () {
      // Try deleting User response
      request(app).delete('/api/userResponses/' + userResponseObj._id)
        .expect(403)
        .end(function (userResponseDeleteErr, userResponseDeleteRes) {
          // Set message assertion
          (userResponseDeleteRes.body.message).should.match('User is not authorized');

          // Handle User response error error
          done(userResponseDeleteErr);
        });

    });
  });

  it('should be able to get a single User response that has an orphaned user reference', function (done) {
    // Create orphan user creds
    var _creds = {
      username: 'orphan',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    // Create orphan user
    var _orphan = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'orphan@test.com',
      username: _creds.username,
      password: _creds.password,
      provider: 'local'
    });

    _orphan.save(function (err, orphan) {
      // Handle save error
      if (err) {
        return done(err);
      }

      agent.post('/api/auth/signin')
        .send(_creds)
        .expect(200)
        .end(function (signinErr, signinRes) {
          // Handle signin error
          if (signinErr) {
            return done(signinErr);
          }

          // Get the userId
          var orphanId = orphan._id;

          // Save a new User response
          agent.post('/api/userResponses')
            .send(userResponse)
            .expect(200)
            .end(function (userResponseSaveErr, userResponseSaveRes) {
              // Handle User response save error
              if (userResponseSaveErr) {
                return done(userResponseSaveErr);
              }

              // Set assertions on new User response
              (userResponseSaveRes.body.name).should.equal(userResponse.name);
              should.exist(userResponseSaveRes.body.user);
              should.equal(userResponseSaveRes.body.user._id, orphanId);

              // force the User response to have an orphaned user reference
              orphan.remove(function () {
                // now signin with valid user
                agent.post('/api/auth/signin')
                  .send(credentials)
                  .expect(200)
                  .end(function (err, res) {
                    // Handle signin error
                    if (err) {
                      return done(err);
                    }

                    // Get the User response
                    agent.get('/api/userResponses/' + userResponseSaveRes.body._id)
                      .expect(200)
                      .end(function (userResponseInfoErr, userResponseInfoRes) {
                        // Handle User response error
                        if (userResponseInfoErr) {
                          return done(userResponseInfoErr);
                        }

                        // Set assertions
                        (userResponseInfoRes.body._id).should.equal(userResponseSaveRes.body._id);
                        (userResponseInfoRes.body.name).should.equal(userResponse.name);
                        should.equal(userResponseInfoRes.body.user, undefined);

                        // Call the assertion callback
                        done();
                      });
                  });
              });
            });
        });
    });
  });

  afterEach(function (done) {
    User.remove().exec(function () {
      UserResponse.remove().exec(done);
    });
  });
});
