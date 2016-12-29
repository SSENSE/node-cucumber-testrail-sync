# Test cases synchronization

Now that you've configured your application, you can run the `./node_modules/.bin/cucumber-testrail-sync` command to sync the test cases from TestRail.

By default, the .feature files (containing the Gherkin) will be located in the `features` folder - unless you changed this configuration.

You can use the `--pull` or `--push` flags to either pull TestCases from TestRail or push them to TestRail.

---

> Next: [Synchronization verification](/docs/verification.md)