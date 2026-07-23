import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Incident } from '../types';
import { AREA_TO_GROUP, GROUP_ORDER, groupFor } from '../data/groups';

const incidents = JSON.parse(
  readFileSync(resolve(process.cwd(), 'public/content/incidents.json'), 'utf-8'),
) as Incident[];

// ux/03 grouping: 26 process areas → 7 parents; counts 4/4/7/3/3/2/3.
describe('process-area grouping', () => {
  it('maps every incident processArea to a known group', () => {
    for (const i of incidents) {
      expect(groupFor(i.processArea), `unmapped area: ${i.processArea}`).toBeDefined();
    }
  });

  it('has exactly 7 parent groups', () => {
    expect(GROUP_ORDER).toHaveLength(7);
    expect(new Set(Object.values(AREA_TO_GROUP)).size).toBe(7);
  });

  it('matches the expected per-group incident counts', () => {
    const counts: Record<string, number> = {};
    for (const i of incidents) counts[groupFor(i.processArea)!] = (counts[groupFor(i.processArea)!] ?? 0) + 1;
    expect(counts).toEqual({
      'Integration & Master Data': 4,
      Inbound: 4,
      Outbound: 7,
      'RF & Resources': 3,
      'Inventory & Internal': 3,
      'Output & Printing': 2,
      'Automation, Yard & Technical': 3,
    });
  });
});
