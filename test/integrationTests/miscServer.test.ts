import * as request from 'request-promise-native';
import { getTestURL } from '../helpers/testingUtils';

const testURL = getTestURL();

describe('misc server tests', () => {
  
  test('displays pools', async () => {
    const response = await request.get({
      url: `${testURL}/pools`,
      json: true
    });
    // expect(response.statusCode).toBe('200');
    expect(typeof response).toBe("object");
    expect(response.length).toBeGreaterThanOrEqual(0);
  });

  test('returns the testform', async () => {
    const response = await request.get({
      url: `${testURL}/testform`,
      resolveWithFullResponse: true
    });
    expect(response.statusCode).toBe(200);
  });

  test('returns the userinfo form', async () => {
    const response = await request.get({
      url: `${testURL}/userinfo`,
      resolveWithFullResponse: true
    });
    expect(response.statusCode).toBe(200);
  });

  test('returns the home page', async () => {
    const response = await request.get({
      url: `${testURL}/`,
      resolveWithFullResponse: true
    });
    expect(response.statusCode).toBe(200);
  });
});

