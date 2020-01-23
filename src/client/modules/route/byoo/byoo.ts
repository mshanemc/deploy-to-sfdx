import { LightningElement, api, track } from 'lwc';

export default class Byoo extends LightningElement {
  @api template;

  @track sandboxURL;
  @track regularURL;

  get scratchUrl() {
    return window.location.href.replace('byoo', 'launch');
  }
  async connectedCallback() {
    let authURL = `/authURL?template=${this.template[0]}`;
    if (this.template.length > 1) {
      authURL = `${authURL}&template=${this.template.slice(1).join('&template=')}`;
    }
    console.log(authURL);
    this.regularURL = await (await fetch(authURL)).text();
    this.sandboxURL = await (await fetch(`${authURL}&base_url=https://test.salesforce.com`)).text();
  }
}
