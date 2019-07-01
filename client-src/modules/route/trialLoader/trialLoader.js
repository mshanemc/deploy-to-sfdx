import { LightningElement, api, wire } from 'lwc';
import wsSubscribe from '../../messages/wsWire/wsWire';

export default class TrialLoader extends LightningElement {
  @api deployId;

  @wire(wsSubscribe, { uri: location.href.replace(/^http/, 'ws'), log: true })
  wiredResults({ error, data }) {
    if (error) {
      console.error('error from ws subscribe wire', error);
    } else if (data) {
      console.log(data);
      if (data.mainUser && data.mainUser.loginUrl) {
        window.location.href = data.mainUser.loginUrl;
      }
    }
  }
}
