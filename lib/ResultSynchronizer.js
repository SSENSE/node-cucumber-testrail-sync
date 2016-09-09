var Testrail = require('testrail-api');
var async = require('async');
var _ = require('lodash');

function ResultSynchronizer(config) {
  this.config = config;
  this.testrailClient = new Testrail(config.testrail);
  this.testruns = {};
  this.testresults = {};

  this.PASSED_STATUS_ID = 1;
  this.BLOCKED_STATUS_ID = 2;
  this.FAILED_STATUS_ID = 5;

  if (process.env.PUSH_RESULTS_TO_TESTRAIL) {
    this.config.pushResults = true;
  }
}

ResultSynchronizer.prototype.readRemoteTestRuns = function (callback) {
  if (this.config.pushResults !== true) {
    return callback();
  }

  this.getAllTestRuns(function (err, testruns) {
    this.testruns = testruns;
    callback();
  }.bind(this));
};

ResultSynchronizer.prototype.getAllTestRuns = function (callback) {
  var runs = {};

  if (this.config.testrail.filters.run_id) {
    var runId = this.config.testrail.filters.run_id;

    this.testrailClient.getTests(runId, function (err2, testcases) {
      runs[runId] = {
        cases: testcases.map(function (item) {
          return item.case_id;
        })
      };
      callback(null, runs);
    });
  } else {
    this.testrailClient.getPlan(this.config.testrail.filters.plan_id, function (err, plan) {
      if (err) {
        return callback(err);
      }
      async.eachSeries(plan.entries, function (planentry, nextEntry) {
        async.eachSeries(planentry.runs, function (run, nextRun) {
          this.testrailClient.getTests(run.id, function (err2, testcases) {
            if (err2) {
              return nextRun(err2);
            }
            runs[run.id] = {
              cases: testcases.map(function (item) {
                return item.case_id;
              })
            };
            nextRun();
          });
        }.bind(this), nextEntry);
      }.bind(this),
      function (err3) {
        callback(err3, runs);
      });
    }.bind(this));
  }
};

ResultSynchronizer.prototype.saveTestResult = function (scenario, callback) {
  if (this.config.pushResults !== true) {
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

  tcid = tcid[0];

  var result = {
    case_id: tcid,
    status_id: this.PASSED_STATUS_ID
  };

  if (scenario.isPending()) {
    result.status_id = this.BLOCKED_STATUS_ID;
  } else if (!scenario.isSuccessful()) {
    result.status_id = this.FAILED_STATUS_ID;
    var exception = scenario.getException();

    if (typeof exception === 'string') {
      result.comment = exception;
    } else if (typeof exception === 'object') {
      result.comment = exception.toString();

      if (exception.stack) {
        result.comment += '\n\n' + exception.stack;
      }
    }
  }

  this.testresults[tcid] = result;

  callback();
};

ResultSynchronizer.prototype.pushTestResults = function (callback) {
  if (this.config.pushResults !== true) {
    return callback();
  }

  async.eachOfSeries(this.testruns, function (testrun, testrunId, nextRun) {
    var results = _.pick(this.testresults, testrun.cases);
    var data = Object.keys(results).map(function (k) {
      return results[k];
    });

    if (data.length === 0) {
      return nextRun();
    }

    this.testrailClient.addResultsForCases(testrunId, { results: data }, nextRun);
  }.bind(this),
  function (err) {
    callback(err);
  });
};

module.exports = ResultSynchronizer;
