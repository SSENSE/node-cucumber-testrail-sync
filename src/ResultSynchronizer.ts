import * as TestrailApiClient from 'testrail-api';
import {pick} from 'lodash';
import {ScenarioSynchronizerOptions} from '../index.d';
import {HookScenario} from 'cucumber';

export class ResultSynchronizer {
    protected config: ScenarioSynchronizerOptions;
    public PASSED_STATUS_ID: number = 1;
    public BLOCKED_STATUS_ID: number = 2;
    public FAILED_STATUS_ID: number = 5;

    protected testrailClient: any;
    protected testruns: any;
    protected testresults: any;

    constructor(config: ScenarioSynchronizerOptions) {
        this.config = config;

        this.testrailClient = new TestrailApiClient(config.testrail);
        this.testruns = {};
        this.testresults = {};

        if (process.env.PUSH_RESULTS_TO_TESTRAIL !== undefined && Boolean(process.env.PUSH_RESULTS_TO_TESTRAIL) === true) {
            this.config.pushResults = true;
        }
    }

    public async readRemoteTestRuns(callback?: Function): Promise<any> {
        if (this.config.pushResults === true) {
            this.testruns = await this.getAllTestRuns();
        }
        if (typeof callback === 'function') {
            return callback();
        }
        return Promise.resolve();
    }

    public saveTestResult(scenario: HookScenario, callback?: Function): Promise<any> {
        if (this.config.pushResults === true) {
            const tcidArray = scenario.getTags()
                                .filter((tag: any) => tag.getName().startsWith('@tcid:'))
                                .map((tag: any) => tag.getName().split(':').pop());

            if (tcidArray.length === 1) {
                const testcaseId = tcidArray[0];

                const result = {
                    case_id: testcaseId,
                    status_id: this.PASSED_STATUS_ID,
                    comment: ''
                };

                if (process.env.TESTRAIL_RESULTS_COMMENT !== undefined) {
                    result.comment = process.env.TESTRAIL_RESULTS_COMMENT;
                }

                if (scenario.isPending()) {
                    result.status_id = this.BLOCKED_STATUS_ID;
                } else if (!scenario.isSuccessful()) {
                    result.status_id = this.FAILED_STATUS_ID;
                    const exception = scenario.getException();

                    if (typeof exception === 'string') {
                        result.comment += (result.comment.length ? '\n\n' : '') + exception;
                    } else if (typeof exception === 'object') {
                        result.comment += (result.comment.length ? '\n\n' : '') + exception.toString();

                        if (exception.stack) {
                            result.comment += '\n\n' + exception.stack;
                        }
                    }
                }

                if (result.comment.length === 0) {
                    delete result.comment;
                }

                this.testresults[testcaseId] = result;
            }
        }
        if (typeof callback === 'function') {
            return callback();
        }
        return Promise.resolve();
    }

    public async pushTestResults(callback?: Function): Promise<any> {
        if (this.config.pushResults === true) {
            for (const runId of Object.keys(this.testruns)) {
                const results: any = pick(this.testresults, this.testruns[runId].cases);
                const data = Object.keys(results).map((k: any) => results[k]);

                if (data.length > 0) {
                    await this.testrailClient.addResultsForCases(Number(runId), { results: data });
                }
            }
        }
        if (typeof callback === 'function') {
            return callback();
        }
        return Promise.resolve();
    }

    protected async getAllTestRuns(): Promise<any> {
        const runs: any = {};

        if (this.config.testrail.filters.run_id) {
            const runId = this.config.testrail.filters.run_id;
            const testcases = await this.testrailClient.getTests(runId);
            runs[runId] = {
                cases: testcases.map((t: any) => t.case_id)
            };
        } else {
            const plan = await this.testrailClient.getPlan(this.config.testrail.filters.plan_id);
            for (const planentry of plan.entries) {
                for (const run of planentry.runs) {
                    const testcases = await this.testrailClient.getTests(run.id);
                    runs[run.id] = {
                        cases: testcases.map((t: any) => t.case_id)
                    };
                }
            }
        }

        return runs;
    }
}
