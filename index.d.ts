interface TestrailOptions {
  testrail: {
    host: string;
    user: string;
    password: string;
    filters: {
      plan_id: number;
      run_id?: number;
      custom_status?: [number];
    };
    verifyFilters?: {
      custom_status?: [number];
    }
  };
}

export interface ScenarioSynchronizerOptions extends TestrailOptions {
  featuresDir: string;
  stepDefinitionsDir: string;
  overwrite?: {
    local?: boolean | string;
    remote?: boolean | string;
  };
  stepDefinitionsTemplate?: string;
  stepDefinitionsStringPatterns?: boolean;
  stepDefinitionsExpressions?: boolean;
  indent?: string;
  silent?: boolean;
  directoryStructure?: {
    type?: string;
    skipRootFolder?: number;
  };
  verify?: boolean;
  findUnused?: boolean;
  pushResults?: boolean;
  debug?: boolean;
  newTestCase?: {
    section_id: number;
    [key: string]: any;
  };
}

export class ScenarioSynchronizer {
  constructor();
  synchronize(options: ScenarioSynchronizerOptions, callback: Function): void;
}

export class ResultSynchronizer {
  constructor(options: ScenarioSynchronizerOptions);
  saveTestResult(scenario: any, callback: Function): void;
  pushTestResults(callback: Function): void;
}

export function readConfig(): ScenarioSynchronizerOptions;

export function install(cucumber: any): void;
