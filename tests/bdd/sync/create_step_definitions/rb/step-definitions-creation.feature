Feature: Step definitions file creation
  Background:
    Given I use a TestPlan with 1 TestRun and 2 TestCases
    And I set the indent option to "  "
    And The first case contains the following gherkin
      """
      Given I have a list of 10 apples
      When I remove **1** apples
      Then I should have 9 apples
      # a comment
      """
    And The second case contains the following gherkin
      """
      Given I have a list of 20 apples
      When I remove **5** apples
      Then I should have 15 "apples"
      """

  Scenario: Using ruby.rb template
    Given I set the stepDefinitionsTemplate option to "ruby.rb"
    When I run the synchronization script
    Then There should be 2 code files on the file system
    And The file "/js/parent-section/a-sub-section/my-first-test.rb" should have the following content:
      """
      Given(/^I have a list of (\d+) apples$/) do |arg1|
        pending
      end

      When(/^I remove \*\*(\d+)\*\* apples$/) do |arg1|
        pending
      end

      Then(/^I should have (\d+) apples$/) do |arg1|
        pending
      end


      """
    And The file "/js/parent-section/my-second-test.rb" should have the following content:
      """
      Then(/^I should have (\d+) "([^"]*)"$/) do |arg1, arg2|
        pending
      end

      
      """

  Scenario: Don't create duplicate step definitions
    Given I set the stepDefinitionsTemplate option to "ruby.rb"
    And There is a file named "/js/parent-section/a-sub-section/my-first-test.rb" with the content:
      """
      Given(/^I have a list of (\d+) apples$/) do |arg1|
        pending
      end

      When(/^I remove \*\*(\d+)\*\* apples$/) do |arg1|
        pending
      end

      Then(/^I should have (\d+) apples$/) do |arg1|
        pending
      end


      """
    When I run the synchronization script
    Then There should be 2 code files on the file system
    And The file "/js/parent-section/my-second-test.rb" should have the following content:
      """
      Then(/^I should have (\d+) "([^"]*)"$/) do |arg1, arg2|
        pending
      end


      """
