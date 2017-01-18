Feature: Step definitions file creation
  Background:
    Given I use a TestPlan with 1 TestRun and 2 TestCases
    And I set the indent option to "  "
    And The first case contains the following gherkin
      """
      When The user requests to create a new product url /products
      And The request method post      
      Then The request is successful with status="201"
      """
    And The second case contains the following gherkin
      """      
      When The user requests to update an existing product url /products/4
      And The request method put      
      Then The request is successful with status="200"
      """

  Scenario: Don't create duplicate step definitions
    Given I set the stepDefinitionsTemplate option to "typescript.legacy.ts"
    And There is a file named "/support/common.ts" with the content:
      """
      module.exports = function (): void {
        this.When(/^.* request method ([\w]+)$/, (method: string, callback: Function) => {
          callback(null, 'pending');
        });

        this.When(/^.* url ([&=\?\/\w]+)$/, (endpointUrl: string, callback: Function) => {
          callback(null, 'pending');
        });

      };

      """
    When I run the synchronization script
    Then There should be 1 code files on the file system
    And The file "/js/parent-section/a-sub-section/my-first-test.ts" should have the following content:
      """
      module.exports = function (): void {
        this.Then(/^The request is successful with status="([^"]*)"$/, (arg1: string, callback: Function): void => {
          callback(null, 'pending');
        });

      };
      
      """
