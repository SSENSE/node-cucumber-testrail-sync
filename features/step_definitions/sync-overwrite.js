module.exports = function() {
  var fs = require('fs');
  var chai = require('chai');
  var expect = chai.expect;
  var Testrail = require('testrail-api');


  this.Given(/^I (enable|disable) the (.*) option$/, function (action, optionName, callback) {
    var splitted = optionName.split('.');
    var opts = this.syncOptions;

    for (var i = 0; i < splitted.length - 1; i++) {
      opts[splitted[i]] = opts[splitted[i]] || {};
      opts = opts[splitted[i]];
    }
    opts[splitted[splitted.length - 1]] = (action === 'enable');

    callback();
  }.bind(this));


  this.Given(/^I (confirm|deny) the overwrite$/, function (actionType, callback) {
    this.ScenarioSynchronizer.__set__('inquirer', {
      prompt: function (options) {
        return Promise.resolve({ confirm: (actionType == 'confirm') });
      }
    });

    callback();
  }.bind(this));


  this.Then(/^The file "(.*)" should not have been modified$/, function (filePath, callback) {
    expect(fs.statSync(filePath).mtime.getTime()).to.equal(new Date(1).getTime());

    callback();
  }.bind(this));


  this.Then(/^The TestCase should have the following Gherkins:$/, function (gherkins, callback) {
    var testrail = new Testrail({
      host: 'https://test.testrail.com', 
      user: 'test', 
      password: 'test'
    });

    testrail.getCase(100, function (err, testcase) {
      expect(testcase).to.be.an('object');
      expect(testcase).to.have.property('custom_gherkin');
      expect(testcase.custom_gherkin).to.be.equal(gherkins);

      callback();
    });
  }.bind(this));
};
