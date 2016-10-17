import {expect} from 'chai';
import {ScenarioSynchronizer} from '../../src/index';

/* tslint:disable:max-line-length */
describe('Scenario synchronizer', () => {
    const sync = new ScenarioSynchronizer();

    it('isValidGherkin fails when called with invalid gherkin', () => {
        const gherkin = [
            'Blabla',
            'Given I am a tester\nWhatever I am testing'
        ];

        for (let i = 0; i < gherkin.length; i++) {
            expect(sync.isValidGherkin(gherkin[i])).to.be.false;
        }
    });

    it('isValidGherkin succeed when called with valid gherkin', () => {
        const gherkin = [
            'Given I am a tester\n# comment',
            'Given I am a tester\n When I am testing',
            'Given I am a tester\n  When I am testing\nAnd The test should pass',
            'Given I am a tester\n\tWhen I am testing\nAnd The test should pass\nThen The test passes',
            'Given I am a tester\n| name |\n| myself |\nWhen I am testing\nAnd The test should pass\nThen The test passes',
            'Given I am a tester\n| name |\n| myself |\nWhen I am testing\nAnd The test should pass\nThen The test passes\n"""\ndata\n"""\nAnd something else',
            'Given I am a tester <name>\nWhen I am testing\nAnd The test should pass\nThen The test passes\n\nExamples:\n| name |\n| myself |\n'
        ];

        for (let i = 0; i < gherkin.length; i++) {
            expect(sync.isValidGherkin(gherkin[i])).to.be.true;
        }
    });

    // TestRail returns tables in a format such as:
    // || row1.1 | row1.2
    // We have to cast it to a markdown format:
    // | row1.1 | row1.2 |
    it('getGherkinLines succeed when called with valid gherkin with tables', () => {
        const gherkin = '  Given   i am a tester  \n|| name\n|| myself\n # a comment';
        const expected = [ 'Given I am a tester', '| name|', '| myself|', '# a comment'];

        expect(sync.getGherkinLines({ custom_gherkin: gherkin })).to.deep.equal(expected);

        const gherkinTriplePipes = '  Given   i am a tester  \n||| name\n|| myself\n # a comment';

        expect(sync.getGherkinLines({ custom_gherkin: gherkinTriplePipes })).to.deep.equal(expected);
    });

    it('getGherkinLines succeed when called with valid gherkin (Scenario Outline)', () => {
        const gherkin = 'Given There are <start> cucumbers\nWhen I eat <eat> cucumbers\nThen I should have <left> cucumbers\n\nExamples:\n| start | eat | left |\n| 12 | 5 | 7 |';
        const expected = [ 'Given There are <start> cucumbers', 'When I eat <eat> cucumbers', 'Then I should have <left> cucumbers', '', 'Examples:', '| start | eat | left |', '| 12 | 5 | 7 |'];

        expect(sync.getGherkinLines({ custom_gherkin: gherkin })).to.deep.equal(expected);
    });
});
