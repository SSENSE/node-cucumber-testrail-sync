Feature: Verify tests

  Scenario: Should fail if no .feature file match
    Given I have 1 TestCase in a TestPlan in TestRail
    And I enable the verify option
    When I run the synchronization script
    Then It should fail

  Scenario: Should fail if there's a missing .feature file
    Given I have 1 TestCase in a TestPlan in TestRail
    And There is a file named "/feature/parent-section/a-sub-section/my-first-test.feature" with the content:
      """
      Feature: a sub section
        @tcid:100
        Scenario: my first test
          Given that I am a tester
          When I am testing
          Then I should see test results
          And I should be satified
      """
    And I enable the verify option
    When I run the synchronization script
    Then It should fail

  Scenario: Should fail if .feature file content is different
    Given I have 1 TestCase in a TestPlan in TestRail
    And There is a file named "/feature/parent-section/a-sub-section/my-first-test.feature" with the content:
      """
      Feature: a sub section
        @tcid:100
        Scenario: my first test
          Given that I am a tester
          When I am testing
          Then I should see test results
          And I should be satified
      """
    And There is a file named "/feature/parent-section/a-sub-section/my-second-test.feature" with the content:
      """
      Feature: parent section
        @tcid:101
        Scenario: my second test
          Given that I am a tester <name>
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
    Given I have 1 TestCase in a TestPlan in TestRail
    And There is a file named "/feature/parent-section/a-sub-section/my-first-test.feature" with the content:
      """
      Feature: a sub section
        @tcid:100
        Scenario: my first test
          Given that I am a tester
          When I am testing
          Then I should see test results
          And I should be satified
      """
    And There is a file named "/feature/parent-section/a-sub-section/my-second-test.feature" with the content:
      """
      Feature: parent section
        @tcid:101
        Scenario: my second test
          Given that I am a tester <name>
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