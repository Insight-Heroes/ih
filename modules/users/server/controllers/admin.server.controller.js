'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
    fs = require('fs'),
    mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Project = mongoose.model('Project'),
    parameters = require('strong-params').Parameters,
    confirmationMailer = require(path.resolve('./modules/users/server/controllers/users/users.confirmation-mail.server.controller')),
    _ = require('lodash'),
    generatePassword = require('password-generator'),
    utils = require(path.resolve('./modules/core/server/utilities/utils.server')),
    multer = require('multer'),
    chalk = require('chalk'),
    moment = require('moment'),
    shortid = require('shortid'),
    aws = require('aws-sdk'),
    async = require('async'),
    multerS3 = require('multer-s3'),
    errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));
    var AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID;
    var AWS_SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY;
    var AWS_REGION = process.env.AWS_REGION;

/**
 * Show the current user
 */
exports.read = function (req, res) {
    var user = req.model;
    User.find({ _id: user._id, user: req.user.parentId() }, function (err, u) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            res.json(user);

        }
    });
};

/**
 * List of Users
 */
exports.list = function (req, res) {
    var projectIds = [],
        projects = {},
        users = [];
    async.waterfall([
        function(done) {
            User.find({ user: req.user.parentId() }, done);
        },
        function(usrs, done) {
            users = JSON.parse(JSON.stringify(usrs));
            usrs.forEach(function(u) {
                getProjectIdFromUser(u);
            });
            done();
        },
        function(done) {
            projectIds = _.uniq(projectIds);
            Project.find()
                .where('_id')
                .in(projectIds)
                .exec(function (err, prjs) {
                    prjs.forEach(function(p) {
                        projects[p._id.toString()] = {
                            _id: p._id,
                            name: p.name
                        };
                    });
                    done();
                });
        },
        function(done) {
            var updatedUsers = [];
            // console.log('Cloned Users: ', users);
            users.forEach(function(u) {
                updatedUsers.push(attachProjectInfoInUsers(u));
            });
            done(null, updatedUsers);
        }], function(err, updatedUsers) {
            if (err) {
                return res.status(400).send({
                    message: errorHandler.getErrorMessage(err)
                });
            }
            updatedUsers.reverse();
            res.json(updatedUsers);
        });

    function attachProjectInfoInUsers(u) {
        if (u.permissions &&
            u.permissions.allowedProjects &&
            u.permissions.allowedProjects.length > 0 &&
            u.permissions.allowedProjects[0]) {
            var project = projects[_.first(u.permissions.allowedProjects).toString()];
            u.assignedProject = project;
        }
        return u;
    }

    function getProjectIdFromUser(u) {
        if (u.permissions && u.permissions.allowedProjects && u.permissions.allowedProjects.length > 0) {
            projectIds.push(u.permissions.allowedProjects[0]);
        }
    }

};

// gatherer users List of main user
exports.gathererList = function (req, res) {
    User.find({ roles: 'gatherer', user: req.user.parentId() }).exec(function(err, result) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        }
        res.json(result);
    });
};

// List of surveys of gatherers user
exports.publishedSurveysUsers = function (req, res) {

    var gathererUser = req.params.userId;

    User.find({ _id: gathererUser }).populate('publishedSurveys').exec(function(err, result) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        }
        if (result.length > 0) {
            res.json(result[0].publishedSurveys);
        } else {
            res.json([]);
        }
    });
};

/**
 * Filter user params from request body
 * @param  {Object} req request object
 * @return {Object}     Filtered paramters
 */
var userParams = function(req) {
    var tmpPassword = generatePassword();
    return {
        provider: 'local',
        tmpPassword: tmpPassword,
        password: tmpPassword,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        mobileNo: req.body.mobileNo,
        address: req.body.address,
        zipcode: req.body.zipcode,
        state: req.body.state,
        country: req.body.country,
        roles: req.body.roles,
        company: req.body.company
    };
};

/**
*Set Storage
*/
var setStorage = function () {
    var storage,
    s3;
    s3 = new aws.S3({ accessKeyId: AWS_ACCESS_KEY, secretAccessKey: AWS_SECRET_KEY, region: AWS_REGION });
    console.log('process.env.NODE_ENV', process.env.NODE_ENV, (process.env.NODE_ENV === 'development'));
    // multers disk storage settings
    if (process.env.NODE_ENV === 'development') {
        storage = multer.diskStorage({
            destination: function (request, file, cb) {
                    cb(null, 'public/uploads/');
                },
            filename: function (request, file, cb) {
                var ext = file.originalname.split('.').pop();
                var fileName = 'rbac-user-' + moment(Date.now()).unix() + '-' + shortid.generate() + '.' + ext.toLowerCase();
                cb(null, fileName);
                }
        });
    } else {
        storage = multerS3({
            destination: function(request, file, cb) {
                cb(null, 'rbac-users');
            },
            key: function(request, file, cb) {
                var ext = file.originalname.split('.').pop();
                var fileName = 'rbac-user-' + moment(Date.now()).unix() + '-' + shortid.generate() + '.' + ext.toLowerCase();
                cb(null, fileName);
            },
            s3: s3,
            acl: 'public-read',
            bucket: process.env.AWS_S3_BUCKET
        });
    }
    return storage;
};

var deleteImage = function(profileImage, res, done) {
    var filePath;
    if (process.env.NODE_ENV === 'development') {
        filePath = path.join('public', profileImage);
        if (profileImage !== 'modules/users/client/img/profile/default.png') {
            fs.unlink(filePath, function(err) {
                if (err) {
                    done(err, null);
                } else {
                    console.log('profileImage deleted successfully');
                    done(null, 'profileImage deleted');
                }
            });
        }
    } else {
        filePath = profileImage;
        var bucketInstance = new aws.S3();
        var params = {
                Bucket: process.env.AWS_S3_BUCKET,
                Key: _.last(filePath.split('/'))
            };
        if (profileImage !== 'modules/users/client/img/profile/default.png') {
            bucketInstance.deleteObject(params, function (err, data) {
                if (err) {
                    done(err, null);
                } else {
                    console.log('profileImage deleted successfully');
                    done(null, 'profileImage deleted');
                }
            });
        }
    }
};

var getFileUrl = function(file) {
    var fileUrl;
    if (file) {
        if (process.env.NODE_ENV === 'development') {
            fileUrl = file.path.replace('public', '');
            console.log(chalk.bgGreen('File URL: '), fileUrl);
        } else {
            fileUrl = file.location;
            console.log(chalk.bgGreen('File URL: '), fileUrl);
        }
        console.log('profileImage Uploaded');
        return fileUrl;
    }
};

/**
 * Create user
 */
exports.create = function (req, res, next) {
    var upload,
    storage;
    storage = setStorage();
    console.log('storage : ', storage);

    upload = multer({ storage: storage }).single('profileImage');
    // Init user and add missing fields
    upload(req, res, function(err) {
        console.log('File: ', req.file);
        var fileUrl;
        var user = new User(userParams(req));
        user.user = req.user.parentId();
        fileUrl = getFileUrl(req.file);
        if (fileUrl) {
        user.profileImage = fileUrl;
        }
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        }
        user.save(function(err, u) {
            if (err) {
                deleteImage(user.profileImage, res, function(err, data) {
                    if (err) {
                        console.log('Error Occured : ', err);
                        return res.status(400).send({
                            message: errorHandler.getErrorMessage(err)
                        });
                    }
                });
                return res.status(400).send({
                    message: errorHandler.getErrorMessage(err)
                });
            } else {
                confirmationMailer.deliverEmail(req, res, next, user, true, function(err, Response) {
                    if (err) {
                        console.log('Error Occured : ', err);
                        return res.status(400).send({
                            message: errorHandler.getErrorMessage(err)
                        });
                    } else {
                        console.log('Email delivered');
                        res.json(u);
                    }
                });
            }
        });
    });
};

/**
 * Filter user params from request body
 * @param  {Object} req request object
 * @return {Object}     Filtered paramters
 */
var updateParams = function(req) {
    return {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        mobileNo: req.body.mobileNo,
        address: req.body.address,
        zipcode: req.body.zipcode,
        state: req.body.state,
        country: req.body.country,
        roles: req.body.roles,
        company: req.body.company
    };
};

/**
 * Update a User
 */
exports.update = function (req, res) {
    var user = req.model;
    console.log('user :', user);

    var storage,
    upload;
    storage = setStorage();
    console.log('storage : ', storage);
    upload = multer({ storage: storage }).single('profileImage');

    upload(req, res, function(err) {
        var fileUrl;
        console.log('File: ', req.file);
        console.log('Parameters(req.body):', req.body);
        var updatedUser = _.merge(user, updateParams(req));
        fileUrl = getFileUrl(req.file);
        if (fileUrl) {
            deleteImage(user.profileImage, res, function(err, data) {
                if (err) {
                    console.log('Error Occured : ', err);
                    return res.status(400).send({
                        message: errorHandler.getErrorMessage(err)
                    });
                }
            });
            updatedUser.profileImage = fileUrl;
        }
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        }
        // console.log(req.file);
        updatedUser.save(function(err, u) {
            if (err) {
                console.log('ERROR :', err);
                return res.status(400).send({
                    message: errorHandler.getErrorMessage(err)
                });
            } else {
                console.log('updated user: ', u);
                res.json(u);
            }
        });
    });
};

/**
 * Delete a user
 */
exports.delete = function (req, res) {
    var user = req.model;

    // Hero can not delete main user
    if (_.includes(['user', 'mainUser'], req.model.roles) && req.user.roles === 'hero') {
        return res.status(403).json({
            message: 'Access Denied! User is not authorized to access the given module'
        });
    }

    user.remove(function (err) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            if (user.profileImage !== 'modules/users/client/img/profile/default.png') {
                deleteImage(user.profileImage, res, function(err, data) {
                    if (err) {
                        console.log('Error Occured : ', err);
                        return res.status(400).send({
                            message: errorHandler.getErrorMessage(err)
                        });
                    }
                });
            }
            console.log('User deleted successfully');
            res.json(user);
        }
    });
};


/**
 * Assign project to user
 * @param  {Object} req - Request object
 * @param  {Object} res - Response object
 */
exports.assignProject = function(req, res) {
    var projectId = req.body.projectId;
    var user = req.model;
    if (!user.permissions) {
        user.permissions = {
            allowedProjects: [req.projectId],
            allowedModules: []
        };
    } else {
        console.log('Here');
        user.permissions.allowedProjects = [projectId];
    }
    console.log(user);
    user.save(function(err, user) {
        if (err) {
            console.log('Error Occured : ', err);
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        }
        res.json(user);
    });
};

/**
 * User middleware
 */
exports.userByID = function (req, res, next, id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send({
            message: 'User is invalid'
        });
    }
    User.findById(id, '-salt -password -providerData').exec(function (err, user) {
        if (err) {
            return next(err);
        } else if (!user) {
            return res.status(404).send({
                message: 'Failed to load user ' + id
            });
            // return next(new Error('Failed to load user ' + id));
        }

        req.model = user;
        next();
    });
};
