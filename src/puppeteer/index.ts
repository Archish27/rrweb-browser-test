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

export const generatePuppeteerTests = (
  events: Array<eventWithTime | string>,
): string => {
  let code = '';

  code += `const puppeteer = require('puppeteer');\n\n`;
  code += `describe('TODO: name the test block', () => {\n`;
  code += `${indent(1)}let browser, page;\n\n`;
  code += `${indent(1)}beforeAll(async () => {\n`;
  code += `${indent(2)}browser = await puppeteer.launch();\n`;
  code += `${indent(2)}page = await browser.newPage();\n`;
  code += `${indent(1)}});\n\n`;
  code += `${indent(1)}afterAll(async () => {\n`;
  code += `${indent(2)}await browser.close();\n`;
  code += `${indent(1)}});\n\n`;

  code += `${indent(1)}test('TODO: name the test case', async () => {\n`;

  const fullSnapshotEvents = events.filter(
    (event) => (event as eventWithTime).type === EventType.FullSnapshot,
  ) as fullSnapshotEvent[];
  const nodeMap = buildNodeMapFromFullSnapshots(fullSnapshotEvents);

  events.forEach((event: eventWithTime | string) => {
    const e = event as eventWithTime;
    switch (e.type) {
      case EventType.Meta:
        if (e.data.href) {
          code += `${indent(2)}await page.goto('${e.data.href}');\n`;
          code += `${indent(2)}await expect(page.url()).toBe('${e.data.href}');\n`;
        }
        if (e.data.width && e.data.height) {
          code += `${indent(2)}await page.setViewport({ width: ${e.data.width}, height: ${e.data.height} });\n`;
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
              code += `${indent(2)}await page.mouse.move(${d.positions[0].x}, ${d.positions[0].y});\n`;
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
              code += `${indent(2)}await page.click('${selector}');\n`;
            }
            break;

          case IncrementalSource.Scroll:
            d = data as scrollData;
            if (d.x && d.y) {
              const elementId = nodeMap.get(d.id)?.attributes?.id || '';
              code += `${indent(2)}await page.evaluate(() => {\n`;
              code += `${indent(3)}document.querySelector('#${elementId}').scrollTo(${d.x}, ${d.y});\n`;
              code += `${indent(2)}});\n`;
            }
            break;

          case IncrementalSource.ViewportResize:
            d = data as viewportResizeData;
            if (d.width && d.height) {
              code += `${indent(2)}await page.setViewport({ width: ${d.width}, height: ${d.height} });\n`;
            }
            break;

          case IncrementalSource.Input:
            d = data as inputData;
            if (d.text) {
              const elementId = nodeMap.get(d.id)?.attributes?.id || '';
              code += `${indent(2)}await page.type('#${elementId}', '${d.text}');\n`;
            }
            break;

          case IncrementalSource.MediaInteraction:
            d = data as mediaInteractionData;
            if (d.type) {
              const elementId = nodeMap.get(d.id)?.attributes?.id || '';
              code += `${indent(2)}await page.evaluate(() => {\n`;
              code += `${indent(3)}document.querySelector('#${elementId}').${d.type}();\n`;
              code += `${indent(2)}});\n`;
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

  return code;
};
