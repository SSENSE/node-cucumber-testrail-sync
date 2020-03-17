import { Scenario, TestCaseReport, Step } from './index';

export class CucumberReportParser {
  protected report: any[];
  protected scenarios: Scenario[];

  public parseReport(report: TestCaseReport[]): Scenario[] {
    this.report = report;
    this.scenarios = [];
    report.forEach((result: any) => {
      this.parseTestCases(result.elements);
    });
    return this.scenarios;
  }

  protected parseTestCases(testCases: TestCaseReport[]): void {
    testCases.forEach((testCase: TestCaseReport) => {
      const error = this.parseTestCase(testCase);
      const scenario = <Scenario> {
        tags: [testCase.tags[0].name],
        isPending: false,
        isUndefined: false,
        isSkipped: false,
        isSuccessful: error === null,
        exception: error
      };
      this.scenarios.push(scenario);
    });
  }

  protected parseTestCase(testCase: TestCaseReport): Error {
    let error = null;
    testCase.steps.forEach((step: Step) => {
      if (step.result.status !== 'passed') {
        error = `status[${step.result.status}] step[${step.name}]`;
      }
    });
    return error;
  }
}
