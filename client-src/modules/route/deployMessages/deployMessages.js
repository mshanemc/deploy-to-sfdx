import { LightningElement, api, track } from 'lwc';
import { CDS } from '../../../../built/lib/CDS';

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
        return (this.results.commandResults.length / this.results.lineCount) * 100 || 1;
    }

    get loadingDescription() {
        return `Deploying ${ this.results.deployId ? this.results.deployId : '...'}`;
    }

    get showMainUser() {
        return this.results && this.results.mainUser && this.results.mainUser.loginUrl;
    }

    get showPassword() {
        return this.results && this.results.mainUser && this.results.mainUser.password;
    }

    deleteOrg(e) {
        console.log('delete called');
        e.preventDefault();
        e.stopPropagation();

        const xhttp = new XMLHttpRequest();

        xhttp.open('POST', '/delete', true);
        xhttp.setRequestHeader('Content-type', 'application/json');
        xhttp.onreadystatechange = function () {
            if (xhttp.readyState === 4 && xhttp.status === 302) {
                console.log(xhttp.response);
                console.log(xhttp.status);
                console.log(xhttp.responseText);
                window.location = xhttp.responseText;
            }
        };

        xhttp.send(JSON.stringify({
            username: this.results.mainUser.username
        }));

        return false;
    }

    handleMessage(msg) {
        this.results = msg.detail;
    }
}
