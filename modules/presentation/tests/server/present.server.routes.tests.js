'use strict';

var should = require('should'),
  request = require('supertest'),
  path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Present = mongoose.model('Present'),
  express = require(path.resolve('./config/lib/express'));

/**
 * Globals
 */
var app,
  agent,
  credentials,
  user,
  present;

/**
 * Present routes tests
 */
describe('Present CRUD tests', function () {

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

    // Save a user to the test db and create new Present
    user.save(function () {
      present = {
        name: 'Present name'
      };

      done();
    });
  });

  it('should be able to save a Present if logged in', function (done) {
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

        // Save a new Present
        agent.post('/api/presentation')
          .send(present)
          .expect(200)
          .end(function (presentSaveErr, presentSaveRes) {
            // Handle Present save error
            if (presentSaveErr) {
              return done(presentSaveErr);
            }

            // Get a list of Presents
            agent.get('/api/presentation')
              .end(function (presentsGetErr, presentsGetRes) {
                // Handle Presents save error
                if (presentsGetErr) {
                  return done(presentsGetErr);
                }

                // Get Presents list
                var presents = presentsGetRes.body;

                // Set assertions
                (presents[0].user._id).should.equal(userId);
                (presents[0].name).should.match('Present name');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to save an Present if not logged in', function (done) {
    agent.post('/api/presentation')
      .send(present)
      .expect(403)
      .end(function (presentSaveErr, presentSaveRes) {
        // Call the assertion callback
        done(presentSaveErr);
      });
  });

  it('should not be able to save an Present if no name is provided', function (done) {
    // Invalidate name field
    present.name = '';

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

        // Save a new Present
        agent.post('/api/presentation')
          .send(present)
          .expect(400)
          .end(function (presentSaveErr, presentSaveRes) {
            // Set message assertion
            (presentSaveRes.body.message).should.match('Please fill Present name');

            // Handle Present save error
            done(presentSaveErr);
          });
      });
  });

  it('should be able to update an Present if signed in', function (done) {
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

        // Save a new Present
        agent.post('/api/presentation')
          .send(present)
          .expect(200)
          .end(function (presentSaveErr, presentSaveRes) {
            // Handle Present save error
            if (presentSaveErr) {
              return done(presentSaveErr);
            }

            // Update Present name
            present.name = 'WHY YOU GOTTA BE SO MEAN?';

            // Update an existing Present
            agent.put('/api/presentation/' + presentSaveRes.body._id)
              .send(present)
              .expect(200)
              .end(function (presentUpdateErr, presentUpdateRes) {
                // Handle Present update error
                if (presentUpdateErr) {
                  return done(presentUpdateErr);
                }

                // Set assertions
                (presentUpdateRes.body._id).should.equal(presentSaveRes.body._id);
                (presentUpdateRes.body.name).should.match('WHY YOU GOTTA BE SO MEAN?');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should be able to get a list of Presents if not signed in', function (done) {
    // Create new Present model instance
    var presentObj = new Present(present);

    // Save the present
    presentObj.save(function () {
      // Request Presents
      request(app).get('/api/presentation')
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Array).and.have.lengthOf(1);

          // Call the assertion callback
          done();
        });

    });
  });

  it('should be able to get a single Present if not signed in', function (done) {
    // Create new Present model instance
    var presentObj = new Present(present);

    // Save the Present
    presentObj.save(function () {
      request(app).get('/api/presentation/' + presentObj._id)
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Object).and.have.property('name', present.name);

          // Call the assertion callback
          done();
        });
    });
  });

  it('should return proper error for single Present with an invalid Id, if not signed in', function (done) {
    // test is not a valid mongoose Id
    request(app).get('/api/presentation/test')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'Present is invalid');

        // Call the assertion callback
        done();
      });
  });

  it('should return proper error for single Present which doesnt exist, if not signed in', function (done) {
    // This is a valid mongoose Id but a non-existent Present
    request(app).get('/api/presentation/559e9cd815f80b4c256a8f41')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'No Present with that identifier has been found');

        // Call the assertion callback
        done();
      });
  });

  it('should be able to delete an Present if signed in', function (done) {
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

        // Save a new Present
        agent.post('/api/presentation')
          .send(present)
          .expect(200)
          .end(function (presentSaveErr, presentSaveRes) {
            // Handle Present save error
            if (presentSaveErr) {
              return done(presentSaveErr);
            }

            // Delete an existing Present
            agent.delete('/api/presentation/' + presentSaveRes.body._id)
              .send(present)
              .expect(200)
              .end(function (presentDeleteErr, presentDeleteRes) {
                // Handle present error error
                if (presentDeleteErr) {
                  return done(presentDeleteErr);
                }

                // Set assertions
                (presentDeleteRes.body._id).should.equal(presentSaveRes.body._id);

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to delete an Present if not signed in', function (done) {
    // Set Present user
    present.user = user;

    // Create new Present model instance
    var presentObj = new Present(present);

    // Save the Present
    presentObj.save(function () {
      // Try deleting Present
      request(app).delete('/api/presentation/' + presentObj._id)
        .expect(403)
        .end(function (presentDeleteErr, presentDeleteRes) {
          // Set message assertion
          (presentDeleteRes.body.message).should.match('User is not authorized');

          // Handle Present error error
          done(presentDeleteErr);
        });

    });
  });

  it('should be able to get a single Present that has an orphaned user reference', function (done) {
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

          // Save a new Present
          agent.post('/api/presentation')
            .send(present)
            .expect(200)
            .end(function (presentSaveErr, presentSaveRes) {
              // Handle Present save error
              if (presentSaveErr) {
                return done(presentSaveErr);
              }

              // Set assertions on new Present
              (presentSaveRes.body.name).should.equal(present.name);
              should.exist(presentSaveRes.body.user);
              should.equal(presentSaveRes.body.user._id, orphanId);

              // force the Present to have an orphaned user reference
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

                    // Get the Present
                    agent.get('/api/presentation/' + presentSaveRes.body._id)
                      .expect(200)
                      .end(function (presentInfoErr, presentInfoRes) {
                        // Handle Present error
                        if (presentInfoErr) {
                          return done(presentInfoErr);
                        }

                        // Set assertions
                        (presentInfoRes.body._id).should.equal(presentSaveRes.body._id);
                        (presentInfoRes.body.name).should.equal(present.name);
                        should.equal(presentInfoRes.body.user, undefined);

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
      Present.remove().exec(done);
    });
  });
});
