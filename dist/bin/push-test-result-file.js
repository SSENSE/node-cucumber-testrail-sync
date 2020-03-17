#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const program = require("commander");
const path = require("path");
const index_1 = require("../index");
let parser = new index_1.CucumberReportParser();
program
    .option('--file <String>', 'filename in results directory')
    .parse(process.argv);
const error = (s) => {
    program.outputHelp();
    console.log();
    console.log('Error: ' + s);
    process.exit(1);
};
if (!program.file || [0, NaN].indexOf(program.file) !== -1) {
    error('<testcase file> is required and must be a string');
}
let config = index_1.readConfig();
config.pushResults = true;
const resultFile = String(program.file);
let results;
try {
    results = require(path.resolve(config.resultsDir, resultFile));
}
catch (e) {
    error(`<testcase file> error reading file[${path.resolve(config.resultsDir, resultFile)}] exception[${e}]`);
}
if (!Array.isArray(results)) {
    error(`<testcase file> wrong cucumber format result file ${path.resolve(config.resultsDir, resultFile)}`);
}
const scenarios = parser.parseReport(results);
const sync = new index_1.ResultSynchronizer(config);
const savePromises = [];
for (const scenario of scenarios) {
    savePromises.push(sync.saveTestResult(scenario));
}
Promise.all(savePromises)
    .then(() => sync.readRemoteTestRuns().then(() => sync.pushTestResults().then(function () {
    console.log(`sync done`);
})))
    .catch(e => error(e));
//# sourceMappingURL=push-test-result-file.js.map