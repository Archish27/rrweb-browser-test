import { expect, test } from 'vitest';
import { indent } from './utils.js';

test('add', () => {
  expect(indent(2)).toBe('  ');
});
