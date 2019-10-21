import { Request } from 'express';
import { deployRequest } from './types';
declare const deployMsgBuilder: (req: Request) => deployRequest;
export { deployMsgBuilder };
