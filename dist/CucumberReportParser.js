"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CucumberReportParser {
    parseReport(report) {
        this.report = report;
        this.scenarios = [];
        report.forEach((result) => {
            let testCases = result.elements;
            this.parseTestCases(testCases);
        });
        return this.scenarios;
    }
    parseTestCases(testCases) {
        testCases.forEach((testCase) => {
            let error = this.parseTestCase(testCase);
            const scenario = {
                tags: [testCase.tags[0].name],
                isPending: false,
                isUndefined: false,
                isSkipped: false,
                isSuccessful: error === null,
                exception: error,
            };
            this.scenarios.push(scenario);
        });
    }
    parseTestCase(testCase) {
        let error = null;
        testCase.steps.forEach((step) => {
            if (step.result.status !== 'passed') {
                error = `status[${step.result.status}] step[${step.name}]`;
            }
        });
        return error;
    }
}
exports.CucumberReportParser = CucumberReportParser;
//# sourceMappingURL=CucumberReportParser.js.map