/* eslint-disable @lwc/lwc/no-async-operation */
import { register, ValueChangedEvent } from '@lwc/wire-service';

export default function wsSubscribe() {
    // eslint-disable-next-line no-unused-vars
    return new Promise((resolve, reject) => {
        resolve();
    });
}

register(wsSubscribe, eventTarget => {

    let config;
    let pinger;
    let ws;

    eventTarget.addEventListener('config', newConfig => {
        if (newConfig.log) {
            console.log('new config is', newConfig);
        }
        config = newConfig;
    });

    eventTarget.addEventListener('connect', () => {
        if (config.log) {
            console.log('ws is connecting');
        }

        ws = new WebSocket(config.uri);
        ws.onopen = () => {
            if (config.log) {
                console.log('WS is open!');
            }
            pinger = setInterval(() => {
                try {
                    ws.send('ping');
                } catch (e) {
                    console.log('could not send ws ping', e);
                }
            }, 5000);
        };

        ws.onmessage = event => {
            const newData = JSON.parse(event.data);
            if (config.log) {
                console.log('heard ws event', newData);            
            }
            eventTarget.dispatchEvent(new ValueChangedEvent({ data: newData }));
        };
    
        ws.onclose = () => {
            if (config.log) {
                console.log('WS is closing');
            }
            clearInterval(pinger);
        };
        
    });

    eventTarget.addEventListener('disconnect', () => {
        ws.close();
        clearInterval(pinger);
    });
    

});