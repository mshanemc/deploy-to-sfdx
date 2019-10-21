import { LightningElement, api } from 'lwc';

export default class CommandOutput extends LightningElement {
  @api commandResult;

  get formattedResult() {
    return this.commandResult.summary || this.commandResult.shortForm || this.commandResult.command || this.commandResult.raw;
  }
}
