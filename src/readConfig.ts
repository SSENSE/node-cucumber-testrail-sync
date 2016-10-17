import * as path from 'path';
import * as _ from 'lodash';
import {ScenarioSynchronizerOptions} from '../index.d';

export const readConfig = (): ScenarioSynchronizerOptions => {
    const dir = process.cwd();

    const defaultOptions = {
        featuresDir: path.resolve(dir, 'features'),
        stepDefinitionsDir: path.resolve(dir, 'features', 'step_definitions')
    };

    const options = require(path.resolve(dir, '.testrail-sync.js'));

    if (options.featuresDir) {
        defaultOptions.stepDefinitionsDir = path.resolve(options.featuresDir, 'step_definitions');
    }

    return (<ScenarioSynchronizerOptions> _.defaultsDeep(options, defaultOptions));
};
