import { exec } from 'child_process';
declare const execProm: typeof exec.__promisify__;
declare const exec2JSON: (cmd: string, options?: {}) => Promise<any>;
declare const exec2String: (cmd: string, options?: {}) => Promise<any>;
export { execProm, exec2JSON, exec2String };
export { execProm as exec };
