'use strict';

describe('User responses E2E Tests:', function () {
  describe('Test User responses page', function () {
    it('Should report missing credentials', function () {
      browser.get('http://localhost:3001/user-responses');
      expect(element.all(by.repeater('user-response in user-responses')).count()).toEqual(0);
    });
  });
});
