#!/usr/bin/env node
import * as program from 'commander';
import {ResultSynchronizer, readConfig} from '../index';

program
    .option('--id <id>', 'testcase id')
    .option('--status <status>', 'passed, blocked or failed')
    .parse(process.argv);

const error = (s: string): void => {
    program.outputHelp();
    console.log();
    console.log('Error: ' + s);
    process.exit(1);
};

if (! (<any> program).id || [0, NaN].indexOf(Number((<any> program).id)) !== -1) {
    error('<testcase id> is required and must be a number');
}

if (! (<any> program).status || ['passed', 'blocked', 'failed'].indexOf((<any> program).status) === -1) {
    error('<status id> is required and must be either: passed, blocked or failed');
}

let status = ResultSynchronizer.PASSED_STATUS_ID;
if ((<any> program).status === 'blocked') {
    status = ResultSynchronizer.BLOCKED_STATUS_ID;
} else if ((<any> program).status === 'failed') {
    status = ResultSynchronizer.FAILED_STATUS_ID;
}
const config = readConfig();
ResultSynchronizer.pushTestResult(config, Number((<any> program).id), status)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
