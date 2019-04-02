import * as puppeteer from 'puppeteer';
import * as fs from 'fs-extra';

import { getTestURL } from './../helpers/testingUtils';
import { sfdxTimeout } from './../helpers/testingUtils';

const deployCheck = async (user, repo) => {
    await fs.ensureDir('tmp');

    const baseUrl = getTestURL();
	const url = `https://github.com/${user}/${repo}`;
	const browser = await puppeteer.launch({headless:true});
	const page = await browser.newPage();
    
    await page.goto(`${baseUrl}/launch?template=${url}`);

    const urlResult = await page.url(); 
	expect(urlResult).toContain(`deploying/deployer/${user}-${repo}-`);

    await page.waitForSelector('a#loginURL[href*="https:"]', { timeout: sfdxTimeout});

    const href = await page.evaluate(() => (<HTMLAnchorElement>document.querySelector('#loginUrl')).href);    
	expect(typeof href).toBe('string');

	// verify that loading icon eventually stops spinning
    await page.waitForSelector('#loaderBlock', { timeout: sfdxTimeout, hidden: true});
    await page.waitForSelector('#errorBlock', { timeout: sfdxTimeout, hidden: true});

    await Promise.all([
        page.click('#deleteButton'),
        page.waitForNavigation()
    ]);

    browser.close();
};

export { deployCheck };
