(function () {
  'use strict';

  describe('Presents Route Tests', function () {
    // Initialize global variables
    var $scope,
      PresentsService;

    // We can start by loading the main application module
    beforeEach(module(ApplicationConfiguration.applicationModuleName));

    // The injector ignores leading and trailing underscores here (i.e. _$httpBackend_).
    // This allows us to inject a service but then attach it to a variable
    // with the same name as the service.
    beforeEach(inject(function ($rootScope, _PresentsService_) {
      // Set a new global scope
      $scope = $rootScope.$new();
      PresentsService = _PresentsService_;
    }));

    describe('Route Config', function () {
      describe('Main Route', function () {
        var mainstate;
        beforeEach(inject(function ($state) {
          mainstate = $state.get('presents');
        }));

        it('Should have the correct URL', function () {
          expect(mainstate.url).toEqual('/presentation');
        });

        it('Should be abstract', function () {
          expect(mainstate.abstract).toBe(true);
        });

        it('Should have template', function () {
          expect(mainstate.template).toBe('<ui-view/>');
        });
      });

      describe('View Route', function () {
        var viewstate,
          PresentsController,
          mockPresent;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          viewstate = $state.get('presents.view');
          $templateCache.put('modules/presentation/client/views/view-presentation.client.view.html', '');

          // create mock Present
          mockPresent = new PresentsService({
            _id: '525a8422f6d0f87f0e407a33',
            name: 'Present Name'
          });

          // Initialize Controller
          PresentsController = $controller('PresentsController as vm', {
            $scope: $scope,
            presentResolve: mockPresent
          });
        }));

        it('Should have the correct URL', function () {
          expect(viewstate.url).toEqual('/:presentId');
        });

        it('Should have a resolve function', function () {
          expect(typeof viewstate.resolve).toEqual('object');
          expect(typeof viewstate.resolve.presentResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(viewstate, {
            presentId: 1
          })).toEqual('/presentation/1');
        }));

        it('should attach an Present to the controller scope', function () {
          expect($scope.vm.present._id).toBe(mockPresent._id);
        });

        it('Should not be abstract', function () {
          expect(viewstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(viewstate.templateUrl).toBe('modules/presentation/client/views/view-presentation.client.view.html');
        });
      });

      describe('Create Route', function () {
        var createstate,
          PresentsController,
          mockPresent;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          createstate = $state.get('presents.create');
          $templateCache.put('modules/presentation/client/views/form-presentation.client.view.html', '');

          // create mock Present
          mockPresent = new PresentsService();

          // Initialize Controller
          PresentsController = $controller('PresentsController as vm', {
            $scope: $scope,
            presentResolve: mockPresent
          });
        }));

        it('Should have the correct URL', function () {
          expect(createstate.url).toEqual('/create');
        });

        it('Should have a resolve function', function () {
          expect(typeof createstate.resolve).toEqual('object');
          expect(typeof createstate.resolve.presentResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(createstate)).toEqual('/presentation/create');
        }));

        it('should attach an Present to the controller scope', function () {
          expect($scope.vm.present._id).toBe(mockPresent._id);
          expect($scope.vm.present._id).toBe(undefined);
        });

        it('Should not be abstract', function () {
          expect(createstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(createstate.templateUrl).toBe('modules/presentation/client/views/form-presentation.client.view.html');
        });
      });

      describe('Edit Route', function () {
        var editstate,
          PresentsController,
          mockPresent;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          editstate = $state.get('presents.edit');
          $templateCache.put('modules/presentation/client/views/form-presentation.client.view.html', '');

          // create mock Present
          mockPresent = new PresentsService({
            _id: '525a8422f6d0f87f0e407a33',
            name: 'Present Name'
          });

          // Initialize Controller
          PresentsController = $controller('PresentsController as vm', {
            $scope: $scope,
            presentResolve: mockPresent
          });
        }));

        it('Should have the correct URL', function () {
          expect(editstate.url).toEqual('/:presentId/edit');
        });

        it('Should have a resolve function', function () {
          expect(typeof editstate.resolve).toEqual('object');
          expect(typeof editstate.resolve.presentResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(editstate, {
            presentId: 1
          })).toEqual('/presentation/1/edit');
        }));

        it('should attach an Present to the controller scope', function () {
          expect($scope.vm.present._id).toBe(mockPresent._id);
        });

        it('Should not be abstract', function () {
          expect(editstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(editstate.templateUrl).toBe('modules/presentation/client/views/form-presentation.client.view.html');
        });

        xit('Should go to unauthorized route', function () {

        });
      });

    });
  });
}());
