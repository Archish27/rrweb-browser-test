# rrweb-browser-test

Auto-generating browser tests from rrweb recording events. Following test frameworks supported:

- Playwright
- Puppeteer
- Cypress
- Selenium

### Example

Specify your recorded rrweb as `events.json`. The following code will generate auto-generate test script based on recorded events.

```javascript
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
```
