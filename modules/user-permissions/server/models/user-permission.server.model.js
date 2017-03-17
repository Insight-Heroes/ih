'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/**
 * User permission Schema
 */
var UserPermissionSchema = new Schema({
    permittedModules: {
        type: Array
    },
    permittedProjects: {
        type: Array
    },
    created: {
        type: Date,
        default: Date.now
    },
    user: {
        type: Schema.ObjectId,
        ref: 'User'
    }
});

mongoose.model('UserPermission', UserPermissionSchema);
