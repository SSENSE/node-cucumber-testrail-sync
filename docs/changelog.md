# Change Log

## [2.1.1](https://github.com/Groupe-Atallah/node-cucumber-testrail-sync/tree/v2.1.1) (2016-10-??)

- Better documentation

- `--verify` won't fail anymore if only the scenario name of a testcase has been changed

## [2.1.0](https://github.com/Groupe-Atallah/node-cucumber-testrail-sync/tree/v2.1.0) (2016-10-17)

- Migration to TypeScript

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