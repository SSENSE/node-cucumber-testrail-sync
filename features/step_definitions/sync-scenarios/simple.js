module.exports = function() {
  var fs = require('fs');
  var chai = require('chai');
  var expect = chai.expect;
  var fsMock = require('mock-fs');


  this.Given(/^I have (\d+) TestCase in a TestPlan in TestRail$/, function (caseCount, callback) {
    this.PLAN_ID = caseCount;

    this.syncOptions = {
      testrail: {
        host: 'https://test.testrail.com',
        user: 'test',
        password: 'test',
        filters: {
          plan_id: this.PLAN_ID
        },
      },
      featuresDir: '/feature',
      jsDir: '/js',
      silent: true
    };

    callback();
  }.bind(this));


  this.When(/^I want to write test stubs$/, function (callback) {
    this.syncOptions.testFilesTemplate = 'cucumberjs.es6';
    callback();
  }.bind(this));


  this.When(/^I run the synchronization script$/, function (callback) {
    fsMock(this.fsMockConfig);

    new this.ScenarioSynchronizer(this.syncOptions, callback);
  }.bind(this));


  this.Then(/^I should have (\d+) (\w+) file(?:s?) on the file system$/, function (fileCount, rootDir, callback) {
    expect(fs.readdirSync('/'+rootDir)).to.have.lengthOf(fileCount);

    callback();
  }.bind(this));
};
