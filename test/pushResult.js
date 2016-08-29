var util = require('util');
var _ = require('lodash');
var Cucumber = require('cucumber');
var chai = require('chai');
var expect = chai.expect;
var resultSynchronizer = require('../lib/ResultSynchronizer');
var testrailmock = require('./pushResult-fixture');

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

var syncOptionsNoPush = _.clone(syncOptions);
delete syncOptionsNoPush.pushResults;


describe('Send results to TestRail', function () {
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
    var sync = new resultSynchronizer(syncOptions);

    testrailmock.createNewTestRunMock();

    sync.createNewTestRun(function () {
      expect(testrailmock.getCreateNewTestRunRequest().case_ids.length).to.equal(1);
      expect(testrailmock.getCreateNewTestRunRequest().case_ids[0]).to.equal(200);
      done();
    });
  });


  it('does not create a new test run when pushResults is not true', function (done) {
    var sync = new resultSynchronizer(syncOptionsNoPush);

    testrailmock.createNewTestRunMock();

    sync.createNewTestRun(function () {
      expect(testrailmock.getCreateNewTestRunRequest()).to.be.empty;
      done();
    });
  });


  it('sends PASSED when scenario is successful', function (done) {
    var sync = new resultSynchronizer(syncOptions);

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
        expect(testrailmock.getUpdateResultRequest().status_id).to.equal(sync.PASSED_STATUS_ID);
        done();
      });
    });
  });


  it('sends FAILED when scenario is failed', function (done) {
    var sync = new resultSynchronizer(syncOptions);

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
        expect(testrailmock.getUpdateResultRequest().status_id).to.equal(sync.FAILED_STATUS_ID);
        done();
      });
    });
  });


  it('sends BLOCKED when scenario is pending', function (done) {
    var sync = new resultSynchronizer(syncOptions);

    testrailmock.updateResultMock();

    var astscenario = Cucumber.Ast.Scenario(scenariodata);
    var scenario_result = Cucumber.Runtime.ScenarioResult(astscenario);
    var step = Cucumber.Ast.Step({});
    var step_result = Cucumber.Runtime.StepResult({
      status: Cucumber.Status.PENDING,
      step: step
    });
    scenario_result.witnessStepResult(step_result);
    var scenario = Cucumber.Api.Scenario(astscenario, scenario_result);

    sync.createNewTestRun(function() {
      sync.pushResult(scenario, function () {
        expect(testrailmock.getUpdateResultRequest().status_id).to.equal(sync.BLOCKED_STATUS_ID);
        done();
      });
    });
  });


  it('does not send results when pushResults is not true', function (done) {
    var sync = new resultSynchronizer(syncOptionsNoPush);

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
    var sync = new resultSynchronizer(syncOptionsNoPush);

    testrailmock.updateResultMock();

    var scenariodata_notag = {
      name: 'test scenario',    
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
});
