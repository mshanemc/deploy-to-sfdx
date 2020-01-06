import { LightningElement } from 'lwc';
import { lwcRouter } from '@mshanemc/lwc-oss-base/src/modules/base/router/router';
import { routeTable } from './routes';

export default class Main extends LightningElement {
  routeableArea = 'primary-content';

  renderedCallback() {
    const router = new lwcRouter({
      targetElement: this.template.querySelector(`.${this.routeableArea}`),
      routeTable
    });
  }
}
