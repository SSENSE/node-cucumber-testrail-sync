export const fixtures = {
  good: [
    {
      keyword: 'Feature',
      name: 'Test Cases',
      line: 1,
      id: 'test-cases',
      tags: [],
      uri: 'login.feature',
      elements: [
        {
          id: 'test-cases;login',
          keyword: 'Scenario',
          line: 3,
          name: 'Login',
          tags: [
            {
              name: '@tcid:77980',
              line: 2
            }
          ],
          type: 'scenario',
          steps: [
            {
              arguments: [],
              keyword: 'Given ',
              line: 4,
              name: 'I am on my page',
              result: {
                status: 'passed',
                duration: 8021000000
              }
            },
            {
              arguments: [],
              keyword: 'When ',
              line: 5,
              name: 'I log as a valid user',
              result: {
                status: 'passed',
                duration: 9687000000
              }
            },
            {
              arguments: [],
              keyword: 'Then ',
              line: 6,
              name: 'I see the News Line',
              result: {
                status: 'passed',
                duration: 7555000000
              }
            }
          ]
        }
      ]
    }
  ],
  emptyElements: [
    {
      keyword: 'Feature',
      name: 'Test Cases',
      line: 1,
      id: 'test-cases',
      tags: [],
      uri: 'login.feature',
      elements: []
    }
  ],
  empty: [],
  errorOnLastStep: [
    {
      keyword: 'Feature',
      name: 'Test Cases',
      line: 1,
      id: 'test-cases',
      tags: [],
      uri: 'login.feature',
      elements: [
        {
          id: 'test-cases;login',
          keyword: 'Scenario',
          line: 3,
          name: 'Login',
          tags: [
            {
              name: '@tcid:77980',
              line: 2
            }
          ],
          type: 'scenario',
          steps: [
            {
              arguments: [],
              keyword: 'Given ',
              line: 4,
              name: 'I am on my page',
              result: {
                status: 'passed',
                duration: 8021000000
              }
            },
            {
              arguments: [],
              keyword: 'When ',
              line: 5,
              name: 'I log as a valid user',
              result: {
                status: 'passed',
                duration: 9687000000
              }
            },
            {
              arguments: [],
              keyword: 'Then ',
              line: 6,
              name: 'I see the News Line',
              result: {
                status: 'failed',
                duration: 7555000000
              }
            }
          ]
        }
      ]
    }
  ]
};
