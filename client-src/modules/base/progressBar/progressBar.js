import { LightningElement, api, track } from 'lwc';

export default class ProgressBar extends LightningElement {
  @api description;
  @track _progress = 0;

  @api
  set progress(value) {
    this._progress = Math.round(value);
  }

  get progress() {
    return this._progress;
  }

  get widthStyle() {
    return `width: ${this._progress}%`;
  }
}
