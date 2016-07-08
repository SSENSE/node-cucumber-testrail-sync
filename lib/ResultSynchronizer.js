var Testrail = require('testrail-api');


function ResultSynchronizer(options) {
}


ScenarioSynchronizer.prototype.formattime = function () {
  // ... code ...
};


module.exports = ResultSynchronizer;




var runid;

function formattime() {
  var time = new Date();
  return time.getUTCFullYear() + '-' + (time.getMonth() + 1) + '-' + time.getDate() +
    ' ' + time.getUTCHours() + ':' + time.getUTCMinutes() + ':' + time.getUTCSeconds();
}

exports.createNewTestRun = function (options, callback) {
  if (options.sendResults === 'undefined' || !options.sendResults) {
    return callback();
  }

  var testrail = new Testrail({
    host: options.testrail.host,
    user: options.testrail.user,
    password: options.testrail.password
  });

  testrail.getPlan(options.testrail.filters.plan_id, function (err, plan) {
    if (plan.entries && plan.entries.length && plan.entries[0].runs && plan.entries[0].runs.length) {
      testrail.getTests(plan.entries[0].runs[0].id, function (err2, testcases) {
        var suiteid = plan.entries[0].suite_id;
        var trname = plan.entries[0].runs[0].name + ' ' + formattime();
        var idarr = [];
        testcases.forEach(function (tc) {
          idarr.push(tc.case_id);
        });
        testrail.addPlanEntry(options.testrail.filters.plan_id,
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
            runid = planentry.runs[0].id;
            callback();
          });
      });
    }
  });
};

exports.updateResult = function (options, scenario, callback) {
  if (options.sendResults === 'undefined' || !options.sendResults) {
    return callback();
  }

  var testrail = new Testrail({
    host: options.testrail.host,
    user: options.testrail.user,
    password: options.testrail.password
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

  testrail.addResultForCase(runid, tcid, rsdata, callback);
};
