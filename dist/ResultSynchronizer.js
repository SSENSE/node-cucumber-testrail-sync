"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const TestrailApiClient = require("testrail-api");
const lodash_1 = require("lodash");
class ResultSynchronizer {
    constructor(config) {
        this.config = config;
        this.testrailClient = new TestrailApiClient(config.testrail);
        this.testruns = {};
        this.testresults = {};
        if (process.env.PUSH_RESULTS_TO_TESTRAIL !== undefined && Boolean(process.env.PUSH_RESULTS_TO_TESTRAIL) === true) {
            this.config.pushResults = true;
        }
    }
    readRemoteTestRuns(callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.config.pushResults === true) {
                this.testruns = yield this.getAllTestRuns();
            }
            /* istanbul ignore next */
            if (typeof callback === 'function') {
                return callback();
            }
            return Promise.resolve();
        });
    }
    saveTestResult(scenario, callback) {
        if (this.config.pushResults === true) {
            const tcidArray = scenario.tags
                .filter((tag) => tag.startsWith('@tcid:'))
                .map((tag) => tag.split(':').pop());
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
                }
                else if (!scenario.isSuccessful) {
                    result.status_id = ResultSynchronizer.FAILED_STATUS_ID;
                    const exception = scenario.exception;
                    if (typeof exception === 'string') {
                        result.comment += (result.comment.length ? '\n\n' : '') + exception;
                    }
                    else if (typeof exception === 'object' && exception !== null) {
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
    pushTestResults(callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.config.pushResults === true) {
                for (const runId of Object.keys(this.testruns)) {
                    const results = lodash_1.pick(this.testresults, this.testruns[runId].cases);
                    const data = Object.keys(results).map((k) => results[k]);
                    if (data.length > 0) {
                        yield this.testrailClient.addResultsForCases(Number(runId), { results: data });
                    }
                }
            }
            /* istanbul ignore next */
            if (typeof callback === 'function') {
                return callback();
            }
            return Promise.resolve();
        });
    }
    static pushTestResult(config, testcaseId, statusId) {
        return __awaiter(this, void 0, void 0, function* () {
            const testrailClient = new TestrailApiClient(config.testrail);
            const plan = yield testrailClient.getPlan(config.testrail.filters.plan_id);
            let runId = 0;
            if (config.testrail.filters.run_id) {
                runId = config.testrail.filters.run_id;
            }
            else {
                let doBreak = false;
                for (const planentry of plan.entries) {
                    for (const run of planentry.runs) {
                        const testcases = yield testrailClient.getTests(run.id);
                        const cases = testcases.filter((t) => {
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
        });
    }
    getAllTestRuns() {
        return __awaiter(this, void 0, void 0, function* () {
            const runs = {};
            if (this.config.testrail.filters.run_id) {
                const runId = this.config.testrail.filters.run_id;
                const testcases = yield this.testrailClient.getTests(runId);
                runs[runId] = {
                    cases: testcases.map((t) => t.case_id)
                };
            }
            else {
                const plan = yield this.testrailClient.getPlan(this.config.testrail.filters.plan_id);
                for (const planentry of plan.entries) {
                    for (const run of planentry.runs) {
                        const testcases = yield this.testrailClient.getTests(run.id);
                        runs[run.id] = {
                            cases: testcases.map((t) => t.case_id)
                        };
                    }
                }
            }
            return runs;
        });
    }
}
ResultSynchronizer.PASSED_STATUS_ID = 1;
ResultSynchronizer.BLOCKED_STATUS_ID = 2;
ResultSynchronizer.FAILED_STATUS_ID = 5;
exports.ResultSynchronizer = ResultSynchronizer;
//# sourceMappingURL=ResultSynchronizer.js.map