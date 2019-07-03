import { LightningElement, api, track, wire } from 'lwc';
import { CDS } from '../../../../built/lib/CDS';
import resultsPoll from '../../messages/resultsPoll/resultsPoll';

export default class DeployMessages extends LightningElement {
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

  get showErrors() {
    return this.results && this.results.errors && this.results.errors.length > 0;
  }

  get showHeroku() {
    return this.results && this.results.herokuResults && this.results.herokuResults.length > 0;
  }

  @wire(resultsPoll, { deployId: '$deployId' })
  wiredResults({ error, data }) {
    if (error) {
      console.error('error from ws subscribe wire', error);
    } else if (data) {
      console.log(data);
      this.results = data;
    }
  }

  async deleteOrg(e) {
    e.preventDefault();
    e.stopPropagation();
    const response = await (await fetch('/delete', {
      method: 'POST',
      body: JSON.stringify({
        deployId: this.results.deployId
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })).json();

    console.log(response);
    window.location = response.redirectTo;
  }

  handleMessage(msg) {
    this.results = msg.detail;
  }
}
