Feature: Scenario Outline
  Background:
    Given I use a TestPlan with 1 TestRun and 1 TestCase
    And I set the indent option to "  "
    And The first case contains the following gherkin
      """
      Given I have a list of <start> apples
      When I remove <removed> apples
      Then I should have <left> apples in my <container>
      Examples:
      | start | removed | left | container |
      | 20 | 15 | 5 | basket |
      """

  Scenario: Using es5 template
    Given I set the stepDefinitionsTemplate option to "es5.js"
    And I enable the stepDefinitionsExpressions option
    When I run the synchronization script
    Then There should be 1 feature file on the file system
    And There should be 1 code file on the file system
    And The file "/feature/parent-section/a-sub-section/my-first-test.feature" should have the following content:
      """
      Feature: a sub section
        @tcid:100
        Scenario Outline: my first test
          Given I have a list of <start> apples
          When I remove <removed> apples
          Then I should have <left> apples in my <container>
          
          Examples:
          | start | removed | left | container |
          | 20 | 15 | 5 | basket |
      """
    And The file "/js/parent-section/a-sub-section/my-first-test.js" should have the following content:
      """
      var cucumber = require('cucumber');

      cucumber.defineSupportCode(function (ctx) {
        ctx.Given('I have a list of {start} apples', function (start, callback) {
          callback(null, 'pending');
        });

        ctx.When('I remove {removed} apples', function (removed, callback) {
          callback(null, 'pending');
        });

        ctx.Then('I should have {left} apples in my {container}', function (left, container, callback) {
          callback(null, 'pending');
        });

      });
      """
 