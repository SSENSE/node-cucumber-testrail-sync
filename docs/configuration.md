# Configuration

Each project should have its own Test Plan, with each features having their own Test Run.

To get started, create the `.testrail-sync.js` file at the root of your project :

```js
module.exports = {
  testrail: {
    host: 'https://YOURACCOUNT.testrail.com',
    user: '',
    password: '',  // password or api key
    filters: {
      plan_id: '', // required: the project's plan id
      run_id: '',  // optional: a test run
                   // if not set, all the runs in the plan will be included
      custom_status: [3, 4] // optional list of whitelisted status (testcases that don't have 1 of thoses statuses won't be synced)
                     // 3 = Approved
                     // 4 = Approved to automate
    }
  },
  /* Optional: default testcase attributes when pushing new testcases to TestRail
  newTestCase: {
    section_id: 1,
    template_id: 1,
    type_id: 6,
    priority_id: 2,
    estimate: '0',
    custom_status: 4
  }
  */
};
```

There are other possible options:

  * __overwrite__: Toggle the local .feature file overwrite _OR_ remote test case overwrite if the local Gherkin doesn't match the Gherkin from TestRail.

  ```js
  overwrite: {
    local: 'ask', // 'ask' will show you the differences and force you to confirm before overwriting
    remote: false,
  }
  ```

  * __stepDefinitionsTemplate__:  The template to use to generate blank step definition files - Possible values:

    * for cucumber-js >= 2.x: `es5.js`, `es6.js`, `typescript.ts`

    * for cucumber-js 1.x: `es5.legacy.js`, `es6.legacy.js`, `typescript.legacy.ts`

    * other: `ruby.rb`

  * __indent__: The indentation character(s) to use when generating `.feature` or `.js` files (ie. `indent: '    '`, default: 2 spaces)

  * __featuresDir__: The directory where `.feature` files should be created (default: `features`)

  * __stepDefinitionsDir__: The directory where blank step definition files should be created (default: `features/step_definitions`)

  * __stepDefinitionsStringPatterns__: (cucumber-js 1.x only) If set to `true`, [Strings patterns](https://github.com/cucumber/cucumber-js/blob/v1.3.1/docs/support_files/string_patterns.md) will be used instead of regexps to write step definition files.

  * __stepDefinitionsExpressions__: (cucumber-js >= 2.x only) If set to `true`, [Cucumber expressions](https://docs.cucumber.io/cucumber-expressions/) will be used instead of regexps to write step definition files.

  * __directoryStructure__: Used to match the TestRail sections tree with the local tests directory structure.

    * __type__: The variable name to used to create the folders - Possible values: `section:slug` or `section:name`

    * __skipRootFolder__: The number of TestRail root sections to skip when creating the local tests directory structure.

---

> Next: [Synchronization of test cases from/to TestRail](/docs/synchronization.md)
