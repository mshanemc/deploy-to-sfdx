import { deployRequest } from './types';
declare const lineParse: (msgJSON: deployRequest) => Promise<string[]>;
declare const jsonify: (line: string) => string;
export { lineParse, jsonify };
