module.exports = function() {
  var chai = require('chai');
  var expect = chai.expect;


  this.Then(/^It should (succeed|fail)$/, function (result, callback) {
    if (result === 'succeed') {
      expect(this.verifyError).to.be.null;
    } else {
      expect(this.verifyError).to.not.be.null;
    }
    callback();
  }.bind(this));
};
