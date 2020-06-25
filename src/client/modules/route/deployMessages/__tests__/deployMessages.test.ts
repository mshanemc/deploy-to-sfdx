import { createElement } from 'lwc';
import resultsPoll from '../../../messages/resultsPoll/resultsPoll';
import { registerTestWireAdapter } from '@salesforce/wire-service-jest-util';

import DeployMessages from '../deployMessages';

import { fullExample } from './data/fullExample';

describe('deploy-messages', () => {
  const fakeWire = registerTestWireAdapter(resultsPoll);

  afterEach(() => {
    // The jsdom instance is shared across test cases in a single file so reset the DOM
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it('displays correct initial state (deployId only)', () => {
    // Create element
    const deployId = fullExample.deployId;
    const element = createElement('deploy-messages', {
      is: DeployMessages,
    });

    element.deployId = deployId;
    document.body.appendChild(element);

    // Verify displayed id
    const bpb = element.shadowRoot.querySelector('base-progress-bar');
    expect(bpb).toBeTruthy();
    expect(bpb.description).toBe(`Deploying ${deployId}`);
    expect(bpb.value).toBe(1);

    const errors = element.shadowRoot.querySelector('.slds-theme_error');
    expect(errors).toBeFalsy();

    expect(element.shadowRoot.querySelector('.slds-theme_heroku')).toBeFalsy();
    expect(element.shadowRoot.querySelector('.slds-theme_success')).toBeFalsy();
  });

  it('displays lots of things from data', () => {
    // Create element
    const deployId = fullExample.deployId;
    const element = createElement('deploy-messages', {
      is: DeployMessages,
    });

    element.deployId = deployId;
    document.body.appendChild(element);
    expect(element.deployId).toBe(deployId);

    fakeWire.emit({ data: fullExample });

    return Promise.resolve().then(() => {
      // Verify displayed id
      const bpb = element.shadowRoot.querySelector('base-progress-bar');
      expect(bpb).toBeTruthy();
      expect(bpb.description).toBe(`Deploying ${fullExample.deployId}`);
      expect(bpb.value).toBe(25);

      const errors = element.shadowRoot.querySelector('div.slds-theme_error');
      expect(errors).toBeTruthy();

      expect(element.shadowRoot.querySelector('.slds-theme_heroku')).toBeTruthy();
      expect(element.shadowRoot.querySelector('.slds-theme_success')).toBeTruthy();
    });
  });
});
