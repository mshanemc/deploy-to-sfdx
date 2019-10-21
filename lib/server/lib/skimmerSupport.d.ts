import { poolConfig } from './types';
declare const skimmer: () => Promise<void>;
declare const checkExpiration: (pool: poolConfig) => Promise<string>;
declare const herokuExpirationCheck: () => Promise<void>;
declare const removeOldDeployIds: () => Promise<void>;
declare const processDeleteQueue: () => Promise<void>;
export { checkExpiration, skimmer, herokuExpirationCheck, removeOldDeployIds, processDeleteQueue };
