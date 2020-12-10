import logger from 'heroku-logger';
import { DeployRequest, DeployRequestExternalFields, DeployRequestRepo } from './types';
import { shellSanitize, filterAlphaHypenUnderscore, filterUnsanitized } from './shellSanitize';
import { checkWhitelist } from './checkWhitelist';
import { getDeployId } from './namedUtilities';
import ua from 'universal-analytics';

import { processWrapper } from './processWrapper';

const validateQuery = (query): void => {
    for (const prop in query) {
        if (!shellSanitize(query[prop])) {
            throw new Error(`unsafe query parameter ${prop}`);
        }
    }

    if (!query.template) {
        throw 'There should be a github repo in that url.  Example: /launch?template=https://github.com/you/repo';
    }
};

const makesTemplates = (templateParam): string[] => {
    if (processWrapper.SINGLE_REPO) {
        return [processWrapper.SINGLE_REPO];
    }
    if (Array.isArray(templateParam)) {
        return templateParam;
    }
    // now it'll definitely be an array!
    return [templateParam];
};

const processRepos = async (repos: DeployRequestRepo[]) =>
    Promise.all(
        repos.map(async (repo) => ({
            ...repo,
            username: filterUnsanitized(repo.username.toLowerCase()),
            repo: filterUnsanitized(repo.repo.toLowerCase()),
            source: filterUnsanitized(repo.source ?? 'github'),
            whitelisted: await checkWhitelist(repo.username, repo.repo)
        }))
    );

const deployMsgFromAPI = async (req: DeployRequestExternalFields): Promise<DeployRequest> =>
    // do some serious validation of inputs.
    ({
        ...req,
        deployId: getDeployId(req.repos[0].username, req.repos[0].repo).trim(),
        createdTimestamp: new Date(),
        visitor: processWrapper.UA_ID ? ua(processWrapper.UA_ID) : undefined,
        repos: await processRepos(req.repos)
    });

const deployMsgFromExpressReq = async (req): Promise<DeployRequest> => {
    validateQuery(req.query); // check for exploits
    const repos = await processRepos(
        makesTemplates(req.query.template).map((template) => {
            logger.debug(`deployMsgFromExpressReq: template is ${template}`);
            const path = template.replace('https://github.com/', '');
            return {
                username: filterAlphaHypenUnderscore(path.split('/')[0]),
                repo: filterAlphaHypenUnderscore(path.split('/')[1]),
                branch: path.includes('/tree/')
                    ? filterAlphaHypenUnderscore(path.split('/tree/')[1])
                    : undefined
            };
        })
    );

    const message: DeployRequest = {
        deployId: getDeployId(repos[0].username, repos[0].repo).trim(),
        createdTimestamp: new Date(),
        repos,
        byoo: req.byoo,
        noPool: req.query.nopool,
        visitor: processWrapper.UA_ID ? ua(processWrapper.UA_ID) : undefined,
        email: req.query.email,
        firstname: req.query.firstname,
        lastname: req.query.lastname,
        pool: req.query.pool
    };

    // posting from trial form
    if (req.body && req.body.UserEmail) {
        if (shellSanitize(req.body.UserEmail)) {
            message.email = req.body.UserEmail;
        } else {
            throw new Error(`invalid email address in form post ${req.body.UserEmail}`);
        }
    }

    logger.debug('deployMsgFromExpressReq: done', message);
    return message;
};

export { deployMsgFromExpressReq, deployMsgFromAPI };
