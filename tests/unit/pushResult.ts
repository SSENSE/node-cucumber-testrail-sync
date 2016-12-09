import * as _ from 'lodash';
// tslint:disable-next-line:no-var-requires variable-name
const Cucumber = require('cucumber');
import {expect} from 'chai';
import {ResultSynchronizer} from '../../src/index';
import * as testrailmock from './pushResult-fixture';
import {ScenarioSynchronizerOptions} from '../../index.d';

const syncOptions = {
    testrail: {
        host: 'https://test.testrail.com',
        user: 'test',
        password: 'test',
        filters: {
            plan_id: 10,
            run_id: 100
        }
    },
    pushResults: true,
    featuresDir: 'test',
    stepDefinitionsDir: 'test'
};

const syncOptionsNoPush = _.clone(syncOptions);
delete syncOptionsNoPush.pushResults;

const pushTestResults = async (options: any, scenarios: any, callback: Function): Promise<void> => {
    const sync = new ResultSynchronizer(<ScenarioSynchronizerOptions> options);

    testrailmock.pushResultsMock();

    await sync.readRemoteTestRuns();

    for (const scenarioContent of scenarios) {
        const astscenario = Cucumber.Ast.Scenario(scenarioContent.scenariodata);
        const scenarioResult = Cucumber.Runtime.ScenarioResult(astscenario);
        const step = Cucumber.Ast.Step({});
        const stepResultData = {
            status: scenarioContent.status,
            step: step
        };
        if (scenarioContent.failureException) {
            (<any> stepResultData).failureException = scenarioContent.failureException;
        }
        const stepResult = Cucumber.Runtime.StepResult(stepResultData);
        scenarioResult.witnessStepResult(stepResult);
        const scenario = Cucumber.Api.Scenario(astscenario, scenarioResult);

        await sync.saveTestResult(scenario);
    }

    await sync.pushTestResults();
    callback(null, testrailmock.getPushResultsRequest());
};

describe('Send results to TestRail', () => {
    const sync = new ResultSynchronizer(<ScenarioSynchronizerOptions> syncOptions);

    const scenariodata: any = {
        name: 'test scenario',
        tags: [{ name: '@tcid:200' }],
        steps: []
    };

    before((done: Function) => {
        testrailmock.setupMock();
        done();
    });

    it('sends PASSED when scenario is successful', (done: Function) => {
        const scenarios = [
            { scenariodata: scenariodata, status: Cucumber.Status.PASSED }
        ];
        pushTestResults(syncOptions, scenarios, (err: any, updateRequests: any) => {
            expect(Object.keys(updateRequests)).to.have.lengthOf(1);
            expect(updateRequests).to.have.property('100');
            expect(updateRequests['100']).to.deep.equal({ results: [{ case_id: '200', status_id: sync.PASSED_STATUS_ID }] });
            done();
        });
    });

    it('sends FAILED when scenario is failed', (done: Function) => {
        const scenarios = [
            { scenariodata: scenariodata, status: Cucumber.Status.FAILED }
        ];
        pushTestResults(syncOptions, scenarios, (err: any, updateRequests: any) => {
            expect(Object.keys(updateRequests)).to.have.lengthOf(1);
            expect(updateRequests).to.have.property('100');
            expect(updateRequests['100']).to.deep.equal({ results: [{ case_id: '200', status_id: sync.FAILED_STATUS_ID }] });
            done();
        });
    });

    it('sends FAILED when scenario is failed with exception', (done: Function) => {
        const error = new Error('An error');
        error.stack = 'A stack trace';
        const scenarios = [
            {
                scenariodata: scenariodata,
                status: Cucumber.Status.FAILED,
                failureException: error
            }
        ];

        pushTestResults(syncOptions, scenarios, (err: any, updateRequests: any) => {
            expect(Object.keys(updateRequests)).to.have.lengthOf(1);
            expect(updateRequests).to.have.property('100');
            expect(updateRequests['100']).to.deep.equal({ results: [{
                case_id: '200',
                status_id: sync.FAILED_STATUS_ID,
                comment: 'Error: An error\n\nA stack trace'
            }] });
            done();
        });
    });

    it('sends BLOCKED when scenario is pending', (done: Function) => {
        const scenarios = [
            { scenariodata: scenariodata, status: Cucumber.Status.PENDING }
        ];
        pushTestResults(syncOptions, scenarios, (err: any, updateRequests: any) => {
            expect(Object.keys(updateRequests)).to.have.lengthOf(1);
            expect(updateRequests).to.have.property('100');
            expect(updateRequests['100']).to.deep.equal({ results: [{ case_id: '200', status_id: sync.BLOCKED_STATUS_ID }] });
            done();
        });
    });

    it('does not send results when pushResults is not true', (done: Function) => {
        const scenarios = [
            { scenariodata: scenariodata, status: Cucumber.Status.FAILED }
        ];
        pushTestResults(syncOptionsNoPush, scenarios, (err: any, updateRequests: any) => {
            expect(updateRequests).to.be.empty;
            done();
        });
    });

    it('send results when pushResults is not true but env.PUSH_RESULTS_TO_TESTRAIL is set', (done: Function) => {
        const scenarios = [
            { scenariodata: scenariodata, status: Cucumber.Status.FAILED }
        ];
        process.env.PUSH_RESULTS_TO_TESTRAIL = '1';
        pushTestResults(syncOptionsNoPush, scenarios, (err: any, updateRequests: any) => {
            delete process.env.PUSH_RESULTS_TO_TESTRAIL;

            expect(Object.keys(updateRequests)).to.have.lengthOf(1);
            expect(updateRequests).to.have.property('100');
            expect(updateRequests['100']).to.deep.equal({ results: [{ case_id: '200', status_id: sync.FAILED_STATUS_ID }] });

            done();
        });
    });

    it('does not send results if @tcid metatag is not present', (done: Function) => {
        const scenariodataNotag: any = {
            name: 'test scenario'
        };
        scenariodataNotag.steps = [];
        const scenarios = [
            { scenariodata: scenariodataNotag, status: Cucumber.Status.FAILED }
        ];
        pushTestResults(syncOptions, scenarios, (err: any, updateRequests: any) => {
            expect(updateRequests).to.be.empty;
            done();
        });
    });

    it('send results to multiple runs', (done: Function) => {
        const scenariodata201: any = {
            name: 'test scenario',
            tags: [{ name: '@tcid:201' }]
        };
        scenariodata201.steps = [];
        const scenarios = [
            { scenariodata: scenariodata, status: Cucumber.Status.FAILED },
            { scenariodata: scenariodata201, status: Cucumber.Status.PASSED }
        ];
        const options = _.cloneDeep(syncOptions);
        delete options.testrail.filters.run_id;
        pushTestResults(options, scenarios, (err: any, updateRequests: any) => {
            expect(Object.keys(updateRequests)).to.have.lengthOf(2);
            expect(updateRequests).to.have.property('100');
            expect(updateRequests['100']).to.deep.equal({ results: [{ case_id: '200', status_id: sync.FAILED_STATUS_ID }] });
            expect(updateRequests).to.have.property('101');
            expect(updateRequests['101']).to.deep.equal({ results: [{ case_id: '201', status_id: sync.PASSED_STATUS_ID }] });
            done();
        });
    });
});
