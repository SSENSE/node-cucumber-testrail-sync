Feature: Local overwrite tests

  Scenario: Don't overwrite local .feature file if overwrite.local is not set
    Given I have 1 TestCase in a TestPlan in TestRail
    And There is a file named "/feature/parent-section/a-sub-section/my-first-test.feature" with the content:
      """
      Some content
      """
    When I run the synchronization script
    Then I should have 1 feature file on the file system
    And The file "/feature/parent-section/a-sub-section/my-first-test.feature" should have the following content:
      """
      Some content
      """


  Scenario: Overwrite local .feature file if overwrite.local = True
    Given I have 1 TestCase in a TestPlan in TestRail
    And There is a file named "/feature/parent-section/a-sub-section/my-first-test.feature" with the content:
      """
      Some content
      """
    And I enable the overwrite.local option
    When I run the synchronization script
    Then I should have 1 feature file on the file system
    And The file "/feature/parent-section/a-sub-section/my-first-test.feature" should have the following content:
      """
      Feature: a sub section
        @tcid:100
        Scenario: my first test
          Given that I am a tester
          When I am testing
          Then I should see test results
          And I should be satified
      """

  Scenario: Overwrite local .feature file bases on testcase id
    Given I have 1 TestCase in a TestPlan in TestRail
    And There is a file named "/feature/parent-section/a-sub-section/hello-world.feature" with the content:
      """
      Feature: hello world
        @tcid:100
        Scenario: 1
          Given that I am an old test

        @tcid:101
        Scenario: 2
          Given that I am an old test
      """
    And I enable the overwrite.local option
    When I run the synchronization script
    Then I should have 1 feature file on the file system
    And The file "/feature/parent-section/a-sub-section/hello-world.feature" should have the following content:
      """
      Feature: a sub section
        @tcid:100
        Scenario: my first test
          Given that I am a tester
          When I am testing
          Then I should see test results
          And I should be satified

        @tcid:101
        Scenario: my first test
          Given that I am a tester
          | name |
          | tester 1 |
          | tester 2 |
          When I am testing
          Then I should see test results
          And I should be satified
      """

  Scenario: Overwrite local .feature file if overwrite.local = 'ask' and the user confirms the overwrite
    Given I have 1 TestCase in a TestPlan in TestRail
    And There is a file named "/feature/parent-section/a-sub-section/my-first-test.feature" with the content:
      """
      Some content
      """
    And I set the overwrite.local option to "ask"
    And I confirm the overwrite
    When I run the synchronization script
    Then I should have 1 feature file on the file system
    And The file "/feature/parent-section/a-sub-section/my-first-test.feature" should have the following content:
      """
      Feature: a sub section
        @tcid:100
        Scenario: my first test
          Given that I am a tester
          When I am testing
          Then I should see test results
          And I should be satified
      """


  Scenario: Don't overwrite local .feature file if overwrite.local = 'ask' and the user denies the overwrite
    Given I have 1 TestCase in a TestPlan in TestRail
    And There is a file named "/feature/parent-section/a-sub-section/my-first-test.feature" with the content:
      """
      Some content
      """
    And I set the overwrite.local option to "ask"
    And I deny the overwrite
    When I run the synchronization script
    Then I should have 1 feature file on the file system
    And The file "/feature/parent-section/a-sub-section/my-first-test.feature" should have the following content:
      """
      Some content
      """


  Scenario: Don't overwrite local .feature file if overwrite.local = True but file hasn't changed
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
    And I enable the overwrite.local option
    When I run the synchronization script
    Then I should have 1 feature file on the file system
    And The file "/feature/parent-section/a-sub-section/my-first-test.feature" should have the following content:
      """
      Feature: a sub section
        @tcid:100
        Scenario: my first test
          Given that I am a tester
          When I am testing
          Then I should see test results
          And I should be satified
      """
    And The file "/feature/parent-section/a-sub-section/my-first-test.feature" should not have been modified