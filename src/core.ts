import type { eventWithTime } from '@rrweb/types';
import { generatePlaywrightTests } from './playwright';
import { TestFramework, type TestOptions } from './types';

const generateTests = (
  events: Array<eventWithTime | string>,
  options?: TestOptions,
): string => {
  switch (options?.framework) {
    case TestFramework.PLAYWRIGHT:
      return generatePlaywrightTests(events);
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
