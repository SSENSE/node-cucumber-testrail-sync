Feature: Step definitions file creation - Scenarios mixed with Scenario outlines
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
      When The user requests url <endpoint>
      And The request method get
      Then The request is <request_result> with status="<status>"

      Examples:
      | endpoint | request_result | status |
      | /products | successful | 200 |
      """

  Scenario: Don't create step definitions if they are already implemented
    Given I set the stepDefinitionsTemplate option to "typescript.legacy.ts"
    And There is a file named "/js/api-helpers/common.ts" with the content:
      """
      module.exports = function (): void {
        this.When(/^.* request method ([\w]+)$/, (method: string, callback: Function) => {
          callback(null, 'pending');
        });

        this.When(/^.* url ([&=\?\/\w]+)$/, (endpointUrl: string, callback: Function) => {
          callback(null, 'pending');
        });

        this.Then(/^The request is (?:successful|unsuccessful) with status=(?:")?(\d+)(?:")?$/,
          (responseCode: string, callback: Function): void => {
          callback(null, 'pending');
        });

      };

      """
    When I run the synchronization script
    Then There should be 1 code file on the file system
   