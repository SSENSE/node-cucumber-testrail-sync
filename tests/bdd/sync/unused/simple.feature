Feature: Find unused step definitions
  Background:
    Given I use a TestPlan with 1 TestRun and 2 TestCases
    And I enable the findUnused option
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
    And There is a file named "/feature/test.feature" with the content:
      """
      Feature: test
        Scenario: test
          When The user requests to create a new product url /products
          And The request method post      
          Then The request is successful with status="201"
      """

  Scenario: Has unused step definitions
    Given There is a file named "/js/parent-section/a-sub-section/my-first-test.ts" with the content:
      """
      module.exports = function (): void {
        this.When(/^Whatever$/, (method: string, callback: Function) => {
          callback(null, 'pending');
        });
      };
      """
    When I run the synchronization script
    Then It should fail
    
  Scenario: Has no unused step definitions
    When I run the synchronization script
    Then It should succeed
