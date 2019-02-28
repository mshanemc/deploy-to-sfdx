import { clearQueues } from '../helpers/clearRedis';

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
  getPoolDeployRequestQueueSize
} from '../../src/lib/redisNormal';

import { deployRequest } from '../../src/lib/types';

import * as chai from 'chai';

const expect = chai.expect;

describe('redis tests', async () => {
  const deployMsgTest:deployRequest = {
    repo: 'testRepo',
    username: 'mshanemc',
    deployId: 'this-is-the-deploy-id',
    createdTimestamp: new Date()
  };


  const deployMsgSerialized: any = {...deployMsgTest};
  deployMsgSerialized.createdTimestamp = deployMsgSerialized.createdTimestamp.toJSON();

  before(async () => {
    await clearQueues();
  });

  it('can put a message on the deploy queue', async () => {
    await putDeployRequest(deployMsgTest);
  });

  it('can get a message from the deploy queue', async () => {
    const msg = await getDeployRequest();
    expect(msg).to.be.an('object');
    expect(msg).to.deep.equal(deployMsgSerialized);
  });

  it('blocks deletes with bad usernames', async () => {
    await expect(deleteOrg('hack@you.bad;wget')).to.be.rejected;
  });

  it('allows deletes with good usernames', async () => {
    await expect(deleteOrg('sweet@you.good'));
  });
});
