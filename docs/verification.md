# Synchronization verification

You can use the `--verify` switch to verify that your project's `.feature` files match the Gherkin of the test cases from TestRail.

Furthermore, you could add it to your Continuous Integration workflow by using it in the `pretest` script section of your `package.json` file:

```js
"scripts": {
  "pretest": "./node_modules/.bin/cucumber-testrail-sync --verify"
}
```

---

The verification script can be run against a subset of the test cases - based on their statuses.

For example, if a QA analyst changes the Gherkin of a test case on TestRail - but doesn't want the changes to affect the CI build until a developer updates the test code - he/she can change the status of that test case so that the verification script overlook that specific test case.

At [SSENSE](https://github.com/SSENSE), we use the **Approved** and **Approved to automate** statuses - test cases with thoses statuses are sync'ed but only test cases with the **Approved** status are verified.

Here's our configuration:

```js
testrail: {
  // ...
  filters: {
    // ...
    custom_status: [3, 4] // Approved || Approved to automate
  },
  verifyFilters: {
    custom_status: [3] // Approved
  }
}
```

---

> Next: [Pushing test results to TestRail](/docs/pushing_results.md)