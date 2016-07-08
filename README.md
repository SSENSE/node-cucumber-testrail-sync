# cucumber-testrail-sync

This module has two main features:

> It can synchronize test cases from TestRail to `.feature` files on your local filesystem.

We propose the following collaborative workflow for BDD testing:

![Synchronize test cases!](images/sync-scenarios.png)

------------

> It can automatically push test results back to TestRail.

## Installation

> npm i cucumber-testrail-sync [-g]

## Usage (test cases synchronization)

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

  * __overwrite__: Toggle the local .feature file overwrite OR remote test case overwrite if the local Gherkins doesn't match the TestRail Gherkins.

  ```js
  overwrite: {
    local: 'ask',
    remote: false,
  }
  ```

  * __testFilesTemplate__:  The template to use to generate blank step definition files (ie. `testFilesTemplate: 'cucumberjs.es5'`)

  * __indent__: The indentation to use when generating `.feature` or `.js` files (ie. `indent: '    '`)

  * __featuresDir__:  The directory where `.feature` files should be created (ie. `featuresDir: 'features'`)

  * __jsDir__:  The directory where blank step definition files should be created  (ie. `featuresDir: 'features/step_definitions'`)

Then you can run the `testrail-sync` command (or `./node_modules/.bin/testrail-sync` if it's not installed globally).

## Usage (test results synchronization)

You will first need to setup the `.testrail-sync.js` config file, as described above.

@to complete
