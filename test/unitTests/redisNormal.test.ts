import {
  redis,
  deleteOrg,
  deployRequestExchange,
  getDeployRequest,
  cdsExchange,
  cdsPublish,
  putDeployRequest,
  putPoolRequest,
  getKeys,
  getPooledOrg,
  putPooledOrg,
  getPoolRequest,
  getPoolDeployRequestQueueSize,
  getPoolDeployCountByRepo
} from '../../src/lib/redisNormal';

import { deployRequest } from '../../src/lib/types';

jest.setTimeout(7000);
const deployMsgTest:deployRequest = {
  repo: 'testRepo',
  username: 'mshanemc',
  deployId: 'this-is-the-deploy-id',
  createdTimestamp: new Date()
};

const deployMsgSerialized: any = {...deployMsgTest};
deployMsgSerialized.createdTimestamp = deployMsgSerialized.createdTimestamp.toJSON();

test('can put a message on the deploy queue', async () => {
  await putDeployRequest(deployMsgTest);
});

test('can get a message from the deploy queue', async () => {
  const msg = await getDeployRequest();
  expect(msg).toEqual(deployMsgSerialized);
});

test('blocks deletes with bad usernames', async () => {
  await expect(deleteOrg('hack@you.bad;wget')).rejects.toEqual(Error('invalid username hack@you.bad;wget'));
});

test('allows deletes with good usernames', async () => {
  expect(deleteOrg('sweet@you.good')).resolves.toBeUndefined();
  const result = await deleteOrg('sweet@you.good');
  expect(result).toBeUndefined();
});

test('properly counts poolDeploys', async () => {

  const username = 'mshanemc';
  const mainRepo = 'platformTrial';

  const req: deployRequest = {
    username: username,
    repo: mainRepo,
    deployId: encodeURIComponent( `${username}-${mainRepo}-${new Date().valueOf()}` ),
    whitelisted: true,
    pool: true,
    createdTimestamp: new Date()
  };

  const req2: deployRequest = {
    username: username,
    repo: 'else',
    deployId: encodeURIComponent( `${username}-else-${new Date().valueOf()}` ),
    whitelisted: true,
    pool: true,
    createdTimestamp: new Date()
  };
  
  await putPoolRequest(req);
  await putPoolRequest(req);
  await putPoolRequest(req);
  await putPoolRequest(req);
  await putPoolRequest(req2);

  const poolSize = await getPoolDeployRequestQueueSize();
  expect(poolSize).toBe(5);

  const trialSize = await getPoolDeployCountByRepo(username, mainRepo);
  expect(trialSize).toBe(4);
});