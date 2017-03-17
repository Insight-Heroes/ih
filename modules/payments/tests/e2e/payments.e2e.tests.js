'use strict';

describe('Payments E2E Tests:', function () {
  describe('Test Payments page', function () {
    it('Should report missing credentials', function () {
      browser.get('http://localhost:3001/payments');
      expect(element.all(by.repeater('payment in payments')).count()).toEqual(0);
    });
  });
});
