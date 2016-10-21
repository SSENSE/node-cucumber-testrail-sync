Feature: Verify tests in 1 testrun
  Background:
    Given I use a TestPlan with 1 TestRun and 2 TestCases

  Scenario: Should fail if no .feature file match
    Given I enable the verify option
    When I run the synchronization script
    Then It should fail

  Scenario: Should fail if there's a missing .feature file
    Given There is a file named "/feature/parent-section/a-sub-section/my-first-test.feature" with the content:
      """
      Feature: a sub section
        @tcid:100
        Scenario: my first test
          Given That I am a tester
          When I am testing
          Then I should see test results
          And I should be satified
      """
    And I enable the verify option
    When I run the synchronization script
    Then It should fail

  Scenario: Should fail if .feature file content is different
    Given There is a file named "/feature/parent-section/a-sub-section/my-first-test.feature" with the content:
      """
      Feature: a sub section
        @tcid:100
        Scenario: my first test
          Given That I am a tester
          When I am testing
          Then I should see test results
          And I should be satified
      """
    And There is a file named "/feature/parent-section/a-sub-section/my-second-test.feature" with the content:
      """
      Feature: parent section
        @tcid:101
        Scenario: my second test
          Given That I am a tester <name>
          | name |
          | tester 1 |
          | tester changeddata |
          When I am testing
          Then I should see test results
          And I should be satified
      """
    And I enable the verify option
    When I run the synchronization script
    Then It should fail

  Scenario: Should succeed if .feature file is the same
    Given There is a file named "/feature/parent-section/a-sub-section/my-first-test.feature" with the content:
      """
      Feature: a sub section
        @tcid:100
        Scenario: my first test
          Given That I am a tester
          When I am testing
          Then I should see test results
          And I should be satified
      """
    And There is a file named "/feature/parent-section/a-sub-section/my-second-test.feature" with the content:
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
    And I enable the verify option
    When I run the synchronization script
    Then It should succeed

  Scenario: Should succeed if only the name of feature/scenario changed
    Given There is a file named "/feature/parent-section/a-sub-section/my-first-test.feature" with the content:
      """
      Feature: whatever
        @tcid:100
        Scenario: whatever
          Given That I am a tester
          When I am testing
          Then I should see test results
          And I should be satified
      """
    And There is a file named "/feature/parent-section/a-sub-section/my-second-test.feature" with the content:
      """
      Feature: whatever
        @tcid:101
        Scenario: whatever
          Given That I am a tester <name>
          | name |
          | tester 1 |
          | tester 2 |
          When I am testing
          Then I should see test results
          And I should be satified
      """
    And I enable the verify option
    When I run the synchronization script
    Then It should succeed

  Scenario: Should only verify cases with a certain status
    Given There is a file named "/feature/parent-section/a-sub-section/my-first-test.feature" with the content:
      """
      Feature: a sub section
        @tcid:100
        Scenario: my first test
          Given That I am a tester
          When I am testing
          Then I should see test results
          And I should be satified
      """
    And I set the testrail.verifyFilters.custom_status option to "[4]"
    And I enable the verify option
    When I run the synchronization script
    Then It should succeed
