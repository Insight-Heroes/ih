'use strict';

describe('Comments E2E Tests:', function () {
  describe('Test Comments page', function () {
    it('Should report missing credentials', function () {
      browser.get('http://localhost:3001/comments');
      expect(element.all(by.repeater('comment in comments')).count()).toEqual(0);
    });
  });
});
