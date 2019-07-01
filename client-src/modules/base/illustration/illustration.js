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
    if (this.size === 'large') {
      return `slds-illustration slds-illustration_large`;
    }
    return `slds-illustration slds-illustration_small`;
  }
}
