Feature: Simple sync tests, multiple test runs
  Background:
    Given I use a TestPlan with 2 TestRuns with 1 TestCase in each

  Scenario: Single run
    Given I set the testrail.filters.run_id option to "56"
    And I set the stepDefinitionsTemplate option to "es6.legacy.js"
    When I run the synchronization script
    Then There should be 1 feature file on the file system
    And There should be 1 code file on the file system

  Scenario: Should write .feature file
    When I run the synchronization script
    Then There should be 2 feature file on the file system
    And There should be 0 code file on the file system
    And The file "/feature/parent-section/a-sub-section/my-first-test.feature" should have the following content:
      """
      Feature: a sub section
        @tcid:100
        Scenario: my first test
          Given That I am a tester
          When I am testing
          Then I should see test results
          And I should be satified
      """
    And The file "/feature/parent-section/my-second-test.feature" should have the following content:
      """
      Feature: parent section
        @tcid:101
        Scenario: my second test
          Given That I am a tester <name>
          | name |
          | tester 1 |
          | tester 2 |
          When I am testing
          Then I should see test results
          And I should be satified
      """

  Scenario: Should write code file
    Given I set the stepDefinitionsTemplate option to "es6.legacy.js"
    When I run the synchronization script
    Then There should be 2 feature file on the file system
    And There should be 2 code file on the file system

  Scenario: Should only import cases with a certain status
    Given I set the testrail.filters.custom_status option to "[4]"
    When I run the synchronization script
    Then There should be 1 feature file on the file system
