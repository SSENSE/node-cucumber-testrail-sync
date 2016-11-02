import {expect} from 'chai';

/* tslint:disable:no-invalid-this */
module.exports = function (): void {
    this.Then(/^It should (succeed|fail)$/, (result: any, callback: Function) => {
        if (result === 'succeed') {
            expect(this.scriptError).to.be.null;
        } else {
            expect(this.scriptError).to.not.be.null;
        }
        callback();
    });
};
