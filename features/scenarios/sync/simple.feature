Feature: Simple sync tests
  Background:
    Given I use a TestPlan with 1 TestRun and 2 TestCases

  Scenario: Should write .feature file
    When I run the synchronization script
    Then There should be 2 feature file on the file system
    And There should be 0 code file on the file system

  Scenario: Should write step definition file
    Given I set the stepDefinitionsTemplate option to "es6.js"
    When I run the synchronization script
    Then There should be 2 feature file on the file system
    And There should be 2 code file on the file system