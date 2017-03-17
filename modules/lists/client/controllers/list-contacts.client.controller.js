(function () {
    'use strict';

    // Lists controller
    angular
        .module('lists')
        .controller('ListContactsController', ListContactsController);

    ListContactsController.$inject = ['$scope', '$state', '$window', 'Authentication', 'listResolve', 'Survey', '$stateParams', 'ErrorHandler', 'toastr', 'ListsService', '$timeout'];

    function ListContactsController ($scope, $state, $window, Authentication, list, Survey, $stateParams, ErrorHandler, toastr, ListsService, $timeout) {
        var vm = this;

        // View model bindings
        vm.authentication = Authentication;
        vm.list = list;
        vm.hidePublish = true;
        // View variable bindings
        vm.activeState = 'upload-csv'; // map-csv-columns

        vm.csvFile = null;
        vm.defaultHeaders = [];
        vm.newColumn = false;
        vm.csv = {
            headers: [],
            lines: [],
            // lines: [
            //     ["Kalpesh", " Fulpagare", " kalpesh@promobitech.com", " Tech Lead"],
            //     ["Sibu", " Stephen", " sibu@promobitech.com", " UI Developer"],
            //     ["Prasenjit", " Das", " prasenjit@promobitech.com", " UX Developer"],
            //     ["Parag", " Dulam", " parag@promobitech.com", " iOS Developer"]
            // ],
            activeColumn: 0,
            file: null,
            indices: {
                email: null,
                firstName: null,
                lastName: null
            }
        };

        vm.defaultRespondentTypes = $window.dataCollectionTypes;
        vm.respondentType = 'email';

        // View function bindings
        vm.fileDragged = fileDragged;
        vm.goToCSVUpload = goToCSVUpload;
        vm.goToColumnSelection = goToColumnSelection;
        vm.editCSVColumn = editCSVColumn;
        vm.headerChoiceUpdate = headerChoiceUpdate;
        vm.saveColumn = saveColumn;
        vm.skipColumn = skipColumn;
        vm.contactsHeadersProcessed = contactsHeadersProcessed;
        vm.saveContacts = saveContacts;
        vm.listPage = true;

        // Fetch Survey
        Survey.get({ id: $stateParams.surveyId }, function success(survey) {
            vm.survey = survey;
        }, function error(err) {
            $state.go('dashboard');
            ErrorHandler.error(err);
        });

        function fileDragged(files, file, newFiles, duplicateFiles, invalidFiles, event) {
            if (file) {
                vm.csvFile = file;
                readFile(file);
            }
        }

        /**
         * Callback function which reads the CSV file
         * extracts the headers and csv data
         * @param  {Object} f - File object
         */
        function readFile(f) {
            var reader = new FileReader();

            reader.onload = function(e) {
                    vm.csv.lines = [];
                    // Print the contents of the file
                    var text = e.target.result;

                    var lines = text.split(/[\r\n]+/g); // tolerate both Windows and Unix linebreaks

                    if (lines.length > 0) {
                        var headerRow = lines[0].split(',');
                        if (rowContainsRecord(headerRow)) {
                            vm.csv.headers = headerRow;
                        }
                        for (var i = 1; i < lines.length; i++) {
                            var row = lines[i].split(',');
                            if (row.length > 0 && rowContainsRecord(row)) {
                                vm.csv.lines.push(row);
                            }
                        }
                    }

                    /**
                     * Function to check if CSV row contains a record
                     * @param  {Array} r Row of a CSV
                     */
                    function rowContainsRecord(r) {
                        var recordExist = true;
                        if (r.join('').replace(/ /g, '') === '') {
                            recordExist = false;
                        }
                        return recordExist;
                    }
            };

            reader.readAsText(f, 'UTF-8');
        }
        /**
         * Go back to page where CSV can be uploaded again
         */
        function goToCSVUpload() {
            vm.activeState = 'upload-csv';
            vm.csv = {
                headers: [],
                lines: [],
                activeColumn: 0,
                file: null,
                indices: {
                    email: null,
                    firstName: null,
                    lastName: null
                }
            };
        }

        /**
         * Show page for column selection of CSV file
         */
        function goToColumnSelection() {
            console.log(vm.csv.file);
            if (!vm.csv.file) {
                toastr.error('Please upload a CSV file to continue');
                return;
            }
            console.log(vm.csv.lines);
            if (vm.csv.headers.length === 0) {
                toastr.error('Error: CSV headers missing');
                return;
            }
            if (vm.csv.lines === 0) {
                toastr.error('Error: CSV file recordsis empty');
                return;
            } else {
                mapCSVHeadersToListHeaders();
                vm.activeState = 'map-csv-columns';
            }
        }

        /**
         * Detect CSV headers and map to list headers
         */
        function mapCSVHeadersToListHeaders() {
            vm.defaultHeaders = [];
            for (var i = 0; i < vm.csv.headers.length; i++) {
                vm.defaultHeaders.push(0);
            }
            angular.forEach(vm.csv.headers, function(h, index) {
                if (isEmailField(h)) {
                    vm.defaultHeaders[index] = 'email';
                }
                if (isFirstNameField(h)) {
                    vm.defaultHeaders[index] = 'firstname';
                }
                if (isLastNameField(h)) {
                    vm.defaultHeaders[index] = 'lastname';
                }
                setExistingFieldMatch(h, index);
            });

            function isEmailField(header) {
                var trimmed = _.chain(header).toLower().trim().replace(/ /g, '').value();
                return _.includes(['email', 'emailid', 'emailaddress'], trimmed);
            }

            function isFirstNameField(header) {
                var trimmed = _.chain(header).toLower().trim().replace(/ /g, '').value();
                return (trimmed === 'firstname');
            }

            function isLastNameField(header) {
                var trimmed = _.chain(header).toLower().trim().replace(/ /g, '').value();
                return (trimmed === 'lastname');
            }

            function setExistingFieldMatch(header, index) {
                var trimmed = _.chain(header).toLower().trim().replace(/ /g, '').value();
                if (_.includes(_.keys(vm.list.contactHeaders), trimmed)) {
                    vm.defaultHeaders[index] = trimmed;
                }
            }
            console.log(vm.defaultHeaders);
        }

        /**
         * Edit the column grid(header) of CSV records
         * @param  {Integer} index index of column which needs to be edited
         */
        function editCSVColumn(index) {
            vm.csv.activeColumn = index;
        }

        /**
         * ng change function when header select list changes
         */
        function headerChoiceUpdate() {
            if (vm.defaultHeaders[vm.csv.activeColumn] === 'NEW_COLUMN') {
                vm.newColumn = true;
                vm.defaultHeaders[vm.csv.activeColumn] = '';
            }
        }

        /**
         * Save a column & move ahead
         */
        function saveColumn() {
            if (vm.newColumn) {
                if (vm.defaultHeaders[vm.csv.activeColumn] === '') {
                    toastr.error('Please enter new column name');
                    return;
                } else {
                    var headerText = vm.defaultHeaders[vm.csv.activeColumn],
                        slug = _.chain(headerText).toLower().trim().replace(/ /g, '').value();
                    if (_.includes(_.keys(vm.list.contactHeaders), slug)) {
                        toastr.error('Column name already exists');
                    }
                    vm.list.contactHeaders[slug] = headerText;
                    vm.defaultHeaders[vm.csv.activeColumn] = slug;
                    moveNext();
                }
            } else {
                if (!vm.defaultHeaders[vm.csv.activeColumn] || (vm.defaultHeaders[vm.csv.activeColumn] === '')) {
                    toastr.error('Please select a column name');
                    return;
                } else {
                    moveNext();
                }
            }
            console.log('vm.defaultHeaders', vm.defaultHeaders);
            console.log('vm.list.contactHeaders', vm.list.contactHeaders);
        }

        /**
         * Skip a column & move ahead
         */
        function skipColumn(index) {
            vm.defaultHeaders[index] = -1;
            if (index === vm.csv.activeColumn) {
                moveNext();
            }
        }

        /**
         * Move to next column in CSV column mapping - column selection
         */
        function moveNext() {
            vm.newColumn = false;
            vm.csv.activeColumn = vm.csv.activeColumn + 1;
            console.log('vm.defaultHeaders', vm.defaultHeaders);
            console.log('vm.list.contactHeaders', vm.list.contactHeaders);
        }

        /**
         * Return true if contacts headers processed by end user
         * otherwise false
         * @return {Boolean} Return true if contact headers are processed
         */
        function contactsHeadersProcessed() {
            return !_.includes(vm.defaultHeaders, 0);
        }

        /**
         * Save contacts for a list
         */
        function saveContacts() {
            // Check if any column is unmatched and not matched by user
            if (_.includes(vm.defaultHeaders, 0)) {
                toastr.error('Please save unmatched column or skip them using edit.');
                return;
            }

            // Check if there is any column is selected twice
            if (_.filter(vm.defaultHeaders, function(n) { return (n !== -1); }).hasDuplicates()) {
                toastr.error('Column name must be unique');
                return;
            }
            // Check whether email column is present or not
            if (_.indexOf(vm.defaultHeaders, 'email') === -1) {
                toastr.error('Email column must be present to save the contact');
                return;
            }

            // Get new headers which we have added now
            var newHeaders = {};
            vm.defaultHeaders.forEach(function(h) {
                if (!_.includes(['firstname', 'lastname', 'email', -1], h)) {
                    newHeaders[h] = vm.list.contactHeaders[h];
                }
            });

            var contacts = [];
            vm.csv.lines.forEach(function(l) {
                var lineData = {};
                l.forEach(function(columnName, i) {
                    if (vm.defaultHeaders[i] !== -1) {
                        lineData[vm.defaultHeaders[i]] = _.trim(columnName);
                    }
                });
                contacts.push(lineData);
            });
            console.log('New headers: ', newHeaders);
            console.log('contacts: ', contacts);
            ListsService.addContacts({ headers: newHeaders, contacts: contacts, respondentType: vm.respondentType, id: vm.list._id },
                 function success() {
                    $state.go('lists.list', { listId: vm.list._id, surveyId: vm.survey._id });
                    toastr.success('Contacts saved successfully');
                 },
                 function error(err) {
                    ErrorHandler.error(err);
                 });
        }
    }
}());
