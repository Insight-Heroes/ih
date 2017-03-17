(function () {
    'use strict';

    angular
        .module('questions')
        .factory('QuestionValidation', QuestionValidation);

    QuestionValidation.$inject = ['toastr'];

    function QuestionValidation(toastr) {
        return {
            isValid: isValid
        };
        /**
         * Check if Question is valid or not
         * @return {Boolean} return true if question is valid otherwise false
         */
        function isValid(question, files) {
            var valid;
            switch (question.questionType) {
                case 'multiChoice':
                    valid = validateChoices(question);
                break;

                case 'rankOrder':
                    valid = validateChoices(question);
                break;

                case 'slider':
                    valid = validateChoices(question);
                break;

                case 'dropdown':
                    valid = validateChoices(question);
                break;

                case 'matrix':
                    valid = validateMatrix(question);
                break;

                case 'pairing':
                    valid = validatePairing(question);
                break;

                case 'imageChoice':
                    valid = validateImagechoice(files);
                break;

                case 'media':
                    valid = validateMedia(question, files);
                break;

                default:
                    valid = true;
            }
            return valid;
        }

        /**
         * Check if pairing question is valid or not
         * @param  {Object} question Question object
         * @return {Boolean} Returns true if question is valid otherwise false
         */
        function validatePairing(question) {
            var valid = true;

            var leftChoices = _.map(_.map(question.leftChoices, 'text'), lowercase);
            if (_.uniq(leftChoices).length !== leftChoices.length) {
                toastr.error('Left side choices are not unique. Choices must be unique');
                valid = false;
            }

            var rightChoices = _.map(_.map(question.rightChoices, 'text'), lowercase);
            if (_.uniq(rightChoices).length !== rightChoices.length) {
                toastr.error('Right side choices are not unique. Choices must be unique');
                valid = false;
            }

            if (_.intersection(rightChoices, leftChoices).length > 0) {
                toastr.error('Left and right choices must be unique');
                valid = false;
            }

            return valid;
        }

        /**
         * Check is MultiChoice question is valid or not
         * @param  {Object} question Question object
         * @return {Boolean}  Returns true if question is valid otherwise false
         */
        function validateChoices(question) {
            var choices = _.map(_.map(question.choices, 'text'), lowercase);
            if (_.uniq(choices).length !== choices.length) {
                switch (question.questionType) {
                    case 'multiChoice':
                        toastr.error('Choices must be unique');
                    break;

                    case 'dropdown':
                        toastr.error('Dropdown options must be unique');
                    break;

                    case 'rankOrder':
                        toastr.error('Entries must be unique');
                    break;

                    case 'slider':
                        toastr.error('Slider labels must be unique');
                    break;
                }
                return false;
            }
            return true;
        }

        /**
         * Check if Matrix question is valid or not
         * @param  {Object} question Question object
         * @return {Boolean}  Returns true if question is valid otherwise false
         */
        function validateMatrix(question) {
            var rows = _.map(_.map(question.rows, 'text'), lowercase);
            if (_.uniq(rows).length !== rows.length) {
                toastr.error('Matrix rows must contain unique texts');
                return false;
            }
            var cols = _.map(_.map(question.columns, 'text'), lowercase);
            if (_.uniq(cols).length !== cols.length) {
                toastr.error('Matrix columns must contain unique texts');
                return false;
            }
            if (_.intersection(rows, cols).length > 0) {
                toastr.error('Matrix rows & columns must contain unique texts');
                return false;
            }
            return true;
        }

        /**
         * Validate if we have atleast two images uploaded by user
         * @param  {Array} files - list of files
         * @return {[type]}       [description]
         */
        function validateImagechoice(files) {
          var duplicateimage = [];
          files.forEach(function (f) {
            duplicateimage.push(
              f.name
            );
          });
          if (duplicateimage.hasDuplicates()) {
              toastr.error('Please upload unique images');
              return false;
          }

            var valid = true,
                images = 0;
            files.forEach(function(f) {
                if ((f.file && f.file !== '') || f.url) {
                    images += 1;
                }
            });
            if (images < 2) {
                toastr.error('Please upload atleast two images');
                return false;
            }
            return true;
        }

        /**
         * Validate if we have atleast one file uploaded by user
         * @param  {Array} files - list of files
         */
        function validateMedia(question, files) {

            if (question.switchType === 'link') {
                /**
                * validate youtube or vimeo url
                */
                var url = '';
                if (question.videoUrl)
                url = question.videoUrl;
                var retVal = {};
                var matches;
                var base = 'v';

                if (url.indexOf('https://www.youtube.com/watch') !== -1) {
                    retVal.provider = 'youtube';
                    var re = new RegExp('(\\?|&)' + base + '\\=([^&]*)(&|$)');
                    matches = url.match(re);
                    if (matches)
                        retVal.id = matches[2];
                    else
                        retVal.id = '';
                } else if (url.indexOf('https://youtu.be') !== -1) {
                    retVal.provider = 'youtube';
                    matches = url.match(/youtu.be\/([^&]*)(&|$)/);
                    if (matches)
                        retVal.id = matches[1];
                    else
                        retVal.id = '';
                } else if (url.indexOf('https://vimeo.com/') !== -1) {
                    retVal.provider = 'vimeo';
                    matches = url.match(/vimeo.com\/(\d+)/);
                    if (matches)
                        retVal.id = matches[1];
                    else
                        retVal.id = '';
                }
                if ((retVal.provider === 'youtube' || retVal.provider === 'vimeo') && retVal.id !== '')
                return true;
                else {
                    toastr.error('Please enter valid video url');
                    return false;
                }
            } else {
                /**
                * validate media files
                */
                var valid = true,
                    images = 0;
                files.forEach(function(f) {
                    if (f.name && f.name !== '') {
                        images += 1;
                    }
                });
                if (images < 1) {
                    toastr.error('Please upload atleast one media file');
                    return false;
                }
                return true;
            }
        }

        /**
         * Change case of string to lowercase
         * @param  {String} str String whose case needs to be lowered
         * @return {String}   Lowercased version of str
         */
        function lowercase(str) {
            return (str + '').toLowerCase();
        }
    }
}());
