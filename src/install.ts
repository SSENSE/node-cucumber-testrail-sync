import {readConfig} from './readConfig';
import {ResultSynchronizer} from './ResultSynchronizer';
import {Scenario} from './index';

// tslint:disable-next-line:variable-name
const installHandlers = (registerHandler: any, After: any): void => {
    const testResultSync = new ResultSynchronizer(readConfig());

    registerHandler('BeforeFeatures', (features: any, callback: Function) => {
        testResultSync.readRemoteTestRuns(callback);
    });

    After((cucumberScenario: any, callback: Function) => {
        const scenario: Scenario = {
            tags: [],
            isPending: cucumberScenario.isPending(),
            isUndefined: cucumberScenario.isUndefined(),
            isSkipped: cucumberScenario.isSkipped(),
            isSuccessful: cucumberScenario.isSuccessful ? cucumberScenario.isSuccessful() : cucumberScenario.isPassed(),
            exception: null
        };

        // cucumber-js v1.x
        if (cucumberScenario.getTags) {
            scenario.tags = cucumberScenario.getTags().map((tag: any) => tag.getName());
            scenario.exception = cucumberScenario.getException();
        } else {
            // cucumber-js v2.x
            // Hooks now receive a ScenarioResult instead of the Scenario
            scenario.tags = cucumberScenario.scenario.tags.map((tag: any) => tag.name);
            scenario.exception = cucumberScenario.failureException;
        }

        testResultSync.saveTestResult(scenario, callback);
    });

    registerHandler('AfterFeatures', (features: any, callback: Function) => {
        testResultSync.pushTestResults(callback);
    });
};

export const legacyInstall = (cucumber: any) => {
    installHandlers(cucumber.registerHandler, cucumber.After);
};

export const install = (cucumber: any) => {
    const testResultSync = new ResultSynchronizer(readConfig());

    cucumber.defineSupportCode((obj: any) => {
        installHandlers(obj.registerHandler, obj.After);
    });
};
