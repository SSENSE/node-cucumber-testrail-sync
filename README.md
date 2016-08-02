# cucumber-testrail-sync

This module has two main features:

> It can test cases from TestRail to `.feature` files on your local filesystem.

> It can automatically push test results to TestRail.

## Installation

> npm i cucumber-testrail-sync [-g]

## Usage: *synchronize test cases from TestRail*

We propose the following collaborative workflow for BDD testing:

![Synchronize test cases!](images/sync-scenarios.png)

------------

At the root of your project, create the `.testrail-sync.js` file.

```js
module.exports = {
  testrail: {
    host: '', // testrail host
    user: '', // testrail username
    password: '', // testrail password or api key
    filters: {
      plan_id: '', // testrail plan id
    }
  },
};
```

There are other possible options:

  * __overwrite__: Toggle the local .feature file overwrite OR remote test case overwrite if the local Gherkins doesn't match the Gherkins from TestRail.

  ```js
  overwrite: {
    local: 'ask',
    remote: false,
  }
  ```

  * __stepDefinitionsTemplate__:  The template to use to generate blank step definition files (ie. `stepDefinitionsTemplate: 'es5.js'`)

  * __indent__: The indentation to use when generating `.feature` or `.js` files (ie. `indent: '    '`)

  * __featuresDir__:  The directory where `.feature` files should be created (ie. `featuresDir: 'features'`)

  * __stepDefinitionsDir__:  The directory where blank step definition files should be created  (ie. `stepDefinitionsDir: 'features/step_definitions'`)

Then you can run the `testrail-sync` command (or `./node_modules/.bin/testrail-sync` if it's not installed globally) to fetch the test cases from TestRail.

## Usage: *pushing test results to TestRail*

You will first need to create the `.testrail-sync.js` config file, as described above.

Then, we have to setup the following things :

1. Right before running the tests, a Test Run has to be created in TestRail.

2. After each test case has been run, the result has to be pushed to TestRail (bound to the previously created Test Run).

In order to achieve this, you will need to register some Cucumber event handlers (`features/support/hooks.js`).

```js
var testrailSync = require('cucumber-testrail-sync');

module.exports = function () {
  var testResultSync = new testrailSync.ResultSynchronizer(testrailSync.readConfig());

  this.registerHandler('BeforeFeatures', function (features, callback) {
    testResultSync.createNewTestRun(callback);
  });

  this.After(function (scenario, callback) {
    testResultSync.pushResult(scenario, callback);
  });
};
```
