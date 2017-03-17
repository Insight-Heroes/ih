'use strict';

/**
 * Module dependencies
 */
var listsPolicy = require('../policies/lists.server.policy'),
    path = require('path'),
    lists = require('../controllers/lists.server.controller');
var utils = require(path.resolve('./modules/core/server/utilities/utils.server'));

module.exports = function(app) {
    // Lists Routes
    app.route('/api/lists').all(utils.authenticate)
        .get(lists.list)
        .post(lists.create);

    app.route('/api/lists/publish_survey')
        .get(utils.authenticate, lists.published)
        .post(utils.authenticate, lists.publishSurvey)
        .put(utils.authenticate, lists.processPublishSurvey);

    app.route('/api/lists/pdf')
        .get(utils.authenticate, lists.generatePdf);

    app.route('/api/lists/:listId').all(utils.authenticate)
        .get(lists.read)
        .put(lists.update)
        .delete(lists.delete);

    app.route('/api/lists/:listId/add_contacts')
        .post(utils.authenticate, lists.addContacts);


    // Finish by binding the List middleware
    app.param('listId', lists.listByID);
};
