import { LightningElement, api, wire } from 'lwc';
import resultsPoll from '../../messages/resultsPoll/resultsPoll';
import { CDS } from '../../../../server/lib/CDS';

export default class TrialLoader extends LightningElement {
  _deployId;

  @api
  get deployId() {
    return this._deployId;
  }

  set deployId(value) {
    this._deployId = value;
  }

  @wire(resultsPoll, { deployId: '$deployId' })
  wiredResults({ error, data }: { error: any; data: CDS }) {
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
