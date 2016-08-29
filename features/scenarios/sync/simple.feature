Feature: Simple sync tests

  Scenario: Should write .feature file
    Given I have 1 TestCase in a TestPlan in TestRail
    When I run the synchronization script
    Then I should have 1 feature file on the file system
    And I should have 0 js file on the file system

  Scenario: Should write .js file
    Given I have 1 TestCase in a TestPlan in TestRail
    And I set the stepDefinitionsTemplate option to "es6.js"
    When I run the synchronization script
    Then I should have 1 feature file on the file system
    And I should have 1 js file on the file system