'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
    fs = require('fs'),
    mongoose = require('mongoose'),
    Project = mongoose.model('Project'),
    Present = mongoose.model('Present'),
    LogicJump = mongoose.model('LogicJump'),
    Survey = mongoose.model('Survey'),
    Question = mongoose.model('Question'),
    User = mongoose.model('User'),
    async = require('async'),
    _ = require('lodash'),
    multer = require('multer'),
    chalk = require('chalk'),
    moment = require('moment'),
    shortid = require('shortid'),
    aws = require('aws-sdk'),
    multerS3 = require('multer-s3'),
    parameters = require('strong-params').Parameters,
    uploader = require(path.resolve('./modules/core/server/utilities/uploader.server')),
    errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

    var AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID;
    var AWS_SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY;
    var AWS_REGION = process.env.AWS_REGION;

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

var deleteImage = function(logo, res, done) {
    var filePath;
    if (process.env.NODE_ENV === 'development') {
        filePath = path.join('public', logo);
        fs.unlink(filePath, function(err) {
            if (err) {
                done(err, null);
            } else {
                console.log('Logo deleted successfully');
                done(null, 'Logo deleted');
            }
        });
    } else {
        filePath = logo;
        var bucketInstance = new aws.S3();
        var params = {
                Bucket: process.env.AWS_S3_BUCKET,
                Key: _.last(filePath.split('/'))
            };
        bucketInstance.deleteObject(params, function (err, data) {
            if (err) {
                done(err, null);
            } else {
                console.log('Logo deleted successfully');
                done(null, 'Logo deleted');
            }
        });
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
        console.log('Logo Uploaded');
        return fileUrl;
    } else {
    return fileUrl;
    }
};

/**
 * Function to whitelist project parameters from a request
 * @param  {Object} req request object
 * @return {Object}     Whitelisted project parameter hash(object)
 */
function projectParams(rawParams) {
    var params = parameters(rawParams);
    return params.permit('name', 'description', 'client', 'division', 'round', 'frequency', 'respondantType', 'country', 'stateProvincesCovered', 'sampleToBeCovered', 'methodOfDataCollection', 'ValueOfProject', 'startDate', 'estimatedEndDate', 'clientCoordinator', 'email', 'mobileNo', 'skypeID').value();
}

/**
 * Create a project
 */
exports.create = function (req, res) {
    var upload,
    storage;
    storage = setStorage();
    console.log('storage : ', storage);

    upload = multer({ storage: storage }).single('logo');
    // Init user and add missing fields
    upload(req, res, function(err) {
        console.log('inside createProject : ', req.body);
        console.log('File: ', req.file);
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            var fileUrl;
            var project = new Project(projectParams(req.body));
            project.user = req.user.parentId();
            if (project.estimatedEndDate === undefined || project.estimatedEndDate === null) {
                project.set('estimatedEndDate', null);
            }
            fileUrl = getFileUrl(req.file);
            if (fileUrl) {
                project.logo = fileUrl;
            }
            project.save(function(err, p) {
                if (err) {
                    if (project.logo) {
                        deleteImage(project.logo, res, function(err, data) {
                            if (err) {
                                console.log('Error Occured : ', err);
                                return res.status(400).send({
                                    message: errorHandler.getErrorMessage(err)
                                });
                            }
                        });
                    }
                    return res.status(400).send({
                        message: errorHandler.getErrorMessage(err)
                    });
                } else {
                    console.log('Project created successfully');
                    res.json(p);
                }
            });
        }
    });
};

/**
 * List of Projects
 */
exports.list = function (req, res) {
    var params = { user: req.user.parentId() };
    console.log(req.user.roles, _.includes(['warrior', 'client'], req.user.roles));
    if (req.user.user && _.includes(['warrior', 'client'], req.user.roles)) {
        if (req.user.permissions && req.user.permissions.allowedProjects.length > 0) {
            params._id = { $in: req.user.permissions.allowedProjects };
        } else {
            return res.json([]);
        }
    }
    Project.find(params).sort('-created').populate('user', '-password -confirmationToken -confirmationTokenExpires').exec(function (err, projects) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
          res.json(projects);
        }
    });
};

/**
 * Project middleware
 */
exports.projectByID = function (req, res, next, id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send({
            message: 'Project id is invalid'
        });
    }
    Project.findOne({ _id: id, user: req.user.parentId() }).populate('user').exec(function (err, project) {
        if (err) {
            return next(err);
        } else if (!project) {
            return res.status(404).send({
                message: 'Project not found'
            });
        }
        req.project = project;
        next();
    });
};

/**
 * Show the current project
 */
exports.read = function (req, res) {
    // convert mongoose document to JSON
    var project = req.project;
    project.lastOpenedOn = Date.now();
    Project.update({ _id: project._id }, project, function(err) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            Survey.find({ user: req.user.parentId(), project: project._id }).sort('-created').exec(function (err, surveys) {
                if (err) {
                    return res.status(400).send({
                        message: errorHandler.getErrorMessage(err)
                    });
                } else {
                    console.log('project.lastOpenedOn : ', project.lastOpenedOn);
                    project.surveys = surveys;
                    res.json(project);
                }
            });
        }
    });
};

/**
 * Update an project
 */
exports.update = function (req, res) {
    var project = req.project;
    var storage,
    upload;
    storage = setStorage();
    console.log('Project Body', req.body);
    upload = multer({ storage: storage }).single('logo');

    upload(req, res, function(err) {
        var fileUrl;
        console.log('File: ', req.file);
        console.log('Parameters(req.body):', req.body);
        var filteredParams = projectParams(req.body);

        for (var key in filteredParams) {
            if (filteredParams.hasOwnProperty(key))
                project[key] = filteredParams[key];
        }
        if (filteredParams.estimatedEndDate === 'null') {
            project.set('estimatedEndDate', null);
        }
        // var filteredParams = _.merge(project, projectParams(req.body));
        fileUrl = getFileUrl(req.file);
        if (fileUrl) {
            if (project.logo) {
                deleteImage(project.logo, res, function(err, data) {
                    if (err) {
                        console.log('Error Occured : ', err);
                        return res.status(400).send({
                            message: errorHandler.getErrorMessage(err)
                        });
                    }
                });
            }
            project.logo = fileUrl;
        }
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        }
        // console.log(req.file);
        project.save(function (err) {
            if (err) {
                return res.status(400).send({
                    message: errorHandler.getErrorMessage(err)
                });
            } else {
                console.log('updated project: ', project);
                res.json(project);
            }
        });
    });
};

/**
 * Delete a project
 */
exports.delete = function (req, res) {
    var project = req.project;
    Survey.find({ project: project._id }).exec(function (err, surveys) {
        surveys.forEach(function(jsonsurveys) {
            jsonsurveys.questions.forEach(function(quesIds) {
                /* Find each question under survey and delete with images from s3 */
                Question.findOne({ _id: quesIds }).exec(function (err, quesdata) {
                    if (quesdata !== null) {
                        var quesdatajs = JSON.parse(JSON.stringify(quesdata));
                        async.each(quesdatajs.mediaFiles, function(file, callback) {
                            if (file.url) {
                            uploader.delete(file.url, function(err, deleteResponse) {
                               callback(err, deleteResponse);
                            });
                            } else {
                               callback();
                            }
                        }, function(err) {
                            // done(err);
                        });
                        quesdata.remove();
                    }
                });
            });
            /* Delete each survey under the project */
            Survey.findByIdAndRemove({ _id: jsonsurveys._id }).exec(function (err, res) {
                if (err) {
                    return res.status(400).send({
                        message: errorHandler.getErrorMessage(err)
                    });
                }
            });

            Present.find({ survey: jsonsurveys._id }).remove().exec(function (err, response) {
                if (err) {
                    console.log('Error when deleting storyboards of survey!');
                }
            });

            LogicJump.find({ survey: jsonsurveys._id }).remove().exec(function (err, response) {
                if (err) {
                    console.log('Error when deleting LogicJumps of survey!');
                }
            });

        });
    });
    /** Delete the project */
    project.remove(function (err, p) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            if (project.logo) {
                deleteImage(project.logo, res, function(err, data) {
                    if (err) {
                        console.log('Error Occured : ', err);
                        return res.status(400).send({
                            message: errorHandler.getErrorMessage(err)
                        });
                    }
                });
            }
            console.log('Project deleted successfully');
            res.json(p);
        }
    });
};
