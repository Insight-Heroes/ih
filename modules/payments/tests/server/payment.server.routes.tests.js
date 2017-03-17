'use strict';

var should = require('should'),
  request = require('supertest'),
  path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Payment = mongoose.model('Payment'),
  express = require(path.resolve('./config/lib/express'));

/**
 * Globals
 */
var app,
  agent,
  credentials,
  user,
  payment;

/**
 * Payment routes tests
 */
describe('Payment CRUD tests', function () {

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

    // Save a user to the test db and create new Payment
    user.save(function () {
      payment = {
        name: 'Payment name'
      };

      done();
    });
  });

  it('should be able to save a Payment if logged in', function (done) {
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

        // Save a new Payment
        agent.post('/api/payments')
          .send(payment)
          .expect(200)
          .end(function (paymentSaveErr, paymentSaveRes) {
            // Handle Payment save error
            if (paymentSaveErr) {
              return done(paymentSaveErr);
            }

            // Get a list of Payments
            agent.get('/api/payments')
              .end(function (paymentsGetErr, paymentsGetRes) {
                // Handle Payments save error
                if (paymentsGetErr) {
                  return done(paymentsGetErr);
                }

                // Get Payments list
                var payments = paymentsGetRes.body;

                // Set assertions
                (payments[0].user._id).should.equal(userId);
                (payments[0].name).should.match('Payment name');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to save an Payment if not logged in', function (done) {
    agent.post('/api/payments')
      .send(payment)
      .expect(403)
      .end(function (paymentSaveErr, paymentSaveRes) {
        // Call the assertion callback
        done(paymentSaveErr);
      });
  });

  it('should not be able to save an Payment if no name is provided', function (done) {
    // Invalidate name field
    payment.name = '';

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

        // Save a new Payment
        agent.post('/api/payments')
          .send(payment)
          .expect(400)
          .end(function (paymentSaveErr, paymentSaveRes) {
            // Set message assertion
            (paymentSaveRes.body.message).should.match('Please fill Payment name');

            // Handle Payment save error
            done(paymentSaveErr);
          });
      });
  });

  it('should be able to update an Payment if signed in', function (done) {
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

        // Save a new Payment
        agent.post('/api/payments')
          .send(payment)
          .expect(200)
          .end(function (paymentSaveErr, paymentSaveRes) {
            // Handle Payment save error
            if (paymentSaveErr) {
              return done(paymentSaveErr);
            }

            // Update Payment name
            payment.name = 'WHY YOU GOTTA BE SO MEAN?';

            // Update an existing Payment
            agent.put('/api/payments/' + paymentSaveRes.body._id)
              .send(payment)
              .expect(200)
              .end(function (paymentUpdateErr, paymentUpdateRes) {
                // Handle Payment update error
                if (paymentUpdateErr) {
                  return done(paymentUpdateErr);
                }

                // Set assertions
                (paymentUpdateRes.body._id).should.equal(paymentSaveRes.body._id);
                (paymentUpdateRes.body.name).should.match('WHY YOU GOTTA BE SO MEAN?');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should be able to get a list of Payments if not signed in', function (done) {
    // Create new Payment model instance
    var paymentObj = new Payment(payment);

    // Save the payment
    paymentObj.save(function () {
      // Request Payments
      request(app).get('/api/payments')
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Array).and.have.lengthOf(1);

          // Call the assertion callback
          done();
        });

    });
  });

  it('should be able to get a single Payment if not signed in', function (done) {
    // Create new Payment model instance
    var paymentObj = new Payment(payment);

    // Save the Payment
    paymentObj.save(function () {
      request(app).get('/api/payments/' + paymentObj._id)
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Object).and.have.property('name', payment.name);

          // Call the assertion callback
          done();
        });
    });
  });

  it('should return proper error for single Payment with an invalid Id, if not signed in', function (done) {
    // test is not a valid mongoose Id
    request(app).get('/api/payments/test')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'Payment is invalid');

        // Call the assertion callback
        done();
      });
  });

  it('should return proper error for single Payment which doesnt exist, if not signed in', function (done) {
    // This is a valid mongoose Id but a non-existent Payment
    request(app).get('/api/payments/559e9cd815f80b4c256a8f41')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'No Payment with that identifier has been found');

        // Call the assertion callback
        done();
      });
  });

  it('should be able to delete an Payment if signed in', function (done) {
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

        // Save a new Payment
        agent.post('/api/payments')
          .send(payment)
          .expect(200)
          .end(function (paymentSaveErr, paymentSaveRes) {
            // Handle Payment save error
            if (paymentSaveErr) {
              return done(paymentSaveErr);
            }

            // Delete an existing Payment
            agent.delete('/api/payments/' + paymentSaveRes.body._id)
              .send(payment)
              .expect(200)
              .end(function (paymentDeleteErr, paymentDeleteRes) {
                // Handle payment error error
                if (paymentDeleteErr) {
                  return done(paymentDeleteErr);
                }

                // Set assertions
                (paymentDeleteRes.body._id).should.equal(paymentSaveRes.body._id);

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to delete an Payment if not signed in', function (done) {
    // Set Payment user
    payment.user = user;

    // Create new Payment model instance
    var paymentObj = new Payment(payment);

    // Save the Payment
    paymentObj.save(function () {
      // Try deleting Payment
      request(app).delete('/api/payments/' + paymentObj._id)
        .expect(403)
        .end(function (paymentDeleteErr, paymentDeleteRes) {
          // Set message assertion
          (paymentDeleteRes.body.message).should.match('User is not authorized');

          // Handle Payment error error
          done(paymentDeleteErr);
        });

    });
  });

  it('should be able to get a single Payment that has an orphaned user reference', function (done) {
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

          // Save a new Payment
          agent.post('/api/payments')
            .send(payment)
            .expect(200)
            .end(function (paymentSaveErr, paymentSaveRes) {
              // Handle Payment save error
              if (paymentSaveErr) {
                return done(paymentSaveErr);
              }

              // Set assertions on new Payment
              (paymentSaveRes.body.name).should.equal(payment.name);
              should.exist(paymentSaveRes.body.user);
              should.equal(paymentSaveRes.body.user._id, orphanId);

              // force the Payment to have an orphaned user reference
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

                    // Get the Payment
                    agent.get('/api/payments/' + paymentSaveRes.body._id)
                      .expect(200)
                      .end(function (paymentInfoErr, paymentInfoRes) {
                        // Handle Payment error
                        if (paymentInfoErr) {
                          return done(paymentInfoErr);
                        }

                        // Set assertions
                        (paymentInfoRes.body._id).should.equal(paymentSaveRes.body._id);
                        (paymentInfoRes.body.name).should.equal(payment.name);
                        should.equal(paymentInfoRes.body.user, undefined);

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
      Payment.remove().exec(done);
    });
  });
});
