import { deployRequest } from './types';
import { CDS } from './CDS';
declare const lineRunner: (msgJSON: deployRequest, lines: string[], output: CDS) => void;
export { lineRunner };
