import { poolConfig } from './types';
export declare const preparePoolByName: (pool: poolConfig, createHerokuDynos?: boolean) => Promise<void>;
export declare const prepareAll: () => Promise<void>;
