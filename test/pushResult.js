var util = require('util');
var _ = require('lodash');
var Cucumber = require('cucumber');
var chai = require('chai');
var expect = chai.expect;
var resultSynchronizer = require('../lib/ResultSynchronizer');
var testrailmock = require('./pushResult-fixture');
var async = require('async');

var syncOptions = {
  testrail: {
    host: 'https://test.testrail.com',
    user: 'test',
    password: 'test',
    filters: {
      plan_id: 10,
      run_id: 100
    },
  },
  pushResults: true
};

var syncOptionsNoPush = _.clone(syncOptions);
delete syncOptionsNoPush.pushResults;

var pushTestResults = function (options, scenarios, callback) {
  var sync = new resultSynchronizer(options);

  testrailmock.pushResultsMock();

  sync.readRemoteTestRuns(function () {
    async.eachSeries(scenarios, function (scenarioContent, next) {
      var astscenario = Cucumber.Ast.Scenario(scenarioContent.scenariodata);
      var scenario_result = Cucumber.Runtime.ScenarioResult(astscenario);
      var step = Cucumber.Ast.Step({});
      var step_result = Cucumber.Runtime.StepResult({
        status: scenarioContent.status,
        step: step
      });
      scenario_result.witnessStepResult(step_result);
      var scenario = Cucumber.Api.Scenario(astscenario, scenario_result);

      sync.saveTestResult(scenario, next);
    },
    function (err) {
      sync.pushTestResults(function () {
        var request = testrailmock.getPushResultsRequest();
        callback(null, request);
      });
    });
  });
};


describe('Send results to TestRail', function () {
  var sync = new resultSynchronizer(syncOptions);

  var scenariodata = {
    name: 'test scenario',
    tags: [
      {
        name: "@tcid:200"
      }
    ],
    steps: [],
  };

  before(function (done) {
    testrailmock.setupMock();
    done();
  });

  it('sends PASSED when scenario is successful', function (done) {
    var scenarios = [
      { scenariodata: scenariodata, status: Cucumber.Status.PASSED }
    ];
    pushTestResults(syncOptions, scenarios, function (err, updateRequests) {
      expect(Object.keys(updateRequests)).to.have.lengthOf(1);
      expect(updateRequests).to.have.property('100');
      expect(updateRequests['100']).to.deep.equal({ results: [{ case_id: "200", status_id: sync.PASSED_STATUS_ID }] });
      done();
    });
  });


  it('sends FAILED when scenario is failed', function (done) {
    var scenarios = [
      { scenariodata: scenariodata, status: Cucumber.Status.FAILED }
    ];
    pushTestResults(syncOptions, scenarios, function (err, updateRequests) {
      expect(Object.keys(updateRequests)).to.have.lengthOf(1);
      expect(updateRequests).to.have.property('100');
      expect(updateRequests['100']).to.deep.equal({ results: [{ case_id: "200", status_id: sync.FAILED_STATUS_ID }] });
      done();
    });
  });


  it('sends BLOCKED when scenario is pending', function (done) {
    var scenarios = [
      { scenariodata: scenariodata, status: Cucumber.Status.PENDING }
    ];
    pushTestResults(syncOptions, scenarios, function (err, updateRequests) {
      expect(Object.keys(updateRequests)).to.have.lengthOf(1);
      expect(updateRequests).to.have.property('100');
      expect(updateRequests['100']).to.deep.equal({ results: [{ case_id: "200", status_id: sync.BLOCKED_STATUS_ID }] });
      done();
    });
  });


  it('does not send results when pushResults is not true', function (done) {
    var scenarios = [
      { scenariodata: scenariodata, status: Cucumber.Status.FAILED }
    ];
    pushTestResults(syncOptionsNoPush, scenarios, function (err, updateRequests) {
      expect(updateRequests).to.be.empty;
      done();
    });
  });


  it('send results when pushResults is not true but env.PUSH_RESULTS_TO_TESTRAIL is set', function (done) {
    var scenarios = [
      { scenariodata: scenariodata, status: Cucumber.Status.FAILED }
    ];
    process.env.PUSH_RESULTS_TO_TESTRAIL = '1';
    pushTestResults(syncOptionsNoPush, scenarios, function (err, updateRequests) {
      delete process.env.PUSH_RESULTS_TO_TESTRAIL;

      expect(Object.keys(updateRequests)).to.have.lengthOf(1);
      expect(updateRequests).to.have.property('100');
      expect(updateRequests['100']).to.deep.equal({ results: [{ case_id: "200", status_id: sync.FAILED_STATUS_ID }] });

      done();
    });
  });


  /* syncOptionsNoPush */


  it('does not send results if @tcid metatag is not present', function (done) {
    var scenariodata_notag = {
      name: 'test scenario',    
      steps: [],
    };
    var scenarios = [
      { scenariodata: scenariodata_notag, status: Cucumber.Status.FAILED }
    ];
    pushTestResults(syncOptions, scenarios, function (err, updateRequests) {
      expect(updateRequests).to.be.empty;
      done();
    });
  });


  it('send results to multiple runs', function (done) {
    var scenariodata201 = {
      name: 'test scenario',
      tags: [
        {
          name: "@tcid:201"
        }
      ],
      steps: [],
    };
    var scenarios = [
      { scenariodata: scenariodata, status: Cucumber.Status.FAILED },
      { scenariodata: scenariodata201, status: Cucumber.Status.PASSED }
    ];
    var options = _.cloneDeep(syncOptions);
    delete options.testrail.filters.run_id;
    pushTestResults(options, scenarios, function (err, updateRequests) {
      expect(Object.keys(updateRequests)).to.have.lengthOf(2);
      expect(updateRequests).to.have.property('100');
      expect(updateRequests['100']).to.deep.equal({ results: [{ case_id: "200", status_id: sync.FAILED_STATUS_ID }] });
      expect(updateRequests).to.have.property('101');
      expect(updateRequests['101']).to.deep.equal({ results: [{ case_id: "201", status_id: sync.PASSED_STATUS_ID }] });
      done();
    });
  });
});
