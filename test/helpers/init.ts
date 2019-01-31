// const dotenv = require('dotenv');

import * as dotenv from 'dotenv';

dotenv.config();

process.env.DEPLOYER_TESTING_ENDPOINT = 'http://localhost:8443';
// process.env.DEPLOYER_TESTING_ENDPOINT =
//   'https://hosted-scratch-dev.herokuapp.com';
// process.env.REDIS_URL = 'redis://localhost:6379';
process.env.LOG_LEVEL = 'DEBUG';
