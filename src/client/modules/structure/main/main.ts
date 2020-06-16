import { LightningElement } from 'lwc';
import { routeTable } from './routes';
import { lwcRouter } from '@mshanemc/lwc-oss-base/src/modules/base/router/router';

export default class Main extends LightningElement {
  renderedCallback() {
    const router = new lwcRouter({
      targetElement: this.template.querySelector('.primary-content'),
      routeTable,
    });
  }
}
