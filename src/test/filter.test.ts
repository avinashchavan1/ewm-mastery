import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Incident } from '../types';
import { filterIncidents } from '../lib/filterIncidents';

const incidents = JSON.parse(
  readFileSync(resolve(process.cwd(), 'public/content/incidents.json'), 'utf-8'),
) as Incident[];

describe('incident filtering', () => {
  it('returns all 26 with no filters, sorted Critical-first', () => {
    const r = filterIncidents(incidents, {});
    expect(r).toHaveLength(26);
    expect(r[0].priority).toBe('Critical');
  });

  it('filters by group', () => {
    const r = filterIncidents(incidents, { group: 'Outbound' });
    expect(r).toHaveLength(7);
    expect(r.every((i) => i.processArea.startsWith('Outbound'))).toBe(true);
  });

  it('filters by priority (AND facet)', () => {
    const r = filterIncidents(incidents, { pris: ['Critical'] });
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((i) => i.priority === 'Critical')).toBe(true);
  });

  it('full-text search matches a t-code', () => {
    const r = filterIncidents(incidents, { q: 'SMQ1' });
    expect(r.length).toBeGreaterThan(0);
    expect(r.some((i) => i.tcodes.includes('SMQ1'))).toBe(true);
  });

  it('returns empty for an impossible combination', () => {
    const r = filterIncidents(incidents, { group: 'Output & Printing', pris: ['Critical'] });
    expect(r).toHaveLength(0);
  });
});
