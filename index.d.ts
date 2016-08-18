export class ScenarioSynchronizer {
    constructor(options: any);
}

export class ResultSynchronizer {
    constructor(options: any);
    createNewTestRun(callback: Function): void;
    pushResult(scenario: any, callback: Function): void;
}

export function readConfig(): void;
