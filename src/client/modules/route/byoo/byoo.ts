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

// https://test.salesforce.com/services/oauth2/authorize?response_type=code&client_id=3MVG9CEn_O3jvv0zQGZ3RC8AeiAlKksCa92VaSmHnAqkAWhPddsKqGb.NoXPjB4eJXWl6L7.himK3uxebGl9I&redirect_uri=http%3A%2F%2Flocalhost%3A8443%2Ftoken&scope=api%20id%20web%20openid&state=%7B%22template%22%3A%22https%3A%2F%2Fgithub.com%2Fmshanemc%2Fdf17integrationworkshops%22%2C%22base_url%22%3A%22https%3A%2F%2Ftest.salesforce.com%22%7D
// https://test.salesforce.com/services/oauth2/authorize?response_type=code&client_id=3MVG9CEn_O3jvv0zQGZ3RC8AeiAlKksCa92VaSmHnAqkAWhPddsKqGb.NoXPjB4eJXWl6L7.himK3uxebGl9I&redirect_uri=http%3A%2F%2Flocalhost%3A8443%2Ftoken&scope=api%20id%20web%20openid&state=%7B%22template%22%3A%22https%3A%2F%2Fgithub.com%2Fmshanemc%2Fdf17integrationworkshops%22%2C%22base_url%22%3A%22https%3A%2F%2Ftest.salesforce.com%22%7D
// https://test.salesforce.com/services/oauth2/authorize?response_type=code&client_id=3MVG9CEn_O3jvv0zQGZ3RC8AeiAlKksCa92VaSmHnAqkAWhPddsKqGb.NoXPjB4eJXWl6L7.himK3uxebGl9I&redirect_uri=http%3A%2F%2Flocalhost%3A8443%2Ftoken&scope=api%20id%20web%20openid&state=%7B%22template%22%3A%22https%3A%2F%2Fgithub.com%2Fmshanemc%2Fdf17appbuilding%22%2C%22https%3A%2F%2Fgithub.com%2Fmshanemc%2Fdf17integrationworkshops%22%3A%22%22%2C%22base_url%22%3A%22https%3A%2F%2Ftest.salesforce.com%22%7D
