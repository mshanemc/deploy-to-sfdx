import { LightningElement, api } from 'lwc';

export default class TopLevelError extends LightningElement {
    @api 
    set errorMessage(value) {
        // url unencode
        this._errorMessage = decodeURI(value);
    }

    get errorMessage() {
        return this._errorMessage;
    }

}
