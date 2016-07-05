var async = require('async');
var S = require('string');
var chalk = require('chalk');
var path = require('path');
var fs = require('fs');
var inquirer = require('inquirer');

var Testrail = require('testrail-api');

var testrail = new Testrail({
  host: 'https://ssense.testrail.com', 
  user: 'mickael.burguet@ssense.com', 
  password: 'iLugnVNqFr1f03tawB3q-/5MPnCkCg99/3BPmznUm'
});

/*
* support tables
*/

var getJsFileContent = function(gherkins) {
    var jsFileContent = 'module.exports = function () {\n';
    var lastKeyword = null;
    for (var i = 0; i < gherkins.length; i++) {
        var line = gherkins[i];
        var lineArray = line.split(' ');
        var keyword = lineArray.shift();

        if(keyword == 'And') {
            keyword = lastKeyword;
        }
        else {
            lastKeyword = keyword;
        }

        jsFileContent += TAB + 'this.' + keyword + '(/^' + lineArray.join(' ') + '$/, (callback) => {\n';
        jsFileContent += TAB + TAB + 'callback();\n';
        jsFileContent += TAB + '});\n';

        if(i+1 < gherkins.length) {
            jsFileContent += '\n\n';
        }
    }
    jsFileContent += '};';

    return jsFileContent;
};


var cases = [2151/*, 2154*/];
var featuresDir = '/home/mickaelburguet/Desktop/node-cucumber-testrail-sync/features/';
var jsDir = path.resolve(featuresDir, 'step_definitions');
var TAB = '    ';

console.log(chalk.bgBlack.green('Syncing with TestRail ...'));
console.log('');

async.eachSeries(cases, function (item, next) {
    testrail.getCase(item, function (err, testcase) {
        var filebasename = 'C' + testcase.id + '-' + S(testcase.title).slugify().s;

        var jsfilepath = path.resolve(jsDir, filebasename + '.js');
        var jsfileexists = false;

        var featurefilepath = path.resolve(featuresDir, filebasename + '.feature');
        var featurefileexists = false;

        async.series([
            function (next) {
                fs.stat(jsfilepath, function (err, stat) {
                    jsfileexists = (err ? false : true);
                    next();
                });
            },


            function (next) {
                fs.stat(featurefilepath, function (err, stat) {
                    featurefileexists = (err ? false : true);
                    next();
                });
            },

            function (next) {
                var gherkins = testcase.custom_gherkin.replace(/[\r]/g, '');
                var gherkins = gherkins.split('\n').filter(function (line) {
                    line = line.trim();
                    return line.length > 0 && line.indexOf('Scenario:') !== 0;
                });

                var featuresFileContent = 'Feature: ' + testcase.title + '\n';
                featuresFileContent += TAB + 'Scenario: C' + testcase.id + ' - ' + testcase.title + '\n' + TAB + TAB;
                featuresFileContent += gherkins.join('\n' + TAB + TAB);


                if (!featurefileexists) {
                    fs.writeFileSync(featurefilepath, featuresFileContent);

                    if (!jsfileexists) {
                        fs.writeFileSync(jsfilepath, getJsFileContent(gherkins));
                    }

                    console.log('  ' + chalk.bgBlack.green('Created ' + filebasename));
                    next();
                }
                else {
                    var currentFileContent = fs.readFileSync(featurefilepath).toString();
                    var fileChanged = (currentFileContent != featuresFileContent);
                    if (fileChanged) {
                        //show current, show testyrail
                        console.log('  ' + chalk.bgBlack.yellow(filebasename + ' is not up to date with TestRail'));
                        console.log('  ' + chalk.bgBlack.yellow('Local version:'));
                        console.log(currentFileContent);
                        console.log('-'.repeat(40));
                        console.log('  ' + chalk.bgBlack.yellow('TestRail version:'));
                        console.log(featuresFileContent);
                        console.log('-'.repeat(40));

                        inquirer.prompt({ 
                            type: 'confirm', 
                            name: 'confirm',
                            message: 'Do you want to override the local version ?', 
                            default: false 
                        }).then(function (answers) {
                            var confirmed = answers.confirm;


                            if(confirmed) {
                                fs.writeFileSync(featurefilepath, featuresFileContent);
                                console.log('  ' + chalk.bgBlack.green('Updated ' + filebasename));
                                next();
                            }
                            else {
                                console.log('  ' + chalk.bgBlack.yellow('Ignoring ' + filebasename));
                                next();
                            }
                        });
                    }
                    else {
                        console.log('  ' + chalk.bgBlack.yellow('Ignoring ' + filebasename + ' (no changes)'));
                        next();
                    }
                }
            }
        ],
        function (err) {
            next(err);
        });
    });
}, 
function(err) {
    if(err) {
        console.log('error', err);
    }
});

