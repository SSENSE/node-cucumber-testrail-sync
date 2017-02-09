export class GherkinFormatter {
    /**
     * Verify that each line is valid gherkin syntax
     */
    public isValidGherkin(gherkin: string): boolean {
        if (gherkin === null) {
            return false;
        }

        const lines = gherkin.split('\n')
            .map(Function.prototype.call, String.prototype.trim)
            .filter((line: string) => line.length > 0 && line.indexOf('Feature:') !== 0 && line.indexOf('Scenario:') !== 0);

        const re = new RegExp('^(Given|When|And|Then|Examples|\\||#)', 'i');
        const validLines = lines.filter((line: string) => re.test(line));

        let numLinesWithData = 0;
        let isData = false;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].substr(0, 3) === '"""') {
                numLinesWithData++;
                isData = !isData;
                continue;
            }
            if (isData) {
                numLinesWithData++;
                continue;
            }
        }

        return (lines.length === validLines.length + numLinesWithData);
    }

    public getGherkinFromTestcase(testcase: any): string {
        if (testcase.custom_gherkin && testcase.custom_gherkin.length > 0) {
            return testcase.custom_gherkin;
        } else if (testcase.custom_steps && testcase.custom_steps.length > 0) {
            return testcase.custom_steps;
        } else if (testcase.custom_steps_separated && testcase.custom_steps_separated.length > 0) {
            return testcase.custom_steps_separated.map((s: any) => s.content).join('\n');
        }
        return '';
    }

    /**
     * Split the gherkin content from TestRail into lines
     */
    public formatLinesFromTestrail(testcase: any): string[] {
        const arr = this.getGherkinFromTestcase(testcase).replace(/[\r]/g, '').split('\n')
          .map(Function.prototype.call, String.prototype.trim)
          .map((line: string) => {
            // replace ” by "
            return line.replace(/”/g, '"');
          })
          .map((line: string) => {
            // remove extra spaces
            // convert the first character to uppercase
            return line.replace(/^(Given|When|Then|And)\s+(\w)/i, (match: any, first: any, second: any) => {
              return first.charAt(0).toUpperCase() + first.slice(1) + ' ' + second.toUpperCase();
            });
          })
          .filter((line: string) => line.length > 0 && line.indexOf('Scenario:') !== 0)
          // replace line like: |:header1|:header2| by |header1|header2|
          .map((line: string) => {
            if (line[0] !== '|') {
                return line;
            }
            return line.replace(/\|:/g, '|');
          });

        // insert a blank line before Examples
        for (let i = arr.length - 1; i > 0; i--) {
            if (arr[i].indexOf('Examples') === 0) {
                arr.splice(i, 0, '');
            }
        }

        return this.replaceMultiPipesTables(arr);
    }

    protected replaceMultiPipesTables(arr: string[]): string[] {
        let tableStart = -1;
        for (let i = 0; i < arr.length; i++) {
            if (arr[i][0] === '|' && i + 1 < arr.length) {
                if (tableStart === -1) {
                    tableStart = i;
                }
            } else if (tableStart !== -1) {
                let tableEnd = i;
                if (arr[i][0] === '|' && i + 1 === arr.length) {
                    tableEnd = tableEnd + 1;
                }

                // Replace tables like: ||value1|value2 by |value1|value2|
                // All rows of the table should start with ||'s - or ||| for the first one
                const len = tableEnd - tableStart;
                const multiPipesLines = arr.filter((value: string, index: Number): boolean => {
                    return index >= tableStart && index < tableEnd;
                }).filter((value: string): boolean => {
                    return value.substr(0, 2) === '||';
                }).length;

                if (len === multiPipesLines) {
                    arr.splice.apply(arr, (<any[]> [ tableStart, len ]).concat(
                         arr.filter((value: string, index: Number): boolean => {
                            return index >= tableStart && index < tableEnd;
                        }).map((line: string, index: number) => {
                            if (index === 0) {
                                return line.replace(/^(\|{2,})(.*)$/, '|$2|');
                            }
                            return line.replace(/^(\|{2})(.*)$/, '|$2|');
                        })
                    ));
                }

                tableStart = -1;
            }
        }

        return arr;
    }

    public replaceTablesByMultiPipesTables(gherkin: string): string {
        const arr = gherkin.split('\n');
        let tableLindexIndex = -1;
        for (let i = 0; i < arr.length; i++) {
            if (arr[i][0] === '|') {
                tableLindexIndex++;
                // Replace tables like: |value1|value2| by ||value1|value2
                // Header should be replaced by: |||:header1|:header2
                arr[i] = arr[i].replace(/\s*\|\s*$/, '');
                arr[i] = arr[i].replace(/^\s*\|/, '');
                if (tableLindexIndex === 0) {
                    arr[i] = arr[i].replace(/\|/g, '|:');
                    arr[i] = `|||:${arr[i]}`;
                } else {
                    arr[i] = `||${arr[i]}`;
                }
            } else {
                tableLindexIndex = -1;
            }
        }

        return arr.join('\n');
    }
}
