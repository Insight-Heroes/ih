(function() {
    'use strict';

    // Analysis controller
    angular
        .module('analysis')
        .controller('AnalysisController', AnalysisController);

    AnalysisController.$inject = ['$scope', '$state', '$http', '$window', 'Authentication', 'Analysis', '$stateParams', 'ErrorHandler', 'toastr', '$timeout', '$filter'];

    function AnalysisController($scope, $state, $http, $window, Authentication, Analysis, $stateParams, ErrorHandler, toastr, $timeout, $filter) {
        var vm = this;
        // View variable bindings
        vm.authentication = Authentication;
        vm.hidePublish = true;
        vm.inPlaceEditing = false;
        vm.graphMode = null;
        vm.check = false;
        vm.searchBar = searchBar;
        vm.search = true;
        vm.selectedQuestions = [];
        vm.defaultCharts = {
            bar: 'Bar',
            line: 'Line',
            polarArea: 'Polar',
            pie: 'Pie',
            doughnut: 'Doughnut chart',
            horizontalBar: 'Horizontal bar'
        };
        vm.seriesCharts = {
            bar: 'Bar',
            line: 'Line',
            horizontalBar: 'Horizontal bar'
        };
        var graphOptions = {
            scales: {
                xAxes: [{
                    stacked: true,
                    ticks: {
                        beginAtZero: true
                    }
                }],
                yAxes: [{
                    stacked: true,
                    ticks: {
                        beginAtZero: true
                    }
                }]
            },
            legend: { display: false }
        };
    adjustSidebarHeight();
      /*
        Chart Colors
       */
    vm.chartColors = [
                '#0766EF',
                '#FB2355',
                '#71BEF4',
                '#360696',
                '#D0579A',
                '#99092A',
                '#D5A7E6',
                '#FFD86E',
                '#65CACA',
                '#032F98',
                '#18AFC4',
                '#F4E66D',
                '#1BB7B8',
                '#6AF7OD',
                '#FF8AA3',
                '#F75A73',
                '#FEDO9O',
                '#FFC42F',
                '#FF135F',
                '#6FAAFF',
                '#43F165',
                '#FFD86E',
                '#5E65D8',
                '#C78EE1',
                '#658AED',
                '#7B4FB3',
                '#11E9DE'
            ];

        vm.crossTabOptions = {
            scales: {
                xAxes: [{
                    stacked: true,
                    ticks: {
                        beginAtZero: true
                    }
                }],
                yAxes: [{
                    stacked: true,
                    ticks: {
                        beginAtZero: true
                    }
                }]
            },
            legend: { display: true }
        };

        // View function bindings
        vm.toggleQuestionSelection = toggleQuestionSelection;
        vm.saveVariableNames = saveVariableNames;
        vm.cancelVariableRename = cancelVariableRename;
        vm.getTabData = getTabData;
        vm.getCrossTabData = getCrossTabData;
        vm.exportToPresent = exportToPresent;
        vm.switchVariables = switchVariables;

        initGraphObject();

        Analysis.getQuestionList($stateParams.id)
            .then(function success(response) {
                vm.survey = response.data.survey;
                vm.questions = response.data.questions;
                vm.questions.forEach(function(q) {
                    if (!q.varName) {
                        q.varName = $filter('limitTo')($filter('removetags')(q.title), 100, 0);
                    }
                });
            }, function error(error) {
                ErrorHandler.error(error);
            });
            function searchBar() {
                if (vm.search === false) {
                    vm.search = true;
                } else {
                vm.search = false;
            }
        }

        // Call server api & update variable names
        function saveVariableNames() {
            var updatedQuestions = {};
            vm.questions.forEach(function(q) {
                updatedQuestions[q._id] = q.varName;
            });
            Analysis.updateQuestionNames($stateParams.id, updatedQuestions)
                .then(function success(res) {
                    cancelVariableRename();
                    toastr.success('Variable names saved successfully');
                }, function error(err) {
                    ErrorHandler.error(err);
                });
        }

        // Cancel variable rename
        function cancelVariableRename() {
            vm.inPlaceEditing = false;
        }

        // Toggle question selection
        function toggleQuestionSelection(q) {
            if (vm.inPlaceEditing) {
                return;
            }
            if (q.isSelected) {
                q.isSelected = false;
                var i = vm.selectedQuestions.indexOf(q._id);
                if (i > -1) {
                    vm.selectedQuestions.splice(i, 1);
                }
            } else {
                if (vm.selectedQuestions.length < 3) {
                    q.isSelected = true;
                     vm.search = true;
                    vm.selectedQuestions.push(q._id);
                } else {
                    toastr.error('Can not compute cross tabulation of more than three variables');
                }
            }
            if (vm.selectedQuestions.length === 0) initGraphObject();
        }

        /**
         * Reset/Init graph object
         */
        function initGraphObject() {
            vm.graphData = {};
            vm.graphMode = null;
        }

        function getTabData() {
            if (vm.selectedQuestions.length === 1) {
                Analysis.getTabStats(vm.survey._id, vm.selectedQuestions[0])
                    .then(function(response) {
                        generateGraphDataForTab(response.tabStat, response.totalResponses);
                    });
            } else if (vm.selectedQuestions.length === 0) {
                toastr.error('Please select a question to see view tab analysis');
            } else {
                toastr.error('Please select only one variables for tabulation analysis');
            }
        }

        function getCrossTabData() {
            if (vm.selectedQuestions.length === 2 || vm.selectedQuestions.length === 3) {
                Analysis.getCrossTabStats(vm.survey._id, getCrossTabParams())
                    .then(function(response) {
                        formatCrossTabulationData(response.stats, response.totalResponses);
                    });
            } else if (vm.selectedQuestions.length === 1) {
                toastr.error('Please select at least two variables for cross tabulation analysis');
            } else {
                toastr.error('Please select two/three questions to see view cross tabulation');
            }

            function getCrossTabParams() {
                return {
                    sourceQuestion: vm.selectedQuestions[0],
                    targetQuestions: vm.selectedQuestions.slice(1, vm.selectedQuestions.length)
                };
            }
        }


        function formatCrossTabulationData(stats, responseCount) {
            var labels = [],
                seriesData = {},
                seriesComplete = false;
            _.forOwn(stats, function(questionArrays, questionLabel) {
                questionArrays.forEach(function(ar, i) {
                    _.forOwn(ar, function (v, k) {
                        if (seriesData.hasOwnProperty(k)) {
                            seriesData[k].push(v);
                        } else {
                            seriesData[k] = [v];
                        }
                    });
                });
                labels.push(questionLabel);
            });
            generateGraphDataForCrossTab({
                    data: _.values(seriesData),
                    labels: labels,
                    series: _.keys(seriesData)
                }, responseCount);
        }

        // Tabulation - Graph Data
        function generateGraphDataForCrossTab(stat, responseCount) {
            vm.graphMode = 'crossTab';
            var chartType = vm.graphData.chartType || 'bar';
            var question = [];
            var varName = [];
            vm.graphData = {};
            vm.questions.forEach(function(q) {
              if (q.isSelected === true) {
                question.push(q);
                varName.push(q.varName);
              }
            });
            var graph = {
                sampleSize: responseCount,
                data: stat.data,
                labels: stat.labels,
                series: stat.series,
                chartType: chartType,
                graphMode: vm.graphMode,
                question: question,
                varName: varName
            };
            vm.graphData = graph;
            console.log('Graph data: (%s)', vm.graphMode, vm.graphData);
        }

        // Cross Tabulation - Graph Data
        function generateGraphDataForTab(stat, responseCount) {
            vm.graphMode = 'tab';
            var question = [];
            var varName = [];
            vm.graphData = {};
            vm.questions.forEach(function(q) {
              if (q.isSelected === true) {
                question.push(q);
                varName.push(q.varName);
              }
            });
            var data = reformatData(stat.data);
            var graph = {
                question: question,
                varName: varName,
                sampleSize: responseCount,
                data: data,
                graphOptions: graphOptions,
                percentData: convertToPercentage(responseCount, data),
                labels: stat.labels,
                series: stat.series || stat.labels,
                chartType: 'bar',
                statsType: 'count',
                graphMode: vm.graphMode,
                analysisData: getAnalysisStats(stat.data, stat.labels, responseCount)
            };
            if (stat.series) {
                graph.seriesData = true;
                graph.graphOptions.legend.display = true;
            } else {
                graph.graphOptions.legend.display = false;
            }
            vm.graphData = graph;
            console.log('Graph data: (%s)', vm.graphMode, vm.graphData);
        }

        function reformatData(data) {
            if (data.length === 0 || (typeof data[0] === 'number')) {
                return data;
            }
            var formattedData = [];
            var loopSize = new Array(data[0].length);
            _.each(loopSize, function(e, i) {
                var newData = [];
                data.forEach(function(ar) {
                    newData.push(ar[i]);
                });
                formattedData.push(newData);
            });
            return formattedData;
        }

        function convertToPercentage(total, graphData) {
            var percentageGraphData = [];
            if (total > 0) {
                graphData.forEach(function(i) {
                    if (typeof i === 'number') {
                        percentageGraphData.push(getPercentile(i, graphData));
                    } else {
                        var innerArray = [];
                        i.forEach(function(e) {
                            innerArray.push(getPercentile(e, i));
                        });
                        percentageGraphData.push(innerArray);
                    }
                });
            } else {
                return graphData;
            }
            return percentageGraphData;

            function getPercentile(val, array) {
                var count = 0;
                array.forEach(function(i) {
                    if (i <= val) count++;
                });
                if (count > 0) {
                    return ((count / array.length) * 100).toFixed(2);
                } else {
                    return count;
                }
            }
        }

        function getAnalysisStats(data, labels, sampleSize) {
            var analysisData = {};
            if (typeof data[0] === 'number') {
                analysisData.min = {
                    val: Math.min.apply(Math, data),
                    label: labels[data.indexOf(Math.min.apply(Math, data))]
                };
                analysisData.max = {
                    val: Math.max.apply(Math, data),
                    label: labels[data.indexOf(Math.max.apply(Math, data))]
                };
            }

            return analysisData;
        }

        /*
         * sending all data to present module
         * */
        function exportToPresent() {
            if (_.isEmpty(vm.graphData)) {
                return toastr.error('Please Select Any Tools First');
            }
            if (vm.graphData.sampleSize !== 0) {
                var params = {};
                angular.copy(vm.graphData, params);
                if (!params.hasOwnProperty('graphOptions')) {
                    params.graphOptions = graphOptions;
                }
                params.surveyId = $stateParams.id;
                if (params.statsType === 'percentile') {
                    delete params.data;
                } else {
                    delete params.percentData;
                }
                $http.post('/api/presentation', [params]).success(function(response) {
                    toastr.success('Data exported to storyboard successfully');
                });
            } else {
                toastr.error('No response received');
            }
        }

        /**
         * Switch variables for Cross tab
         * Move last variable to first place
         */
        function switchVariables() {
            var q = _.clone(vm.selectedQuestions[0]);
            vm.selectedQuestions.splice(0, 1);
            vm.selectedQuestions.push(q);
            getCrossTabData();
        }

        /*
        Set scrollable  length starts here
        */
        function adjustSidebarHeight() {
            $timeout(function() {
                setSidebarBottomHeight();
            }, 400);
        }
          function setSidebarBottomHeight() {
            var designSidebarHeaight = $('.design-sidebar').height();
            var designSidebarTopHeight = $('.design-sidebar .sidebar-top').height();
            var calculatedDesignSidebarBottomHeight = designSidebarHeaight - designSidebarTopHeight;
            $('.design-sidebar .sidebar-bottom').height(calculatedDesignSidebarBottomHeight);
        }

        $(window).on('resize', function() {
            setSidebarBottomHeight();
        });

        /*
         Set scrollable width length ends here
         */
    }
}());
