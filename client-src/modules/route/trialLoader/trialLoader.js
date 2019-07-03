import { LightningElement, api, wire } from 'lwc';
import resultsPoll from '../../messages/resultsPoll/resultsPoll';

export default class TrialLoader extends LightningElement {
  @api deployId;

  @wire(resultsPoll, { deployId: '$deployId' })
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
