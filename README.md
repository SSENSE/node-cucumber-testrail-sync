# Cucumber TestRail Sync

[![Latest Stable Version](https://img.shields.io/npm/v/@ssense/node-cucumber-testrail-sync.svg)](https://www.npmjs.com/package/@ssense/node-cucumber-testrail-sync)
[![Known Vulnerabilities](https://snyk.io/test/npm/@ssense/node-cucumber-testrail-sync/badge.svg)](https://snyk.io/test/npm/@ssense/node-cucumber-testrail-sync)

Module to use [Cucumber](https://github.com/cucumber/cucumber-js) in conjunction with [TestRail](http://www.gurock.com/testrail/).

* It can synchronize test cases from TestRail to `.feature` files on your local filesystem.

* It can automatically push test results to TestRail - after they've been run.

## Philosophy

At [SSENSE](https://github.com/SSENSE), we strive to deliver high quality on every project.

With that perspective, `Cucumber TestRail Sync` has been developed with 2 main goals:

1. Have a single source of truth for test cases (TestRail)

2. Encourage synergy between developers and QA analysts - yes it's possible !

We propose the following collaborative workflow for BDD testing:

![Synchronization!](https://github.com/SSENSE/node-cucumber-testrail-sync/raw/master/docs/img/sync-flow.png)

## Installation

> npm i @ssense/cucumber-testrail-sync -D

## Usage

* [Configuring a project](/docs/configuration.md)

* [Synchronization of test cases from/to TestRail](/docs/synchronization.md)

* [Synchronization verification](/docs/verification.md)

* [Pushing test results to TestRail](/docs/pushing_results.md)

## [Change Log](/docs/changelog.md)

## Authors

* **Lizbeth Burbano** - *Senior QA Analyst* - [LizbethB](https://github.com/LizbethB)
* **Mickael Burguet** - *Senior Developer* - [rundef](http://rundef.com)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.