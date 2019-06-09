import { LightningElement, api } from 'lwc';

export default class Illustration extends LightningElement {

    @api variant;
    @api size = 'small';
    @api heading;

    get isWalkthroughNotAvailable() {
        return this.variant === 'WalkthroughNotAvailable';
    }

    get isPageNotAvailable() {
        return this.variant === 'PageNotAvailable';
    }

    get sizeClass() {
        return `slds-illustration slds-illustration_${this.size}`;
    }
}