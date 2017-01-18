Feature: Scenario Outline Step Definitions
  Background:
    Given I use a TestPlan with 1 TestRun and 2 TestCases
    And I set the indent option to "  "
    And The first case contains the following gherkin
      """
      Given I have a list of <start> apples
      When I remove **<removed>** apples
      Then I should have <left> apples in my <container>
      Examples:
      | start | removed | left | container |
      | 20 | 15 | 5 | basket |
      """
    And The second case contains the following gherkin
      """
      Given I have a list of <start> apples
      When I eat <eaten> apples
      Then I should have <left> apples
      Examples:
      | start | eaten | left |
      | 3 | 2 | 1 |
      """

  Scenario: Using es5 template
    Given I set the stepDefinitionsTemplate option to "es5.js"
    When I run the synchronization script
    Then There should be 2 code files on the file system
    And The file "/js/parent-section/a-sub-section/my-first-test.js" should have the following content:
      """
      var cucumber = require('cucumber');

      cucumber.defineSupportCode(function (ctx) {
        ctx.Given(/^I have a list of (\w+) apples$/, function (start, callback) {
          callback(null, 'pending');
        });

        ctx.When(/^I remove \*\*(\w+)\*\* apples$/, function (removed, callback) {
          callback(null, 'pending');
        });

        ctx.Then(/^I should have (\w+) apples in my (\w+)$/, function (left, container, callback) {
          callback(null, 'pending');
        });

      });
      """
    And The file "/js/parent-section/my-second-test.js" should have the following content:
      """
      var cucumber = require('cucumber');

      cucumber.defineSupportCode(function (ctx) {
        ctx.When(/^I eat (\w+) apples$/, function (eaten, callback) {
          callback(null, 'pending');
        });

        ctx.Then(/^I should have (\w+) apples$/, function (left, callback) {
          callback(null, 'pending');
        });

      });
      """

  Scenario: Using es5 template - Cucumber expressions
    Given I set the stepDefinitionsTemplate option to "es5.js"
    And I enable the stepDefinitionsExpressions option
    When I run the synchronization script
    Then There should be 2 code files on the file system
    And The file "/js/parent-section/a-sub-section/my-first-test.js" should have the following content:
      """
      var cucumber = require('cucumber');

      cucumber.defineSupportCode(function (ctx) {
        ctx.Given('I have a list of {start} apples', function (start, callback) {
          callback(null, 'pending');
        });

        ctx.When('I remove \*\*{removed}\*\* apples', function (removed, callback) {
          callback(null, 'pending');
        });

        ctx.Then('I should have {left} apples in my {container}', function (left, container, callback) {
          callback(null, 'pending');
        });

      });
      """
    And The file "/js/parent-section/my-second-test.js" should have the following content:
      """
      var cucumber = require('cucumber');

      cucumber.defineSupportCode(function (ctx) {
        ctx.When('I eat {eaten} apples', function (eaten, callback) {
          callback(null, 'pending');
        });

        ctx.Then('I should have {left} apples', function (left, callback) {
          callback(null, 'pending');
        });

      });
      """

  Scenario: Don't create duplicate step definitions
    Given I set the stepDefinitionsTemplate option to "es5.js"
    And I enable the stepDefinitionsExpressions option
    And There is a file named "/js/parent-section/a-sub-section/my-first-test.js" with the content:
      """
      var cucumber = require('cucumber');

      cucumber.defineSupportCode(function (ctx) {
        ctx.Given('I have a list of {start} apples', function (start, callback) {
          callback(null, 'pending');
        });

        ctx.When('I remove \*\*{removed}\*\* apples', function (removed, callback) {
          callback(null, 'pending');
        });

        ctx.Then('I should have {left} apples in my {container}', function (left, container, callback) {
          callback(null, 'pending');
        });

      });

      """
    When I run the synchronization script
    Then There should be 2 code files on the file system
    And The file "/js/parent-section/my-second-test.js" should have the following content:
      """
      var cucumber = require('cucumber');

      cucumber.defineSupportCode(function (ctx) {
        ctx.When('I eat {eaten} apples', function (eaten, callback) {
          callback(null, 'pending');
        });

        ctx.Then('I should have {left} apples', function (left, callback) {
          callback(null, 'pending');
        });

      });
      """
