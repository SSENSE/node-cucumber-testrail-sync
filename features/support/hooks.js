var nock = require('nock');

var fsMock = require('mock-fs');
var path = require('path');

var mockFsHelper = require('../lib/mock-fs-helper');
var rewire = require('rewire');   

var myHooks = function () {
  this.Before(function (scenario) {
    process.env.SILENT = true;

    this.syncOptions = {
      testrail: {
        host: 'https://test.testrail.com',
        user: 'test',
        password: 'test',
        filters: {
        },
      },
      featuresDir: '/feature',
      stepDefinitionsDir: '/js',
      silent: true,
      directoryStructure: {
        type: 'section:slug'
      }
    };

    this.fsMockConfig = {
      node_modules: mockFsHelper.duplicateFSInMemory(path.resolve('node_modules')),
      templates: mockFsHelper.duplicateFSInMemory(path.resolve('templates')),
      'lib/ScenarioSynchronizer.js': mockFsHelper.readFile(path.resolve('lib/ScenarioSynchronizer.js')),
      '/feature': {},
      '/js': {}
    };

    this.testCases = [];
    this.testCases[100] = {
      "id": "1",
      "title": "my first test",
      "custom_gherkin": "Given That I am a tester\nWhen I am testing\nThen I should see test results\nAnd I should be satified",
      "case_id": "100",
      "custom_status": 4
    };
    this.testCases[101] = {
      "id": "1",
      "title": "my second test",
      "custom_gherkin": "Given That I am a tester <name>\n| name |\n| tester 1 |\n| tester 2 |\nWhen I am testing\nThen I should see test results\nAnd I should be satified",
      "case_id": "101",
      "custom_status": 5
    };

    nock.disableNetConnect();

    // Plan 1: a single test run with 2 test cases
    nock('https://test.testrail.com')
      .get('/index.php?/api/v2/get_plan/1')
      .reply(200, {
        "project_id": "98",
        "entries": [
          {
            "id": "3933d74b-4282-4c1f-be62-a641ab427063",
            "name": "My template",
            "suite_id": "99",
            "runs": [
              { "id": "1" }
            ]
          }
        ]
      });

    // Get tests of the run
    nock('https://test.testrail.com')
      .get('/index.php?/api/v2/get_tests/1')
      .reply(function (uri, requestBody) {
        return [200, [
          this.testCases[100],
          this.testCases[101]
        ]];
      }.bind(this));

     // Plan 2: a single test run with 2 test cases
    nock('https://test.testrail.com')
      .get('/index.php?/api/v2/get_plan/2')
      .reply(200, {
        "project_id": "98",
        "entries": [
          {
            "id": "3933d74b-4282-4c1f-be62-a641ab427063",
            "name": "My template",
            "suite_id": "99",
            "runs": [
              { "id": "2" }
            ]
          }
        ]
      });

    // Get tests of the run
    nock('https://test.testrail.com')
      .get('/index.php?/api/v2/get_tests/2')
      .reply(function (uri, requestBody) {
        return [200, [
          this.testCases[100]
        ]];
      }.bind(this));

    // Plan 3: two test runs
    nock('https://test.testrail.com')
      .persist()
      .get('/index.php?/api/v2/get_plan/55')
      .reply(200, {
        "project_id": "98",
        "entries": [
          {
            "id": "3933d74b-4282-4c1f-be62-a641ab427063",
            "name": "My template",
            "suite_id": "99",
            "runs": [
              { "id": "56" },
              { "id": "57" }
            ]
          }
        ]
      });

    // Get tests of the run
    nock('https://test.testrail.com')
      .get('/index.php?/api/v2/get_tests/56')
      .reply(function (uri, requestBody) {
        return [200, [
          this.testCases[100]
        ]];
      }.bind(this));

    nock('https://test.testrail.com')
      .get('/index.php?/api/v2/get_tests/57')
      .reply(function (uri, requestBody) {
        return [200, [
          this.testCases[101]
        ]];
      }.bind(this));

    nock('https://test.testrail.com')
      .get('/index.php?/api/v2/get_cases/98&suite_id=99')
      .reply(function (uri, requestBody) {
        return [200, [
          { id: 100, section_id: 2 },
          { id: 101, section_id: 1 }
        ]];
      }.bind(this));


    nock('https://test.testrail.com')
      .get('/index.php?/api/v2/get_sections/98&suite_id=99')
      .reply(function (uri, requestBody) {
        return [200, [
          { id: 1, name: 'parent section', parent_id: null },
          { id: 2, name: 'a sub section', parent_id: 1 }
        ]];
      }.bind(this));


    nock('https://test.testrail.com')
      .post('/index.php?/api/v2/update_case/100')
      .reply(function (uri, requestBody) {
        this.testCases[100].custom_gherkin = requestBody.custom_gherkin;

        return [200, this.testCases[100]]
      }.bind(this));


    nock('https://test.testrail.com')
      .get('/index.php?/api/v2/get_case/100')
      .reply(function (uri, requestBody) {
        return [200, this.testCases[100]]
      }.bind(this));


    nock('https://test.testrail.com')
      .post('/index.php?/api/v2/update_case/101')
      .reply(function (uri, requestBody) {
        this.testCases[101].custom_gherkin = requestBody.custom_gherkin;

        return [200, this.testCases[101]]
      }.bind(this));


    nock('https://test.testrail.com')
      .get('/index.php?/api/v2/get_case/101')
      .reply(function (uri, requestBody) {
        return [200, this.testCases[101]]
      }.bind(this));


    this.ScenarioSynchronizer = rewire('../../lib/ScenarioSynchronizer');
  }.bind(this));


  this.After(function (scenario) {
    fsMock.restore();
  });
};

module.exports = myHooks;