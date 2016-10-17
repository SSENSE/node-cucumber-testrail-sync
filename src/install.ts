import {readConfig} from './readConfig';
import {Hooks, HookScenario} from 'cucumber';
import {ResultSynchronizer} from './ResultSynchronizer';

export const install = (cucumber: Hooks) => {
    const testResultSync = new ResultSynchronizer(readConfig());

    cucumber.registerHandler('BeforeFeatures', (features: any, callback: Function) => {
        testResultSync.readRemoteTestRuns(callback);
    });

    cucumber.After((scenario: HookScenario, callback: Function) => {
        testResultSync.saveTestResult(scenario, callback);
    });

    cucumber.registerHandler('AfterFeatures', (features: any, callback: Function) => {
        testResultSync.pushTestResults(callback);
    });
};
