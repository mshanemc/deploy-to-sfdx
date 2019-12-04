import { CDS } from './CDS';

const loginURL = (cds: CDS): string => {
    if (!cds.mainUser.password) {
        return cds.mainUser.loginUrl;
    }
    // has username and password
    let startUrl = '/lightning/setup/';
    if (cds.mainUser.openPath) {
        startUrl = cds.mainUser.openPath;
    }
    if (!startUrl.startsWith('/')) {
        startUrl = `/${startUrl}`;
    }
    // upgrade to permanent link
    return encodeURI(`https://test.salesforce.com/?un=${cds.mainUser.username}&pw=${cds.mainUser.password}&startURL=${startUrl}`);
};

export { loginURL };
