// tslint:disable-next-line:no-reference
/// <reference path="../typings.d.ts" />
export { ScenarioSynchronizer } from './ScenarioSynchronizer';
export { ResultSynchronizer } from './ResultSynchronizer';
export { CucumberReportParser } from './CucumberReportParser';

export { readConfig } from './readConfig';
export { install, legacyInstall } from './install';

export interface Scenario {
  tags: string[];
  isPending: boolean;
  isUndefined: boolean;
  isSkipped: boolean;
  isSuccessful: boolean;
  exception: Error;
}

export interface TestCaseReport {
  id: Number;
  name: string;
  tags: Tag[];
  type: string;
  steps: Array<Step>;
}

export interface Step {
  keyword: string;
  line: Number;
  name: string;
  result: StepResult;
}

export interface StepResult {
  status: string;
  duration: Number;
}

export interface Tag {
  line: Number;
  name: String;
}
