module.exports = function() {
  var fs = require('fs');
  var chai = require('chai');
  var expect = chai.expect;
  var fsMock = require('mock-fs');
  var glob = require('glob');


  this.Given(/^I use a TestPlan with 1 TestRun and 2 TestCases$/, function (callback) {
    this.syncOptions.testrail.filters.plan_id = 1;
    this.syncOptions.testrail.filters.run_id = 1;

    callback();
  }.bind(this));


  this.Given(/^I use a TestPlan with 2 TestRuns with 1 TestCase in each$/, function (callback) {
    this.syncOptions.testrail.filters.plan_id = 55;

    callback();
  }.bind(this));


  this.Given(/^I set the (.*) option to "(.*)"$/, function (optionName, optionValue, callback) {
    var splitted = optionName.split('.');
    var opts = this.syncOptions;

    for (var i = 0; i < splitted.length - 1; i++) {
      opts[splitted[i]] = opts[splitted[i]] || {};
      opts = opts[splitted[i]];
    }
    opts[splitted[splitted.length - 1]] = optionValue;

    callback();
  }.bind(this));


  this.Given(/^There is a file named "(.*)" with the content:$/, function (filePath, fileContent, callback) {
    this.fsMockConfig['/feature/parent-section'] = {};
    this.fsMockConfig['/feature/parent-section/a-sub-section'] = {};

    this.fsMockConfig[filePath] = fsMock.file({
      content: fileContent,
      ctime: new Date(1),
      mtime: new Date(1)
    });

    callback();
  }.bind(this));


  this.Given(/^The (first|second) case contains the following gherkin$/, function (type, data, callback) {
    var id = (type === 'first' ? 100 : 101);
    this.testCases[id].custom_gherkin = data;
    callback();
  }.bind(this));


  this.When(/^I run the synchronization script$/, function (callback) {
    fsMock(this.fsMockConfig);

    var sync = new this.ScenarioSynchronizer();
    sync.synchronize(this.syncOptions, function (err) {
      if (this.syncOptions.verify === true) {
        this.verifyError = err;
        return callback();
      }
      callback(err);
    }.bind(this));
  }.bind(this));


  this.Then(/^There should be (\d+) (\w+) file[s]? on the file system$/, function (fileCount, fileType, callback) {
    if (fileType === 'feature') {
      expect(glob.sync(this.syncOptions.featuresDir + '/**/*.feature')).to.have.lengthOf(fileCount);
    }
    else {
      expect(glob.sync(this.syncOptions.stepDefinitionsDir + '/**/*.*')).to.have.lengthOf(fileCount);
    }
    
    callback();
  }.bind(this));


  this.Then(/^The file "(.*)" should have the following content:$/, function (filePath, fileContent, callback) {
    expect(fs.readFileSync(filePath).toString()).to.equal(fileContent);

    callback();
  }.bind(this));
};
