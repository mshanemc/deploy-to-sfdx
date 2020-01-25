import { LightningElement, api } from 'lwc';

export default class TopLevelError extends LightningElement {
  _errorMessages: string[];

  @api
  set errorMessages(errors: string[]) {
    this._errorMessages = errors.map(error => decodeURI(error));
  }

  get errorMessages() {
    return this._errorMessages;
  }

  get errorMessage() {
    return this._errorMessages.join(';');
  }
}
