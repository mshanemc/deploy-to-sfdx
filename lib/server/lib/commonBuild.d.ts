import { deployRequest } from './types';
import { CDS } from './CDS';
declare const build: (msgJSON: deployRequest) => Promise<CDS>;
export { build };
