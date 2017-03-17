(function () {
    'use strict';

    angular
        .module('pages')
        .factory('Page', PageService);

    PageService.$inject = ['$resource'];

    function PageService($resource) {
        var Page = $resource('/api/pages/:id', { id: '@_id' }, {
            update: {
                method: 'PUT' // this method issues a PUT request
            }
            // copy: {
            //     method: 'PUT', // Issue a post request for copying resource
            //     params: { id: '@id' },
            //     url: '/api/questions/:id/copy'
            // }
        });

        return Page;
    }
}());
