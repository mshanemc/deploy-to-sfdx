import { LightningElement, api } from 'lwc';

export default class TrialLoader extends LightningElement {
    
    @api deployId;

    handleMessage(msg) {
        const detail = msg.detail;
        console.log(detail);
        if (detail.mainUser && detail.mainUser.loginUrl) {
            window.location.href = detail.mainUser.loginUrl;
        }
    }
}   