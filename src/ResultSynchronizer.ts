import * as TestrailApiClient from 'testrail-api';
import {pick} from 'lodash';
import {ScenarioSynchronizerOptions} from '../index.d';
import {Scenario} from './index';

export class ResultSynchronizer {
    protected config: ScenarioSynchronizerOptions;
    public static PASSED_STATUS_ID: number = 1;
    public static BLOCKED_STATUS_ID: number = 2;
    public static FAILED_STATUS_ID: number = 5;

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
        /* istanbul ignore next */
        if (typeof callback === 'function') {
            return callback();
        }
        return Promise.resolve();
    }

    public saveTestResult(scenario: Scenario, callback?: Function): Promise<any> {
        if (this.config.pushResults === true) {
            const tcidArray = scenario.tags
                                .filter((tag: any) => tag.startsWith('@tcid:'))
                                .map((tag: any) => tag.split(':').pop());

            if (tcidArray.length === 1) {
                const testcaseId = tcidArray[0];

                const result = {
                    case_id: testcaseId,
                    status_id: ResultSynchronizer.PASSED_STATUS_ID,
                    comment: ''
                };

                /* istanbul ignore next */
                if (process.env.TESTRAIL_RESULTS_COMMENT !== undefined) {
                    result.comment = process.env.TESTRAIL_RESULTS_COMMENT;
                }

                if (scenario.isPending || scenario.isUndefined || scenario.isSkipped) {
                    result.status_id = ResultSynchronizer.BLOCKED_STATUS_ID;
                } else if (!scenario.isSuccessful) {
                    result.status_id = ResultSynchronizer.FAILED_STATUS_ID;
                    const exception = scenario.exception;

                    if (typeof exception === 'string') {
                        result.comment += (result.comment.length ? '\n\n' : '') + exception;
                    } else if (typeof exception === 'object' && exception !== null) {
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
        /* istanbul ignore next */
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
        /* istanbul ignore next */
        if (typeof callback === 'function') {
            return callback();
        }
        return Promise.resolve();
    }

    public static async pushTestResult(config: ScenarioSynchronizerOptions, testcaseId: number, statusId: number): Promise<any> {
        const testrailClient = new TestrailApiClient(config.testrail);
        const plan = await testrailClient.getPlan(config.testrail.filters.plan_id);
        let runId = 0;

        if (config.testrail.filters.run_id) {
            runId = config.testrail.filters.run_id;
        } else {
            let doBreak = false;
            for (const planentry of plan.entries) {
                for (const run of planentry.runs) {
                    const testcases = await testrailClient.getTests(run.id);
                    const cases = testcases.filter((t: any) => {
                        return t.case_id === testcaseId;
                    });

                    if (cases.length) {
                        runId = run.id;
                        doBreak = true;
                    }
                    if (doBreak) {
                        break;
                    }
                }
                if (doBreak) {
                    break;
                }
            }
        }

        if (runId === 0) {
            return Promise.reject(new Error('Case ID not found in the Test Plan'));
        }
        return testrailClient.addResultForCase(runId, testcaseId, { status_id: statusId });
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
