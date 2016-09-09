var readConfig = require('./readConfig');
var ResultSynchronizer = require('./ResultSynchronizer');

module.exports = function (Cucumber) {
  var testResultSync = new ResultSynchronizer(readConfig());

  Cucumber.registerHandler('BeforeFeatures', function (features, callback) {
    testResultSync.readRemoteTestRuns(callback);
  });

  Cucumber.After(function (scenario, callback) {
    testResultSync.saveTestResult(scenario, callback);
  });

  Cucumber.registerHandler('AfterFeatures', function (features, callback) {
    testResultSync.pushTestResults(callback);
  });
};
