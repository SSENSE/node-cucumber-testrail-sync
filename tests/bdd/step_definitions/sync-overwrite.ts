import {expect} from 'chai';
import * as fs from 'fs';
import * as TestrailApiClient from 'testrail-api';

/* tslint:disable:no-invalid-this */
module.exports = function (): void {
    this.Given(/^I (enable|disable) the (.*) option$/, (action: string, optionName: string, callback: Function) => {
        const splitted = optionName.split('.');
        let opts = this.syncOptions;

        for (let i = 0; i < splitted.length - 1; i++) {
            opts[splitted[i]] = opts[splitted[i]] || {};
            opts = opts[splitted[i]];
        }
        opts[splitted[splitted.length - 1]] = (action === 'enable');

        callback();
    });

    this.Given(/^I (confirm|deny) the overwrite$/, (actionType: string, callback: Function) => {
        this.ScenarioSynchronizer.FORCE_CONFIRMATION_PROMPT(actionType === 'confirm');

        callback();
    });

    this.Then(/^The file "(.*)" should not have been modified$/, (filePath: string, callback: Function) => {
        expect(fs.statSync(filePath).mtime.getTime()).to.equal(new Date(1).getTime());

        callback();
    });

    this.Then(/^The TestCase should have the following Gherkins:$/, (gherkins: string, callback: Function) => {
        const testrail = new TestrailApiClient({
            host: 'https://test.testrail.com',
            user: 'test',
            password: 'test'
        });

        testrail.getCase(100, (err: any, testcase: any) => {
            expect(testcase).to.be.an('object');

            if (testcase.custom_gherkin) {
                expect(testcase.custom_gherkin).to.be.equal(gherkins);
            } else if (testcase.custom_steps) {
                expect(testcase.custom_steps).to.be.equal(gherkins);
            } else if (testcase.custom_steps_separated) {
                const stepsSeparated = gherkins.split('\n').map((s: string) => { return { content: s }; });
                const testCaseSteps = testcase.custom_steps_separated.map((s: any) => { return { content: s.content }; });
                expect(testCaseSteps).to.deep.equal(stepsSeparated);
            }

            callback();
        });
    });
};
