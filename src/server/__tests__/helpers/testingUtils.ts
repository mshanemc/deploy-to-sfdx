import { processWrapper } from '../../lib/processWrapper';

const getTestURL = (): string => {
    if (processWrapper.HEROKU_APP_NAME) {
        return `https://${processWrapper.HEROKU_APP_NAME}.herokuapp.com`;
    } else {
        return `http://localhost:${processWrapper.PORT || 8443}`;
    }
};

const sfdxTimeout = 1000 * 60 * 35;

export { getTestURL, sfdxTimeout };
