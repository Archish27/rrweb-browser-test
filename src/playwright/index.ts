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
  type mutationData,
  type scrollData,
  type viewportResizeData,
} from '@rrweb/types';
import { buildNodeMapFromFullSnapshots, indent } from '../utils';

export const generatePlaywrightTests = (
  events: Array<eventWithTime | string>,
): string => {
  let code = '';

  code += `import { test, expect } from '@playwright/test';\n\n`;
  code += `test('Generated Playwright Test from rrweb events with tabs', async ({ page, context }) => {\n`;

  const fullSnapshotEvents = events.filter(
    (event) => (event as eventWithTime).type === EventType.FullSnapshot,
  ) as fullSnapshotEvent[];
  const nodeMap = buildNodeMapFromFullSnapshots(fullSnapshotEvents);

  code += `${indent(2)}const newTab = await context.newPage();\n`;

  events.forEach((event: eventWithTime | string) => {
    const e = event as eventWithTime;
    switch (e.type) {
      case EventType.Meta:
        if (e.data.href) {
          code += `${indent(2)}await page.goto('${e.data.href}');\n`;
          code += `${indent(2)}await expect(page).toHaveURL('${e.data.href}');\n`;
        }
        if (e.data.width && e.data.height) {
          code += `${indent(2)}await page.setViewportSize({ width: ${e.data.width}, height: ${e.data.height} });\n`;
          code += `${indent(2)}await expect(page).toHaveViewportSize({ width: ${e.data.width}, height: ${e.data.height} });\n`; // Assert viewport size
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
              const id = clickNode?.attributes?.id
                ? `#${clickNode?.attributes?.id}`
                : clickNode?.tagName === 'nav'
                  ? `${clickNode?.tagName}:text-is("${clickNode.childNodes
                      ?.filter((f) => f.tagName === 'a')
                      ?.map((node) =>
                        node.childNodes?.map(
                          (n1) => (n1 as any)?.['textContent'],
                        ),
                      )
                      .join(' ')}")`
                  : `${clickNode?.tagName}.${clickNode?.attributes?.class}`;

              if (d.x && d.y) {
                code += `${indent(2)}await page.locator(\`${id}\`).click();\n`;
                code += `${indent(2)}await expect(page.locator(\`${id}\`)).toBeVisible();\n`; // Assert visibility after click
              }
              break;
            }
            break;

          case IncrementalSource.Scroll:
            d = data as scrollData;
            if (d.x && d.y) {
              code += `${indent(2)}await page.mouse.wheel(() => { document.querySelector('[data-id="${nodeMap.get(d.id)?.attributes?.id}"]').scrollTo(${d.x}, ${d.y}); });\n`;
              code += `${indent(2)}await expect(page.locator('[data-id="${nodeMap.get(d.id)?.attributes?.id}"]')).toBeVisible();\n`; // Assert element visibility after scroll
            }
            break;

          case IncrementalSource.ViewportResize:
            d = data as viewportResizeData;
            if (d.width && d.height) {
              code += `${indent(2)}await page.setViewportSize({ width: ${d.width}, height: ${d.height} });\n`;
              code += `${indent(2)}await expect(page).toHaveViewportSize({ width: ${d.width}, height: ${d.height} });\n`; // Assert viewport size
            }
            break;

          case IncrementalSource.Input:
            d = data as inputData;
            if (d.text) {
              code += `${indent(2)}await page.fill('[data-id="${nodeMap.get(d.id)?.attributes?.id}"]', '${d.text}');\n`;
              code += `${indent(2)}await expect(page.locator('[data-id="${nodeMap.get(d.id)?.attributes?.id}"]')).toHaveValue('${d.text}');\n`; // Assert input value
            }
            break;

          case IncrementalSource.MediaInteraction:
            d = data as mediaInteractionData;
            if (d.type) {
              code += `${indent(2)}await page.$eval('[data-id="${nodeMap.get(d.id)?.attributes?.id}"]', el => el.${d.type}());\n`;
              code += `${indent(2)}await expect(page.locator('[data-id="${nodeMap.get(d.id)?.attributes?.id}"]')).toBeVisible();\n`; // Assert visibility of the media element
            }
            break;
        }
        break;

      default:
        break;
    }
  });

  code += `${indent(1)}});\n`;

  return code;
};
