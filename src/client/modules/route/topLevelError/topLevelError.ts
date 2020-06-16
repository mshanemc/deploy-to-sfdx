import { LightningElement, api } from 'lwc';
// import { parseQuery } from '../../structure/main/parseQueryVars';

export default class TopLevelError extends LightningElement {
  @api rawError;

  get errorMessage() {
    console.log(this.rawError);
    return decodeURI(this.rawError);
  }
}
