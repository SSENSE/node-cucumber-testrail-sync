var Testrail = require('testrail-api');

function ResultSynchronizer(options) {
  this.options = options;
  this.runid = null;
}


ResultSynchronizer.prototype.formatTime = function () {
  var time = new Date();
  return time.getUTCFullYear() + '-' + (time.getMonth() + 1) + '-' + time.getDate() +
    ' ' + time.getUTCHours() + ':' + time.getUTCMinutes() + ':' + time.getUTCSeconds();
};

ResultSynchronizer.prototype.createNewTestRun = function (callback) {
  if (this.options.sendResults === 'undefined' || !this.options.sendResults) {
    return callback();
  }

  var testrail = new Testrail({
    host: this.options.testrail.host,
    user: this.options.testrail.user,
    password: this.options.testrail.password
  });

  testrail.getPlan(this.options.testrail.filters.plan_id, function (err, plan) {
    if (plan.entries && plan.entries.length && plan.entries[0].runs && plan.entries[0].runs.length) {
      testrail.getTests(plan.entries[0].runs[0].id, function (err2, testcases) {
        var suiteid = plan.entries[0].suite_id;
        var trname = plan.entries[0].runs[0].name + ' ' + this.formatTime();
        var idarr = [];
        testcases.forEach(function (tc) {
          idarr.push(tc.case_id);
        });
        testrail.addPlanEntry(this.options.testrail.filters.plan_id,
          {
            suite_id: suiteid,
            name: trname,
            include_all: false,
            case_ids: idarr,
            runs: [
              {
                include_all: true
              }
            ]
          }, function (err3, planentry) {
            this.runid = planentry.runs[0].id;
            callback();
          }.bind(this));
      }.bind(this));
    }
  }.bind(this));
};

ResultSynchronizer.prototype.updateResult = function (scenario, callback) {
  if (this.options.sendResults === 'undefined' || !this.options.sendResults) {
    return callback();
  }

  var testrail = new Testrail({
    host: this.options.testrail.host,
    user: this.options.testrail.user,
    password: this.options.testrail.password
  });

  var tcid = 0;
  scenario.getTags().forEach(function (tag) {
    if (tag.getName().startsWith('@tcid:')) {
      var arr = tag.getName().split(':');
      tcid = arr[1];
    }
  });

  var rsdata = {};
  if (scenario.isSuccessful()) {
    rsdata = { status_id: 1 };
  } else {
    var errmsg = scenario.getException();
    rsdata = {
      status_id: 5,
      comment: '' + errmsg
    };
  }

  // Skip updating if a scenario does not have @tcid.
  if (tcid!='undefined') {
    testrail.addResultForCase(this.runid, tcid, rsdata, callback);
  }
};

module.exports = ResultSynchronizer;
