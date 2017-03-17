// Analysis service used to communicate Analysis REST endpoints
(function () {
    'use strict';

    angular
        .module('analysis')
        .factory('Analysis', AnalysisService);

    AnalysisService.$inject = ['$http', 'ErrorHandler', '$q'];

    function AnalysisService($http, ErrorHandler, $q) {
        var questionStatsCache = { questions: {}, sample: null };

        return {
            getQuestionList: function(surveyID) {
                return $http.get('/api/analysis/' + surveyID + '/variable-lists');
            },

            updateQuestionNames: function(surveyID, questions) {
                return $http.put('/api/analysis/' + surveyID + '/update-variables', { questions: questions });
            },

            getTabStats: function(surveyID, questionID) {
                var deferred = $q.defer();
                $http({
                    url: '/api/analysis/' + surveyID + '/tab-statistics',
                    params: { questionID: questionID }
                }).then(function success(response) {
                        deferred.resolve(response.data);
                        console.debug('Tab: ', response.data);
                    }, function error(err) {
                        deferred.reject();
                        ErrorHandler.error(err);
                    });
                return deferred.promise;
            },

            getCrossTabStats: function(surveyID, params) {
                var deferred = $q.defer();
                $http({
                    url: '/api/analysis/' + surveyID + '/crosstab-statistics',
                    params: params
                }).then(function success(response) {
                        deferred.resolve(response.data);
                        console.debug('Cross Tab: ', response.data);
                    }, function error(err) {
                        deferred.reject();
                        ErrorHandler.error(err);
                    });
                return deferred.promise;
            }
        };
    }
}());
