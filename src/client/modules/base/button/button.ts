import { LightningElement, api, track } from 'lwc';

export default class Button extends LightningElement {
  @track styleClass = 'slds-button';

  @api url;
  @api target = '_blank';
  _variant = '';

  @api disabled;

  @api label;
  @api
  get variant() {
    return this._variant;
  }
  set variant(value) {
    this._variant = value;
    switch (value) {
      case 'neutral':
        this.styleClass = 'slds-button slds-button_neutral';
        break;
      case 'brand':
        this.styleClass = 'slds-button slds-button_brand';
        break;
      case 'destructive':
        this.styleClass = 'slds-button slds-button_destructive';
        break;
      case 'success':
        this.styleClass = 'slds-button slds-button_success';
        break;
      case 'inverse':
        this.styleClass = 'slds-button slds-button_inverse';
        break;
      case 'outline-brand':
        this.styleClass = 'slds-button slds-button_outline-brand';
        break;
      case 'text-destructive':
        this.styleClass = 'slds-button slds-button_text-destructive';
        break;
      default:
        this.styleClass = 'slds-button';
    }
  }

  click(event) {
    event.stopPropagation();
    event.preventDefault();
    this.dispatchEvent(
      new CustomEvent('click', {
        detail: {
          label: this.label
        }
      })
    );
  }
}
