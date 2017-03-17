'use strict';

/**
 * Module dependencies
 */
var listContactsPolicy = require('../policies/list-contacts.server.policy'),
  path = require('path'),
  utils = require(path.resolve('./modules/core/server/utilities/utils.server')),
  listContacts = require('../controllers/list-contacts.server.controller');

module.exports = function(app) {
  // List contacts Routes
  app.route('/api/list-contacts').all(utils.authenticate)
    .get(listContacts.list)
    .post(listContacts.create);

  app.route('/api/list-contacts/:listContactId').all(utils.authenticate)
    .get(listContacts.read)
    .put(listContacts.update)
    .delete(listContacts.delete);

  // Finish by binding the List contact middleware
  app.param('listContactId', listContacts.listContactByID);
};
