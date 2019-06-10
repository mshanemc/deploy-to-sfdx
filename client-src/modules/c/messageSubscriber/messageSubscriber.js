/* eslint-disable @lwc/lwc/no-async-operation */
import { LightningElement, api } from 'lwc';

export default class MessageSubscriber extends LightningElement {

    @api deployId;
    HOST = location.href.replace(/^http/, 'ws');
    ws = new WebSocket(this.HOST);
    pinger;

    connectedCallback() {
        // note the open connection and keep the connection alive
        this.ws.onopen = () => {
            console.log('WS is open!');
            this.pinger = setInterval(() => {
                this.ws.send('ping');
            }, 5000);
        };

        this.ws.onmessage = event => {
            const newData = JSON.parse(event.data);
            console.log(newData);            
            const deployMessage = new CustomEvent('deploymessage', {
                detail: newData,
                bubbles: true
            });
            this.dispatchEvent(deployMessage);
        };

        this.ws.onclose = () => {
            console.log('WS is closing');
            clearInterval(this.pinger);
        };
          
    }

    disconnectedCallback() {
        this.ws.close();
        clearInterval(this.pinger);
    }

}