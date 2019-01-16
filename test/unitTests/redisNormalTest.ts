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

import * as chai from 'chai';

const expect = chai.expect;

describe('redis tests', async () => {
  const deployMsgTest = {
    repo: 'testRepo',
    username: 'mshanemc',
    deployId: 'this-is-the-deploy-id'
  };

  before(async () => {
    await clearQueues();
  });

  it('can put a message on the deploy queue', async () => {
    await putDeployRequest(deployMsgTest);
  });

  it('can get a message from the deploy queue', async () => {
    const msg = await getDeployRequest();
    expect(msg).to.be.an('object');
    expect(msg).to.deep.equal(deployMsgTest);
  });
});
