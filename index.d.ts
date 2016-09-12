interface TestrailOptions {
  testrail: {
    host: string;
    user: string;
    password: string;
    filters: {
      plan_id: number;
      run_id?: number;
    }
  };
}

interface ScenarioSynchronizerOptions extends TestrailOptions {
  featuresDir: string;
  stepDefinitionsDir: string;
  overwrite?: {
    local?: boolean | string;
    remote?: boolean | string;
  };
  stepDefinitionsTemplate?: string;
  indent?: string;
  silent?: boolean;
  directoryStructure?: {
    type?: string;
    skipRootFolder?: number;
  };
  verify?: boolean;
}

interface ResultSynchronizerOptions extends TestrailOptions {
  pushResults?: boolean;
}

export class ScenarioSynchronizer {
  constructor();
  synchronize(options: ScenarioSynchronizerOptions, callback: Function): void;
}

export class ResultSynchronizer {
  constructor(options: ResultSynchronizerOptions);
  saveTestResult(scenario: any, callback: Function): void;
  pushTestResults(callback: Function): void;
}

export function readConfig(): ResultSynchronizerOptions;

export function install(cucumber: any): void;
