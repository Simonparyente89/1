import { describe, expect, it } from 'vitest';
import { flattenText } from './sefaria';

const keys = (m: Map<string, unknown>) => Array.from(m.keys());

describe('flattenText', () => {
  it('handles a range across chapters', () => {
    const m = flattenText([['v31'], ['v1', 'v2', 'v3']], [1, 31], [2, 3]);
    expect(keys(m)).toEqual(['1:31', '2:1', '2:2', '2:3']);
  });

  it('handles a range within a chapter', () => {
    const m = flattenText(['a', 'b', 'c'], [7, 17], [7, 19]);
    expect(keys(m)).toEqual(['7:17', '7:18', '7:19']);
  });

  it('handles a single verse', () => {
    expect(keys(flattenText('only', [1, 1], [1, 1]))).toEqual(['1:1']);
  });

  it('handles whole chapters', () => {
    const m = flattenText([['a', 'b'], ['c']], [10], [11]);
    expect(keys(m)).toEqual(['10:1', '10:2', '11:1']);
    expect(keys(flattenText(['a', 'b'], [23], [23]))).toEqual(['23:1', '23:2']);
  });

  it('handles commentary (one level deeper)', () => {
    // Rashi on Genesis 1:31-2:2
    const m = flattenText([[['r1', 'r2']], [['r3'], [], ['r4']]], [1, 31], [2, 3]);
    expect(keys(m)).toEqual(['1:31:1', '1:31:2', '2:1:1', '2:3:1']);
    // Rashi on a single verse
    expect(keys(flattenText(['x', 'y'], [1, 1], [1, 1]))).toEqual(['1:1:1', '1:1:2']);
  });

  it('skips empty segments', () => {
    expect(keys(flattenText(['a', '', 'c'], [3, 1], [3, 3]))).toEqual(['3:1', '3:3']);
  });
});
