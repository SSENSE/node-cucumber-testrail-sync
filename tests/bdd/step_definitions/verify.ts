import {expect} from 'chai';

/* tslint:disable:no-invalid-this */
module.exports = function (): void {
    this.Then(/^It should (succeed|fail)$/, (result: any, callback: Function) => {
        if (result === 'succeed') {
            expect(this.verifyError).to.be.null;
        } else {
            expect(this.verifyError).to.not.be.null;
        }
        callback();
    });
};
