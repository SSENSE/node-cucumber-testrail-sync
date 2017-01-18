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
    Given I set the stepDefinitionsTemplate option to "es5.legacy.js"
    When I run the synchronization script
    Then There should be 2 code files on the file system
    And The file "/js/parent-section/a-sub-section/my-first-test.js" should have the following content:
      """
      module.exports = function () {
        this.Given(/^I have a list of (\w+) apples$/, function (start, callback) {
          callback(null, 'pending');
        }.bind(this));

        this.When(/^I remove \*\*(\w+)\*\* apples$/, function (removed, callback) {
          callback(null, 'pending');
        }.bind(this));

        this.Then(/^I should have (\w+) apples in my (\w+)$/, function (left, container, callback) {
          callback(null, 'pending');
        }.bind(this));

      };
      """
    And The file "/js/parent-section/my-second-test.js" should have the following content:
      """
      module.exports = function () {
        this.When(/^I eat (\w+) apples$/, function (eaten, callback) {
          callback(null, 'pending');
        }.bind(this));

        this.Then(/^I should have (\w+) apples$/, function (left, callback) {
          callback(null, 'pending');
        }.bind(this));

      };
      """

  Scenario: Using es5 template - String patterns
    Given I set the stepDefinitionsTemplate option to "es5.legacy.js"
    And I enable the stepDefinitionsStringPatterns option
    When I run the synchronization script
    Then There should be 2 code files on the file system
    And The file "/js/parent-section/a-sub-section/my-first-test.js" should have the following content:
      """
      module.exports = function () {
        this.Given('I have a list of $start apples', function (start, callback) {
          callback(null, 'pending');
        }.bind(this));

        this.When('I remove \*\*$removed\*\* apples', function (removed, callback) {
          callback(null, 'pending');
        }.bind(this));

        this.Then('I should have $left apples in my $container', function (left, container, callback) {
          callback(null, 'pending');
        }.bind(this));

      };
      """
    And The file "/js/parent-section/my-second-test.js" should have the following content:
      """
      module.exports = function () {
        this.When('I eat $eaten apples', function (eaten, callback) {
          callback(null, 'pending');
        }.bind(this));

        this.Then('I should have $left apples', function (left, callback) {
          callback(null, 'pending');
        }.bind(this));

      };
      """

  Scenario: Don't create duplicate step definitions
    Given I set the stepDefinitionsTemplate option to "es5.legacy.js"
    And I enable the stepDefinitionsStringPatterns option
    And There is a file named "/js/parent-section/a-sub-section/my-first-test.js" with the content:
      """
      module.exports = function () {
        this.Given('I have a list of $start apples', function (start, callback) {
          callback(null, 'pending');
        }.bind(this));

        this.When('I remove \*\*$removed\*\* apples', function (removed, callback) {
          callback(null, 'pending');
        }.bind(this));

        this.Then('I should have $left apples in my $container', function (left, container, callback) {
          callback(null, 'pending');
        }.bind(this));

      };

      """
    When I run the synchronization script
    Then There should be 2 code files on the file system
    And The file "/js/parent-section/my-second-test.js" should have the following content:
      """
      module.exports = function () {
        this.When('I eat $eaten apples', function (eaten, callback) {
          callback(null, 'pending');
        }.bind(this));

        this.Then('I should have $left apples', function (left, callback) {
          callback(null, 'pending');
        }.bind(this));

      };
      """
