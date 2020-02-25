import { LightningElement, track } from 'lwc';
import { parseQuery } from './parseQueryVars';

export default class Main extends LightningElement {
  @track pathname = window.location.pathname;
  @track params = this.getQueryVariables();

  @track isHome = this.pathname === '/';
  @track isError = this.pathname === '/error';
  @track isDeployer = this.pathname.startsWith('/deploying/deployer/');
  @track isTrial = this.pathname.startsWith('/deploying/trial/');
  @track isDelete = this.pathname === '/deleteConfirm';
  @track isUserInfo = this.pathname === '/userinfo';
  @track isTestform = this.pathname === '/testform';
  @track isByoo = this.pathname.startsWith('/byoo');

  get paramsDebug() {
    return JSON.stringify(this.params);
  }

  get deployId() {
    return this.pathname.replace('/deploying/deployer/', '').replace('/deploying/trial/', '');
  }

  getQueryVariables() {
    // console.log('query var running');
    return parseQuery(window.location.search.substring(1));
  }
}
