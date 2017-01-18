import * as _ from 'lodash';
import {expect} from 'chai';
import {ResultSynchronizer, Scenario} from '../../src/index';
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

    for (const scenario of scenarios) {
        await sync.saveTestResult(scenario);
    }

    await sync.pushTestResults();
    callback(null, testrailmock.getPushResultsRequest());
};

describe('Send results to TestRail', () => {
    before((done: Function) => {
        testrailmock.setupMock();
        done();
    });

    it('sends PASSED when scenario is successful', (done: Function) => {
        const scenarios = [
            <Scenario> {
                tags: ['@tcid:200'],
                isPending: false,
                isUndefined: false,
                isSkipped: false,
                isSuccessful: true
            }
        ];
        pushTestResults(syncOptions, scenarios, (err: any, updateRequests: any) => {
            expect(Object.keys(updateRequests)).to.have.lengthOf(1);
            expect(updateRequests).to.have.property('100');
            expect(updateRequests['100']).to.deep.equal({ results: [{ case_id: '200', status_id: ResultSynchronizer.PASSED_STATUS_ID }] });
            done();
        });
    });

    it('sends FAILED when scenario is failed', (done: Function) => {
        const scenarios = [
            <Scenario> {
                tags: ['@tcid:200'],
                isPending: false,
                isUndefined: false,
                isSkipped: false,
                isSuccessful: false
            }
        ];
        pushTestResults(syncOptions, scenarios, (err: any, updateRequests: any) => {
            expect(Object.keys(updateRequests)).to.have.lengthOf(1);
            expect(updateRequests).to.have.property('100');
            expect(updateRequests['100']).to.deep.equal({ results: [{ case_id: '200', status_id: ResultSynchronizer.FAILED_STATUS_ID }] });
            done();
        });
    });

    it('sends FAILED when scenario is failed with exception', (done: Function) => {
        const error = new Error('An error');
        error.stack = 'A stack trace';
        const scenarios = [
            <Scenario> {
                tags: ['@tcid:200'],
                isPending: false,
                isUndefined: false,
                isSkipped: false,
                isSuccessful: false,
                exception: error
            }
        ];

        pushTestResults(syncOptions, scenarios, (err: any, updateRequests: any) => {
            expect(Object.keys(updateRequests)).to.have.lengthOf(1);
            expect(updateRequests).to.have.property('100');
            expect(updateRequests['100']).to.deep.equal({ results: [{
                case_id: '200',
                status_id: ResultSynchronizer.FAILED_STATUS_ID,
                comment: 'Error: An error\n\nA stack trace'
            }] });
            done();
        });
    });

    it('sends BLOCKED when scenario is pending', (done: Function) => {
        const scenarios = [
            <Scenario> {
                tags: ['@tcid:200'],
                isPending: true,
                isUndefined: false,
                isSkipped: false,
                isSuccessful: false
            }
        ];
        pushTestResults(syncOptions, scenarios, (err: any, updateRequests: any) => {
            expect(Object.keys(updateRequests)).to.have.lengthOf(1);
            expect(updateRequests).to.have.property('100');
            expect(updateRequests['100']).to.deep.equal({ results: [{ case_id: '200', status_id: ResultSynchronizer.BLOCKED_STATUS_ID }] });
            done();
        });
    });

    it('does not send results when pushResults is not true', (done: Function) => {
        const scenarios = [
            <Scenario> {
                tags: ['@tcid:200'],
                isPending: false,
                isUndefined: false,
                isSkipped: false,
                isSuccessful: false
            }
        ];
        pushTestResults(syncOptionsNoPush, scenarios, (err: any, updateRequests: any) => {
            expect(updateRequests).to.be.empty;
            done();
        });
    });

    it('send results when pushResults is not true but env.PUSH_RESULTS_TO_TESTRAIL is set', (done: Function) => {
        const scenarios = [
            <Scenario> {
                tags: ['@tcid:200'],
                isPending: false,
                isUndefined: false,
                isSkipped: false,
                isSuccessful: false
            }
        ];
        process.env.PUSH_RESULTS_TO_TESTRAIL = '1';
        pushTestResults(syncOptionsNoPush, scenarios, (err: any, updateRequests: any) => {
            delete process.env.PUSH_RESULTS_TO_TESTRAIL;

            expect(Object.keys(updateRequests)).to.have.lengthOf(1);
            expect(updateRequests).to.have.property('100');
            expect(updateRequests['100']).to.deep.equal({ results: [{ case_id: '200', status_id: ResultSynchronizer.FAILED_STATUS_ID }] });

            done();
        });
    });

    it('does not send results if @tcid metatag is not present', (done: Function) => {
        const scenarios = [
            <Scenario> {
                tags: [],
                isPending: false,
                isUndefined: false,
                isSkipped: false,
                isSuccessful: false
            }
        ];
        pushTestResults(syncOptions, scenarios, (err: any, updateRequests: any) => {
            expect(updateRequests).to.be.empty;
            done();
        });
    });

    it('send results to multiple runs', (done: Function) => {
        const scenarios = [
            <Scenario> {
                tags: ['@tcid:200'],
                isPending: false,
                isUndefined: false,
                isSkipped: false,
                isSuccessful: false
            },
            <Scenario> {
                tags: ['@tcid:201'],
                isPending: false,
                isUndefined: false,
                isSkipped: false,
                isSuccessful: true
            }
        ];
        const options = _.cloneDeep(syncOptions);
        delete options.testrail.filters.run_id;
        pushTestResults(options, scenarios, (err: any, updateRequests: any) => {
            expect(Object.keys(updateRequests)).to.have.lengthOf(2);
            expect(updateRequests).to.have.property('100');
            expect(updateRequests['100']).to.deep.equal({ results: [{ case_id: '200', status_id: ResultSynchronizer.FAILED_STATUS_ID }] });
            expect(updateRequests).to.have.property('101');
            expect(updateRequests['101']).to.deep.equal({ results: [{ case_id: '201', status_id: ResultSynchronizer.PASSED_STATUS_ID }] });
            done();
        });
    });

    it('pushTestResult function', async (): Promise<void> => {
        testrailmock.pushResultsMock();

        const syncOptionsNoRunId = _.clone(syncOptions);
        delete syncOptionsNoRunId.testrail.filters.run_id;
        await ResultSynchronizer.pushTestResult(<ScenarioSynchronizerOptions> syncOptionsNoRunId, 201, ResultSynchronizer.FAILED_STATUS_ID);

        const updateRequests = testrailmock.getPushResultsRequest();

        expect(Object.keys(updateRequests)).to.have.lengthOf(1);
        expect(updateRequests).to.have.property('101');
        expect(updateRequests['101']).to.deep.equal({ status_id: ResultSynchronizer.FAILED_STATUS_ID });
    });
});
