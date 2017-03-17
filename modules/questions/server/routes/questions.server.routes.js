'use strict';

/**
 * Module dependencies
 */
var questions = require('../controllers/questions.server.controller'),
    path = require('path');
var utils = require(path.resolve('./modules/core/server/utilities/utils.server'));

module.exports = function (app) {
    // app.all('/api/questions*', utils.authenticate, questions.verifySurveyOwner)
    // Questions collection routes
    app.route('/api/questions')
        .all(utils.authenticate)
        .post(questions.create);

    // Single Question routes
    app.route('/api/questions/:questionId')
        .all(utils.authenticate)
        .get(questions.read)
        .put(questions.update)
        .delete(questions.delete);

    // File upload callback routes
    app.route('/api/questions/:questionId/file_upload_callback')
        .put(utils.authenticate, questions.s3UploadCallback);

    // Question copy routes
    app.route('/api/questions/:questionId/copy')
        .put(utils.authenticate, questions.copy);

    // Logic Jumps
    app.route('/api/questions/:questionId/logic_jumps')
        .all(utils.authenticate)
        .get(questions.listLogicJumps)
        .put(questions.updateLogicJumps);

    // Finish by binding the survey middleware
    app.param('questionId', questions.questionByID);
};
