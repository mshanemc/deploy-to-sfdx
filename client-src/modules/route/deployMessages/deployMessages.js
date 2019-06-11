import { LightningElement, api, track } from 'lwc';
// import * as fakeData from './__tests__/fakeData.json';

export default class DeployMessages extends LightningElement {
    @api deployId;

    @track results = {
        complete: false,
        mainUser: {},
        herokuResults: [],
        errors: [],
        commandResults: []
    }

    get resultsOutput() {
        return JSON.stringify(this.results);
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
        console.log(msg);
        this.results = msg.detail;
    }
}
