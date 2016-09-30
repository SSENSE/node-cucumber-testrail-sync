# cucumber-testrail-sync

This module has two main features:

> It can synchronize test cases from TestRail to `.feature` files on your local filesystem.

> It can automatically push test results to TestRail.

## Installation

> npm i @ssense/cucumber-testrail-sync

## Usage: *synchronize test cases from TestRail*

We propose the following collaborative workflow for BDD testing:

![Synchronization!](https://github.com/Groupe-Atallah/node-cucumber-testrail-sync/raw/master/images/sync-flow.png)

An application should only have one TestPlan, with each features having their own Test Run.

------------

At the root of your project, create the `.testrail-sync.js` file.

```js
module.exports = {
  testrail: {
    host: '', // testrail host
    user: '', // testrail username
    password: '', // testrail password or api key
    filters: {
      plan_id: '', // required testrail plan id
      run_id: '', // optional testrail run id
      custom_status: [4] // optional list of whitelisted status (testcases that don't have 1 of thoses statuses won't be synced)
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

  * __featuresDir__: The directory where `.feature` files should be created (ie. `featuresDir: 'features'`)

  * __stepDefinitionsDir__: The directory where blank step definition files should be created  (ie. `stepDefinitionsDir: 'features/step_definitions'`)

  * __stepDefinitionsStringPatterns__: If set to `true`, use [Strings patterns](https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/string_patterns.md) to write step definitions.

  * __directoryStructure__: Used to match the TestRail sections tree with the local tests directory structure.

    * __type__: The variable name to used to create the folders. Can be either `section:slug` or `section:name`

    * __skipRootFolder__: The number of root sections to skip.

Then you can run the `./node_modules/.bin/cucumber-testrail-sync` command to fetch the test cases from TestRail.

You can use the `--verify` switch to verify that your project's features files match the test cases from TestRail.

## Usage: *pushing test results to TestRail*

![Synchronization!](https://github.com/Groupe-Atallah/node-cucumber-testrail-sync/raw/master/images/push-results.jpg)

> Tests running (left) and results being pushed to Test Rail (right)

We suggest enabling this option at the CI level (without the `run_id` config, so that the results from all the runs in the TestPlan will be updated).

To push the results, you will have to do the following two things:

1. Install this module in Cucumber's context (`features/support/hooks.js`) :

```js
var testrailSync = require('@ssense/cucumber-testrail-sync');

module.exports = function () {
  testrailSync.install(this);
};
```

Or for TypeScript :

```js
import * as testrailSync from '@ssense/cucumber-testrail-sync';

module.exports = function (): void {
  testrailSync.install(this);
};
```

2. set the `PUSH_RESULTS_TO_TESTRAIL` environment variable

### Integration with Travis CI

Here at SSENSE, we wanted to push the results only when the tests were being run against the `develop` branch.

To do so, we set up the `.travis.yml` to run a shell script: `script: ./scripts/run-ci-tests.sh`

```bash
#!/bin/bash
set -ev

GITHUB_LINK="https://github.com/${TRAVIS_REPO_SLUG}/commit/${TRAVIS_COMMIT}"
COMMIT_MSG=`git log -n 1 --pretty="format:%an committed %s" $TRAVIS_COMMIT`
COMMIT_LOG="[${COMMIT_MSG}](${GITHUB_LINK})"

if [[ ${TRAVIS_BRANCH} == "develop" ]] && [[ ${TRAVIS_PULL_REQUEST} == "false" ]]; then
  docker run my_app /bin/sh -c "export PUSH_RESULTS_TO_TESTRAIL=1; export TESTRAIL_RESULTS_COMMENT=\"$COMMIT_LOG\"; cd /app; npm test"
else
  docker run my_app /bin/sh -c "cd /app; npm test"
fi
```

AS you can see, we're also setting the `TESTRAIL_RESULTS_COMMENT` env variable to push a comment (containing the commit author and message) along with the test results.

# Change Log

## [2.0.15](https://github.com/Groupe-Atallah/node-cucumber-testrail-sync/tree/v2.0.15) (2016-09-30)

- Allow verifying only TestCases with a certain custom_status

## 2.0.11 (2016-09-22)

- Allow syncing only TestCases with a certain custom_status

- Fixed step_definitions creation bug when mixing regexp with string patterns

## 2.0.8 (2016-09-20)

- Allow comments in the gherkin

- Update README: Add Travis CI example

## [2.0.6](https://github.com/Groupe-Atallah/node-cucumber-testrail-sync/tree/v2.0.6) (2016-09-15)

- Support regex flags when parsing step_definitions files

## [2.0.5](https://github.com/Groupe-Atallah/node-cucumber-testrail-sync/tree/v2.0.5) (2016-09-13)

- Support Scenario Outlines ([issue #6](https://github.com/Groupe-Atallah/node-cucumber-testrail-sync/issues/6))

- Support Cucumber String Patterns (`stepDefinitionsStringPatterns` option) ([issue #8](https://github.com/Groupe-Atallah/node-cucumber-testrail-sync/issues/8))

## [2.0.2](https://github.com/Groupe-Atallah/node-cucumber-testrail-sync/tree/v2.0.2) (2016-09-12)

- Fix tables import containing three pipes or more ([issue #5](https://github.com/Groupe-Atallah/node-cucumber-testrail-sync/issues/5))

- Fix TestRail vs Local .feature diff output not showing

- Colored TestRail vs Local .feature diff output

## [2.0.0](https://github.com/Groupe-Atallah/node-cucumber-testrail-sync/tree/v2.0.0) (2016-09-12)

- Ability to specify a custom run_id (if not, every run in the Test Plan will be used)

- Update the original TestRun results rather than creating a new one every time

- Various improvements

## [1.0.10](https://github.com/Groupe-Atallah/node-cucumber-testrail-sync/tree/v1.0.10) (2016-08-30)

- Bugfix: sync script was creating duplicate step definitions

- Add unique filename check

## [1.0.9](https://github.com/Groupe-Atallah/node-cucumber-testrail-sync/tree/v1.0.9) (2016-08-30)

- Implemented `--verify` switch ([issue #3](https://github.com/Groupe-Atallah/node-cucumber-testrail-sync/issues/3))

- Add some regression tests

## [1.0.8](https://github.com/Groupe-Atallah/node-cucumber-testrail-sync/tree/v1.0.8) (2016-08-24)

- Create the `step_definitions` folder if it doesn't exist

## [1.0.7](https://github.com/Groupe-Atallah/node-cucumber-testrail-sync/tree/1.0.7) (2016-08-18)

- When creating the blank step definitions files, avoid creating duplicate step definitions if they are implemented in other files

- Add patterns/params detection when creating the step definitions files
