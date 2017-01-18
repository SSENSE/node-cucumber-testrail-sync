#!/usr/bin/env node

import * as program from 'commander';
import {ScenarioSynchronizer, readConfig} from '../index';
// tslint:disable-next-line:no-var-requires
const pkg = require('../../package.json');

program
    .version(pkg.version)
    .option('--verify', 'Verify that the local features files match the test cases from TestRail')
    .option('--unused', 'Find unused step definitions')
    .option('--silent', 'Disable output')
    .option('--debug', 'Debug')
    .option('--pull', 'Pull test cases from TestRail to the local filesystem')
    .option('--push', 'Push test cases from the local filesystem to TestRail')
    .parse(process.argv);

const sync = new ScenarioSynchronizer();

const config = readConfig();
config.verify = (<any> program).verify || config.verify || false;
config.findUnused = (<any> program).unused || config.findUnused || false;
config.silent = (<any> program).silent || config.silent || false;
config.debug = (<any> program).debug || config.debug || false;

if ((<any> program).pull) {
    config.overwrite = {
        local: 'ask'
    };
} else if ((<any> program).push) {
    config.overwrite = {
        remote: 'ask'
    };
}

sync.synchronize(config, (err: any): void => {
    process.exit(err ? 1 : 0);
});
