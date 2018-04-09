#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const program = require("commander");
const index_1 = require("../index");
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
const sync = new index_1.ScenarioSynchronizer();
const config = index_1.readConfig();
config.verify = program.verify || config.verify || false;
config.findUnused = program.unused || config.findUnused || false;
config.silent = program.silent || config.silent || false;
config.debug = program.debug || config.debug || false;
if (program.pull) {
    config.overwrite = {
        local: 'ask'
    };
}
else if (program.push) {
    config.overwrite = {
        remote: 'ask'
    };
}
sync.synchronize(config, (err) => {
    process.exit(err ? 1 : 0);
});
//# sourceMappingURL=sync-test-cases.js.map