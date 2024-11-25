import type { eventWithTime } from '@rrweb/types';
import { generateCypressTests } from './cypress';
import { generatePlaywrightTests } from './playwright';
import { generatePuppeteerTests } from './puppeteer';
import { generateSeleniumTests } from './selenium';
import { TestFramework, type TestOptions } from './types';

const generateTests = (
  events: Array<eventWithTime | string>,
  options?: TestOptions,
): string => {
  switch (options?.framework) {
    case TestFramework.PLAYWRIGHT:
      return generatePlaywrightTests(events);
    case TestFramework.CYPRESS:
      return generateCypressTests(events);
    case TestFramework.SELENIUM:
      return generateSeleniumTests(events);
    case TestFramework.PUPPETEER:
      return generatePuppeteerTests(events);
    default:
      return generatePlaywrightTests(events);
  }
};

export const generateBrowserTests = (
  events: Array<eventWithTime | string>,
  options?: TestOptions,
): string => {
  return generateTests(events, options);
};
