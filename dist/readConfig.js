"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const _ = require("lodash");
exports.readConfig = () => {
    const dir = process.cwd();
    const defaultOptions = {
        featuresDir: path.resolve(dir, 'features'),
        stepDefinitionsDir: path.resolve(dir, 'features', 'step_definitions')
    };
    const options = require(path.resolve(dir, '.testrail-sync.js'));
    if (options.featuresDir) {
        defaultOptions.stepDefinitionsDir = path.resolve(options.featuresDir, 'step_definitions');
    }
    return _.defaultsDeep(options, defaultOptions);
};
//# sourceMappingURL=readConfig.js.map