import Redis from 'ioredis';
import { processWrapper } from './processWrapper';

const redis = new Redis(processWrapper.REDIS_URL);
export = redis;
