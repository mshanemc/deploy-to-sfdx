import { deployRequest } from './types';
declare const pooledOrgFinder: (deployReq: deployRequest, forcePool?: boolean) => Promise<import("./CDS").CDS>;
export { pooledOrgFinder };
