(function () {
  'use strict';

  // Create the image handling wrapper service
  angular
    .module('core')
    .factory('FileHelper', FileHelper);

  FileHelper.$inject = ['Upload', '$window', '$q', '$http', 'toastr'];

  function FileHelper(Upload, $window, $q, $http, toastr) {
    var service = {
        getData: getData,
        uploadToS3: uploadToS3
    };

    return service;

    function convertToBase64(file) {
        var reader = new FileReader();
        reader.onloadend = function() {
            return (reader.result);
        };
        return reader.readAsDataURL(file);
    }

    /**
     * Get data of image based on app environment
     * for development, return base64 encoded data of image
     * for production, just return true to create aws token in express server
     * @param  {Object} fileObj File selector object
     */
    function getData(fileObj, base64Compulsary) {
        return $q(function(resolve, reject) {
            if (!fileObj || fileObj === '') {
                return resolve(undefined);
            }
            if ($window.env === 'development' || base64Compulsary) {
                Upload.base64DataUrl(fileObj)
                    .then(function(base64Data) {
                        var matches = base64Data.match(/^data:([A-Za-z0-9-+\/]+);base64,(.+)$/),
                            base64;
                        if (!matches) {
                            base64 = fileObj.name + '_SEPARATOR_' + base64Data;
                        } else {
                            base64 = fileObj.name + '_SEPARATOR_' + matches[2];
                        }
                        console.log('Base64 Encoded File:', base64.substring(0, 100));
                        resolve(base64);
                    });
            } else {
                resolve(fileObj.name);
            }
        });
    }

    /**
     * Upload file to S3 server
     * @param  {Object}          data       Data contains S3 policy, callback URL,
     *                                      fileName, access key
     * @param  {FileObject}      file       File to be uploaded to S3
     * @param  {PromiseObject}   promise    Promise which will be resolved
     *                                      when upload process completes
     * @param  {Object}          options
     * @return {Promise} Promise which will be resolved after upload completes
     */
    function uploadToS3(data, file, promise, resolveAlways) {
        Upload.upload({
            url: data.uploadUrl, // S3 upload url including bucket name
            method: 'POST',
            data: {
                key: data.fileName, // the key to store the file on S3, could be file name or customized
                AWSAccessKeyId: data.accessKey,
                acl: 'public-read', // sets the access to the uploaded file in the bucket: private, public-read, ...
                policy: data.policy, // base64-encoded json policy (see article below)
                signature: data.signature, // base64-encoded signature based on policy string (see article below)
                'Content-Type': file.type !== '' ? file.type : 'application/octet-stream', // content type of the file (NotEmpty)
                file: file,
                region: data.region
            }
        }).progress(function(event) {
            console.log(parseInt(100.0 * (event.loaded / event.total), 10));
        })
        .success(function(response, status, headers, config) {
            // toastr.info(imgType + ' uploaded successfully');
            if (data.callbackURL) {
                data.callbackData.upload = true;
                s3ServerCallback(data, promise);
            } else {
                promise.resolve({ url: data.url, status: true });
            }
        })
        .error(function(errors, status, headers, config) {
            console.error('S3 Error Callback: ', errors, status, headers, config);
            if (data.imageName) {
                toastr.error(data.imageName + 'could not be uploaded');
            }
            if (data.callbackURL) {
                data.callbackData.upload = false;
                s3ServerCallback(data, promise);
            } else {
                if (resolveAlways)
                    promise.resolve({ url: data.url, status: false });
                else
                    promise.reject();
            }
        });
        return promise.promise;
    }

    /**
     * Notify insight heroes server about S3 file upload
     */
    function s3ServerCallback(data, promise) {
        $http.put(data.callbackURL, data.callbackData).success(function (res) {
            promise.resolve();
        }).error(function() {
            promise.reject();
        });
    }

  }
}());
