"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const TestrailApiClient = require("testrail-api");
const path = require("path");
const chalk = require("chalk");
const jsdiff = require("diff");
const fs = require("fs");
const inquirer = require("inquirer");
const _ = require("lodash");
const Joi = require("joi");
const walk = require("walkdir");
const uniquefilename = require("uniquefilename");
const mkdirp = require("mkdirp");
const Handlebars = require("handlebars");
const GherkinFormatter_1 = require("./GherkinFormatter");
class ScenarioSynchronizer {
    synchronize(config, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const defaultConfig = {
                indent: '  '
            };
            const schema = Joi.object().keys({
                testrail: {
                    host: Joi.string().required(),
                    user: Joi.string().required(),
                    password: Joi.string().required(),
                    filters: {
                        plan_id: Joi.number().required(),
                        run_id: Joi.number().default(0),
                        custom_status: Joi.array().items(Joi.number())
                    },
                    verifyFilters: {
                        custom_status: Joi.array().items(Joi.number())
                    }
                },
                featuresDir: Joi.string().required(),
                stepDefinitionsDir: Joi.string().required(),
                overwrite: {
                    local: Joi.any().valid([true, false, 'ask']),
                    remote: Joi.any().valid([true, false, 'ask'])
                },
                stepDefinitionsTemplate: Joi.string(),
                stepDefinitionsStringPatterns: Joi.boolean().default(false),
                stepDefinitionsExpressions: Joi.boolean().default(false),
                indent: Joi.string().required(),
                silent: Joi.boolean().default(false),
                directoryStructure: {
                    type: Joi.any().valid(['section:slug', 'section:name']),
                    skipRootFolder: Joi.number().default(0)
                },
                verify: Joi.boolean().default(false),
                findUnused: Joi.boolean().default(false),
                pushResults: Joi.boolean().default(false),
                debug: Joi.boolean().default(false),
                newTestCase: Joi.object()
            });
            this.config = _.defaultsDeep(config, defaultConfig);
            this.templateDir = path.resolve(__dirname, '..', 'templates');
            this.formatter = new GherkinFormatter_1.GherkinFormatter();
            try {
                yield this.validateConfig(schema);
                if (this.config.findUnused === true) {
                    yield this.findImplementedStepDefinitions();
                    const errors = yield this.findUnusedStepDefinitions();
                    if (errors.length) {
                        throw new Error(errors.join('\n'));
                    }
                    else {
                        this.output(chalk.green('OK'));
                    }
                }
                else if (this.config.verify === true) {
                    yield this.fetchTestPlanAndSections();
                    yield this.findImportedTestcases();
                    const errors = yield this.verifySync();
                    if (errors.length) {
                        throw new Error(errors.join('\n'));
                    }
                    else {
                        this.output(chalk.green('OK'));
                    }
                }
                else {
                    yield this.fetchTestPlanAndSections();
                    yield this.findImportedTestcases();
                    yield this.findImplementedStepDefinitions();
                    yield this.synchronizePlan();
                }
                callback();
            }
            catch (err) {
                this.output(chalk.red('Error:'));
                const errorMessage = err.message || err;
                if (_.isString(errorMessage)) {
                    this.output(chalk.red(errorMessage));
                }
                else {
                    this.output(err);
                }
                callback(err);
            }
        });
    }
    output(s) {
        /* istanbul ignore next */
        if (!this.config.silent) {
            console.log(s);
        }
    }
    debug(s) {
        /* istanbul ignore next */
        if (this.config.debug) {
            console.log(chalk.inverse(s));
        }
    }
    validateConfig(schema) {
        return new Promise((resolve, reject) => {
            return Joi.validate(this.config, schema, (err) => {
                if (err) {
                    return reject(err);
                }
                // Validate the overwrite config
                if (this.config.overwrite === undefined) {
                    this.config.overwrite = {
                        local: false,
                        remote: false
                    };
                }
                if (this.config.overwrite.local === undefined) {
                    this.config.overwrite.local = false;
                }
                if (this.config.overwrite.remote === undefined) {
                    this.config.overwrite.remote = false;
                }
                if (this.config.overwrite.local !== false && this.config.overwrite.remote !== false) {
                    return reject(new Error('Validation error: overwrite.local and overwrite.remote cannot be both defined'));
                }
                // Validate that the specified template does exist
                if (this.config.stepDefinitionsTemplate) {
                    const templateFile = path.resolve(this.templateDir, this.config.stepDefinitionsTemplate + '.hbs');
                    return fs.stat(templateFile, (err2, stat) => {
                        if (err2) {
                            if (err2.code === 'ENOENT') {
                                return reject(new Error(`Template file ${this.config.stepDefinitionsTemplate}.hbs does not exists`));
                            }
                            else {
                                return reject(err2);
                            }
                        }
                        else if (!stat.isFile()) {
                            return reject(new Error(`Template file ${this.config.stepDefinitionsTemplate}.hbs is not a file`));
                        }
                        return resolve();
                    });
                }
                else {
                    return resolve();
                }
            });
        });
    }
    fetchTestPlanAndSections() {
        return __awaiter(this, void 0, void 0, function* () {
            this.testrailClient = new TestrailApiClient(this.config.testrail);
            this.plan = yield this.testrailClient.getPlan(this.config.testrail.filters.plan_id);
            if (!this.plan.entries || this.plan.entries.length === 0 || !this.plan.entries[0].runs || this.plan.entries[0].runs.length === 0) {
                return Promise.reject(new Error('The Test Plan should contain at least one Test Run.'));
            }
            const cases = yield this.testrailClient.getCases(this.plan.project_id, { suite_id: this.plan.entries[0].suite_id });
            this.caseSections = {};
            for (let i = 0; i < cases.length; i++) {
                const caseId = cases[i].id;
                this.caseSections[caseId] = cases[i].section_id;
            }
            const sections = yield this.testrailClient.getSections(this.plan.project_id, { suite_id: this.plan.entries[0].suite_id });
            this.sectionTree = {};
            for (let i = 0; i < sections.length; i++) {
                const sectionId = sections[i].id;
                const node = {
                    name: sections[i].name,
                    slug: this.slugify(sections[i].name),
                    parent_id: sections[i].parent_id
                };
                this.sectionTree[sectionId] = node;
            }
            return Promise.resolve();
        });
    }
    findImportedTestcases() {
        return __awaiter(this, void 0, void 0, function* () {
            this.testFiles = {};
            const re = /@tcid:(\d+)$/;
            return walk.sync(this.config.featuresDir, (filePath) => {
                if (/\.feature$/.test(filePath)) {
                    const fileContent = fs.readFileSync(filePath).toString();
                    const ids = fileContent.split('\n')
                        .filter((line) => re.test(line))
                        .map((line) => Number(re.exec(line)[1]));
                    for (let i = 0; i < ids.length; i++) {
                        const id = ids[i];
                        this.testFiles[id] = filePath;
                    }
                }
            });
        });
    }
    findImplementedStepDefinitions() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.config.stepDefinitionsTemplate === 'ruby.rb') {
                return this.findImplementedStepDefinitionsRuby();
            }
            return this.findImplementedStepDefinitionsJS();
        });
    }
    findImplementedStepDefinitionsJS() {
        return __awaiter(this, void 0, void 0, function* () {
            this.implementedSteps = [];
            mkdirp.sync(this.config.stepDefinitionsDir);
            const foldersToScan = [
                path.resolve(this.config.stepDefinitionsDir),
                path.resolve(this.config.stepDefinitionsDir, '..', 'support')
            ];
            const re = /^(?:(?:this|ctx)\.)(Given|When|Then|defineStep)\((\/|')(.+)(\/|')(\w*)/;
            for (const folder of foldersToScan) {
                try {
                    if (!fs.lstatSync(folder).isDirectory()) {
                        continue;
                    }
                }
                catch (err) {
                    continue;
                }
                walk.sync(folder, (filePath) => {
                    if (!fs.lstatSync(filePath).isDirectory()) {
                        const fileContent = fs.readFileSync(filePath).toString();
                        const stepDefinitions = fileContent.split('\n').map(Function.prototype.call, String.prototype.trim)
                            .filter((line) => re.test(line))
                            .map((line) => {
                            const matches = re.exec(line);
                            const keyword = matches[1];
                            const patternInCode = matches[3];
                            let pattern = matches[3];
                            let isStringPattern = false;
                            // String Pattern
                            if (matches[2] === '\'') {
                                isStringPattern = true;
                                pattern = pattern.replace(/\$\w+/g, '<\\w+>');
                                pattern = pattern.replace(/{\w+}/g, '<\\w+>');
                            }
                            const step = {
                                filename: filePath.substr(folder.length + 1),
                                keyword,
                                regex: pattern,
                                pattern: patternInCode,
                                isStringPattern
                            };
                            if (matches[5].length) {
                                step.regexFlags = matches[5];
                            }
                            return step;
                        });
                        this.implementedSteps = this.implementedSteps.concat(stepDefinitions);
                    }
                });
            }
        });
    }
    findImplementedStepDefinitionsRuby() {
        return __awaiter(this, void 0, void 0, function* () {
            this.implementedSteps = [];
            mkdirp.sync(this.config.stepDefinitionsDir);
            const foldersToScan = [
                path.resolve(this.config.stepDefinitionsDir),
                path.resolve(this.config.stepDefinitionsDir, '..', 'support')
            ];
            const re = /^(Given|When|Then)\((\/)(.+)(\/)(\w*)\)/;
            for (const folder of foldersToScan) {
                try {
                    if (!fs.lstatSync(folder).isDirectory()) {
                        continue;
                    }
                }
                catch (err) {
                    continue;
                }
                walk.sync(folder, (filePath) => {
                    if (!fs.lstatSync(filePath).isDirectory()) {
                        const fileContent = fs.readFileSync(filePath).toString();
                        const stepDefinitions = fileContent.split('\n').map(Function.prototype.call, String.prototype.trim)
                            .filter((line) => re.test(line))
                            .map((line) => {
                            const matches = re.exec(line);
                            const keyword = matches[1];
                            const pattern = matches[3];
                            const step = {
                                filename: filePath.substr(folder.length + 1),
                                keyword,
                                regex: pattern,
                                pattern
                            };
                            if (matches[5].length) {
                                step.regexFlags = matches[5];
                            }
                            return step;
                        });
                        this.implementedSteps = this.implementedSteps.concat(stepDefinitions);
                    }
                });
            }
        });
    }
    /**
     * Gets the testcases from TestRail
     */
    getTests(statuses) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!statuses && this.config.testrail.filters.custom_status) {
                statuses = this.config.testrail.filters.custom_status;
            }
            let testcases = [];
            if (this.config.testrail.filters.run_id) {
                testcases = yield this.testrailClient.getTests(this.config.testrail.filters.run_id);
                this.debug(`Found #${testcases.length} cases on TestRail for run_id = ${this.config.testrail.filters.run_id}`);
                // all runs in a test plan
            }
            else {
                let uniqueCaseIds = [];
                for (const planentry of this.plan.entries) {
                    for (const run of planentry.runs) {
                        const testcasesOfRun = yield this.testrailClient.getTests(run.id);
                        this.debug(`Found #${testcasesOfRun.length} cases on TestRail for run_id = ${run.id}`);
                        const newTestcases = testcasesOfRun.filter((t) => uniqueCaseIds.indexOf(t.case_id) === -1);
                        testcases = testcases.concat(newTestcases);
                        uniqueCaseIds = uniqueCaseIds.concat(newTestcases.map((t) => t.case_id));
                    }
                }
            }
            return testcases.filter((t) => !statuses || statuses.indexOf(t.custom_status) !== -1);
        });
    }
    /**
     * Gets new local testcases
     */
    getNewLocalTests() {
        return __awaiter(this, void 0, void 0, function* () {
            const re = /@tcid:(\d+)$/;
            const reScenario = /^\s*Scenario(?: Outline)?\s*:(.*?)$/;
            const testcases = [];
            walk.sync(this.config.featuresDir, (filePath) => {
                if (/\.feature$/.test(filePath)) {
                    const fileContent = fs.readFileSync(filePath).toString();
                    const ids = fileContent.split('\n')
                        .filter((line) => re.test(line));
                    const scenarios = fileContent.split('\n')
                        .filter((line) => reScenario.test(line));
                    if (ids.length === 0 && scenarios.length === 1) {
                        testcases.push({
                            title: reScenario.exec(scenarios[0])[1].trim(),
                            file_path: filePath,
                            file_content: fileContent,
                            custom_gherkin: fileContent
                        });
                    }
                }
            });
            return testcases;
        });
    }
    addTestCase(testcase) {
        return __awaiter(this, void 0, void 0, function* () {
            const sectionId = this.config.newTestCase.section_id;
            const props = _.omit(this.config.newTestCase, 'section_id');
            props.title = testcase.title;
            props.custom_gherkin = this.formatter.replaceTablesByMultiPipesTables(testcase.custom_gherkin);
            return this.testrailClient.addCase(sectionId, props);
        });
    }
    addToTestPlan(tcid) {
        return __awaiter(this, void 0, void 0, function* () {
            const planId = this.config.testrail.filters.plan_id;
            let planEntry = this.plan.entries[0];
            let caseIds = [];
            if (this.config.testrail.filters.run_id) {
                for (const pe of this.plan.entries) {
                    for (const run of pe.runs) {
                        if (run.id === this.config.testrail.filters.run_id) {
                            planEntry = pe;
                            break;
                        }
                    }
                }
            }
            for (const run of planEntry.runs) {
                const testcasesOfRun = yield this.testrailClient.getTests(run.id);
                caseIds = caseIds.concat(testcasesOfRun.map((t) => t.case_id));
            }
            const content = {
                case_ids: _.uniq(caseIds.concat(tcid)),
                include_all: false
            };
            const response = yield this.testrailClient.updatePlanEntry(planId, planEntry.id, content);
            this.debug(`API call - update_plan_entry - plan_id=${planId}, entry_id=${planEntry.id} - content = ${JSON.stringify(content)}`);
            this.debug(`Current plan entry = ${JSON.stringify(planEntry)}`);
            this.debug(`API response = ${JSON.stringify(response)}`);
            return Promise.resolve();
        });
    }
    /**
     * Gets the .feature file content based on a test case from TestRail
     */
    getFeatureFileContent(testcase, gherkin) {
        let scenarioType = 'Scenario';
        if (gherkin.filter((line) => line.indexOf('Examples') !== -1).length > 0) {
            scenarioType = 'Scenario Outline';
        }
        let content = 'Feature: ' + this.getLastSectionName(testcase.case_id) + '\n';
        content += this.config.indent + '@tcid:' + testcase.case_id + '\n';
        content += this.config.indent + scenarioType + ': ' + testcase.title + '\n' + this.config.indent + this.config.indent;
        content += gherkin.join('\n' + this.config.indent + this.config.indent);
        return content;
    }
    /**
     * Find the name of the last-child section of a test case
     */
    getLastSectionName(testcaseId) {
        if (!this.caseSections[testcaseId]) {
            return 'Cannot find feature name';
        }
        const sectionId = this.caseSections[testcaseId];
        const section = this.sectionTree[sectionId];
        return section.name;
    }
    /**
     * Gets relative path of where a testcase file should be located
     */
    getRelativePath(testcaseId) {
        if (!this.caseSections[testcaseId] || this.config.directoryStructure === undefined) {
            return '';
        }
        const sectionId = this.caseSections[testcaseId];
        let section = this.sectionTree[sectionId];
        let paths = [];
        // tslint:disable-next-line:no-constant-condition
        while (true) {
            paths.push(this.config.directoryStructure.type === 'section:name' ? section.name : section.slug);
            if (section.parent_id === null) {
                break;
            }
            section = this.sectionTree[section.parent_id];
        }
        paths = paths.reverse();
        if (this.config.directoryStructure.skipRootFolder > 0) {
            paths = paths.splice(this.config.directoryStructure.skipRootFolder);
        }
        return paths.join('/');
    }
    escapeStringRegexp(str) {
        const matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;
        return str.replace(matchOperatorsRe, '\\$&');
    }
    /**
     * Updates a test case gherkin content on TestRail
     */
    pushTestCaseToTestRail(testcase, gherkin) {
        const gherkinSteps = gherkin.split('\n')
            .slice(3)
            .map(Function.prototype.call, String.prototype.trim);
        const customGherkin = this.formatter.replaceTablesByMultiPipesTables(gherkinSteps.join('\n'));
        if (testcase.custom_steps && testcase.custom_steps.length > 0) {
            return this.testrailClient.updateCase(testcase.case_id, { custom_steps: customGherkin });
        }
        else if (testcase.custom_steps_separated && testcase.custom_steps_separated.length > 0) {
            const stepsSeparated = gherkinSteps.map((s, index) => {
                const step = {
                    content: s
                };
                if (index < testcase.custom_steps_separated.length) {
                    if (testcase.custom_steps_separated[index].expected) {
                        step.expected = testcase.custom_steps_separated[index].expected;
                    }
                }
                return step;
            });
            return this.testrailClient.updateCase(testcase.case_id, { custom_steps_separated: stepsSeparated });
        }
        return this.testrailClient.updateCase(testcase.case_id, { custom_gherkin: customGherkin });
    }
    showDiff(basename, oldStr, newStr) {
        /* istanbul ignore next */
        if (process.env.SILENT === undefined || Boolean(process.env.SILENT) !== true) {
            console.log('  ' + chalk.yellow(`${basename} is not up to date with TestRail`));
            const diffs = jsdiff.diffLines(oldStr, newStr);
            diffs.forEach((part) => {
                const leadChar = (part.removed ? '-' : (part.added ? '+' : ' '));
                const lines = part.value.split('\n')
                    .map(Function.prototype.call, String.prototype.trim)
                    .filter((line) => line.length > 0);
                lines.forEach((line) => {
                    if (part.added) {
                        console.log(chalk.green(`${leadChar}${line}`));
                    }
                    else if (part.removed) {
                        console.log(chalk.red(`${leadChar}${line}`));
                    }
                    else {
                        console.log(`${leadChar}${line}`);
                    }
                });
            });
            console.log('');
        }
    }
    /**
     * Generate a file containing blank Steps Definitions
     */
    // tslint:disable-next-line:max-func-body-length
    getTestFileContent(gherkinSteps, template) {
        const templateContent = fs.readFileSync(path.resolve(this.templateDir, template + '.hbs'))
            .toString()
            .replace(/\t/g, this.config.indent);
        const compiledTemplate = Handlebars.compile(templateContent);
        const isScenarioOutline = gherkinSteps.filter((line) => line.indexOf('Examples') === 0).length > 0;
        const data = {};
        data.steps = [];
        let lastKeyword = null;
        let isData = false;
        const NUMBER_PATTERN = /\d+/gi;
        const NUMBER_MATCHING_GROUP = '(\\d+)';
        const QUOTED_STRING_PATTERN = /"[^"]*"/gi;
        const QUOTED_STRING_MATCHING_GROUP = '"([^"]*)"';
        const examples = {};
        if (isScenarioOutline) {
            let headerVars = {};
            // Find example values for each variables
            for (let j = 0; j < gherkinSteps.length; j++) {
                if (gherkinSteps[j].indexOf('Examples') === 0) {
                    headerVars = gherkinSteps[j + 1].trim().split('|')
                        .map(Function.prototype.call, String.prototype.trim);
                    for (let lineIndex = j + 2; lineIndex < gherkinSteps.length; lineIndex++) {
                        const exampleValues = gherkinSteps[lineIndex].trim().split('|')
                            .map(Function.prototype.call, String.prototype.trim);
                        for (let k = 0; k < headerVars.length; k++) {
                            if (examples[headerVars[k]] === undefined && exampleValues[k].length > 0) {
                                examples[headerVars[k]] = exampleValues[k];
                            }
                        }
                        if (Object.keys(examples).length === headerVars.length) {
                            break;
                        }
                    }
                    break;
                }
            }
        }
        const isTypescript = (template === 'typescript.ts' || template === 'typescript.legacy.ts');
        const isJavascript = template === 'es5.js' || template === 'es5.legacy.js' ||
            template === 'es6.js' || template === 'es6.legacy.js';
        for (let i = 0; i < gherkinSteps.length; i++) {
            const gherkinsStep = gherkinSteps[i];
            // an example table or a comment
            if (gherkinsStep[0] === '|' || gherkinsStep[0] === '#') {
                continue;
            }
            // start/end of example data
            if (gherkinsStep.substr(0, 3) === '"""') {
                isData = !isData;
                continue;
            }
            // Scenario Outline
            if (gherkinsStep.length === 0 || gherkinsStep.indexOf('Examples') === 0) {
                continue;
            }
            if (isData) {
                continue;
            }
            const gherkinWords = gherkinsStep.split(' ');
            let keyword = gherkinWords.shift();
            let tableParam = '';
            if (i + 1 < gherkinSteps.length) {
                if (gherkinSteps[i + 1][0] === '|') { // an example table
                    tableParam = isTypescript ? 'table: any' : 'table';
                }
            }
            if (keyword === 'And') {
                keyword = lastKeyword;
            }
            else {
                lastKeyword = keyword;
            }
            let regex = gherkinWords.join(' ');
            const step = { keyword: keyword, regex: regex, regexFlags: '' };
            // stepLine[0] will be something such as "I have <count> apples"
            const stepLine = [regex];
            // Replace <variable> by the values of data located in the examples table
            // stepLine[1] will be something such as "I have 10 apples"
            if (isScenarioOutline) {
                stepLine[1] = regex;
                let matchVar;
                do {
                    matchVar = /<(\w+)>/.exec(stepLine[1]);
                    if (matchVar) {
                        const varName = matchVar[1];
                        if (examples[varName] !== undefined) {
                            stepLine[1] = stepLine[1].substring(0, matchVar.index) +
                                examples[varName] +
                                stepLine[1].substring(matchVar.index + matchVar[0].length);
                        }
                        else {
                            stepLine[1] = stepLine[1].substring(0, matchVar.index) +
                                'anything' +
                                stepLine[1].substring(matchVar.index + matchVar[0].length);
                        }
                    }
                } while (matchVar);
            }
            /* search if this step has already been implemented */
            let stepDefinitionMatch = null;
            for (let m = 0; m < this.implementedSteps.length; m++) {
                const re = new RegExp(this.implementedSteps[m].regex, this.implementedSteps[m].regexFlags);
                if (stepLine.filter((line) => re.test(line)).length > 0) {
                    stepDefinitionMatch = this.implementedSteps[m];
                    break;
                }
            }
            if (stepDefinitionMatch === null) {
                let pattern = null;
                const params = [];
                if (this.config.stepDefinitionsStringPatterns || this.config.stepDefinitionsExpressions) {
                    let match;
                    pattern = regex.replace(/\*/g, '\\*');
                    if (isScenarioOutline) {
                        do {
                            match = /<(\w+)>/.exec(pattern);
                            if (match) {
                                const varName = this.config.stepDefinitionsStringPatterns ? ('$' + match[1]) :
                                    ('{' + match[1] + '}');
                                pattern = pattern.substring(0, match.index) + varName +
                                    pattern.substring(match.index + match[0].length);
                                params.push(isTypescript ? match[1] + ': any' : match[1]);
                            }
                        } while (match);
                    }
                    pattern = '\'' + pattern + '\'';
                    step.regex = step.regex.replace(/\*/g, '\\*').replace(/<(\w+)>/g, '<\\w+>');
                }
                else {
                    regex = this.escapeStringRegexp(regex).replace(/\//g, '\\/');
                    if (isScenarioOutline) {
                        let match;
                        pattern = regex.replace(/\*/g, '\\*');
                        do {
                            match = /<(\w+)>/.exec(pattern);
                            if (match) {
                                pattern = pattern.substring(0, match.index) + '(\\w+)' + pattern.substring(match.index + match[0].length);
                                params.push(isTypescript ? match[1] + ': any' : match[1]);
                            }
                        } while (match);
                        step.regex = step.regex.replace(/\*/g, '\\*').replace(/<(\w+)>/g, '(\\w+)');
                    }
                    else {
                        // ------------
                        // add some pattern to our step definition
                        // code borrowed from lib/cucumber/support_code/step_definition_snippet_builder.js
                        step.regex = regex
                            .replace(QUOTED_STRING_PATTERN, QUOTED_STRING_MATCHING_GROUP)
                            .replace(NUMBER_PATTERN, NUMBER_MATCHING_GROUP);
                        const match1 = regex.match(QUOTED_STRING_MATCHING_GROUP);
                        const match2 = regex.replace(QUOTED_STRING_PATTERN, QUOTED_STRING_MATCHING_GROUP).match(NUMBER_MATCHING_GROUP);
                        let paramCount = match1 === null ? 0 : (match1.length - 1);
                        paramCount += match2 === null ? 0 : (match2.length - 1);
                        for (let n = 0; n < paramCount; n++) {
                            const argName = 'arg' + (n + 1);
                            params.push(isTypescript ? argName + ': string' : argName);
                        }
                        if (tableParam.length) {
                            params.push(tableParam);
                        }
                    }
                    step.regex = '^' + step.regex + '$';
                    pattern = '/' + step.regex + '/';
                }
                if (isTypescript) {
                    params.push('callback: Function');
                }
                else if (isJavascript) {
                    params.push('callback');
                }
                // ------------
                step.isStringPattern = false;
                this.implementedSteps.push(step);
                data.steps.push({ keyword: keyword, pattern: pattern, params: params.join(', ') });
            }
        }
        if (data.steps.length === 0) {
            return null;
        }
        return compiledTemplate(data);
    }
    verifySync() {
        return __awaiter(this, void 0, void 0, function* () {
            this.output(chalk.green('Verifying local features files against TestRail test cases ...'));
            this.output('');
            let statuses = undefined;
            if (this.config.testrail.verifyFilters) {
                if (this.config.testrail.verifyFilters.custom_status) {
                    statuses = this.config.testrail.verifyFilters.custom_status;
                }
            }
            const testcases = yield this.getTests(statuses);
            const errors = [];
            for (const testcase of testcases) {
                if (this.testFiles[testcase.case_id] === undefined) {
                    errors.push(`"${testcase.title}" not found locally`);
                    continue;
                }
                const gherkin = this.formatter.formatLinesFromTestrail(testcase);
                const remoteFileContent = this.getFeatureFileContent(testcase, gherkin);
                const featurePath = this.testFiles[testcase.case_id];
                const localFileContent = fs.readFileSync(featurePath).toString().trim();
                if (this.hasGherkinContentChanged(localFileContent, remoteFileContent, false)) {
                    errors.push(`Local test case "${testcase.title}" is outdated`);
                }
            }
            return Promise.resolve(errors);
        });
    }
    findUnusedStepDefinitions() {
        return __awaiter(this, void 0, void 0, function* () {
            this.output(chalk.green('Searching for unused step definitions ...'));
            this.output('');
            this.testFiles = {};
            return new Promise((resolve, reject) => {
                let implementedSteps = this.implementedSteps.map((s) => {
                    s.used = false;
                    return s;
                });
                walk.sync(this.config.featuresDir, (filePath) => {
                    if (/\.feature$/.test(filePath)) {
                        const fileContent = fs.readFileSync(filePath).toString();
                        const re = new RegExp('^(Given|When|And|Then)', 'i');
                        const lines = fileContent.split('\n').map(Function.prototype.call, String.prototype.trim)
                            .filter((line) => re.test(line));
                        for (let line of lines) {
                            const words = line.split(' ');
                            words.shift();
                            line = words.join(' ');
                            for (let m = 0; m < implementedSteps.length; m++) {
                                if (implementedSteps[m].used === true) {
                                    continue;
                                }
                                const re = new RegExp(implementedSteps[m].regex, implementedSteps[m].regexFlags);
                                if (re.test(line)) {
                                    implementedSteps[m].used = true;
                                    break;
                                }
                            }
                        }
                        implementedSteps = implementedSteps.filter((s) => s.used === false);
                    }
                });
                return resolve(implementedSteps.map((s) => {
                    return `Step "${s.pattern}" (${s.filename}) is not used`;
                }));
            });
        });
    }
    synchronizePlan() {
        return __awaiter(this, void 0, void 0, function* () {
            this.output(chalk.green('Syncing with TestRail ...'));
            this.output('');
            this.skippedCount = 0;
            const testcases = yield this.getTests();
            for (const testcase of testcases) {
                const slug = this.slugify(testcase.title);
                const gherkin = this.formatter.getGherkinFromTestcase(testcase);
                /* istanbul ignore else: isValidGherkin function covered in unit test */
                if (gherkin.length === 0) {
                    const log = `Empty gherkin content for TestCase #${testcase.case_id}-${slug}`;
                    this.output(chalk.yellow(log));
                }
                else if (this.formatter.isValidGherkin(gherkin)) {
                    this.debug(`Valid gherkin for TestCase #${testcase.case_id}-${slug}`);
                    yield this.synchronizeCase(testcase, this.getRelativePath(testcase.case_id));
                }
                else {
                    const log = `Invalid gherkin content for TestCase #${testcase.case_id}-${slug}`;
                    this.output(chalk.yellow(log));
                    this.output(chalk.yellow(gherkin));
                }
            }
            if (this.config.overwrite.remote !== undefined &&
                this.config.overwrite.remote !== false &&
                this.config.newTestCase !== undefined) {
                const newLocalTestcases = yield this.getNewLocalTests();
                for (const localTestcase of newLocalTestcases) {
                    const gherkin = this.formatter.getGherkinFromTestcase(localTestcase);
                    if (this.formatter.isValidGherkin(gherkin)) {
                        this.output('  ' + chalk.green(`Pushing new testcase "${localTestcase.title}" to TestRail`));
                        localTestcase.custom_gherkin = gherkin.split('\n')
                            .map(Function.prototype.call, String.prototype.trim)
                            .filter((line) => line.indexOf('Feature:') !== 0 && line.indexOf('Scenario:') !== 0)
                            .join('\n');
                        const testcase = yield this.addTestCase(localTestcase);
                        yield this.addToTestPlan(testcase.id);
                        const modifiedGherkin = gherkin.split('\n');
                        for (let index = 0; index < modifiedGherkin.length; index = index + 1) {
                            const line = modifiedGherkin[index];
                            const position = line.indexOf('Scenario:');
                            if (position >= 0) {
                                const tag = `${line.substr(0, position)}@tcid:${testcase.id}`;
                                modifiedGherkin.splice(index, 0, tag);
                                break;
                            }
                        }
                        fs.writeFileSync(localTestcase.file_path, modifiedGherkin.join('\n'));
                    }
                    else {
                        const log = `Invalid gherkin content for TestCase #${localTestcase.title}`;
                        this.output(chalk.yellow(log));
                        this.output(chalk.yellow(gherkin));
                    }
                }
            }
            if (this.skippedCount > 0) {
                const plural = this.skippedCount > 1 ? 's' : '';
                const log = `Skipped ${this.skippedCount} test case${plural} (no changes)`;
                this.output('  ' + chalk.yellow(log));
            }
        });
    }
    promptForConfirmation(message) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                if (ScenarioSynchronizer.forcedPrompt !== undefined) {
                    return resolve(ScenarioSynchronizer.forcedPrompt);
                }
                /* istanbul ignore next */
                inquirer.prompt({
                    type: 'confirm',
                    name: 'confirm',
                    message,
                    default: false
                }).then((answers) => {
                    return resolve(answers.confirm);
                });
            });
        });
    }
    // tslint:disable-next-line:function-name
    static FORCE_CONFIRMATION_PROMPT(confirm) {
        this.forcedPrompt = confirm;
    }
    hasGherkinContentChanged(fileContent1, fileContent2, considerScenarioNameChange) {
        if (considerScenarioNameChange) {
            return fileContent1 !== fileContent2;
        }
        const gherkinContent1 = fileContent1.split('\n')
            .filter((line) => {
            return !/^\s*(Feature: |@tcid:|Scenario( Outline)?: )/.test(line);
        })
            .join('\n');
        const gherkinContent2 = fileContent2.split('\n')
            .filter((line) => {
            return !/^\s*(Feature: |@tcid:|Scenario( Outline)?: )/.test(line);
        })
            .join('\n');
        return gherkinContent1 !== gherkinContent2;
    }
    /**
     * Synchronize a test case from TestRail to the local filesystem
     */
    synchronizeCase(testcase, relativePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const basename = this.slugify(testcase.title);
            const exists = (this.testFiles[testcase.case_id] !== undefined);
            let featurePath = path.resolve(this.config.featuresDir + '/' + relativePath, basename + '.feature');
            const stepDefinitionsExtension = this.config.stepDefinitionsTemplate ?
                path.extname(this.config.stepDefinitionsTemplate).substr(1) : '';
            let stepDefinitionsPath = path.resolve(this.config.stepDefinitionsDir + '/' + relativePath, basename + '.' + stepDefinitionsExtension);
            featurePath = yield uniquefilename.get(featurePath, {});
            stepDefinitionsPath = yield uniquefilename.get(stepDefinitionsPath, {});
            // If the testcase is not on the filesystem, create the desired directory structure
            if (!exists) {
                mkdirp.sync(this.config.featuresDir + '/' + relativePath);
            }
            const gherkin = this.formatter.formatLinesFromTestrail(testcase);
            const remoteFileContent = this.getFeatureFileContent(testcase, gherkin);
            if (!exists) {
                fs.writeFileSync(featurePath, remoteFileContent);
                this.debug('Wrote .feature file');
                if (this.config.stepDefinitionsTemplate) {
                    const content = this.getTestFileContent(gherkin, this.config.stepDefinitionsTemplate);
                    if (content !== null) {
                        mkdirp.sync(this.config.stepDefinitionsDir + '/' + relativePath);
                        fs.writeFileSync(stepDefinitionsPath, content);
                    }
                    this.output('  ' + chalk.green(`Creating ${basename}`));
                }
            }
            else {
                featurePath = this.testFiles[testcase.case_id];
                const localFileContent = fs.readFileSync(featurePath).toString().trim();
                const fileChanged = this.hasGherkinContentChanged(localFileContent, remoteFileContent, true);
                const diffDescription = fileChanged ? chalk.underline('is different') + ' than' : 'is the same as';
                this.debug(`Existing .feature file ${diffDescription} the TestRail version`);
                if (!fileChanged) {
                    this.skippedCount = this.skippedCount + 1;
                    return Promise.resolve();
                }
                else if (this.config.overwrite.local === true) {
                    this.output('  ' + chalk.green(`Overwriting ${basename}`));
                    fs.writeFileSync(featurePath, remoteFileContent);
                    return Promise.resolve();
                }
                else if (this.config.overwrite.local === 'ask') {
                    this.showDiff(basename, localFileContent, remoteFileContent);
                    if ((yield this.promptForConfirmation('Do you want to overwrite the local version ?')) === true) {
                        fs.writeFileSync(featurePath, remoteFileContent);
                        this.output('  ' + chalk.green(`Updated ${basename}`));
                    }
                    else {
                        this.output('  ' + chalk.yellow(`Skipping ${basename}`));
                    }
                }
                else if (this.config.overwrite.remote === true) {
                    this.output('  ' + chalk.green(`Pushing ${basename} to TestRail`));
                    yield this.pushTestCaseToTestRail(testcase, localFileContent);
                }
                else if (this.config.overwrite.remote === 'ask') {
                    this.showDiff(basename, remoteFileContent, localFileContent);
                    if ((yield this.promptForConfirmation('Do you want to override the TestRail version ?')) === true) {
                        this.output('  ' + chalk.green(`Pushing ${basename} to TestRail`));
                        yield this.pushTestCaseToTestRail(testcase, localFileContent);
                    }
                    else {
                        this.output('  ' + chalk.yellow(`Skipping ${basename}`));
                    }
                }
                else {
                    this.output('  ' + chalk.yellow(`Skipping ${basename}`));
                    return Promise.resolve();
                }
            }
        });
    }
    slugify(string) {
        return string
            .split(' ')
            .join('-')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
    }
}
exports.ScenarioSynchronizer = ScenarioSynchronizer;
//# sourceMappingURL=ScenarioSynchronizer.js.map