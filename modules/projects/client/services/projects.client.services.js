(function () {
    'use strict';

    angular
        .module('projects')
        .factory('Project', ProjectService);

    ProjectService.$inject = ['$resource'];

    function ProjectService($resource) {
        var Project = $resource('/api/projects/:id', { id: '@_id' }, {
            update: {
              method: 'PUT' // this method issues a PUT request
            }
        });

        return Project;

    }
}());
