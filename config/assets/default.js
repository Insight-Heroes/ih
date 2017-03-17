'use strict';

/* eslint comma-dangle:[0, "only-multiline"] */

module.exports = {
  client: {
    lib: {
      css: [
        // bower:css
        'public/lib/angular-material/angular-material.css',
        'public/lib/bootstrap/dist/css/bootstrap.css',
        'public/lib/bootstrap/dist/css/bootstrap-theme.css',
        'public/lib/angular-loading-bar/build/loading-bar.css',
        'public/lib/angular-toastr/dist/angular-toastr.css',
        'public/lib/ng-sortable/dist/ng-sortable.css',
        'public/lib/angularjs-slider/dist/rzslider.css',
        'public/lib/angular-bootstrap-colorpicker/css/colorpicker.css',
        'public/lib/medium-editor/dist/css/medium-editor.css',
        'public/lib/medium-editor/dist/css/themes/default.css',
        // endbower
      ],
      js: [
        // bower:js
        'public/lib/angular/angular.js',
        'public/lib/angular-animate/angular-animate.js',
        'public/lib/angular-bootstrap/ui-bootstrap-tpls.js',
        'public/lib/angular-aria/angular-aria.js',
        'public/lib/angular-messages/angular-messages.js',
        'public/lib/angular-material/angular-material.js',
        'public/lib/angular-mocks/angular-mocks.js',
        'public/lib/angular-resource/angular-resource.js',
        'public/lib/angular-ui-router/release/angular-ui-router.js',
        'public/lib/ng-file-upload/ng-file-upload.js',
        'public/lib/owasp-password-strength-test/owasp-password-strength-test.js',
        'public/lib/angular-loading-bar/build/loading-bar.js',
        'public/lib/angular-toastr/dist/angular-toastr.tpls.js',
        'public/lib/ng-sortable/dist/ng-sortable.js',
        'public/lib/angularjs-slider/dist/rzslider.js',
        'public/lib/angular-sanitize/angular-sanitize.js',
        'public/lib/angular-bootstrap-colorpicker/js/bootstrap-colorpicker-module.js',
        'public/lib/medium-editor/dist/js/medium-editor.js',
        'public/lib/angular-medium-editor/dist/angular-medium-editor.js',
        'public/lib/clipboard/dist/clipboard.js',
        'public/lib/ngclipboard/dist/ngclipboard.js',
        'public/lib/moment/moment.js',
        'public/lib/oclazyload/dist/ocLazyLoad.js',
        // endbower
      ],
      tests: ['public/lib/angular-mocks/angular-mocks.js']
    },
    css: [
      'modules/*/client/css/*.css'
    ],
    less: [
      'modules/*/client/less/*.less'
    ],
    sass: [
      'modules/*/client/scss/*.scss'
    ],
    js: [
      'modules/core/client/app/config.js',
      'modules/core/client/app/init.js',
      'modules/*/client/*.js',
      'modules/*/client/**/*.js'
    ],
    customJs: [
      'public/plugins/lodash.min.js',
      'public/plugins/charts.js',
      'public/plugins/angular-charts.js'
    ],
    img: [
      'modules/**/*/img/**/*.jpg',
      'modules/**/*/img/**/*.png',
      'modules/**/*/img/**/*.gif',
      'modules/**/*/img/**/*.svg'
    ],
    views: ['modules/*/client/views/**/*.html'],
    templates: ['build/templates.js']
  },
  server: {
    gruntConfig: ['gruntfile.js'],
    gulpConfig: ['gulpfile.js'],
    allJS: ['server.js', 'config/**/*.js', 'modules/*/server/**/*.js'],
    models: 'modules/*/server/models/**/*.js',
    routes: ['modules/!(core)/server/routes/**/*.js', 'modules/core/server/routes/**/*.js'],
    sockets: 'modules/*/server/sockets/**/*.js',
    config: ['modules/*/server/config/*.js'],
    policies: 'modules/*/server/policies/*.js',
    views: ['modules/*/server/views/*.html']
  }
};
