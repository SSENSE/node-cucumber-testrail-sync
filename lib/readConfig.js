var path = require('path');
var _ = require('lodash');

module.exports = function () {
  var dir = process.cwd();

  var defaultOptions = {
    featuresDir: path.resolve(dir, 'features'),
    stepDefinitionsDir: path.resolve(dir, 'features', 'step_definitions')
  };

  var options = require(path.resolve(dir, '.testrail-sync.js'));

  if (options.featuresDir) {
    defaultOptions.stepDefinitionsDir = path.resolve(options.featuresDir, 'step_definitions');
  }

  return _.defaultsDeep(options, defaultOptions);
};
