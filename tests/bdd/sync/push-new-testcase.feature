Feature: Push new testcase to TestRail
  Scenario: Push new testcase to TestRail
    Given There is a file named "/feature/my-first-test.feature" with the content:
      """
      Feature: a sub section
        Scenario: my first test
          Given That I am a tester
          When I am testing
          Then I should see test results
          And I should be satified
      """
    And I use a TestPlan with 1 TestRun and 0 TestCase
    And I enable the overwrite.remote option
    When I run the synchronization script
    Then It should succeed
    And There should be 1 feature file on the file system
    And There should be 0 code file on the file system
    And The file "/feature/my-first-test.feature" should have the following content:
      """
      Feature: a sub section
        @tcid:9900
        Scenario: my first test
          Given That I am a tester
          When I am testing
          Then I should see test results
          And I should be satified
      """

  Scenario: Push new testcase to TestRail with correct table formatting
    Given There is a file named "/feature/my-first-test.feature" with the content:
      """
      Feature: a sub section
        Scenario: my first test
          Given That I am a tester
          | id | name |
          | 1 | somebody |
          When I am testing an application
          | application | version |
          | aa | v1 |
          | bb | v2 |
          Then I should see test results
          And I should be satified
      """
    And I use a TestPlan with 1 TestRun and 0 TestCase
    And I enable the overwrite.remote option
    When I run the synchronization script
    Then It should succeed
    And The pushed testcase should have the following gherkin:
      """
      Given That I am a tester
      |||: id |: name
      || 1 | somebody
      When I am testing an application
      |||: application |: version
      || aa | v1
      || bb | v2
      Then I should see test results
      And I should be satified
      """
