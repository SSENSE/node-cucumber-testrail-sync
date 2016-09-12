var Testrail = require('testrail-api');
var path = require('path');
var async = require('async');
var S = require('string');
var chalk = require('chalk');
var jsdiff = require('diff');
var fs = require('fs');
var inquirer = require('inquirer');
var escapeStringRegexp = require('escape-string-regexp');
var mkdirp = require('mkdirp');
var Handlebars = require('handlebars');
var _ = require('lodash');
var Joi = require('joi');
var walk = require('walkdir');
var uniquefilename = require('uniquefilename');

function ScenarioSynchronizer() {
}

ScenarioSynchronizer.prototype.synchronize = function (config, callback) {
  var defaultConfig = {
    indent: '  '
  };

  var schema = Joi.object().keys({
    testrail: {
      host: Joi.string().required(),
      user: Joi.string().required(),
      password: Joi.string().required(),
      filters: {
        plan_id: Joi.number().required(),
        run_id: Joi.number().default(0)
      }
    },
    featuresDir: Joi.string().required(),
    stepDefinitionsDir: Joi.string().required(),
    overwrite: {
      local: Joi.any().valid([true, false, 'ask']),
      remote: Joi.any().valid([true, false, 'ask'])
    },
    stepDefinitionsTemplate: Joi.string(),
    indent: Joi.string().required(),
    silent: Joi.boolean().default(false),
    directoryStructure: {
      type: Joi.any().valid(['section:slug', 'section:name']),
      skipRootFolder: Joi.number().default(0)
    },
    verify: Joi.boolean().default(false),
    pushResults: Joi.boolean().default(false)
  });

  this.config = _.defaultsDeep(config, defaultConfig);

  this.templateDir = path.resolve(__dirname, '..', 'templates');

  async.series([
    // 1. Validate the config
    function validateConfigs(next) {
      Joi.validate(this.config, schema, next);
    }.bind(this),

    // 2. Validate the overwrite config
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

    // 3. Validate that the specified template does exist
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

    // 4. Fetch the test plan from testrail
    function fetchPlan(next) {
      this.testrailClient = new Testrail(this.config.testrail);

      this.testrailClient.getPlan(this.config.testrail.filters.plan_id, function (err, plan) {
        if (err) {
          return next(err);
        }
        if (!plan.entries || plan.entries.length === 0 || !plan.entries[0].runs || plan.entries[0].runs.length === 0) {
          return next('You must add a Test Run to your Test Plan in TestRail');
        }
        this.plan = plan;
        next();
      }.bind(this));
    }.bind(this),

    // 5. Fetch the sections of all the test cases in the plan
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

    // 6. Create a tree of the sections
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

    // 7. Read all the local .feature files to find the testcases that have been previously imported
    function findImportedTestcases(next) {
      this.testFiles = {};
      var re = /@tcid:(\d+)$/;

      walk.sync(this.config.featuresDir, function (filePath) {
        if (/\.feature$/.test(filePath)) {
          var fileContent = fs.readFileSync(filePath).toString();

          var ids = fileContent.split('\n').filter(function (line) {
            return re.test(line);
          }).map(function (line) {
            return Number(re.exec(line)[1]);
          });

          for (var i = 0; i < ids.length; i++) {
            var id = ids[i];
            this.testFiles[id] = filePath;
          }
        }
      }.bind(this));
      next();
    }.bind(this),

    // 8. Read all the implemented step definitions to avoid creating duplicates
    function readImplementedSteps(next) {
      this.implementedSteps = [];

      mkdirp(this.config.stepDefinitionsDir);
      walk.sync(this.config.stepDefinitionsDir, function (filePath) {
        if (!fs.lstatSync(filePath).isDirectory()) {
          var fileContent = fs.readFileSync(filePath).toString();

          var re = /^this\.(Given|When|Then)\(\/\^([^\$\/]+)\$\//;
          var stepDefinitions = fileContent.split('\n').map(Function.prototype.call, String.prototype.trim)
          .filter(function (line) {
            return re.test(line);
          })
          .map(function (line) {
            var matches = re.exec(line);
            var step = { keyword: matches[1], regex: matches[2] };
            return step;
          });

          this.implementedSteps = this.implementedSteps.concat(stepDefinitions);
        }
      }.bind(this));
      next();
    }.bind(this),

    // 9.
    // a) Synchronize local test files with TestRail OR
    // b) Verify that the local features files match the test cases from TestRail
    function synchronizePlan(next) {
      if (this.config.verify === true) {
        this.verifySync(next);
      } else {
        this.synchronizePlan(function (err) {
          if (err) {
            this.output(chalk.red('Synchronization error:'));
          }
          next(err);
        }.bind(this));
      }
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
};

ScenarioSynchronizer.prototype.getTestFileExtension = function (template) {
  return path.extname(template).substr(1);
};

ScenarioSynchronizer.prototype.output = function (s) {
  /* istanbul ignore next */
  if (!this.config.silent) {
    console.log(s);
  }
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

  var NUMBER_PATTERN = /\d+/gi;
  var NUMBER_MATCHING_GROUP = '(\\d+)';

  var QUOTED_STRING_PATTERN = /"[^"]*"/gi;
  var QUOTED_STRING_MATCHING_GROUP = '"([^"]*)"';

  for (var i = 0; i < gherkinSteps.length; i++) {
    var gherkinsStep = gherkinSteps[i];
    // an example table
    if (gherkinsStep[0] === '|') {
      continue;
    }
    // start/end of example data
    if (gherkinsStep.substr(0, 3) === '"""') {
      isData = !isData;
      continue;
    }
    if (isData) {
      continue;
    }

    var gherkinWords = gherkinsStep.split(' ');
    var keyword = gherkinWords.shift();
    var tableParam = '';

    if (i + 1 < gherkinSteps.length) {
      if (gherkinSteps[i + 1][0] === '|') { // an example table
        tableParam = template === 'typescript.ts' ? 'table: any' : 'table';
      }
    }

    if (keyword === 'And') {
      keyword = lastKeyword;
    } else {
      lastKeyword = keyword;
    }

    var regex = gherkinWords.join(' ');

    var step = { keyword: keyword, regex: regex };

    var stepDefinitionMatch = this.implementedSteps.filter(function (implementStep) {
      if (step.keyword === implementStep.keyword) {
        var re = new RegExp('^' + implementStep.regex + '$');
        return re.test(step.regex);
      }
      return false;
    });

    if (stepDefinitionMatch.length === 0) {
      regex = escapeStringRegexp(regex).replace(/\//g, '\\/');

      // ------------
      // add some pattern to our step definition
      // code borrowed from lib/cucumber/support_code/step_definition_snippet_builder.js
      step.regex = regex
          .replace(NUMBER_PATTERN, NUMBER_MATCHING_GROUP)
          .replace(QUOTED_STRING_PATTERN, QUOTED_STRING_MATCHING_GROUP);

      var match1 = regex.match(NUMBER_MATCHING_GROUP);
      var match2 = regex.match(QUOTED_STRING_MATCHING_GROUP);
      var paramCount = match1 === null ? 0 : (match1.length - 1);
      paramCount += match2 === null ? 0 : (match2.length - 1);

      var params = [];

      for (var j = 0; j < paramCount; j++) {
        var argName = 'arg' + (j + 1);

        params.push(template === 'typescript.ts' ? argName + ': string' : argName);
      }

      if (tableParam.length) {
        params.push(tableParam);
      }

      params.push(template === 'typescript.ts' ? 'callback: Function' : 'callback');

      // ------------

      this.implementedSteps.push(step);
      data.steps.push({ keyword: keyword, regex: step.regex, params: params.join(', ') });
    }
  }

  if (data.steps.length === 0) {
    return null;
  }
  return compiledTemplate(data);
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
  if (!this.caseSections[id] || this.config.directoryStructure === undefined) {
    return '';
  }

  var sectionId = this.caseSections[id];

  var section = this.sectionTree[sectionId];

  var paths = [];
  while (true) {
    paths.push(this.config.directoryStructure.type === 'section:name' ? section.name : section.slug);

    if (section.parent_id === null) {
      break;
    }

    section = this.sectionTree[section.parent_id];
  }

  paths = paths.reverse();

  if (this.config.directoryStructure.skipRootFolder > 0) {
    paths = paths.splice(this.config.directoryStructure.skipRootFolder);
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

/**
* Verify that the local features files match the test cases from TestRail
*
* @param {callback} Function
*
* @api private
*/
ScenarioSynchronizer.prototype.verifySync = function (callback) {
  this.output(chalk.green('Verifying local features files against TestRail test cases ...'));
  this.output('');

  var errors = [];

  this.getTests(function (err, testcases) {
    if (Object.keys(this.testFiles).length < testcases.length) {
      return callback('# of features files doesn\'t match the # of test cases in the test plan');
    }
    async.eachSeries(testcases, function iterate(testcase, nextCase) {
      if (this.testFiles[testcase.case_id] === 'undefined') {
        errors.push('"' + testcase.title + '" not found locally');
        return nextCase();
      }

      var gherkin = this.getGherkinLines(testcase);
      var remoteFileContent = this.getFeatureFileContent(testcase, gherkin);

      var featurePath = this.testFiles[testcase.case_id];
      var localFileContent = fs.readFileSync(featurePath).toString().trim();

      if (localFileContent !== remoteFileContent) {
        errors.push('Local test case "' + testcase.title + '" is outdated');
      }

      return nextCase();
    }.bind(this), function () {
      if (errors.length) {
        callback(new Error(errors.join('\n')));
      } else {
        this.output(chalk.green('OK'));
        callback();
      }
    }.bind(this));
  }.bind(this));
};

/**
* Synchronize a test plan from TestRail to the local filesystem
*
* @param {callback} Function
*
* @api private
*/
ScenarioSynchronizer.prototype.synchronizePlan = function (callback) {
  this.output(chalk.green('Syncing with TestRail ...'));
  this.output('');

  this.getTests(function (err, testcases) {
    async.eachSeries(testcases, function iterate(testcase, nextCase) {
      /* istanbul ignore else: isValidGherkin function covered in unit test */
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
* Gets the testcases from TestRail
*
* @param {callback} Function
*
* @api private
*/
ScenarioSynchronizer.prototype.getTests = function (callback) {
  if (this.config.testrail.filters.run_id) {
    this.testrailClient.getTests(this.config.testrail.filters.run_id, callback);
  } else {
    this.testrailClient.getPlan(this.config.testrail.filters.plan_id, function (err, plan) {
      if (err) {
        return callback(err);
      }

      var allTestcases = [];
      var uniqueCaseIds = [];

      async.eachSeries(plan.entries, function (planentry, nextEntry) {
        async.eachSeries(planentry.runs, function (run, nextRun) {
          this.testrailClient.getTests(run.id, function (err2, testcases) {
            if (!err2) {
              var unseenTestcases = testcases.filter(function (item) {
                return uniqueCaseIds.indexOf(item.case_id) === -1;
              });
              allTestcases = allTestcases.concat(unseenTestcases);
              uniqueCaseIds = uniqueCaseIds.concat(unseenTestcases.map(function (item) {
                return item.case_id;
              }));
            }

            nextRun(err2);
          });
        }.bind(this),
        function (err2) {
          nextEntry(err2);
        });
      }.bind(this),
      function (err2) {
        callback(err2, allTestcases);
      });
    }.bind(this));
  }
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

/**
* Split the gherkin content from TestRail into lines
*
* @param {testcase} testcase The test case
*
* @api private
*/
ScenarioSynchronizer.prototype.getGherkinLines = function (testcase) {
  return testcase.custom_gherkin.replace(/[\r]/g, '').split('\n').map(Function.prototype.call, String.prototype.trim)
  .map(function (line) {
    // remove extra spaces
    // convert the first character to uppercase
    return line.replace(/^(Given|When|Then|And)\s+(\w)/i, function (match, first, second) {
      return first.charAt(0).toUpperCase() + first.slice(1) + ' ' + second.toUpperCase();
    });
  })
  .filter(function (line) {
    return line.length > 0 && line.indexOf('Scenario:') !== 0;
  })
  .map(function (line) {
    // replace line like: ||value1|value2 by |value1|value2|
    return line.replace(/^(\|{2,})(.*)([^\|])$/, '|$2$3|');
  });
};

/**
* Gets the .feature file content based on a test case from TestRail
*
* @param {testcase} testcase The test case
* @param {gherkin} string The gherkin lines
*
* @api private
*/
ScenarioSynchronizer.prototype.getFeatureFileContent = function (testcase, gherkin) {
  var content = 'Feature: ' + this.getLastSectionName(testcase.case_id) + '\n';
  content += this.config.indent + '@tcid:' + testcase.case_id + '\n';
  content += this.config.indent + 'Scenario: ' + testcase.title + '\n' + this.config.indent + this.config.indent;
  content += gherkin.join('\n' + this.config.indent + this.config.indent);

  return content;
};

/**
* Synchronize a test case from TestRail to the local filesystem
*
* @param {testcase} testcase The test case
* @param {relativePath} string The relative path from where to create local files
* @param {callback} Function
*
* @api private
*/
ScenarioSynchronizer.prototype.synchronizeCase = function (testcase, relativePath, callback) {
  var basename = S(testcase.title).slugify().s;
  var exists = (this.testFiles[testcase.case_id] !== undefined);

  var featurePath = path.resolve(this.config.featuresDir + '/' + relativePath, basename + '.feature');
  var stepDefinitionsExtension = this.config.stepDefinitionsTemplate ? this.getTestFileExtension(this.config.stepDefinitionsTemplate) : '';
  var stepDefinitionsPath = path.resolve(this.config.stepDefinitionsDir + '/' + relativePath, basename + '.' + stepDefinitionsExtension);

  async.series([
    // 1. Get unique filenames
    function getUniqueFilenames(next) {
      var options = {};
      uniquefilename.get(featurePath, options, function (f1) {
        featurePath = f1;

        uniquefilename.get(stepDefinitionsPath, options, function (f2) {
          stepDefinitionsPath = f2;
          next();
        });
      });
    },

    // 2. If the testcase is not on the filesystem, create the desired directory structure
    function createDirectoryStructure(next) {
      if (!exists) {
        mkdirp(this.config.featuresDir + '/' + relativePath, function () {
          mkdirp(this.config.stepDefinitionsDir + '/' + relativePath, next);
        }.bind(this));
      } else {
        next();
      }
    }.bind(this),

    function synchronizeFiles(next) {
      var gherkin = this.getGherkinLines(testcase);
      var remoteFileContent = this.getFeatureFileContent(testcase, gherkin);

      if (!exists) {
        fs.writeFileSync(featurePath, remoteFileContent);

        if (this.config.stepDefinitionsTemplate) {
          var content = this.getTestFileContent(gherkin, this.config.stepDefinitionsTemplate);
          if (content !== null) {
            fs.writeFileSync(stepDefinitionsPath, content);
          }
        }

        this.output('  ' + chalk.green('Creating ' + basename));
        next();
      } else {
        featurePath = this.testFiles[testcase.case_id];
        var localFileContent = fs.readFileSync(featurePath).toString().trim();
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
          if (process.env.SILENT === undefined || Boolean(process.env.SILENT) !== true) {
            console.log('  ' + chalk.yellow(basename + ' is not up to date with TestRail'));

            /*
            console.log('  ' + chalk.yellow('Local version:'));
            console.log(localFileContent);
            console.log('-'.repeat(40));
            console.log('  ' + chalk.yellow('TestRail version:'));
            console.log(remoteFileContent);
            console.log('-'.repeat(40));
            */

            var diff1 = jsdiff.diffChars(localFileContent, remoteFileContent);

            diff1.forEach(function (part) {
              if (part.added) {
                process.stdout.write(chalk.green(part.value));
              } else if (part.removed) {
                process.stdout.write(chalk.red(part.value));
              } else {
                process.stdout.write(part.value);
              }
            });
          }

          inquirer.prompt({
            type: 'confirm',
            name: 'confirm',
            message: 'Do you want to override the local version ?',
            default: false
          }).then(function (answers) {
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
          if (process.env.SILENT === undefined || Boolean(process.env.SILENT) !== true) {
            /*
            console.log('  ' + chalk.yellow(basename + ' is not up to date with TestRail'));
            console.log('  ' + chalk.yellow('Local version:'));
            console.log(localFileContent);
            console.log('-'.repeat(40));
            console.log('  ' + chalk.yellow('TestRail version:'));
            console.log(remoteFileContent);
            console.log('-'.repeat(40));
            */

            var diff2 = jsdiff.diffChars(remoteFileContent, localFileContent);

            diff2.forEach(function (part) {
              if (part.added) {
                process.stdout.write(chalk.green(part.value));
              } else if (part.removed) {
                process.stdout.write(chalk.red(part.value));
              } else {
                process.stdout.write(part.value);
              }
            });
          }

          inquirer.prompt({
            type: 'confirm',
            name: 'confirm',
            message: 'Do you want to override the TestRail version ?',
            default: false
          }).then(function (answers) {
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
