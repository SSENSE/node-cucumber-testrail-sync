# Pushing results to TestRail

![Pushing results!](https://github.com/SSENSE/node-cucumber-testrail-sync/raw/master/docs/img/push-results.jpg)

> Tests running (left) and results being pushed to Test Rail (right)

## Pushing manually

To push the test results manually, you will have to do the following:

* Install this module in Cucumber's context (`features/support/hooks.js`) :

  - If you are using cucumber-js 1.x

    ```js
    var testrailSync = require('@ssense/cucumber-testrail-sync');

    module.exports = function () {
      testrailSync.legacyInstall(this);
    };
    ```

  - If you are using cucumber-js >= 2.x

    ```js
    var cucumber = require('cucumber');
    var testrailSync = require('@ssense/cucumber-testrail-sync');

    testrailSync.install(cucumber);
    ```

* Either set the `pushResults` to `true` in the configuration file or set the `PUSH_RESULTS_TO_TESTRAIL` environment variable

* The results will now be pushed everytime you run the tests with Cucumber

## Integration with Travis CI

We suggest enabling this option only at the CI level.

At [SSENSE](https://github.com/SSENSE), we setup **Travis CI** to push the results only when the tests are being run against the `develop` branch.

To do so, we configured the `.travis.yml` to run a shell script: `script: ./scripts/run-ci-tests.sh`

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

As you can see, we're also setting the `TESTRAIL_RESULTS_COMMENT` env variable to push a comment (containing the commit author and message) along with the test results.
