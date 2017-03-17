'use strict';

/**
 * Module dependencies
 */
var pages = require('../controllers/pages.server.controller'),
    path = require('path');
var utils = require(path.resolve('./modules/core/server/utilities/utils.server'));

module.exports = function (app) {
    // Pages collection routes
    app.route('/api/pages')
        .all(utils.authenticate)
        .post(pages.create);

    // Single Page routes
    app.route('/api/pages/:pageId')
        .all(utils.authenticate)
        .get(pages.read)
        .put(pages.update)
        .delete(pages.delete);

    // File upload callback routes
    app.route('/api/pages/:pageId/file_upload_callback')
        .put(utils.authenticate, pages.s3UploadCallback);

    // Finish by binding the survey middleware
    app.param('pageId', pages.pageByID);
};
