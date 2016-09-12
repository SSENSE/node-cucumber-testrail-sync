var _ = require('lodash');
var chai = require('chai');
var expect = chai.expect;
var ScenarioSynchronizer = require('../lib/ScenarioSynchronizer');

describe('Scenario synchronizer', function () {
  var sync = new ScenarioSynchronizer();

  it('isValidGherkin fails when called with invalid gherkin', function (done) {
    var gherkin = [
      'Blabla',
      'Given I am a tester\nWhatever I am testing',
    ];

    for (var i = 0; i < gherkin.length; i++) {
      expect(sync.isValidGherkin(gherkin[i])).to.be.false;
    }

    done();
  });

  it('isValidGherkin succeed when called with valid gherkin', function (done) {
    var gherkin = [
      'Given I am a tester',
      'Given I am a tester\n When I am testing',
      'Given I am a tester\n  When I am testing\nAnd The test should pass',
      'Given I am a tester\n\tWhen I am testing\nAnd The test should pass\nThen The test passes',
      'Given I am a tester\n| name |\n| myself |\nWhen I am testing\nAnd The test should pass\nThen The test passes',
      'Given I am a tester\n| name |\n| myself |\nWhen I am testing\nAnd The test should pass\nThen The test passes\n"""\ndata\n"""\nAnd something else',
      'Given I am a tester <name>\nWhen I am testing\nAnd The test should pass\nThen The test passes\n\nExamples:\n| name |\n| myself |\n',
    ];

    for (var i = 0; i < gherkin.length; i++) {
      expect(sync.isValidGherkin(gherkin[i])).to.be.true;
    }

    done();
  });

  // TestRail returns tables in a format such as:
  // || row1.1 | row1.2
  // We have to cast it to a markdown format:
  // | row1.1 | row1.2 |
  it('getGherkinLines succeed when called with valid gherkin with tables', function (done) {
    var gherkin = '  Given   i am a tester  \n|| name\n|| myself';
    var expected = [ 'Given I am a tester', '| name|', '| myself|'];

    expect(sync.getGherkinLines({ custom_gherkin: gherkin })).to.deep.equal(expected);

    gherkinTriplePipes = '  Given   i am a tester  \n||| name\n|| myself';

    expect(sync.getGherkinLines({ custom_gherkin: gherkinTriplePipes })).to.deep.equal(expected);

    done();
  });

  it('getGherkinLines succeed when called with valid gherkin (Scenario Outline)', function (done) {
    var gherkin = 'Given There are <start> cucumbers\nWhen I eat <eat> cucumbers\nThen I should have <left> cucumbers\n\nExamples:\n| start | eat | left |\n| 12 | 5 | 7 |';
    var expected = [ 'Given There are <start> cucumbers', 'When I eat <eat> cucumbers', 'Then I should have <left> cucumbers', '', 'Examples:', '| start | eat | left |', '| 12 | 5 | 7 |'];

    expect(sync.getGherkinLines({ custom_gherkin: gherkin })).to.deep.equal(expected);

    done();
  });
});
