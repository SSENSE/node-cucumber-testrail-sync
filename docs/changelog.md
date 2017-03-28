# Change Log

## [3.0.0](https://github.com/SSENSE/node-cucumber-testrail-sync/tree/3.0.0) (2017-01-18)

- Replace word accents (replace ” by ") when importing from TestRail

- Add support for cucumber-js 2.x

## [2.1.13](https://github.com/SSENSE/node-cucumber-testrail-sync/tree/2.1.13) (2016-12-29)

- Add __--pull__ and __--push__ command line options

- Add ability to push new test cases on TestRail

## [2.1.12](https://github.com/SSENSE/node-cucumber-testrail-sync/tree/2.1.12) (2016-12-16)

- Add __push-test-result__ binary to push test results to TestRail (i.e. from a language other than JavaScript)

## [2.1.11](https://github.com/SSENSE/node-cucumber-testrail-sync/tree/2.1.11) (2016-12-16)

- Add ruby.rb template for step definitions

- Support for TestRail's steps field when pushing Gherkin content to TestRail

## [2.1.10](https://github.com/SSENSE/node-cucumber-testrail-sync/tree/2.1.10) (2016-12-15)

- Add debug flag when running the synchronization script

- Support for TestRail's steps field for test cases

## [2.1.8](https://github.com/SSENSE/node-cucumber-testrail-sync/tree/2.1.8) (2016-12-09)

- Handle undefined/skipped scenarios when pushing results to TestRail

## [2.1.5](https://github.com/SSENSE/node-cucumber-testrail-sync/tree/2.1.5) (2016-12-08)

- Initial open-source release

- Better blank step definitions files creation for Scenario Outline

## [2.1.3](https://github.com/SSENSE/node-cucumber-testrail-sync/tree/2.1.3) (2016-11-07)

- Fix examples tables casting bug

## [2.1.2](https://github.com/SSENSE/node-cucumber-testrail-sync/tree/2.1.2) (2016-11-02)

- Fix Scenario Outline bug: Synchronization was hanging when a variable was used in the steps but not defined in the Examples table

## [2.1.1](https://github.com/SSENSE/node-cucumber-testrail-sync/tree/2.1.1) (2016-11-02)

- Better documentation

- `--verify` won't fail anymore if only the scenario name of a testcase has been changed

- Better Gherkin diff output (similar to `git diff`)

- Scan the `support` folder for steps definitions

- Implemented `--unused` switch to find unused steps definitions

## [2.1.0](https://github.com/SSENSE/node-cucumber-testrail-sync/tree/2.1.0) (2016-10-17)

- Migration to TypeScript

## [2.0.15](https://github.com/SSENSE/node-cucumber-testrail-sync/tree/2.0.15) (2016-09-30)

- Allow verifying only TestCases with a certain custom_status

## 2.0.11 (2016-09-22)

- Allow syncing only TestCases with a certain custom_status

- Fixed step_definitions creation bug when mixing regexp with string patterns

## 2.0.8 (2016-09-20)

- Allow comments in the gherkin

- Update README: Add Travis CI example

## [2.0.6](https://github.com/SSENSE/node-cucumber-testrail-sync/tree/2.0.6) (2016-09-15)

- Support regex flags when parsing step_definitions files

## [2.0.5](https://github.com/SSENSE/node-cucumber-testrail-sync/tree/2.0.5) (2016-09-13)

- Support Scenario Outlines ([issue #6](https://github.com/SSENSE/node-cucumber-testrail-sync/issues/6))

- Support Cucumber String Patterns (`stepDefinitionsStringPatterns` option) ([issue #8](https://github.com/SSENSE/node-cucumber-testrail-sync/issues/8))

## [2.0.2](https://github.com/SSENSE/node-cucumber-testrail-sync/tree/2.0.2) (2016-09-12)

- Fix tables import containing three pipes or more ([issue #5](https://github.com/SSENSE/node-cucumber-testrail-sync/issues/5))

- Fix TestRail vs Local .feature diff output not showing

- Colored TestRail vs Local .feature diff output

## [2.0.0](https://github.com/SSENSE/node-cucumber-testrail-sync/tree/2.0.0) (2016-09-12)

- Ability to specify a custom run_id (if not, every run in the Test Plan will be used)

- Update the original TestRun results rather than creating a new one every time

- Various improvements

## [1.0.10](https://github.com/SSENSE/node-cucumber-testrail-sync/tree/1.0.10) (2016-08-30)

- Bugfix: sync script was creating duplicate step definitions

- Add unique filename check

## [1.0.9](https://github.com/SSENSE/node-cucumber-testrail-sync/tree/1.0.9) (2016-08-30)

- Implemented `--verify` switch ([issue #3](https://github.com/SSENSE/node-cucumber-testrail-sync/issues/3))

- Add some regression tests

## [1.0.8](https://github.com/SSENSE/node-cucumber-testrail-sync/tree/1.0.8) (2016-08-24)

- Create the `step_definitions` folder if it doesn't exist

## [1.0.7](https://github.com/SSENSE/node-cucumber-testrail-sync/tree/1.0.7) (2016-08-18)

- When creating the blank step definitions files, avoid creating duplicate step definitions if they are implemented in other files

- Add patterns/params detection when creating the step definitions files