import {expect} from 'chai';
import {redis} from './../../src/lib/redisNormal';

export const clearQueues = async () => {
  // destroy all the queues
  await redis.flushall();
};
