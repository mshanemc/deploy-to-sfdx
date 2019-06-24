import { createElement } from 'lwc';
import DeployMessages from 'route/deployMessages';
import * as fakeData from '../__tests__/fakeData.json';

describe('deploy-messages', () => {
  afterEach(() => {
    // The jsdom instance is shared across test cases in a single file so reset the DOM
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it('displays correct initial state (deployId only)', () => {
    // Create element
    const deployId = fakeData.deployId;
    const element = createElement('deploy-messages', {
      is: DeployMessages
    });

    element.deployId = deployId;
    document.body.appendChild(element);

    // Verify displayed id
    const bpb = element.shadowRoot.querySelector('base-progress-bar');
    expect(element.deployId).toBe(deployId);
    expect(bpb).toBeTruthy();
    expect(bpb.description).toBe(`Deploying ${deployId}`);
    expect(bpb.progress).toBe(1);

    const errors = element.shadowRoot.querySelector('.slds-theme_error');
    expect(errors).toBeFalsy();

    expect(element.shadowRoot.querySelector('.slds-theme_heroku')).toBeFalsy();
    expect(element.shadowRoot.querySelector('.slds-theme_success')).toBeFalsy();
  });

  it('displays lots of things from data', () => {
    // Create element
    const deployId = fakeData.deployId;
    const element = createElement('deploy-messages', {
      is: DeployMessages
    });

    element.deployId = deployId;
    document.body.appendChild(element);
    expect(element.deployId).toBe(deployId);

    const subscriber = element.shadowRoot.querySelector('messages-message-subscriber');
    expect(subscriber).toBeTruthy();

    return Promise.resolve()
      .then(() => {
        // then, make it feel like data came down      
        subscriber.dispatchEvent(
          new CustomEvent('deploymessage', {
           detail: fakeData 
          })
        );
      })
      .then( () => {
        // Verify displayed id
        const bpb = element.shadowRoot.querySelector('base-progress-bar');
        expect(bpb).toBeTruthy();
        expect(bpb.description).toBe(`Deploying ${fakeData.deployId}`);
        expect(bpb.progress).toBe(25);

        const errors = element.shadowRoot.querySelector('div.slds-theme_error');
        expect(errors).toBeTruthy();

        expect(element.shadowRoot.querySelector('.slds-theme_heroku')).toBeTruthy();
        expect(element.shadowRoot.querySelector('.slds-theme_success')).toBeTruthy();
      });
  });
});