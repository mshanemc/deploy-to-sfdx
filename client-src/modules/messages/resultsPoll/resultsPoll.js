/* eslint-disable @lwc/lwc/no-async-operation */
import { register, ValueChangedEvent } from '@lwc/wire-service';
import * as fakeData from '../../route/deployMessages/__tests__/data/fullExample.json';
import { CDS } from '../../../../built/lib/CDS';

const interval_ms = 1000;
const timeoutMS = 1000 * 60 * 30; // 30 minutes, then stop no matter what

export default function resultsPoll(config) {
  // eslint-disable-next-line no-unused-vars
  return new Promise((resolve, reject) => {
    resolve(config);
  });
}

register(resultsPoll, eventTarget => {
  let config = {};
  let pinger;

  eventTarget.addEventListener('config', newConfig => {
    config = newConfig;
    if (newConfig.log) {
      console.log('new config is', newConfig);
    }

    if (config.fake) {
      eventTarget.dispatchEvent(new ValueChangedEvent({ data: fakeData.default }));
    } else if (config.deployId) {
      clearInterval(pinger);
      setTimeout(() => {
        clearInterval(pinger);
      }, timeoutMS);
      pinger = setInterval(async () => {
        const results = await (await fetch(`/results/${config.deployId}`)).json();
        if (config.log) {
          console.log(results);
        }
        const cds = new CDS({ ...results });
        eventTarget.dispatchEvent(new ValueChangedEvent({ data: results }));
        if (cds.complete) {
          clearInterval(pinger);
        }
      }, interval_ms);
    }
  });

  eventTarget.addEventListener('disconnect', () => {
    clearInterval(pinger);
  });

  eventTarget;
});
