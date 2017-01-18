// tslint:disable-next-line:no-reference
/// <reference path="../typings.d.ts" />
export {ScenarioSynchronizer} from './ScenarioSynchronizer';
export {ResultSynchronizer} from './ResultSynchronizer';
export {readConfig} from './readConfig';
export {install, legacyInstall} from './install';

export interface Scenario {
    tags: string[];
    isPending: boolean;
    isUndefined: boolean;
    isSkipped: boolean;
    isSuccessful: boolean;
    exception: Error;
}
