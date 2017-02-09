import {expect} from 'chai';
import {GherkinFormatter} from '../../src/GherkinFormatter';

/* tslint:disable:max-line-length */
describe('GherkinFormatter', () => {
    const formatter = new GherkinFormatter();

    it('isValidGherkin fails when called with invalid gherkin', () => {
        const gherkin = [
            'Blabla',
            'Given I am a tester\nWhatever I am testing'
        ];

        for (let i = 0; i < gherkin.length; i++) {
            expect(formatter.isValidGherkin(gherkin[i])).to.be.false;
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
            'Given I am a tester <name>\nWhen I am testing\nAnd The test should pass\nThen The test passes\n\nExamples:\n|: name |\n| myself |\n'
        ];

        for (let i = 0; i < gherkin.length; i++) {
            expect(formatter.isValidGherkin(gherkin[i])).to.be.true;
        }
    });

    // TestRail returns tables in a format such as:
    // ||: header1 | header2
    // || row1.1 | row1.2
    // We have to cast it to a markdown format:
    // | header1 | header2 |
    // | row1.1 | row1.2 |
    it('formatLinesFromTestrail succeed when called with valid gherkin with tables #1', () => {
        const gherkin = '  Given   i am a tester  \n||: name |: occupation\n|| myself | developer\n|| someone else |\n# a comment';
        const expected = [ 'Given I am a tester', '| name | occupation|', '| myself | developer|', '| someone else ||', '# a comment'];

        expect(formatter.formatLinesFromTestrail({ custom_gherkin: gherkin })).to.deep.equal(expected);
    });

    it('formatLinesFromTestrail succeed when called with valid gherkin with tables #2', () => {
        const gherkin = '|||:Header 1|:Header 2\n|| Line 1.1 | Line 1.2\n|| Line 2.1 |';
        const expected = [ '|Header 1|Header 2|', '| Line 1.1 | Line 1.2|', '| Line 2.1 ||'];

        expect(formatter.formatLinesFromTestrail({ custom_gherkin: gherkin })).to.deep.equal(expected);
    });

    it('formatLinesFromTestrail succeed when called with valid gherkin with tables #3', () => {
        const gherkin = '|||:Header 1|:Header 2\n|| Line 1.1 | Line 1.2\n||| Line 2.2';
        const expected = [ '|Header 1|Header 2|', '| Line 1.1 | Line 1.2|', '|| Line 2.2|'];

        expect(formatter.formatLinesFromTestrail({ custom_gherkin: gherkin })).to.deep.equal(expected);
    });

    // In case of a hardcoded table, rows should end by a |
    // | header1 | header2 |
    // || value |
    it('formatLinesFromTestrail succeed when called with valid gherkin with tables #3', () => {
        const gherkin = 'Given I am a tester\n| header1 | header2 |\n|| value |';
        const expected = [ 'Given I am a tester', '| header1 | header2 |', '|| value |'];

        expect(formatter.formatLinesFromTestrail({ custom_gherkin: gherkin })).to.deep.equal(expected);
    });

    it('formatLinesFromTestrail succeed when called with valid gherkin (Scenario Outline)', () => {
        const gherkin = 'Given There are <start> cucumbers\nWhen I eat <eat> cucumbers\nThen I should have <left> cucumbers\n\nExamples:\n| start | eat | left |\n| 12 | 5 | 7 |';
        const expected = [ 'Given There are <start> cucumbers', 'When I eat <eat> cucumbers', 'Then I should have <left> cucumbers', '', 'Examples:', '| start | eat | left |', '| 12 | 5 | 7 |'];

        expect(formatter.formatLinesFromTestrail({ custom_gherkin: gherkin })).to.deep.equal(expected);
    });

    it('replaceTablesByMultiPipesTables (Scenario)', () => {
        const gherkin  = 'Given i am a tester\n| name | occupation |\n| myself | developer |\n| someone else ||\n# a comment';
        const expected = 'Given i am a tester\n|||: name |: occupation\n|| myself | developer\n|| someone else |\n# a comment';

        expect(formatter.replaceTablesByMultiPipesTables(gherkin)).to.deep.equal(expected);
    });

    it('replaceTablesByMultiPipesTables (Scenario Outline)', () => {
        const gherkin = 'Given There are <start> cucumbers\nWhen I eat <eat> cucumbers\nThen I should have <left> cucumbers\n\nExamples:\n| start | eat | left |\n| 12 | 5 | 7 |';
        const expected = 'Given There are <start> cucumbers\nWhen I eat <eat> cucumbers\nThen I should have <left> cucumbers\n\nExamples:\n|||: start |: eat |: left\n|| 12 | 5 | 7';

        expect(formatter.replaceTablesByMultiPipesTables(gherkin)).to.deep.equal(expected);
    });
});
