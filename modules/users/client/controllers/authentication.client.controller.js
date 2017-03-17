(function () {
  'use strict';

  angular
    .module('userAuth')
    .controller('AuthenticationController', AuthenticationController);

  AuthenticationController.$inject = ['$scope', '$state', '$http', '$location', '$window', 'Authentication', 'PasswordValidator', 'toastr', 'Upload', 'FileHelper', '$q', '$timeout'];

  function AuthenticationController($scope, $state, $http, $location, $window, Authentication, PasswordValidator, toastr, Upload, FileHelper, $q, $timeout) {
    var vm = this;

    vm.fileOptions = {
      maxFileSize: 2097152 // 2MB in bytes
    };

    // vm.credentials = {
    //   firstName: 'Kalpesh',
    //   lastName: 'Fulpagare',
    //   mobileNo: '8149149651',
    //   email: 'kalpesh@promobitech.com',
    //   address: 'Pune',
    //   zipcode: '421004',
    //   state: 'Maharashtra',
    //   country: 'India',
    //   passwordConfirmation: '12345678',
    //   company: {
    //     name: 'Promobi',
    //     designation: 'Tech Lead Developer',
    //     numberOfEmployees: 100,
    //     numberOfAnalysts: 50,
    //     website: 'http://google.com',
    //     domain: 'kalpesh',
    //     languages: 'Marathi, Hindi, English',
    //     monthlyRespondents: 200,
    //     currency: 'USD',
    //     skypeID: 'kalpesh.fulpagare'
    //   }
    // };
    vm.authentication = Authentication;
    vm.getPopoverMsg = PasswordValidator.getPopoverMsg;
    vm.validateUserForm = validateUserForm;
    vm.signup = signup;
    vm.goBack = goBack;
    vm.signin = signin;
    vm.callOauthProvider = callOauthProvider;
    vm.activeForm = 'user';
    vm.imagePreview = imagePreview;
    // Get an eventual error defined in the URL query string:
    vm.error = $location.search().err;
    // If user is signed in then redirect back dashboard
    if (vm.authentication.user) {
      $location.path('/dashboard');
    }

    function imagePreview($file, $invalidFile, modelKey) {
      /**
       * Check if File size if correct and file type is correct
       */
      if ($invalidFile && $invalidFile.$error === 'maxSize') {
        vm[modelKey] = undefined;
        toastr.error('File size error: Maximum file allowed to upload is 2MB');
        return;
      }

      if ($invalidFile && $invalidFile.$error === 'pattern') {
        vm[modelKey] = undefined;
        toastr.error('File type error: Only image file is allowed to upload');
        return;
      }

      Upload.dataUrl($file, false)
        .then(function (url) {
          vm[modelKey] = url;
        });
    }

    /**
     * Generate object for passing in api
     *
     */
    function generateFormData() {
      return $q.all([FileHelper.getData(vm.profileImage), FileHelper.getData(vm.companyLogo)]);
    }

    function validateUserForm(formValid) {
      if (!formValid) {
        $scope.$broadcast('show-form-errors');
        return false;
      }
      $scope.$broadcast('reset-form-errors');
      vm.activeForm = 'company';
    }


    /** Go-Back
     *
     * @param $scope
     */
    function goBack() {

      if (vm.activeForm !== 'user') {
        vm.activeForm = 'user';
      }
    }

    /**
     * Sign up user
     * @param  {Boolean} isValid Variable which maintains information
     * about form valid
     */
    function signup(isValid) {
      vm.error = null;
      if (!isValid) {
        $scope.$broadcast('show-form-errors');
        return false;
      }
      var params = {};
      angular.copy(vm.credentials, params);
      generateFormData()
        .then(function(data) {
          params.profileImage = data[0];
          params.companyLogo = data[1];
          $http.post('/api/auth/signup', params).success(function (response) {
            signupSuccessCb(response);
          }).error(function(errorResponse) {
            toastr.error(errorResponse.message);
          });
        })
        .catch(function(e) {
          console.error('Promise Error', e);
        });
    }

    function signupSuccessCb(response) {
      if ($window.env === 'development') {
        signupSuccessful();
      } else {
        s3UploadStep1(response);
      }
    }

    function s3UploadStep1(response) {
      var pictureInfo = {
        profileImage: {
          policyName: 'profileImageS3Policy',
          callbackAction: '/company_logo_s3_callback',
          fileKey: 'profileImage'
        },
        companyLogo: {
          policyName: 'companyLogoS3Policy',
          callbackAction: '/avatar_s3_callback',
          fileKey: 'companyLogo'
        }
      };
      $q.all([s3UploadStep2(response, pictureInfo.profileImage), s3UploadStep2(response, pictureInfo.companyLogo)]).then(function success(data) {
        signupSuccessful();
      }, function error(error) {
        signupPictureUploadFailure();
      });
    }

    function s3UploadStep2(response, data) {
      var defer = $q.defer();
      if (response[data.policyName]) {
        var cbData = response[data.policyName];
        cbData.callbackURL = '/api/auth/signup/' + response._id + data.callbackAction;
        cbData.imageName = (data.callbackAction === 'avatar_s3_callback') ? 'Profile image' : 'company Logo';
        cbData.callbackData = {};
        FileHelper.uploadToS3(cbData, vm[data.fileKey], defer);
      } else {
        defer.resolve();
      }
      return defer.promise;
    }

    function signupSuccessful() {
      toastr.success('Account created successfully');
      $state.go('confirmationEmail.confirmed');
    }

    function signupPictureUploadFailure() {
      toastr.warning('Your Account details are saved successfully. We could not upload picture(s). You will receive account confirmation mail with Password shortly.');
      $state.go('home');
    }

    function signin(isValid) {
      vm.error = null;

      if (!isValid) {
        $scope.$broadcast('show-form-errors');
        return false;
      }

      $http.post('/api/auth/signin', vm.credentials).success(function (response) {
        // If successful we assign the response to the global user model
        vm.authentication.user = response;

        $('body').addClass('role-' + response.roles);

        /* var targetState;
        // And redirect to the previous or home page
        if ($state.previous.state.name !== 'home') {
          targetState = $state.previous.state.name || 'dashboard';
        } else {
          targetState = 'dashboard';
        }*/
        $state.go('dashboard');
      }).error(function (response) {
        toastr.error(response.message);
      });
    }


    function hidePersonal() {
      vm.hides = true;
      vm.hide = false;
    }
    // OAuth provider request
    function callOauthProvider(url) {
      if ($state.previous && $state.previous.href) {
        url += '?redirect_to=' + encodeURIComponent($state.previous.href);
      }

      // Effectively call OAuth authentication route:
      $window.location.href = url;
    }
  }
}());
