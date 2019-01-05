import {expect} from 'chai';
import * as redis from './../../src/lib/redisNormal';

export const clearQueues = async () => {
  // destroy all the queues
  const keys = await redis.keys('*');
  await Promise.all(keys.map(key => redis.del(key)));

  const emptyKeys = await redis.keys('*');
  expect(emptyKeys).to.have.length(0);
};
