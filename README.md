# cucumber-testrail-sync


This package has two main goals:

1. Synchronize test cases from TestRail to .feature files on the local filesystem.

  ![Synchronize test cases!](images/sync-scenarios.png)

2. Create a test run on TestRail and send back the test results


## Installation

> npm i cucumber-testrail-sync [-g]

## Usage

At the root of your project, create the `.testrail-sync.js` file.

```js
module.exports = {
  testrail: {
    host: '', // testrail host
    user: '', // testrail username
    password: '', // testrail password or api key
    filters: {
      plan_id: '', // required
    }
  }
};
```

Then you can run the `testrail-sync` command (or `./node_modules/.bin/testrail-sync` if it's not installer globally).
