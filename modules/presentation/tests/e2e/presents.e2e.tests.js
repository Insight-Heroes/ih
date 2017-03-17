'use strict';

describe('Presents E2E Tests:', function () {
  describe('Test Presents page', function () {
    it('Should report missing credentials', function () {
      browser.get('http://localhost:3001/presentation');
      expect(element.all(by.repeater('present in presentation')).count()).toEqual(0);
    });
  });
});
