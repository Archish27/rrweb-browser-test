import {
  EventType,
  IncrementalSource,
  MouseInteractions,
  type eventWithTime,
  type fullSnapshotEvent,
  type inputData,
  type mediaInteractionData,
  type mouseInteractionData,
  type mousemoveData,
  type scrollData,
  type viewportResizeData,
} from '@rrweb/types';
import { buildNodeMapFromFullSnapshots, indent } from '../utils';
import type { BrowserTests } from '../types';

export const generateSeleniumTests = (
  events: Array<eventWithTime | string>,
): BrowserTests => {
  let code = '';

  code += `const { Builder, By, until } = require('selenium-webdriver');\n\n`;
  code += `describe('Generated Selenium Test from rrweb events', () => {\n`;
  code += `${indent(1)}let driver;\n\n`;
  code += `${indent(1)}beforeAll(async () => {\n`;
  code += `${indent(2)}driver = await new Builder().forBrowser('chrome').build();\n`;
  code += `${indent(1)}});\n\n`;
  code += `${indent(1)}afterAll(async () => {\n`;
  code += `${indent(2)}await driver.quit();\n`;
  code += `${indent(1)}});\n\n`;

  code += `${indent(1)}test('Replay rrweb events', async () => {\n`;

  const fullSnapshotEvents = events.filter(
    (event) => (event as eventWithTime).type === EventType.FullSnapshot,
  ) as fullSnapshotEvent[];
  const nodeMap = buildNodeMapFromFullSnapshots(fullSnapshotEvents);

  events.forEach((event: eventWithTime | string) => {
    const e = event as eventWithTime;
    switch (e.type) {
      case EventType.Meta:
        if (e.data.href) {
          code += `${indent(2)}await driver.get('${e.data.href}');\n`;
          code += `${indent(2)}await driver.wait(until.urlIs('${e.data.href}'), 5000);\n`; // Assert URL
        }
        if (e.data.width && e.data.height) {
          code += `${indent(2)}await driver.manage().window().setRect({ width: ${e.data.width}, height: ${e.data.height} });\n`;
        }
        break;

      case EventType.IncrementalSnapshot:
        const data = e.data;
        const type = data.source;
        let d;
        switch (type) {
          case IncrementalSource.MouseMove || IncrementalSource.TouchMove:
            d = data as mousemoveData;
            if (d.positions?.[0]?.x && d.positions?.[0]?.y) {
              code += `${indent(2)}await driver.actions().move({ x: ${d.positions[0].x}, y: ${d.positions[0].y} }).perform();\n`;
            }
            break;

          case IncrementalSource.MouseInteraction:
            d = data as mouseInteractionData;
            if (d.type === MouseInteractions.Click) {
              const clickNode = nodeMap.get(d.id);
              const selector = clickNode?.attributes?.id
                ? `#${clickNode?.attributes?.id}`
                : clickNode?.attributes?.class
                  ? `.${clickNode?.attributes?.class}`
                  : `${clickNode?.tagName}`;
              code += `${indent(2)}await driver.findElement(By.css('${selector}')).click();\n`;
            }
            break;

          case IncrementalSource.Scroll:
            d = data as scrollData;
            if (d.x && d.y) {
              const elementId = nodeMap.get(d.id)?.attributes?.id || '';
              code += `${indent(2)}await driver.executeScript('document.querySelector("[id=${elementId}]").scrollTo(${d.x}, ${d.y});');\n`;
            }
            break;

          case IncrementalSource.ViewportResize:
            d = data as viewportResizeData;
            if (d.width && d.height) {
              code += `${indent(2)}await driver.manage().window().setRect({ width: ${d.width}, height: ${d.height} });\n`;
            }
            break;

          case IncrementalSource.Input:
            d = data as inputData;
            if (d.text) {
              const elementId = nodeMap.get(d.id)?.attributes?.id || '';
              code += `${indent(2)}const input = await driver.findElement(By.css('#${elementId}'));\n`;
              code += `${indent(2)}await input.clear();\n`;
              code += `${indent(2)}await input.sendKeys('${d.text}');\n`;
            }
            break;

          case IncrementalSource.MediaInteraction:
            d = data as mediaInteractionData;
            if (d.type) {
              const elementId = nodeMap.get(d.id)?.attributes?.id || '';
              code += `${indent(2)}await driver.executeScript('document.querySelector("[id=${elementId}]").${d.type}();');\n`;
            }
            break;
        }
        break;

      default:
        break;
    }
  });

  code += `${indent(1)}});\n`;
  code += `});\n`;

  const browserTests: BrowserTests = {
    toCode: () => {
      return code;
    },
  };

  return browserTests;
};
