var nock = require('nock');

var pushResultsMock;

exports.setupMock = function () {
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
      },
      {
        runs: [
          {
            id: 101,
            tests: [
              {
                case_id: 201
              }
            ]
          }
        ]
      }
    ]
  };

  nock.disableNetConnect();

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
    .get('/index.php?/api/v2/get_tests/101')
    .reply(200, function (uri, requestBody) {
      return testplan.entries[1].runs[0].tests;
    });
};

exports.pushResultsMock = function () {
  pushResultsMock = {};

  nock.disableNetConnect();

  nock('https://test.testrail.com')
    .persist()
    .post('/index.php?/api/v2/add_results_for_cases/100')
    .reply(200, function (uri, requestBody) {
      pushResultsMock[100] = requestBody;
      return {
        id: 1
      }
    });

   nock('https://test.testrail.com')
    .persist()
    .post('/index.php?/api/v2/add_results_for_cases/101')
    .reply(200, function (uri, requestBody) {
      pushResultsMock[101] = requestBody;
      return {
        id: 1
      }
    });
};

exports.getPushResultsRequest = function () {
  return pushResultsMock;
};
