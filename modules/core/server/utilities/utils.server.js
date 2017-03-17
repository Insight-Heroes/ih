'use strict';
var chalk = require('chalk');

/**
 * clone object, optionally pass parameters and clone with only parameters passed
 */
exports.clone = function (obj, properties, fns) {
    var cloned = {};
    if (properties) {
        properties.forEach(function(p) {
            if (obj[p] !== undefined) {
                cloned[p] = obj[p];
            }
        });
    } else {
        for (var o in obj) {
            if (obj[o] !== undefined) {
                cloned[o] = obj[o];
            }
        }
    }
    if (fns) {
        fns.forEach(function(fnName) {
            cloned[fnName] = obj[fnName]();
        });
    }
    return cloned;
};

/**
 * Authenticate user - Check if User is logged in or not
 * @param  {Object}   req  request object
 * @param  {Object}   res  response object
 * @param  {Function} next Next function
 */
exports.authenticate = function(req, res, next) {
    console.log(chalk.bold.cyan('User authenticated?', req.isAuthenticated() ? 'Yes' : 'No'));
    if (!req.isAuthenticated())
        res.sendStatus(401);
    else
        next();
};

/**
 * @param  {Boolean} slugList  if slugList is true, returns list of question slug
 * otherwise return question types object
 * @return {[type]} [description]
 */
exports.questionTypes = function(slugList) {
    var types = {
        dropdown: {
            title: 'Dropdown',
            className: ''
        },
        multiChoice: {
            title: 'Multiple Choice',
            className: 'icon-checked'
        },
        imageChoice: {
            title: 'Image Choice',
            className: ''
        },
        matrix: {
            title: 'Matrix',
            className: ''
        },
        rankOrder: {
            title: 'Rank Order',
            className: ''
        },
        slider: {
            title: 'Slider',
            className: ''
        },
        pairing: {
            title: 'Pairing',
            className: ''
        },
        descriptiveText: {
            title: 'Descriptive Text',
            className: ''
        },
        picture: {
            title: 'Picture',
            className: ''
        },
        timeAndDate: {
            title: 'Date/Time',
            className: ''
        },
        media: {
            title: 'Media',
            subTitle: '(Audio/Image/Video)',
            className: ''
        }
    };
    if (slugList) {
        return Object.keys(types);
    } else {
        return types;
    }
};

/**
 * @param  {Boolean} slugList  if slugList is true, returns list of question slug
 * otherwise return question types object
 * @return {[type]} [description]
 */
exports.pageTypes = function() {
    var types = {
        welcome: {
            title: 'Welcome Page',
            className: ''
        },
        customPage: {
            title: 'New Page',
            className: ''
        },
        thankYou: {
            title: 'Thank You Page',
            className: ''
        }

    };
    return types;
};

exports.defaultPlanTypes = function() {
    var types = {
        M: {
            braintreePlanId: 'MonthlyPlan',
            noOfRespondants: 5000,
            name: 'Monthly Billing'
        },
        Y: {
            braintreePlanId: 'YearlyPlan',
            noOfRespondants: 60000,
            name: 'Yearly Billing'
        },
        A: {
            name: 'Add on'
        },
        Free: {
            name: 'Free',
            noOfRespondants: 100
        }

    };
    return types;
};


exports.defaultCSVColumns = function() {
    return ['email', 'firstname', 'lastname'];
};

exports.userTypes = function() {
    var types = {
        mainUser: {
            title: 'MAIN USER',
            info: 'It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.'
        },
        warrior: {
            title: 'WARRIOR',
            info: 'It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.'
        },
        hero: {
            title: 'HERO',
            info: 'It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.'
        },
        client: {
            title: 'CLIENT',
            info: 'It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.'
        },
        gatherer: {
            title: 'GATHERER',
            info: 'It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.'
        }
    };
    return types;
};

exports.dataCollectionTypes = function() {
    return {
        email: 'Email',
        'webEmbedLinks': 'Web/Embed links',
        cati: 'CATI',
        fod: 'FOS'
    };
};

exports.removeHtmlTags = function(html) {
    return html.replace(/<[^>]+>/gm, '').replace(/&nbsp;/g, ' ');
};
