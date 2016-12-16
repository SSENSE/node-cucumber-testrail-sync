import * as nock from 'nock';

let results: any;

export const setupMock = () => {
    const testplan = {
        id: 10,
        entries: [
            {
                runs: [
                    { id: 100, tests: [{ case_id: 200 }] }
                ]
            },
            {
                runs: [
                    { id: 101, tests: [{ case_id: 201 }] }
                ]
            }
        ]
    };

    nock.disableNetConnect();

    nock('https://test.testrail.com')
        .persist()
        .get('/index.php?/api/v2/get_plan/10')
        .reply(200, (uri: any, requestBody: any) => testplan);

    nock('https://test.testrail.com')
        .persist()
        .get('/index.php?/api/v2/get_tests/100')
        .reply(200, (uri: any, requestBody: any) => testplan.entries[0].runs[0].tests);

    nock('https://test.testrail.com')
        .persist()
        .get('/index.php?/api/v2/get_tests/101')
        .reply(200, (uri: any, requestBody: any) => testplan.entries[1].runs[0].tests);
};

export const pushResultsMock = () => {
    results = {};

    nock.disableNetConnect();

    nock('https://test.testrail.com')
    .persist()
    .post('/index.php?/api/v2/add_results_for_cases/100')
    .reply(200, (uri: any, requestBody: any) => {
        results[100] = requestBody;
        return {
            id: 1
        };
    });

    nock('https://test.testrail.com')
    .persist()
    .post('/index.php?/api/v2/add_results_for_cases/101')
    .reply(200, (uri: any, requestBody: any) => {
        results[101] = requestBody;
        return {
            id: 1
        };
    });

    nock('https://test.testrail.com')
    .persist()
    .post('/index.php?/api/v2/add_result_for_case/101/201')
    .reply(200, (uri: any, requestBody: any) => {
        results[101] = requestBody;
        return {
            id: 1
        };
    });
};

export const getPushResultsRequest = () => results;
