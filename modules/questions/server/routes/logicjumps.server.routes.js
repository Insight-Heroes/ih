'use strict';

/**
 * Module dependencies
 */
var logicjumps = require('../controllers/logicjumps.server.controller'),
    path = require('path');
var utils = require(path.resolve('./modules/core/server/utilities/utils.server'));

module.exports = function (app) {
    // app.all('/api/logicjumps*', utils.authenticate, logicjumps.verifySurveyOwner)

    app.route('/api/logicjumps')
        .all(utils.authenticate)
        .post(logicjumps.create);

    // Logic Jumps get list
    app.route('/api/logicjumps/:questionId/logic_jumps') // .all(utils.authenticate)
        .get(logicjumps.listLogicJumps);

    // Logic Jumps delete list
    app.route('/api/logicjumps/delete_jumps')
        .all(utils.authenticate)
        .post(logicjumps.deleteLogicJumps);

    // Logic Jumps delete from questions
    app.route('/api/logicjumps/remLogicFromQues')
        .all(utils.authenticate)
        .post(logicjumps.remLogicFromQues);

    // Finish by binding the survey middleware
    app.param('logicjumpID', logicjumps.logicjumpByID);
};
