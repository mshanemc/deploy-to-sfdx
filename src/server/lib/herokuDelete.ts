import request from 'request-promise-native';
import logger from 'heroku-logger';

import { processWrapper } from '../lib/processWrapper';

const herokuDelete = async (appName: string) => {
    const headers = {
        Accept: 'application/vnd.heroku+json; version=3',
        Authorization: `Bearer ${processWrapper.HEROKU_API_KEY}`
    };

    try {
        const deleteResult = await request.delete({
            url: `https://api.heroku.com/apps/${appName}`,
            headers,
            json: true
        });

        return deleteResult;
    } catch (e) {
        logger.error(`error deleting heroku app ${appName}`);
    }
    return undefined;
};

export { herokuDelete };
