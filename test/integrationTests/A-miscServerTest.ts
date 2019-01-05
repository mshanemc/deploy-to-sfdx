import * as chai from 'chai';
import * as Nightmare from 'nightmare';
import * as dotenv from 'dotenv';
import * as request from 'request-promise-native';

dotenv.config();

const expect = chai.expect;
const testEnv = process.env.DEPLOYER_TESTING_ENDPOINT;
const waitTimeout = 1000 * 60 * 15; // 15 minutes should do it

it('returns the home page empty message', async () => {
  const response = await request.get({
    url: `${testEnv}/`,
    json: true
  });
  expect(response.message).to.equal(
    'There is nothing at /.  See the docs for valid paths.'
  );
});

it('displays pools', async () => {
  const response = await request.get({
    url: `${testEnv}/pools`,
    json: true
  });
  // expect(response.statusCode).to.equal('200');
  expect(response).to.be.an('array');
});

it('returns the testform', async () => {
  const response = await request.get({
    url: `${testEnv}/testform`,
    resolveWithFullResponse: true
  });
  expect(response.statusCode).to.equal(200);
});

it('returns the userinfo form', async () => {
  const response = await request.get({
    url: `${testEnv}/userinfo`,
    resolveWithFullResponse: true
  });
  expect(response.statusCode).to.equal(200);
});
