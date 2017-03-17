(function () {
  'use strict';

  describe('Payments Route Tests', function () {
    // Initialize global variables
    var $scope,
      PaymentsService;

    // We can start by loading the main application module
    beforeEach(module(ApplicationConfiguration.applicationModuleName));

    // The injector ignores leading and trailing underscores here (i.e. _$httpBackend_).
    // This allows us to inject a service but then attach it to a variable
    // with the same name as the service.
    beforeEach(inject(function ($rootScope, _PaymentsService_) {
      // Set a new global scope
      $scope = $rootScope.$new();
      PaymentsService = _PaymentsService_;
    }));

    describe('Route Config', function () {
      describe('Main Route', function () {
        var mainstate;
        beforeEach(inject(function ($state) {
          mainstate = $state.get('payments');
        }));

        it('Should have the correct URL', function () {
          expect(mainstate.url).toEqual('/payments');
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
          PaymentsController,
          mockPayment;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          viewstate = $state.get('payments.view');
          $templateCache.put('modules/payments/client/views/view-payment.client.view.html', '');

          // create mock Payment
          mockPayment = new PaymentsService({
            _id: '525a8422f6d0f87f0e407a33',
            name: 'Payment Name'
          });

          // Initialize Controller
          PaymentsController = $controller('PaymentsController as vm', {
            $scope: $scope,
            paymentResolve: mockPayment
          });
        }));

        it('Should have the correct URL', function () {
          expect(viewstate.url).toEqual('/:paymentId');
        });

        it('Should have a resolve function', function () {
          expect(typeof viewstate.resolve).toEqual('object');
          expect(typeof viewstate.resolve.paymentResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(viewstate, {
            paymentId: 1
          })).toEqual('/payments/1');
        }));

        it('should attach an Payment to the controller scope', function () {
          expect($scope.vm.payment._id).toBe(mockPayment._id);
        });

        it('Should not be abstract', function () {
          expect(viewstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(viewstate.templateUrl).toBe('modules/payments/client/views/view-payment.client.view.html');
        });
      });

      describe('Create Route', function () {
        var createstate,
          PaymentsController,
          mockPayment;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          createstate = $state.get('payments.create');
          $templateCache.put('modules/payments/client/views/form-payment.client.view.html', '');

          // create mock Payment
          mockPayment = new PaymentsService();

          // Initialize Controller
          PaymentsController = $controller('PaymentsController as vm', {
            $scope: $scope,
            paymentResolve: mockPayment
          });
        }));

        it('Should have the correct URL', function () {
          expect(createstate.url).toEqual('/create');
        });

        it('Should have a resolve function', function () {
          expect(typeof createstate.resolve).toEqual('object');
          expect(typeof createstate.resolve.paymentResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(createstate)).toEqual('/payments/create');
        }));

        it('should attach an Payment to the controller scope', function () {
          expect($scope.vm.payment._id).toBe(mockPayment._id);
          expect($scope.vm.payment._id).toBe(undefined);
        });

        it('Should not be abstract', function () {
          expect(createstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(createstate.templateUrl).toBe('modules/payments/client/views/form-payment.client.view.html');
        });
      });

      describe('Edit Route', function () {
        var editstate,
          PaymentsController,
          mockPayment;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          editstate = $state.get('payments.edit');
          $templateCache.put('modules/payments/client/views/form-payment.client.view.html', '');

          // create mock Payment
          mockPayment = new PaymentsService({
            _id: '525a8422f6d0f87f0e407a33',
            name: 'Payment Name'
          });

          // Initialize Controller
          PaymentsController = $controller('PaymentsController as vm', {
            $scope: $scope,
            paymentResolve: mockPayment
          });
        }));

        it('Should have the correct URL', function () {
          expect(editstate.url).toEqual('/:paymentId/edit');
        });

        it('Should have a resolve function', function () {
          expect(typeof editstate.resolve).toEqual('object');
          expect(typeof editstate.resolve.paymentResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(editstate, {
            paymentId: 1
          })).toEqual('/payments/1/edit');
        }));

        it('should attach an Payment to the controller scope', function () {
          expect($scope.vm.payment._id).toBe(mockPayment._id);
        });

        it('Should not be abstract', function () {
          expect(editstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(editstate.templateUrl).toBe('modules/payments/client/views/form-payment.client.view.html');
        });

        xit('Should go to unauthorized route', function () {

        });
      });

    });
  });
}());
