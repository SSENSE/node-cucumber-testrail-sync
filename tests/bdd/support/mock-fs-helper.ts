import * as fs from 'fs';
import * as path from 'path';

/**
 * Function to traverse the directory tree
 * @param {Object} obj  - model of fs
 * @param {String} root - root dirname
 * @param {String} dir  - dirname
 */
const processTree = (obj: any, root: string, dir: string): void => {
    const dirname = dir ? path.join(root, dir) : root;
    const name = dir || root;
    const additionObj: any = obj[name] = {};

    fs.readdirSync(dirname).forEach((basename: string) => {
        const filename = path.join(dirname, basename);
        const stat = fs.statSync(filename);

        if (stat.isDirectory()) {
            processTree(additionObj, dirname, basename);
        } else {
            additionObj[basename] = readFile(filename);
        }
    });
};

/**
 * Helper for reading file.
 * For text files calls a function to delete /r symbols
 * @param {String} filename - filename
 * @returns {*}
 */
export function readFile(filename: string): any {
    const ext = path.extname(filename);

    if (['.gif', '.png', '.jpg', '.jpeg', '.svg'].indexOf(ext) !== -1) {
        return fs.readFileSync(filename);
    }

    return fs.readFileSync(filename, 'utf-8');
}

/**
 * Duplicate of the real file system for passed dir, used for mock fs for tests
 * @param {String} dir – filename of directory (full path to directory)
 * @returns {Object} - object with duplicating fs
 */
export function duplicateFSInMemory(dir: string): any {
    const obj: any = {};

    fs.readdirSync(dir).forEach((basename: string) => {
        const filename = path.join(dir, basename);
        const stat = fs.statSync(filename);

        if (stat.isDirectory()) {
            processTree(obj, dir, basename);
        } else {
            obj[basename] = readFile(filename);
        }
    });

    return obj;
}

/**
 * 1. Remove all css comments, because they going to remove after @import stylus
 * 2. Remove all spaces and white lines
 * @param {String} contents - file contents
 * @returns {String}
 */
export function normalizeFile(contents: string): string {
    return contents
        .replace(/(\r\n|\n|\r)/gm, '') // remove line breaks
        .replace(/(\/\*([\s\S]*?)\*\/)|(\/\/(.*)$)/gm, '') // spaces
        .trim();
}
