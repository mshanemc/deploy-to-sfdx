import { LightningElement, api, track } from 'lwc';

export default class UserInfo extends LightningElement {
  @api theTemplate;
  @track email = '';

  get launchUrl() {
    return `/launch?template=${this.theTemplate}&email=${this.email}`;
  }

  handleEmailChange(event) {
    this.email = event.path[0].value;
  }
}
