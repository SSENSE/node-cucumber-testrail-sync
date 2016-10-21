# Synchronization verification

You can use the `--verify` switch to verify that your project's features files match the test cases from TestRail.

Furthermore, you could add it to your Continuous Integration workflow by using it in the `pretest` script section of your `package.json` file:

```js
"scripts": {
  "pretest": "./node_modules/.bin/cucumber-testrail-sync --verify"
}
```

---

The verification script can be run against a subset of the Test Cases - based on their status.

For example, if a QA analyst changes the content of a test case - but doesn't want the changes to affect the CI build until a developer updated the test code - he/she can change the status of that test case so that the verification script overlook that TestCase.

At [SSENSE](https://github.com/SSENSE), we use the **Approved** and **Approved to automate** statuses - TestCases with thoses statuses are sync'ed but only TestCases with the **Approved** status are verified.

Here's our configuration:

```js
testrail: {
  // ...
  filters: {
    // ...
    custom_status: [3, 4] // Approved && Approved to automate
  },
  verifyFilters: {
    custom_status: [3] // Approved
  }
}
```

---

> Next: [Pushing test results to TestRail](/docs/pushing_results.md)