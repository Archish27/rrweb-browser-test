export type TestOptions = {
  framework: 'playwright' | 'puppeteer' | 'cypress' | 'selenium';
};

export type SerializedNodeWithId = {
  id: number;
  tagName?: string;
  attributes?: Record<string, any>;
  childNodes?: SerializedNodeWithId[];
};

export const TestFramework = {
  PLAYWRIGHT: 'playwright',
  PUPPETEER: 'puppeteer',
  CYPRESS: 'cypress',
  SELENIUM: 'selenium',
};
