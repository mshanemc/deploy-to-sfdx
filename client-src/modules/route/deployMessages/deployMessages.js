import { LightningElement, api, track, wire } from 'lwc';
import { CDS } from '../../../../built/lib/CDS';
import wsSubscribe from '../../messages/wsWire/wsWire';

export default class DeployMessages extends LightningElement {
  // wsUrl = location.href.replace(/^http/, 'ws');
  @track results = {};

  @api
  get deployId() {
    return this._deployId;
  }

  set deployId(value) {
    this._deployId = value;
    this.results = new CDS({
      deployId: this.deployId
    });
  }

  get resultsOutput() {
    return JSON.stringify(this.results);
  }

  get completionPercentage() {
    try {
      return (this.results.commandResults.length / this.results.lineCount) * 100 || 1;
    } catch (e) {
      return 1;
    }
  }

  get loadingDescription() {
    return `Deploying ${this.results.deployId ? this.results.deployId : '...'}`;
  }

  get showMainUser() {
    return this.results && this.results.mainUser && this.results.mainUser.loginUrl;
  }

  get showPassword() {
    return this.results && this.results.mainUser && this.results.mainUser.password;
  }

  @wire(wsSubscribe, { uri: location.href.replace(/^http/, 'ws'), log: true })
  wiredResults({ error, data }) {
    if (error) {
      console.error('error from ws subscribe wire', error);
    } else if (data) {
      console.log(data);
      this.results = data;
    }
  }

  async deleteOrg(e) {
    console.log('delete called');
    e.preventDefault();
    e.stopPropagation();
    const response = await (await fetch('/delete', {
      method: 'POST',
      body: JSON.stringify({
        username: this.results.mainUser.username
      })
    })).json();

    if (response.status === 302) {
      window.location = response.statusText;
    }
    return false;
  }

  handleMessage(msg) {
    this.results = msg.detail;
  }
}
