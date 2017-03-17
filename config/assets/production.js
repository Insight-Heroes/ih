'use strict';

/* eslint comma-dangle:[0, "only-multiline"] */

module.exports = {
  client: {
    lib: {
      css: [
        // bower:css
        'public/lib/angular-material/angular-material.min.css',
        'public/lib/bootstrap/dist/css/bootstrap.min.css',
        'public/lib/bootstrap/dist/css/bootstrap-theme.min.css',
        'public/lib/angular-loading-bar/build/loading-bar.min.css',
        'public/lib/angular-toastr/dist/angular-toastr.min.css',
        'public/lib/ng-sortable/dist/ng-sortable.min.css',
        'public/lib/angularjs-slider/dist/rzslider.min.css',
        'public/lib/angular-bootstrap-colorpicker/css/colorpicker.min.css',
        'public/lib/medium-editor/dist/css/medium-editor.min.css',
        'public/lib/medium-editor/dist/css/themes/default.min.css',
        // endbower
      ],
      js: [
        // bower:js
        'public/lib/angular/angular.min.js',
        'public/lib/angular-animate/angular-animate.min.js',
        'public/lib/angular-bootstrap/ui-bootstrap-tpls.min.js',
        'public/lib/angular-aria/angular-aria.min.js',
        'public/lib/angular-messages/angular-messages.min.js',
        'public/lib/angular-material/angular-material.min.js',
        'public/lib/angular-mocks/angular-mocks.js',
        'public/lib/angular-resource/angular-resource.min.js',
        'public/lib/angular-ui-router/release/angular-ui-router.min.js',
        'public/lib/ng-file-upload/ng-file-upload.min.js',
        'public/lib/owasp-password-strength-test/owasp-password-strength-test.js',
        'public/lib/angular-loading-bar/build/loading-bar.min.js',
        'public/lib/angular-toastr/dist/angular-toastr.tpls.min.js',
        'public/lib/ng-sortable/dist/ng-sortable.min.js',
        'public/lib/angularjs-slider/dist/rzslider.min.js',
        'public/lib/angular-sanitize/angular-sanitize.min.js',
        'public/lib/angular-bootstrap-colorpicker/js/bootstrap-colorpicker-module.min.js',
        'public/lib/medium-editor/dist/js/medium-editor.min.js',
        'public/lib/angular-medium-editor/dist/angular-medium-editor.min.js',
        'public/lib/clipboard/dist/clipboard.min.js',
        'public/lib/ngclipboard/dist/ngclipboard.min.js',
        'public/lib/moment/moment.js'
        // endbower
      ]
    },
    css: 'public/dist/application.min.css',
    js: 'public/dist/application.min.js'
  }
};
