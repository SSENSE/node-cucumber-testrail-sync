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
      silent: true,
      directoryStructure: {
        type: 'section:slug'
      }
    };

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


  this.Then(/^I should have (\d+) (\w+) file(?:s?) on the file system$/, function (fileCount, rootDir, callback) {
    expect(fs.readdirSync('/'+rootDir)).to.have.lengthOf(1); // root section folder
    expect(fs.readdirSync('/'+rootDir+'/parent-section')).to.have.lengthOf(parseInt(fileCount) + 1); // sub section folder + feature file
    expect(fs.readdirSync('/'+rootDir+'/parent-section/a-sub-section')).to.have.lengthOf(fileCount); // feature file

    callback();
  }.bind(this));

  this.Then(/^It should (succeed|fail)$/, function (result, callback) {
    if (result === 'succeed') {
      expect(this.verifyError).to.be.null;
    } else {
      expect(this.verifyError).to.not.be.null;
    }
    callback();
  }.bind(this));
};
