import { LightningElement, api, track } from 'lwc';
import { multiTemplateURLBuilder } from '../../../../server/lib/multiTemplateURLBuilder';

export default class UserInfo extends LightningElement {
  @api theTemplate: string[];
  @track email: string = '';

  get launchUrl() {
    return `${multiTemplateURLBuilder(this.theTemplate, '/launch')}&email=${this.email}`;
  }

  handleEmailChange(event) {
    this.email = event.path[0].value;
  }
}
