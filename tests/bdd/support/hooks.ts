import * as nock from 'nock';
import * as fsMock from 'mock-fs';
import * as path from 'path';
import {duplicateFSInMemory} from './mock-fs-helper';
import {ScenarioSynchronizer} from '../../../src/index';

/* tslint:disable:no-invalid-this max-line-length max-func-body-length */
const myHooks = function (): void {
    this.Before((scenario: any, callback: Function) => {
        process.env.SILENT = true;

        this.syncOptions = {
            testrail: {
                host: 'https://test.testrail.com',
                user: 'test',
                password: 'test',
                filters: {
                }
            },
            featuresDir: '/feature',
            stepDefinitionsDir: '/js',
            silent: true,
            directoryStructure: {
                type: 'section:slug'
            },
            newTestCase: {
                section_id: 1,
                template_id: 1,
                type_id: 6,
                priority_id: 2,
                estimate: '0m',
                custom_status: 4
            }
        };

        this.scriptError = null;

        this.fsMockConfig = {
            node_modules: duplicateFSInMemory(path.resolve('node_modules')),
            templates: duplicateFSInMemory(path.resolve('templates')),
            '/feature': {},
            '/js': {}
        };

        this.testCases = [];
        this.testCases[100] = {
            'id': '1',
            'title': 'my first test',
            'custom_steps_separated': [
                {
                    'content': 'Given That I am a tester',
                    'expected': 'Expected Result 1'
                },
                {
                    'content': 'When I am testing',
                    'expected': 'Expected Result 2'
                },
                {
                    'content': 'Then I should see test results'
                },
                {
                    'content': 'And I should be satified'
                }
            ],
            'case_id': '100',
            'custom_status': 4
        };
        this.testCases[101] = {
            'id': '1',
            'title': 'my second test',
            'custom_gherkin': 'Given That I am a tester <name>\n| name |\n| tester 1 |\n| tester 2 |\nWhen I am testing\nThen I should see test results\nAnd I should be satified',
            'case_id': '101',
            'custom_status': 5
        };

        this.pushedGherkin = '';

        nock.disableNetConnect();

        // Plan 1: a single test run with 2 test cases
        nock('https://test.testrail.com')
            .get('/index.php?/api/v2/get_plan/1')
            .reply(200, {
                'project_id': '98',
                'entries': [
                    {
                        'id': '3933d74b-4282-4c1f-be62-a641ab427063',
                        'name': 'My template',
                        'suite_id': '99',
                        'runs': [
                            { 'id': '1' }
                        ]
                    }
                ]
            }
        );

        // Get tests of the run
        nock('https://test.testrail.com')
            .get('/index.php?/api/v2/get_tests/1')
            .reply(200, (uri: any, requestBody: any) => [200, [ this.testCases[100], this.testCases[101] ]]);

        // Plan 2: a single test run with 2 test cases
        nock('https://test.testrail.com')
        .get('/index.php?/api/v2/get_plan/2')
        .reply(200, {
            'project_id': '98',
            'entries': [
                {
                'id': '3933d74b-4282-4c1f-be62-a641ab427063',
                'name': 'My template',
                'suite_id': '99',
                'runs': [
                    { 'id': '2' }
                ]
                }
            ]
        });

        // Get tests of the run
        nock('https://test.testrail.com')
        .get('/index.php?/api/v2/get_tests/2')
        .reply(200, (uri: any, requestBody: any) => [200, [this.testCases[100]]]);

        // Plan 3: two test runs
        nock('https://test.testrail.com')
        .persist()
        .get('/index.php?/api/v2/get_plan/55')
        .reply(200, {
            'project_id': '98',
            'entries': [
                {
                    'id': '3933d74b-4282-4c1f-be62-a641ab427063',
                    'name': 'My template',
                    'suite_id': '99',
                    'runs': [
                        { 'id': '56' },
                        { 'id': '57' }
                    ]
                }
            ]
        });

        // Get tests of the run
        nock('https://test.testrail.com')
        .get('/index.php?/api/v2/get_tests/56')
        .reply(200, (uri: any, requestBody: any) => [200, [this.testCases[100]]]);

        nock('https://test.testrail.com')
        .get('/index.php?/api/v2/get_tests/57')
        .reply(200, (uri: any, requestBody: any) => [200, [ this.testCases[101] ]]);

        nock('https://test.testrail.com')
        .get('/index.php?/api/v2/get_cases/98&suite_id=99')
        .reply(200, (uri: any, requestBody: any) => {
            return [200, [
                { id: 100, section_id: 2 },
                { id: 101, section_id: 1 }
            ]];
        });

        nock('https://test.testrail.com')
        .get('/index.php?/api/v2/get_sections/98&suite_id=99')
        .reply(200, (uri: any, requestBody: any) => {
            return [200, [
            { id: 1, name: 'parent section', parent_id: null },
            { id: 2, name: 'a sub section', parent_id: 1 }
            ]];
        });

        nock('https://test.testrail.com')
        .post('/index.php?/api/v2/update_case/100')
        .reply(200, (uri: any, requestBody: any) => {
            if (requestBody.custom_gherkin) {
                this.testCases[100].custom_gherkin = requestBody.custom_gherkin;
            } else if (requestBody.custom_steps) {
                this.testCases[100].custom_steps = requestBody.custom_steps;
            } else if (requestBody.custom_steps_separated) {
                this.testCases[100].custom_steps_separated = requestBody.custom_steps_separated;
            }

            return [200, this.testCases[100]];
        });

        nock('https://test.testrail.com')
        .get('/index.php?/api/v2/get_case/100')
        .reply(200, (uri: any, requestBody: any) => [200, this.testCases[100]]);

        nock('https://test.testrail.com')
        .post('/index.php?/api/v2/update_case/101')
        .reply(200, (uri: any, requestBody: any) => {
            if (requestBody.custom_gherkin) {
                this.testCases[101].custom_gherkin = requestBody.custom_gherkin;
            } else if (requestBody.custom_steps) {
                this.testCases[101].custom_steps = requestBody.custom_steps;
            } else if (requestBody.custom_steps_separated) {
                this.testCases[101].custom_steps_separated = requestBody.custom_steps_separated;
            }

            return [200, this.testCases[101]];
        });

        nock('https://test.testrail.com')
            .get('/index.php?/api/v2/get_case/101')
            .reply(200, (uri: any, requestBody: any) => [200, this.testCases[101]]);

        // Plan 4: 1 test run, to test case
        nock('https://test.testrail.com')
        .persist()
        .get('/index.php?/api/v2/get_plan/3')
        .reply(200, {
            'project_id': '98',
            'entries': [
                {
                    'id': '3933d74b-4282-4c1f-be62-a641ab427063',
                    'name': 'My template',
                    'suite_id': '99',
                    'runs': [
                        { 'id': '30' }
                    ]
                }
            ]
        });

        nock('https://test.testrail.com')
        .get('/index.php?/api/v2/get_tests/30')
        .reply(200, (uri: any, requestBody: any): any => [200, []]);

        nock('https://test.testrail.com')
        .post('/index.php?/api/v2/add_case/1')
        .reply(200, (uri: any, requestBody: any) => {
            requestBody.id = 9900;
            this.pushedGherkin = requestBody.custom_gherkin;

            return [200, requestBody];
        });

        nock('https://test.testrail.com')
        .post('/index.php?/api/v2/update_plan_entry/3/3933d74b-4282-4c1f-be62-a641ab427063')
        .reply(200, (uri: any, requestBody: any) => {
            return [200, {}];
        });

        this.ScenarioSynchronizer = ScenarioSynchronizer;
        callback();
    });

    this.After((scenario: any, callback: Function) => {
        fsMock.restore();
        callback();
    });
};

module.exports = myHooks;
