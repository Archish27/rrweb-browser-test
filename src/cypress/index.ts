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
import type { BrowserTests } from '../types';
import { buildNodeMapFromFullSnapshots, indent } from '../utils';

export const generateCypressTests = (
  events: Array<eventWithTime | string>,
): BrowserTests => {
  let code = '';

  code += `describe('Generated Cypress Test from rrweb events', () => {\n`;
  code += `  it('should replay events accurately', () => {\n`;

  const fullSnapshotEvents = events.filter(
    (event) => (event as eventWithTime).type === EventType.FullSnapshot,
  ) as fullSnapshotEvent[];
  const nodeMap = buildNodeMapFromFullSnapshots(fullSnapshotEvents);

  events.forEach((event: eventWithTime | string) => {
    const e = event as eventWithTime;
    switch (e.type) {
      case EventType.Meta:
        if (e.data.href) {
          code += `${indent(3)}cy.visit('${e.data.href}');\n`;
          code += `${indent(3)}cy.url().should('include', '${e.data.href}');\n`; // Assert URL after navigation
        }
        if (e.data.width && e.data.height) {
          code += `${indent(3)}cy.viewport(${e.data.width}, ${e.data.height});\n`;
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
              code += `${indent(3)}cy.get('body').trigger('mousemove', { clientX: ${d.positions[0].x}, clientY: ${d.positions[0].y} });\n`;
            }
            break;

          case IncrementalSource.MouseInteraction:
            d = data as mouseInteractionData;
            if (d.type === MouseInteractions.Click) {
              const clickNode = nodeMap.get(d.id);
              const id = clickNode?.attributes?.id
                ? `#${clickNode?.attributes?.id}`
                : clickNode?.tagName === 'nav'
                  ? `"${clickNode.childNodes
                      ?.filter((f) => f.tagName === 'a')
                      ?.map((node) =>
                        node.childNodes?.map(
                          (n1) => (n1 as any)?.['textContent'],
                        ),
                      )
                      .join(' ')}"`
                  : `${clickNode?.tagName}.${clickNode?.attributes?.class}`;
              if (clickNode?.tagName === 'nav') {
                code += `${indent(3)}cy.contains('${clickNode?.tagName}', ${id}).click();\n`;
              } else {
                code += `${indent(3)}cy.get('${id}').click();\n`;
              }
            }
            break;

          case IncrementalSource.Scroll:
            d = data as scrollData;
            if (d.x && d.y) {
              code += `${indent(3)}cy.get('[data-id="${nodeMap.get(d.id)?.attributes?.id}"]').scrollTo(${d.x}, ${d.y});\n`;
            }
            break;

          case IncrementalSource.ViewportResize:
            d = data as viewportResizeData;
            if (d.width && d.height) {
              code += `${indent(3)}cy.viewport(${d.width}, ${d.height});\n`;
            }
            break;

          case IncrementalSource.Input:
            d = data as inputData;
            if (d.text) {
              code += `${indent(3)}cy.get('[data-id="${nodeMap.get(d.id)?.attributes?.id}"]').type('${d.text}');\n`;
              code += `${indent(3)}cy.get('[data-id="${nodeMap.get(d.id)?.attributes?.id}"]').should('have.value', '${d.text}');\n`; // Assert input value
            }
            break;

          case IncrementalSource.MediaInteraction:
            d = data as mediaInteractionData;
            if (d.type) {
              code += `${indent(3)}cy.get('[data-id="${nodeMap.get(d.id)?.attributes?.id}"]').then((el) => el[0].${d.type}());\n`;
            }
            break;
        }
        break;

      default:
        break;
    }
  });

  code += `  });\n`;
  code += `});\n`;

  const browserTests: BrowserTests = {
    toCode: () => code,
  };

  return browserTests;
};
