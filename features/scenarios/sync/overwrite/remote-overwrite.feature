Feature: Remote overwrite tests
  Background:
    Given I use a TestPlan with 1 TestRun and 2 TestCases

  Scenario: Don't overwrite remote Gherkins if overwrite.remote is not set
    Given There is a file named "/feature/parent-section/a-sub-section/my-first-test.feature" with the content:
      """
      Feature: a sub section
        @tcid:100
        Scenario: my first test
        Given That I am a tester
      """
    When I run the synchronization script
    Then The TestCase should have the following Gherkins:
      """
      Given That I am a tester
      When I am testing
      Then I should see test results
      And I should be satified
      """


  Scenario: Overwrite remote Gherkins if overwrite.remote = True
    Given There is a file named "/feature/parent-section/a-sub-section/my-first-test.feature" with the content:
      """
      Feature: a sub section
        @tcid:100
        Scenario: my first test
          Given That I am a tester #1
          When I am testing #2
          Then I should see test results #3
          And I should be satified #4
      """
    And I enable the overwrite.remote option
    When I run the synchronization script
    Then The TestCase should have the following Gherkins:
      """
      Given That I am a tester #1
      When I am testing #2
      Then I should see test results #3
      And I should be satified #4
      """


  Scenario: Overwrite remote Gherkins if overwrite.remote = 'ask' and the user confirms the overwrite
    Given There is a file named "/feature/parent-section/a-sub-section/my-first-test.feature" with the content:
      """
      Feature: a sub section
        @tcid:100
        Scenario: my first test
          Given That I am a tester #1
          When I am testing #2
          Then I should see test results #3
          And I should be satified #4
      """
    And I set the overwrite.remote option to "ask"
    And I confirm the overwrite
    When I run the synchronization script
    Then The TestCase should have the following Gherkins:
      """
      Given That I am a tester #1
      When I am testing #2
      Then I should see test results #3
      And I should be satified #4
      """


  Scenario: Don't overwrite remote Gherkins if overwrite.remote = 'ask' and the user denies the overwrite
    Given There is a file named "/feature/parent-section/a-sub-section/my-first-test.feature" with the content:
      """
      Feature: a sub section
        @tcid:100
        Scenario: my first test
          Given That I am a tester #1
          When I am testing #2
          Then I should see test results #3
          And I should be satified #4
      """
    And I set the overwrite.remote option to "ask"
    And I deny the overwrite
    When I run the synchronization script
    Then The TestCase should have the following Gherkins:
      """
      Given That I am a tester
      When I am testing
      Then I should see test results
      And I should be satified
      """