var Testrail = require('testrail-api');
var path = require('path');
var async = require('async');
var S = require('string');
var chalk = require('chalk');
var fs = require('fs');
var inquirer = require('inquirer');
var escapeStringRegexp = require('escape-string-regexp');
var mkdirp = require('mkdirp');
var Handlebars = require('handlebars');
var _ = require('lodash');
var Joi = require('joi');

function ScenarioSynchronizer(config, callback) {
  var defaultConfig = {
    indent: '  '
  };

  var schema = Joi.object().keys({
    testrail: {
      host: Joi.string().required(),
      user: Joi.string().required(),
      password: Joi.string().required(),
      filters: {
        plan_id: Joi.number().required()
      }
    },
    overwrite: {
      local: Joi.any().valid([true, false, 'ask']),
      remote: Joi.any().valid([true, false, 'ask'])
    },
    stepDefinitionsTemplate: Joi.string(),
    indent: Joi.string().required(),
    featuresDir: Joi.string().required(),
    stepDefinitionsDir: Joi.string().required(),
    silent: Joi.boolean().default(false),
    pushResults: Joi.boolean().default(false),
    skipRootFolder: Joi.number().default(0)
  });

  this.config = _.defaultsDeep(config, defaultConfig);
  this.templateDir = path.resolve(__dirname, '..', 'templates');

  async.series([
    function validateConfigs(next) {
      Joi.validate(this.config, schema, next);
    }.bind(this),

    function validateOverwriteConfig(next) {
      if (typeof this.config.overwrite === 'undefined') {
        this.config.overwrite = {
          local: false,
          remote: false
        };
      }

      if (typeof this.config.overwrite.local === 'undefined') {
        this.config.overwrite.local = false;
      }

      if (typeof this.config.overwrite.remote === 'undefined') {
        this.config.overwrite.remote = false;
      }

      if (this.config.overwrite.local !== false && this.config.overwrite.remote !== false) {
        return next(new Error('Validation error: overwrite.local and overwrite.remote cannot be both defined'));
      }

      return next();
    }.bind(this),

    function validateTemplateConfig(next) {
      if (this.config.stepDefinitionsTemplate) {
        fs.stat(path.resolve(this.templateDir, this.config.stepDefinitionsTemplate + '.hbs'), function statCallback(err, stat) {
          if (err) {
            if (err.code === 'ENOENT') {
              return next(new Error('Validation error: template file ' + this.config.stepDefinitionsTemplate + '.hbs does not exists'));
            }
            return next(err);
          } else if (!stat.isFile()) {
            return next(new Error('Validation error: template file ' + this.config.stepDefinitionsTemplate + '.hbs is not a file'));
          }
          return next();
        }.bind(this));
      } else {
        return next();
      }
    }.bind(this),

    function fetchPlan(next) {
      this.testrailClient = new Testrail(this.config.testrail);

      this.testrailClient.getPlan(this.config.testrail.filters.plan_id, function (err, plan) {
        if (err) {
          return next(err);
        }
        if (!plan.entries || plan.entries.length === 0 || !plan.entries[0].runs || plan.entries[0].runs.length === 0) {
          return next('You must add a Test Suite to your Test Plan in TestRail');
        }
        this.plan = plan;
        next();
      }.bind(this));
    }.bind(this),

    function fetchCasesSection(next) {
      this.caseSections = {};

      this.testrailClient.getCases(this.plan.project_id, { suite_id: this.plan.entries[0].suite_id }, function (err, cases) {
        if (err) {
          return next(err);
        }

        for (var i = 0; i < cases.length; i++) {
          var caseId = cases[i].id;
          this.caseSections[caseId] = cases[i].section_id;
        }

        next();
      }.bind(this));
    }.bind(this),

    function createTree(next) {
      this.sectionTree = {};

      this.testrailClient.getSections(this.plan.project_id, { suite_id: this.plan.entries[0].suite_id }, function (err, sections) {
        if (err) {
          return next(err);
        }

        for (var i = 0; i < sections.length; i++) {
          var sectionId = sections[i].id;
          var node = {
            name: sections[i].name,
            slug: S(sections[i].name).slugify().s,
            parent_id: sections[i].parent_id
          };
          this.sectionTree[sectionId] = node;
        }

        next();
      }.bind(this));
    }.bind(this),


    function synchronize(next) {
      this.synchronize(function (err) {
        if (err) {
          this.output(chalk.red('Synchronization error:'));
        }
        next(err);
      }.bind(this));
    }.bind(this)
  ],
  function (err) {
    if (err) {
      var errorMessage = err.message || err;
      if (_.isString(errorMessage)) {
        this.output(chalk.red(errorMessage));
      } else {
        this.output(err);
      }
    }
    callback(err);
  }.bind(this));
}


ScenarioSynchronizer.prototype.getTestFileExtension = function (template) {
  return path.extname(template).substr(1);
};

/**
* Generate a file containing blank Steps Definitions
*
* @param {gherkinSteps} Array The gherkin steps
* @param {template} string The name of the handlebars template to use
*
* @api private
*/
ScenarioSynchronizer.prototype.getTestFileContent = function (gherkinSteps, template) {
  var templateContent = fs.readFileSync(path.resolve(this.templateDir, template + '.hbs')).toString().replace(/\t/g, this.config.indent);
  var compiledTemplate = Handlebars.compile(templateContent);

  var data = { steps: [] };
  var lastKeyword = null;
  var isData = false;
  for (var i = 0; i < gherkinSteps.length; i++) {
    var gherkinsStep = gherkinSteps[i];
    if (gherkinsStep[0] === '|') { // an example table
      continue;
    }
    if (gherkinsStep.substr(0, 3) === '"""') {
      isData = !isData;
      continue;
    }
    if (isData) {
      continue;
    }

    var gherkinWords = gherkinsStep.split(' ');
    var keyword = gherkinWords.shift();
    var params = '';

    if (i + 1 < gherkinSteps.length) {
      if (gherkinSteps[i + 1][0] === '|') { // an example table
        params = 'table, ';
        if (template === 'typescript.ts') {
          params = 'table: any, ';
        }
      }
    }

    if (keyword === 'And') {
      keyword = lastKeyword;
    } else {
      lastKeyword = keyword;
    }

    var regex = gherkinWords.join(' ');
    regex = escapeStringRegexp(regex).replace(/\//g, '\\/');

    data.steps.push({ keyword: keyword, regex: regex, params: params });
  }

  return compiledTemplate(data);
};


ScenarioSynchronizer.prototype.output = function (s) {
  /* istanbul ignore next */
  if (!this.config.silent) {
    console.log(s);
  }
};

/**
* Verify that each line is valid gherkin syntax
*
* @api private
*/
ScenarioSynchronizer.prototype.isValidGherkin = function (data) {
  if (data === null) {
    return false;
  }

  var lines = data.split('\n').map(Function.prototype.call, String.prototype.trim).filter(function (line) {
    return line.length > 0 && line.indexOf('Scenario:') !== 0;
  });

  var re = new RegExp('^(Given|When|And|Then|\\|)', 'i');
  var validLines = lines.filter(function (line) {
    return re.test(line);
  });

  var numLinesWithData = 0;
  var isData = false;
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (line.substr(0, 3) === '"""') {
      numLinesWithData++;
      isData = !isData;
      continue;
    }
    if (isData) {
      numLinesWithData++;
      continue;
    }
  }

  return (lines.length === validLines.length + numLinesWithData);
};

/**
* Generate a file containing blank Steps Definitions
*
* @param {gherkinSteps} Array The gherkin steps
* @param {template} string The name of the handlebars template to use
*
* @api private
*/
ScenarioSynchronizer.prototype.getRelativePath = function (id) {
  if (!this.caseSections[id]) {
    return '';
  }

  var sectionId = this.caseSections[id];

  var section = this.sectionTree[sectionId];

  var paths = [];
  while (true) {
    paths.push(section.slug);

    if (section.parent_id === null) {
      break;
    }

    section = this.sectionTree[section.parent_id];
  }

  paths = paths.reverse();

  if (this.config.skipRootFolder > 0) {
    paths = paths.splice(this.config.skipRootFolder);
  }

  return paths.join('/');
};

/**
* Find the name of the last-child section of a test case
*
* @param {id} number A test case ID
*
* @api private
*/
ScenarioSynchronizer.prototype.getLastSectionName = function (id) {
  if (!this.caseSections[id]) {
    return 'Cannot find feature name';
  }

  var sectionId = this.caseSections[id];

  var section = this.sectionTree[sectionId];

  return section.name;
};


ScenarioSynchronizer.prototype.synchronize = function (callback) {
  this.output(chalk.green('Syncing with TestRail ...'));
  this.output('');


  this.testrailClient.getTests(this.plan.entries[0].runs[0].id, function (err2, testcases) {
    async.eachSeries(testcases, function iterate(testcase, nextCase) {
      if (this.isValidGherkin(testcase.custom_gherkin)) {
        this.synchronizeCase(testcase, this.getRelativePath(testcase.case_id), nextCase);
      } else {
        this.output(chalk.yellow('Invalid gherkin content for TestCase #' + testcase.case_id + '-' + S(testcase.title).slugify().s));
        this.output(chalk.yellow(testcase.custom_gherkin));
        nextCase();
      }
    }.bind(this), callback);
  }.bind(this));
};

/**
* Updates a test case gherkin content on TestRail
*
* @param {testcase} testcase The test case
* @param {gherkin} string The gherkin content
* @param {callback} Function
*
* @api private
*/
ScenarioSynchronizer.prototype.pushTestCaseToTestRail = function (testcase, gherkin, callback) {
  var customGherkin = gherkin.split('\n')
    .slice(3)
    .map(Function.prototype.call, String.prototype.trim)
    .join('\n');

  this.testrailClient.updateCase(testcase.case_id, { custom_gherkin: customGherkin }, callback);
};


ScenarioSynchronizer.prototype.synchronizeCase = function (testcase, relativePath, callback) {
  var basename = S(testcase.title).slugify().s;
  var exists = { feature: false, step_definitions: false };

  var featurePath = path.resolve(this.config.featuresDir + '/' + relativePath, basename + '.feature');
  var stepDefinitionsExtension = this.config.stepDefinitionsTemplate ? this.getTestFileExtension(this.config.stepDefinitionsTemplate) : '';
  var stepDefinitionsPath = path.resolve(this.config.stepDefinitionsDir + '/' + relativePath, basename + '.' + stepDefinitionsExtension);

  async.series([
    function createFeaturesDirectoryStructure(next) {
      mkdirp(this.config.featuresDir + '/' + relativePath, next);
    }.bind(this),


    function createStepDefinitionsDirectoryStructure(next) {
      mkdirp(this.config.stepDefinitionsDir + '/' + relativePath, next);
    }.bind(this),


    function checkFeatureFileExistence(next) {
      fs.stat(featurePath, function statCallback(err) {
        exists.feature = !err;
        next();
      });
    },


    function checkStepDefinitionsFileExistence(next) {
      fs.stat(stepDefinitionsPath, function statCallback(err) {
        exists.step_definitions = !err;
        next();
      });
    },


    function synchronizeFiles(next) {
      var gherkin = testcase.custom_gherkin.replace(/[\r]/g, '');
      gherkin = gherkin.split('\n').map(function (line) {
        return line.trim();
      })
      .filter(function (line) {
        return line.length > 0 && line.indexOf('Scenario:') !== 0;
      })
      .map(function (line) {
        // replace line like: ||value1|value2 by |value1|value2|
        return line.replace(/^\|\|(.*)([^\|])$/, '|$1$2|');
      });

      var remoteFileContent = 'Feature: ' + this.getLastSectionName(testcase.case_id) + '\n';
      remoteFileContent += this.config.indent + '@tcid:' + testcase.case_id + '\n';
      remoteFileContent += this.config.indent + 'Scenario: ' + testcase.title + '\n' + this.config.indent + this.config.indent;
      remoteFileContent += gherkin.join('\n' + this.config.indent + this.config.indent);

      if (!exists.feature) {
        fs.writeFileSync(featurePath, remoteFileContent);

        if (!exists.step_definitions && this.config.stepDefinitionsTemplate) {
          fs.writeFileSync(stepDefinitionsPath, this.getTestFileContent(gherkin, this.config.stepDefinitionsTemplate));
        }

        this.output('  ' + chalk.green('Creating ' + basename));
        next();
      } else {
        var localFileContent = fs.readFileSync(featurePath).toString();
        var fileChanged = (localFileContent !== remoteFileContent);

        if (!fileChanged) {
          this.output('  ' + chalk.yellow('Skipping ' + basename + ' (no changes)'));
          next();
        } else if (this.config.overwrite.local === true) {
          this.output('  ' + chalk.green('Overwriting ' + basename));
          fs.writeFileSync(featurePath, remoteFileContent);
          next();
        } else if (this.config.overwrite.local === 'ask') {
          /* istanbul ignore next */
          if (process.env.NODE_ENV !== 'test') {
            console.log('  ' + chalk.yellow(basename + ' is not up to date with TestRail'));
            console.log('  ' + chalk.yellow('Local version:'));
            console.log(localFileContent);
            console.log('-'.repeat(40));
            console.log('  ' + chalk.yellow('TestRail version:'));
            console.log(remoteFileContent);
            console.log('-'.repeat(40));
          }

          inquirer.prompt({
            type: 'confirm',
            name: 'confirm',
            message: 'Do you want to override the local version ?',
            default: false
          }, function answered(answers) {
            var confirmed = answers.confirm;

            if (confirmed) {
              fs.writeFileSync(featurePath, remoteFileContent);
              this.output('  ' + chalk.green('Updated ' + basename));
              next();
            } else {
              this.output('  ' + chalk.yellow('Skipping ' + basename));
              next();
            }
          }.bind(this));
        } else if (this.config.overwrite.remote === true) {
          this.pushTestCaseToTestRail(testcase, localFileContent, function (err) {
            if (!err) {
              this.output('  ' + chalk.green('Pushing ' + basename + ' to TestRail'));
            }
            next(err);
          }.bind(this));
        } else if (this.config.overwrite.remote === 'ask') {
          /* istanbul ignore next */
          if (process.env.NODE_ENV !== 'test') {
            console.log('  ' + chalk.yellow(basename + ' is not up to date with TestRail'));
            console.log('  ' + chalk.yellow('Local version:'));
            console.log(localFileContent);
            console.log('-'.repeat(40));
            console.log('  ' + chalk.yellow('TestRail version:'));
            console.log(remoteFileContent);
            console.log('-'.repeat(40));
          }

          inquirer.prompt({
            type: 'confirm',
            name: 'confirm',
            message: 'Do you want to override the TestRail version ?',
            default: false
          }, function answered(answers) {
            var confirmed = answers.confirm;

            if (confirmed) {
              this.pushTestCaseToTestRail(testcase, localFileContent, function (err) {
                if (!err) {
                  this.output('  ' + chalk.green('Pushed ' + basename + ' to TestRail'));
                }
                next(err);
              }.bind(this));
            } else {
              this.output('  ' + chalk.yellow('Skipping ' + basename));
              next();
            }
          }.bind(this));
        } else {
          this.output('  ' + chalk.yellow('Skipping ' + basename));
          next();
        }
      }
    }.bind(this)
  ], callback);
};


module.exports = ScenarioSynchronizer;
