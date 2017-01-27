import {expect} from 'chai';
import * as fsMock from 'mock-fs';
import * as glob from 'glob';
import * as fs from 'fs';

/* tslint:disable:no-invalid-this */
module.exports = function (): void {
    this.Given(/^I use a TestPlan with 1 TestRun and 2 TestCases$/, (callback: Function) => {
        this.syncOptions.testrail.filters.plan_id = 1;
        this.syncOptions.testrail.filters.run_id = 1;
        callback();
    });

    this.Given(/^I use a TestPlan with 1 TestRun and 1 TestCase$/, (callback: Function) => {
        this.syncOptions.testrail.filters.plan_id = 2;
        this.syncOptions.testrail.filters.run_id = 2;
        callback();
    });

    this.Given(/^I use a TestPlan with 2 TestRuns with 1 TestCase in each$/, (callback: Function) => {
        this.syncOptions.testrail.filters.plan_id = 55;
        callback();
    });

    this.Given(/^I use a TestPlan with 1 TestRun and 0 TestCase$/, (callback: Function) => {
        this.syncOptions.testrail.filters.plan_id = 3;
        callback();
    });

    this.Given(/^I set the (.*) option to "(.*)"$/, (optionName: string, optionValue: string, callback: Function) => {
        const splitted = optionName.split('.');
        let opts = this.syncOptions;

        for (let i = 0; i < splitted.length - 1; i++) {
            opts[splitted[i]] = opts[splitted[i]] || {};
            opts = opts[splitted[i]];
        }
        // convert string to array
        if (optionName === 'testrail.filters.custom_status') {
            // tslint:disable-next-line:no-eval
            optionValue = eval(optionValue);
        }
        opts[splitted[splitted.length - 1]] = optionValue;

        callback();
    });

    this.Given(/^There is a file named "(.*)" with the content:$/, (filePath: string, fileContent: string, callback: Function) => {
        this.fsMockConfig['/feature/parent-section'] = {};
        this.fsMockConfig['/feature/parent-section/a-sub-section'] = {};

        this.fsMockConfig[filePath] = fsMock.file({
            content: fileContent,
            ctime: new Date(1),
            mtime: new Date(1)
        });

        callback();
    });

    this.Given(/^The (first|second) case contains the following gherkin$/, (type: string, data: string, callback: Function) => {
        const id = (type === 'first' ? 100 : 101);
        this.testCases[id].custom_gherkin = data;
        callback();
    });

    this.When(/^I run the synchronization script$/, (callback: Function) => {
        fsMock(this.fsMockConfig);

        const sync = new this.ScenarioSynchronizer();
        sync.synchronize(this.syncOptions, (err: any) => {
            if (this.syncOptions.verify === true || this.syncOptions.findUnused === true) {
                this.scriptError = err || null;
                return callback();
            }
            callback(err);
        });
    });

    this.Then(/^There should be (\d+) (\w+) file[s]? on the file system$/, (fileCount: string, fileType: string, callback: Function) => {
        if (fileType === 'feature') {
            expect(glob.sync(this.syncOptions.featuresDir + '/**/*.feature')).to.have.lengthOf(Number(fileCount));
        } else {
            expect(glob.sync(this.syncOptions.stepDefinitionsDir + '/**/*.*')).to.have.lengthOf(Number(fileCount));
        }

        callback();
    });

    this.Then(/^The file "(.*)" should have the following content:$/, (filePath: string, fileContent: string, callback: Function) => {
        expect(fs.readFileSync(filePath).toString()).to.equal(fileContent);
        callback();
    });

    this.Then(/^The pushed testcase should have the following gherkin:$/, (gherkins: string, callback: Function) => {
        expect(this.pushedGherkin).to.be.equal(gherkins);
        callback();
    });
};
