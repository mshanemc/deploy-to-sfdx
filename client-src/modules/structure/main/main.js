import { LightningElement, track } from 'lwc';

export default class Main extends LightningElement {

    @track pathname = window.location.pathname;
    @track params = getQueryVariables();

    @track isHome = this.pathname === '/';
    @track isError = this.pathname === '/error';
    @track isDeployer = this.pathname.startsWith('/deploying/deployer/');
    @track isTrial = this.pathname.startsWith('/deploying/trial/');
    @track isDelete = this.pathname === '/deleteConfirm';
    @track isUserInfo = this.pathname === '/userinfo';
    @track isTestform = this.pathname === '/testform';
    
    get paramsDebug() {
        return JSON.stringify(this.params);
    }

    get deployId() {
        return this.pathname.replace('/deploying/deployer/', '');
    }

}

const getQueryVariables = () => {
    const output = {};
    const query = window.location.search.substring(1);

    if (query.length === 0) {
        return output;
    }
    const params = query.split('&');
    
    
    params.forEach( (param) => {
        const pair = param.split('=');
        output[pair[0]] = pair[1];
    });

    console.log(output);
    return output;
};

