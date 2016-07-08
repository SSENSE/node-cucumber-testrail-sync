var nock = require('nock');

var newTestRunRequest;
var updateResultRequest;

exports.createNewTestRunMock = function () {

  newTestRunRequest = {};

  var testplan = {
    id: 10,
    entries: [
      {
        runs: [
          {
            id: 100,
            tests: [
              {
                case_id: 200
              }
            ]
          }
        ]
      }
    ]
  };

  nock.disableNetConnect();

  //nock.recorder.rec();

  nock('https://test.testrail.com')
    .persist()
    .get('/index.php?/api/v2/get_plan/10')
    .reply(200, function (uri, requestBody) {
      return testplan;
    });

  nock('https://test.testrail.com')
    .persist()
    .get('/index.php?/api/v2/get_tests/100')
    .reply(200, function (uri, requestBody) {
      return testplan.entries[0].runs[0].tests;
    });

  nock('https://test.testrail.com')
    .persist()
    .post('/index.php?/api/v2/add_plan_entry/10')
    .reply(200, function (uri, requestBody) {
      newTestRunRequest = requestBody;
      return {
        runs: [
          {
            id: 400
          }
        ]
      };
    });

};

exports.getCreateNewTestRunRequest = function () {
  return newTestRunRequest;
};

exports.updateResultMock = function () {

  updateResultRequest = {};

  nock.disableNetConnect();

  nock('https://test.testrail.com')
    .persist()
    .post('/index.php?/api/v2/add_result_for_case/400/200')
    .reply(200, function (uri, requestBody) {
      updateResultRequest = requestBody;
      return {
        id: 1
      }
    });

};

exports.getUpdateResultRequest = function () {
  return updateResultRequest;
};
