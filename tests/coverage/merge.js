var path = require('path'),
    fs = require('fs'),
    libCoverage = require('nyc/node_modules/istanbul-lib-coverage'),
    libReport = require('nyc/node_modules/istanbul-lib-report'),
    reports = require('nyc/node_modules/istanbul-reports');

var rootFolder = __dirname;
var mergeIntoFolder = 'final';
var files = fs.readdirSync(rootFolder);
var mergedCoverageMap = null;

for (var i = 0; i < files.length; i++) {
    var fullPath = path.resolve(rootFolder, files[i]);

    if (files[i] !== mergeIntoFolder && fs.statSync(fullPath).isDirectory()) {
        fullPath = path.resolve(fullPath, 'coverage-final.json');

        var map = libCoverage.createCoverageMap(JSON.parse(fs.readFileSync(fullPath, 'utf8')));
        if (mergedCoverageMap !== null) {
            mergedCoverageMap.merge(map);
        }
        else {
            mergedCoverageMap = map;
        }
    }
}

if (mergedCoverageMap === null) {
    console.warn('Warning: No cover files to be merged');
    return;
}

var context = libReport.createContext({
    dir: path.join(rootFolder, mergeIntoFolder)
});

tree = libReport.summarizers.pkg(mergedCoverageMap);

tree.visit(reports.create('html'), context);
tree.visit(reports.create('lcov'), context);

fs.writeFileSync(path.join(rootFolder, '..', '..', '.nyc_output', 'coverage-final.json'), JSON.stringify(mergedCoverageMap.toJSON()));
