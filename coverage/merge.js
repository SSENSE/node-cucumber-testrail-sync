const istanbul = require('istanbul');
const path = require('path');
const fs = require('fs');

const collector = new istanbul.Collector();

const files = fs.readdirSync(__dirname);
for(let i = 0; i < files.length; i++) {
  let fullPath = path.resolve(__dirname, files[i]);

  if(files[i] != 'final' && fs.statSync(fullPath).isDirectory()) {
    fullPath = path.resolve(fullPath, 'coverage.json');
    collector.add(JSON.parse(fs.readFileSync(fullPath, 'utf8')));
  }
}

const report = istanbul.Report.create('html', {
  dir: path.join(__dirname, 'final')
});
report.writeReport(collector, true);
