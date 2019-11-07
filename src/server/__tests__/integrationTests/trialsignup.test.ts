// import * as puppeteer from 'puppeteer';

// import { sfdxTimeout, getTestURL } from '../helpers/testingUtils';
import { leadCreate } from '../../lib/leadSupport';
import { sample } from '../../__tests__/helpers/sampleLead';

// const shouldBeLoaded = 1000;

describe.skip('tests org62 signup stuff', () => {
    it('calls servlet', async () => {
        const response = await leadCreate(sample);
        console.log(response);
    });
});

// describe.skip('runs the trial', () => {
//     let browser, page;
//     let baseUrl = getTestURL();

//     beforeAll(async () => {
//         browser = await puppeteer.launch({ headless: true });
//         page = await browser.newPage();
//     });

//     test(
//         'gets form and completes it successfully',
//         async () => {
//             // const browser = await puppeteer.launch({headless:false});
//             // const page = await browser.newPage();
//             // const baseUrl = getTestURL();

//             await page.goto(`${baseUrl}/testform`);
//             expect(await page.url()).toContain('/testform');

//             await page.waitForSelector('input#UserEmail', { timeout: shouldBeLoaded });
//             await page.waitForSelector('input#UserFirstName', { timeout: shouldBeLoaded });
//             await page.waitForSelector('input#UserLastName', { timeout: shouldBeLoaded });
//             await page.waitForSelector('input#submitButton', { timeout: shouldBeLoaded });

//             await page.type('input#UserEmail', 'm.shane.mclaughlin@gmail.com');
//             await page.type('input#UserFirstName', 'shane');
//             await page.type('input#UserLastName', 'mclaughlin');
//         },
//         sfdxTimeout
//     );

//     test(
//         'submits form and gets to loading screen, then leaves',
//         async () => {
//             await page.waitForSelector('input#submitButton', { timeout: shouldBeLoaded });

//             await Promise.all([page.click('input#submitButton'), page.waitForNavigation()]);

//             const deployingUrl = await page.url();
//             expect(deployingUrl).toContain('/deploying/trial/mshanemc-platformTrial-');
//             await page.waitForSelector('.bluebar', { timeout: shouldBeLoaded });
//             await page.waitForNavigation({ timeout: sfdxTimeout });
//         },
//         sfdxTimeout
//     );

//     test(
//         'eventually gets to actual trial',
//         async () => {
//             await page.waitForSelector('div.cTrialWelcome2');

//             const trialUrl = await page.url();
//             expect(trialUrl).toContain('lightning.force');
//         },
//         sfdxTimeout
//     );

//     afterAll(async () => {
//         browser.close();
//     });
// });
