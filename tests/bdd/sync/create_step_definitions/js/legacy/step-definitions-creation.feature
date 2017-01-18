Feature: Step definitions file creation
  Background:
    Given I use a TestPlan with 1 TestRun and 2 TestCases
    And I set the indent option to "  "
    And The first case contains the following gherkin
      """
      Given I have a list of 10 apples
      When I remove **1** apples
      Then I should have 9 apples
      # a comment
      """
    And The second case contains the following gherkin
      """
      Given I have a list of 20 apples
      When I remove **5** apples
      Then I should have 15 "apples"
      """

  Scenario: Using es5 template
    Given I set the stepDefinitionsTemplate option to "es5.legacy.js"
    When I run the synchronization script
    Then There should be 2 code files on the file system
    And The file "/js/parent-section/a-sub-section/my-first-test.js" should have the following content:
      """
      module.exports = function () {
        this.Given(/^I have a list of (\d+) apples$/, function (arg1, callback) {
          callback(null, 'pending');
        }.bind(this));

        this.When(/^I remove \*\*(\d+)\*\* apples$/, function (arg1, callback) {
          callback(null, 'pending');
        }.bind(this));

        this.Then(/^I should have (\d+) apples$/, function (arg1, callback) {
          callback(null, 'pending');
        }.bind(this));

      };
      """
    And The file "/js/parent-section/my-second-test.js" should have the following content:
      """
      module.exports = function () {
        this.Then(/^I should have (\d+) "([^"]*)"$/, function (arg1, arg2, callback) {
          callback(null, 'pending');
        }.bind(this));

      };
      """

  Scenario: Using es6 template
    Given I set the stepDefinitionsTemplate option to "es6.legacy.js"
    When I run the synchronization script
    Then There should be 2 code files on the file system
    And The file "/js/parent-section/a-sub-section/my-first-test.js" should have the following content:
      """
      module.exports = function () {
        this.Given(/^I have a list of (\d+) apples$/, (arg1, callback) => {
          callback(null, 'pending');
        });

        this.When(/^I remove \*\*(\d+)\*\* apples$/, (arg1, callback) => {
          callback(null, 'pending');
        });

        this.Then(/^I should have (\d+) apples$/, (arg1, callback) => {
          callback(null, 'pending');
        });

      };
      """
    And The file "/js/parent-section/my-second-test.js" should have the following content:
      """
      module.exports = function () {
        this.Then(/^I should have (\d+) "([^"]*)"$/, (arg1, arg2, callback) => {
          callback(null, 'pending');
        });

      };
      """

  Scenario: Using typescript template
    Given I set the stepDefinitionsTemplate option to "typescript.legacy.ts"
    When I run the synchronization script
    Then There should be 2 code files on the file system
    And The file "/js/parent-section/a-sub-section/my-first-test.ts" should have the following content:
      """
      module.exports = function (): void {
        this.Given(/^I have a list of (\d+) apples$/, (arg1: string, callback: Function): void => {
          callback(null, 'pending');
        });

        this.When(/^I remove \*\*(\d+)\*\* apples$/, (arg1: string, callback: Function): void => {
          callback(null, 'pending');
        });

        this.Then(/^I should have (\d+) apples$/, (arg1: string, callback: Function): void => {
          callback(null, 'pending');
        });

      };

      """
    And The file "/js/parent-section/my-second-test.ts" should have the following content:
      """
      module.exports = function (): void {
        this.Then(/^I should have (\d+) "([^"]*)"$/, (arg1: string, arg2: string, callback: Function): void => {
          callback(null, 'pending');
        });

      };
      
      """

  Scenario: Don't create duplicate step definitions
    Given I set the stepDefinitionsTemplate option to "typescript.legacy.ts"
    And There is a file named "/js/parent-section/a-sub-section/my-first-test.ts" with the content:
      """
      module.exports = function (): void {
        this.Given(/^.* url ([&=\?\/\w]+)$/, (url: string, callback: Function): void => {
          callback(null, 'pending');
        });

        this.Given(/^I have a list of (\d+) apples$/, (arg1: string, callback: Function): void => {
          callback(null, 'pending');
        });

        this.When(/i remove \*\*(\d+)\*\* apples/i, (arg1: string, callback: Function): void => {
          callback(null, 'pending');
        });

        this.Then(/^I should have (\d+) apples$/, (arg1: string, callback: Function): void => {
          callback(null, 'pending');
        });

      };

      """
    When I run the synchronization script
    Then There should be 2 code files on the file system
    And The file "/js/parent-section/my-second-test.ts" should have the following content:
      """
      module.exports = function (): void {
        this.Then(/^I should have (\d+) "([^"]*)"$/, (arg1: string, arg2: string, callback: Function): void => {
          callback(null, 'pending');
        });

      };
      
      """
