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
      stepDefinitionsDir: '/js',
      silent: true
    };

    callback();
  }.bind(this));


  this.When(/^I want to write test stubs$/, function (callback) {
    this.syncOptions.stepDefinitionsTemplate = 'es6.js';
    callback();
  }.bind(this));


  this.When(/^I run the synchronization script$/, function (callback) {
    fsMock(this.fsMockConfig);

    new this.ScenarioSynchronizer(this.syncOptions, callback);
  }.bind(this));


  this.Then(/^I should have (\d+) (\w+) file(?:s?) on the file system$/, function (fileCount, rootDir, callback) {
    expect(fs.readdirSync('/'+rootDir)).to.have.lengthOf(1); // root section folder
    expect(fs.readdirSync('/'+rootDir+'/parent-section')).to.have.lengthOf(parseInt(fileCount) + 1); // sub section folder + feature file
    expect(fs.readdirSync('/'+rootDir+'/parent-section/a-sub-section')).to.have.lengthOf(fileCount); // feature file

    callback();
  }.bind(this));
};
