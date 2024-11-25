import { generateBrowserTests, TestFramework } from '../dist/index.cjs';
import events from 'events.json' with { type: 'json' };

console.log(generateBrowserTests(events).toCode());
console.log(
  generateBrowserTests(events, {
    framework: TestFramework.PLAYWRIGHT,
  }).toCode(),
);
console.log(
  generateBrowserTests(events, { framework: TestFramework.CYPRESS }).toCode(),
);
console.log(
  generateBrowserTests(events, { framework: TestFramework.SELENIUM }).toCode(),
);
console.log(
  generateBrowserTests(events, { framework: TestFramework.PUPPETEER }).toCode(),
);
