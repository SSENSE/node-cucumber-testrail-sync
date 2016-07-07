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


function ScenarioSynchronizer(options, callback) {
  var defaultOptions = {
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
    testFilesTemplate: Joi.string(),
    indent: Joi.string().required(),
    featuresDir: Joi.string().required(),
    jsDir: Joi.string().required(),
    silent: Joi.boolean()
  });

  this.options = _.defaultsDeep(options, defaultOptions);
  this.templateDir = path.resolve(__dirname, '..', 'templates');

  async.series([
    function validateOptions(next) {
      Joi.validate(this.options, schema, next);
    }.bind(this),

    function validateOverwriteOption(next) {
      if (typeof this.options.overwrite === 'undefined') {
        this.options.overwrite = {
          local: false,
          remote: false,
        };
      }

      if (typeof this.options.overwrite.local === 'undefined') {
        this.options.overwrite.local = false;
      }

      if (typeof this.options.overwrite.remote === 'undefined') {
        this.options.overwrite.remote = false;
      }

      if (this.options.overwrite.local !== false && this.options.overwrite.remote !== false) {
        return next(new Error('Validation error: overwrite.local and overwrite.remote cannot be both defined'));
      }

      return next();
    }.bind(this),

    function validateTemplateOption(next) {
      if (this.options.testFilesTemplate) {
        fs.stat(path.resolve(this.templateDir, this.options.testFilesTemplate + '.hbs'), function statCallback(err, stat) {
          if (err) {
            if (err.code === 'ENOENT') {
              return next(new Error('Validation error: template file ' + this.options.testFilesTemplate + '.hbs does not exists'));
            }
            return next(err);
          } else if (!stat.isFile()) {
            return next(new Error('Validation error: template file ' + this.options.testFilesTemplate + '.hbs is not a file'));
          }
          return next();
        }.bind(this));
      } else {
        return next();
      }
    }.bind(this),

    function fetchPlan(next) {
      this.testrailClient = new Testrail(this.options.testrail);

      this.testrailClient.getPlan(this.options.testrail.filters.plan_id, function (err, plan) {
        if (err) {
          return next(err);
        }
        if (!plan.entries || plan.entries.length === 0 || !plan.entries[0].runs || plan.entries[0].runs.length == 0) {
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
          var case_id = cases[i].id;
          this.caseSections[case_id] = cases[i].section_id;
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
          var section_id = sections[i].id;
          var node = { 
            slug: S(sections[i].name).slugify().s,
            parent_id: sections[i].parent_id
          };
          this.sectionTree[section_id] = node;
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


ScenarioSynchronizer.prototype.getTestFileContent = function (gherkinsSteps, template) {
  var templateContent = fs.readFileSync(path.resolve(this.templateDir, template + '.hbs')).toString().replace(/\t/g, this.options.indent);
  var compiledTemplate = Handlebars.compile(templateContent);

  var data = { steps: [] };
  var lastKeyword = null;
  for (var i = 0; i < gherkinsSteps.length; i++) {
    var gherkinsStep = gherkinsSteps[i];
    var gherkinsWords = gherkinsStep.split(' ');
    var keyword = gherkinsWords.shift();

    if (keyword === 'And') {
      keyword = lastKeyword;
    } else {
      lastKeyword = keyword;
    }

    var regex = escapeStringRegexp(gherkinsWords.join(' ')).replace(/\//g, '\\/');

    data.steps.push({ keyword: keyword, regex: regex });
  }

  return compiledTemplate(data);
};


ScenarioSynchronizer.prototype.output = function (s) {
  /* istanbul ignore next */
  if (!this.options.silent) {
    console.log(s);
  }
};


ScenarioSynchronizer.prototype.isValidGherkins = function (gherkins) {
  if (gherkins === null) {
    return false;
  }

  var lines = gherkins.split('\n').map(Function.prototype.call, String.prototype.trim).filter(function (line) {
    var trimmed = line.trim();
    return trimmed.length > 0 && trimmed.indexOf('Scenario:') !== 0;
  });

  var re = new RegExp('^(Given|When|And|Then)', 'i');
  var validLines = lines.filter(function (line) {
    return re.test(line);
  });

  return (lines.length === validLines.length);
};


ScenarioSynchronizer.prototype.getRelativePath = function (id) {
  if (!this.caseSections[id]) {
    return '';
  }

  var section_id = this.caseSections[id];

  var section = this.sectionTree[section_id];

  var paths = [];
  while (true) {
    paths.push(section.slug);

    if(section.parent_id === null) {
      break;
    }

    section = this.sectionTree[section.parent_id];
  }

  var relativePath = paths.reverse().join('/');

  return relativePath;
};


ScenarioSynchronizer.prototype.synchronize = function (callback) {
  this.output(chalk.green('Syncing with TestRail ...'));
  this.output('');


  this.testrailClient.getTests(this.plan.entries[0].runs[0].id, function (err2, testcases) {
    async.eachSeries(testcases, function iterate(testcase, nextCase) {
      if (this.isValidGherkins(testcase.custom_gherkin)) {
        this.synchronizeCase(testcase, this.getRelativePath(testcase.case_id), nextCase);
      } else {
        this.output(chalk.yellow('Invalid gherkin content for TestCase #' + testcase.case_id));
        nextCase();
      }
    }.bind(this), callback);
  }.bind(this));
};


ScenarioSynchronizer.prototype.pushTestCaseToTestRail = function (testcase, gherkins, callback) {
  var customGherkin = gherkins.split('\n')
    .slice(3)
    .map(Function.prototype.call, String.prototype.trim)
    .join('\n');

  this.testrailClient.updateCase(testcase.case_id, { custom_gherkin: customGherkin }, callback);
};


ScenarioSynchronizer.prototype.synchronizeCase = function (testcase, relativePath, callback) {
  var basename = 'C' + testcase.case_id + '-' + S(testcase.title).slugify().s;
  var exists = { feature: false, js: false };

  var featurePath = path.resolve(this.options.featuresDir + '/' + relativePath, basename + '.feature');
  var jsPath = path.resolve(this.options.jsDir + '/' + relativePath, basename + '.js');

  async.series([
    function createFeaturesDirectoryStructure(next) {
      mkdirp(this.options.featuresDir + '/' + relativePath, next);
    }.bind(this),


    function createJSDirectoryStructure(next) {
      mkdirp(this.options.jsDir + '/' + relativePath, next);
    }.bind(this),


    function checkFeatureFileExistence(next) {
      fs.stat(featurePath, function statCallback(err) {
        exists.feature = !err;
        next();
      });
    },


    function checkJSFileExistence(next) {
      fs.stat(jsPath, function statCallback(err) {
        exists.js = !err;
        next();
      });
    },



    function synchronizeFiles(next) {
      var gherkins = testcase.custom_gherkin.replace(/[\r]/g, '');
      gherkins = gherkins.split('\n').filter(function (line) {
        var trimmed = line.trim();
        return trimmed.length > 0 && trimmed.indexOf('Scenario:') !== 0;
      });

      var remoteFileContent = 'Feature: ' + testcase.title + '\n';
      remoteFileContent += this.options.indent + '@tcid:' + testcase.case_id + '\n';
      remoteFileContent += this.options.indent + 'Scenario: C' + testcase.case_id + ' - ' + testcase.title + '\n' + this.options.indent + this.options.indent;
      remoteFileContent += gherkins.join('\n' + this.options.indent + this.options.indent);

      if (!exists.feature) {
        fs.writeFileSync(featurePath, remoteFileContent);

        if (!exists.js && this.options.testFilesTemplate) {
          fs.writeFileSync(jsPath, this.getTestFileContent(gherkins, this.options.testFilesTemplate));
        }

        this.output('  ' + chalk.green('Creating ' + basename));
        next();
      } else {
        var localFileContent = fs.readFileSync(featurePath).toString();
        var fileChanged = (localFileContent !== remoteFileContent);

        if (!fileChanged) {
          this.output('  ' + chalk.yellow('Skipping ' + basename + ' (no changes)'));
          next();
        } else if (this.options.overwrite.local === true) {
          this.output('  ' + chalk.green('Overwriting ' + basename));
          fs.writeFileSync(featurePath, remoteFileContent);
          next();
        } else if (this.options.overwrite.local === 'ask') {
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
        } else if (this.options.overwrite.remote === true) {
          this.pushTestCaseToTestRail(testcase, localFileContent, function (err) {
            if (!err) {
              this.output('  ' + chalk.green('Pushing ' + basename + ' to TestRail'));
            }
            next(err);
          }.bind(this));
        } else if (this.options.overwrite.remote === 'ask') {
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
