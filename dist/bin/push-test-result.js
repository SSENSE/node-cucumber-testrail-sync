#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const program = require("commander");
const index_1 = require("../index");
program
    .option('--id <id>', 'testcase id')
    .option('--status <status>', 'passed, blocked or failed')
    .parse(process.argv);
const error = (s) => {
    program.outputHelp();
    console.log();
    console.log('Error: ' + s);
    process.exit(1);
};
if (!program.id || [0, NaN].indexOf(Number(program.id)) !== -1) {
    error('<testcase id> is required and must be a number');
}
if (!program.status || ['passed', 'blocked', 'failed'].indexOf(program.status) === -1) {
    error('<status id> is required and must be either: passed, blocked or failed');
}
let status = index_1.ResultSynchronizer.PASSED_STATUS_ID;
if (program.status === 'blocked') {
    status = index_1.ResultSynchronizer.BLOCKED_STATUS_ID;
}
else if (program.status === 'failed') {
    status = index_1.ResultSynchronizer.FAILED_STATUS_ID;
}
const config = index_1.readConfig();
index_1.ResultSynchronizer.pushTestResult(config, Number(program.id), status)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
//# sourceMappingURL=push-test-result.js.map