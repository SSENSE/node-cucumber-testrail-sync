var nock = require('nock');

var fsMock = require('mock-fs');
var path = require('path');

var mockFsHelper = require('../lib/mock-fs-helper');
var rewire = require('rewire');   

var myHooks = function () {
  this.Before(function (scenario) {
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
      "custom_gherkin": "Given that I am a tester\nWhen I am testing\nThen I should see test results\nAnd I should be satified",
      "case_id": "100"
    };

    nock.disableNetConnect();

    nock('https://test.testrail.com')
      .get('/index.php?/api/v2/get_plan/1')
      .reply(200, {
        "entries": [
          {
            "id": "3933d74b-4282-4c1f-be62-a641ab427063",
            "name": "My template",
            "runs": [
              { "id": "1" }
            ]
          }
        ]
      });

    nock('https://test.testrail.com')
      .get('/index.php?/api/v2/get_tests/1')
      .reply(function (uri, requestBody) {
        return [200, [
          this.testCases[100]
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


    this.ScenarioSynchronizer = rewire('../../lib/ScenarioSynchronizer');
  }.bind(this));


  this.After(function (scenario) {
    fsMock.restore();
  });
};

module.exports = myHooks;