var Testrail = require('testrail-api');
var dateFormat = require('dateformat');

function ResultSynchronizer(config) {
  this.config = config;
  this.runid = null;
  this.testrailClient = new Testrail(config.testrail);

  this.PASSED_STATUS_ID = 1;
  this.BLOCKED_STATUS_ID = 2;
  this.FAILED_STATUS_ID = 5;
}


ResultSynchronizer.prototype.formatTime = function () {
  var now = new Date();
  return 'Automated run - ' + dateFormat(now, 'mmmm dS, yyyy @ h:MM TT');
};


ResultSynchronizer.prototype.createNewTestRun = function (callback) {
  if (this.config.pushResults === 'undefined' || !this.config.pushResults) {
    return callback();
  }

  this.testrailClient.getPlan(this.config.testrail.filters.plan_id, function (err, plan) {
    if (err) {
      return callback(err);
    }
    if (!plan.entries || plan.entries.length === 0) {
      return callback(new Error('No plan entries found'));
    }
    if (!plan.entries[0].runs || plan.entries[0].runs.length === 0) {
      return callback(new Error('No test runs found'));
    }
    this.testrailClient.getTests(plan.entries[0].runs[0].id, function (err2, testcases) {
      if (err2) {
        return callback(err2);
      }
      var suiteId = plan.entries[0].suite_id;
      var runName = this.formatTime();
      var testcaseIds = testcases.map(function (testcase) { return testcase.case_id; });
      var entryData = {
        suite_id: suiteId,
        name: runName,
        include_all: false,
        case_ids: testcaseIds,
        runs: [
          { include_all: true }
        ]
      };
      this.testrailClient.addPlanEntry(this.config.testrail.filters.plan_id, entryData, function (err3, planentry) {
        if (err3) {
          return callback(err3);
        }
        this.runid = planentry.runs[0].id;
        callback();
      }.bind(this));
    }.bind(this));
  }.bind(this));
};

ResultSynchronizer.prototype.pushResult = function (scenario, callback) {
  if (this.config.pushResults === 'undefined' || !this.config.pushResults) {
    return callback();
  }

  var tcid = scenario.getTags().filter(function (tag) {
    return tag.getName().startsWith('@tcid:');
  }).map(function (tag) {
    return tag.getName().split(':').pop();
  });

  if (tcid.length === 0) {
    return callback();
  }

  var rsdata = { status_id: this.PASSED_STATUS_ID };
  if (scenario.isPending()) {
    rsdata.status_id = this.BLOCKED_STATUS_ID;
  } else if (!scenario.isSuccessful()) {
    rsdata.status_id = this.FAILED_STATUS_ID;
    rsdata.comment = scenario.getException() ? scenario.getException().toString() : '';
  }

  // Skip updating if a scenario does not have @tcid.
  if (typeof tcid === 'undefined') {
    return callback();
  }

  this.testrailClient.addResultForCase(this.runid, tcid[0], rsdata, callback);
};

module.exports = ResultSynchronizer;
