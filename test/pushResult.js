var util = require('util');
var chai = require('chai');
var expect = chai.expect;
var resultSynchronizer = require('../lib/ResultSynchronizer.js');
var testrailmock = require('./testrail-fixture.js');

var syncOptions = {
  testrail: {
    host: 'https://test.testrail.com',
    user: 'test',
    password: 'test',
    filters: {
      plan_id: 10
    },
  },
  pushResults: true
};

var syncOptionsDontSend = {
  testrail: {
    host: 'https://test.testrail.com',
    user: 'test',
    password: 'test',
    filters: {
      plan_id: 10
    },
  },
  pushResults: false
};

describe('Send results to TestRail', function () {

  var sync = null;

  var Cucumber = require('cucumber');

  var scenariodata = {
    name: 'test scenario',
    tags: [
      {
        name: "@tcid:200"
      }
    ],
    steps: [],
  }

  it('creates a new test run when pushResults is true', function (done) {

    sync = new resultSynchronizer(syncOptions);

    testrailmock.createNewTestRunMock();

    sync.createNewTestRun(function () {
      expect(testrailmock.getCreateNewTestRunRequest().case_ids.length).to.equal(1);
      expect(testrailmock.getCreateNewTestRunRequest().case_ids[0]).to.equal(200);
      done();
    });

  });

  it('does not create a new test run when pushResults is false', function (done) {

    sync = new resultSynchronizer(syncOptionsDontSend);

    testrailmock.createNewTestRunMock();

    sync.createNewTestRun(function () {
      expect(testrailmock.getCreateNewTestRunRequest()).to.be.empty;
      done();
    });

  });

  it('sends PASSED when scenario is successful', function (done) {

    sync = new resultSynchronizer(syncOptions);

    testrailmock.updateResultMock();

    var astscenario = Cucumber.Ast.Scenario(scenariodata);
    var scenario_result = Cucumber.Runtime.ScenarioResult(astscenario);
    var step = Cucumber.Ast.Step({});
    var step_result = Cucumber.Runtime.StepResult({
      status: Cucumber.Status.PASSED,
      step: step
    });
    scenario_result.witnessStepResult(step_result);
    var scenario = Cucumber.Api.Scenario(astscenario, scenario_result);

    sync.createNewTestRun(function() {
      sync.pushResult(scenario, function () {
        expect(testrailmock.getUpdateResultRequest().status_id).to.equal(1);
        done();
      });
    });
  });

  it('sends FAILED when scenario is failed', function (done) {

    sync = new resultSynchronizer(syncOptions);

    testrailmock.updateResultMock();

    var astscenario = Cucumber.Ast.Scenario(scenariodata);
    var scenario_result = Cucumber.Runtime.ScenarioResult(astscenario);
    var step = Cucumber.Ast.Step({});
    var step_result = Cucumber.Runtime.StepResult({
      status: Cucumber.Status.FAILED,
      step: step
    });
    scenario_result.witnessStepResult(step_result);
    var scenario = Cucumber.Api.Scenario(astscenario, scenario_result);

    sync.createNewTestRun(function() {
      sync.pushResult(scenario, function () {
        expect(testrailmock.getUpdateResultRequest().status_id).to.equal(5);
        done();
      });
    });

  });

  it('does not send results when pushResults is false', function (done) {

    sync = new resultSynchronizer(syncOptionsDontSend);

    testrailmock.updateResultMock();

    var astscenario = Cucumber.Ast.Scenario(scenariodata);
    var scenario_result = Cucumber.Runtime.ScenarioResult(astscenario);
    var step = Cucumber.Ast.Step({});
    var step_result = Cucumber.Runtime.StepResult({
      status: Cucumber.Status.FAILED,
      step: step
    });
    scenario_result.witnessStepResult(step_result);
    var scenario = Cucumber.Api.Scenario(astscenario, scenario_result);

    sync.pushResult(scenario, function () {
      expect(testrailmock.getUpdateResultRequest()).to.be.empty;
      done();
    });

  });

  it('does not send results if @tcid metatag is not present', function (done) {

    sync = new resultSynchronizer(syncOptionsDontSend);

    testrailmock.updateResultMock();

    var scenariodata_notag = {
      name: 'test scenario',
      tags: [
        {
          name: '@test:1'
        }
      ],
      steps: [],
    }

    var astscenario = Cucumber.Ast.Scenario(scenariodata_notag);
    var scenario_result = Cucumber.Runtime.ScenarioResult(astscenario);
    var step = Cucumber.Ast.Step({});
    var step_result = Cucumber.Runtime.StepResult({
      status: Cucumber.Status.FAILED,
      step: step
    });
    scenario_result.witnessStepResult(step_result);
    var scenario = Cucumber.Api.Scenario(astscenario, scenario_result);

    sync.pushResult(scenario, function () {
      expect(testrailmock.getUpdateResultRequest()).to.be.empty;
      done();
    });

  });

})