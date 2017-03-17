'use strict';
var shortid = require('shortid');
var aws = require('aws-sdk');
var crypto = require('crypto');
var moment = require('moment');
var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var chalk = require('chalk');

var AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID;
var AWS_SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY;
var AWS_REGION = process.env.AWS_REGION;
var S3_BUCKET = process.env.AWS_S3_BUCKET;

aws.config.update({ accessKeyId: AWS_ACCESS_KEY, secretAccessKey: AWS_SECRET_KEY, region: AWS_REGION });

/**
 * Generate S3 policy
 * @param  {String} fileName Generated file name
 * @return {Object}          S3 policy for uploading file to S3 directly
 * from user browser
 * @return example object
 *
 * {
 *   policy: base64EncodedPolicy,
 *   signature: base64EncodedSignature,
 *   accessKey: AWS_ACCESS_KEY,
 *   fileName: fileName,
 *   url: 'https://' + S3_BUCKET + '.s3.amazonaws.com/' + fileName,
 *   uploadUrl: 'https://' + S3_BUCKET + '.s3.amazonaws.com/',
 *   region: AWS_REGION
  };
 */
var getS3PolicyAndCreds = function(fileName, modelPrefix) {
  var s3Policy = {
    'conditions': [
      { 'bucket': S3_BUCKET },
      ['starts-with', '$key', modelPrefix],
      { 'acl': 'public-read' },
      ['content-length-range', 0, 52428800],    // Allow upload upto 50mb
      ['starts-with', '$Content-Type', '']
    ],
    'expiration': moment.utc().add(60, 'minutes').format('YYYY-MM-DDTHH:MM:ss\\Z')
  };
  var encodedPolicy = new Buffer(JSON.stringify(s3Policy)).toString('base64');
  var credentials = {
    policy: encodedPolicy,
    signature: crypto.createHmac('sha1', AWS_SECRET_KEY).update(encodedPolicy).digest('base64'),
    accessKey: AWS_ACCESS_KEY,
    fileName: fileName,
    url: 'https://' + S3_BUCKET + '.s3.amazonaws.com/' + fileName,
    uploadUrl: 'https://' + S3_BUCKET + '.s3.amazonaws.com/',
    region: AWS_REGION
  };
  return credentials;
};

/**
 * Function to upload a file on the local server
 * or s3 server based on url local environment
 */
var getAwsSignedData = function (modelObject, modelId, modelPrefix, originalFileName, callback) {
  var ext = originalFileName.split('.').pop();
  var fileName = modelPrefix + modelId + '-' + shortid.generate() + '.' + ext.toLowerCase();
  var s3Policy = getS3PolicyAndCreds(fileName, modelPrefix);
  callback(null, s3Policy);
};

/**
 * @param  {String} base64String  Base64 encoded image file
 * @return example array
 *
 * [wallpaper.jpg, jpg, base64String]
*/
var getFileNameExtAndBase64 = function(base64String) {
  var base64WithName = base64String.split('_SEPARATOR_');
  var name = base64WithName[0];
  var ext = _.last(name.split('.'));
  return [name, ext, base64WithName[1]];
};

/**
 * Saves file locally and returns the local URL of file
 * @param  {String} base64File  Base64 encoded image file
 * @param  {String} modelPrefix File name prefix
 * @param  {Object} modelObject Model Object
 * @param  {Object} response File name prefix
 */
var saveFileLocally = function(base64String, filePrefix, modelObject, response, callback) {
  if (base64String) {
    var nameExtBase64 = getFileNameExtAndBase64(base64String);
    response.name = nameExtBase64[0];
    var fileName = filePrefix + '-' + shortid.generate() + '.' + nameExtBase64[1];
    console.log(chalk.red(nameExtBase64[0], nameExtBase64[2].substring(0, 100)));
    var imageBuffer = new Buffer(nameExtBase64[2], 'base64');
    var filePath = path.join(process.cwd(), 'public', 'uploads', fileName);
    fs.writeFile(filePath, imageBuffer, function(err) {
      if (!err) {
        response.url = '/uploads/' + fileName;
      }
      callback(err, response);
    });
  } else {
    callback(null, response);
  }
};

/**
 * [upload description]
 * @param  {String}   modelPrefix File Prefix name
 * @param  {Object}   modelObject Mongoose Model Object / JS object
 * which holds file url
 * @param  {String}   modelId     Record ID
 * @param  {String}   paramsFile  Development env - Base64 encoded file object
 * Non Development Environment - File name to be uploaded on S3
 * @param  {Function} callback    Callback fuction which needs to be called
 * after upload completes.
 *
 * function call example
 * upload('user-company-logo', user.company, user._id, 'logo', 'tmpLogo', req.body.companyLogo, done)
 * upload('user', user, user._id, 'profileImage', 'tmpProfileImage', req.body.profileImage, done)
 */
exports.upload = function(modelPrefix, modelObject, modelId, paramsFile, callback) {
  var response = {
    s3Policy: null,
    modelObject: modelObject,
    url: undefined
  };
  if (process.env.NODE_ENV === 'development') {
    var filePrefix = modelPrefix + modelId;
    saveFileLocally(paramsFile, filePrefix, modelObject, response, callback);
  } else {
    if (paramsFile) {
      getAwsSignedData(modelObject, modelId, modelPrefix, paramsFile, function(err, data) {
        if (err) {
          callback(err);
        } else {
          var response = {
            s3Policy: data,
            modelObject: modelObject,
            url: data.url,
            name: paramsFile
          };
          callback(null, response);
        }
      });
    } else {
      callback(null, response);
    }
  }
};

/**
 * Delete file from locally or from AWS S3 based on NODE env
 * @param  {[type]}   url      [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
exports.delete = function(url, callback) {
  if (process.env.NODE_ENV === 'development') {
    var filePath = path.join(process.cwd(), 'public', url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    callback();
  } else {
    var bucketInstance = new aws.S3();
    var params = {
      Bucket: S3_BUCKET,
      Key: _.last(url.split('/'))
    };
    console.log('Params: ', params);
    bucketInstance.deleteObject(params, function (err, data) {
      callback(err, data);
    });
  }
};

/**
 * Returns the maximum file size which can be uploaded to system
 * @return {Object} Object with file size limits
 */
exports.maxFileSize = function() {
  return {
    image: 2097152, // 2MB
    audio: 20971520, // 20MB
    video: 52428800 // 50MB
  };
};


exports.uploadBase64 = function(base64String, modelPrefix, modelObject, callback) {
  var response = {
    modelObject: modelObject,
    url: undefined
  };
  if (process.env.NODE_ENV === 'development') {
    var filePrefix = modelPrefix + modelObject._id;
    saveFileLocally(base64String, filePrefix, modelObject, response, callback);
  } else {
    if (base64String) {
      var fileNameExtBase64 = getFileNameExtAndBase64(base64String);
      response.name = fileNameExtBase64[0];
      var fileName = modelPrefix + modelObject._id + '-' + shortid.generate() + '.' + fileNameExtBase64[1].toLowerCase();
      var fileBuffer = new Buffer(fileNameExtBase64[2], 'base64');
      var fileParams = {
        Key: fileName,
        Body: fileBuffer,
        ContentEncoding: 'base64',
        ContentType: 'image/' + fileNameExtBase64[1],
        ACL: 'public-read'
      };
      var bucketInstance = new aws.S3({ params: { Bucket: S3_BUCKET } });
      bucketInstance.putObject(fileParams, function(err, data) {
        if (err) {
          console.log(err);
          console.log('Error uploading data: ', data);
          callback(err);
        } else {
          response.url = 'https://' + S3_BUCKET + '.s3.amazonaws.com/' + fileName;
          console.log('Succesfully uploaded the image!', data);
          callback(null, response);
        }
      });
    } else {
      callback(null, response);
    }
  }
};
