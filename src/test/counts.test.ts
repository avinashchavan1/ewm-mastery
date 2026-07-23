import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { DayQA, Incident, Meta } from '../types';

const read = <T>(p: string): T =>
  JSON.parse(readFileSync(resolve(process.cwd(), 'public/content', p), 'utf-8')) as T;

const meta = read<Meta>('meta.json');
const incidents = read<Incident[]>('incidents.json');
const days = read<DayQA[]>('qa.json');

// Contract: JSON volumes must match meta.json exactly (26 / 21 / 630).
describe('data contract counts', () => {
  it('has 26 incidents matching meta', () => {
    expect(meta.incidents).toBe(26);
    expect(incidents).toHaveLength(26);
  });

  it('has 21 days matching meta', () => {
    expect(meta.days).toBe(21);
    expect(days).toHaveLength(21);
  });

  it('has 630 questions matching meta and 30 per day', () => {
    const total = days.reduce((n, d) => n + d.questions.length, 0);
    expect(meta.totalQuestions).toBe(630);
    expect(total).toBe(630);
    for (const d of days) {
      expect(d.questions).toHaveLength(30);
      expect(d.questionCount).toBe(30);
    }
  });

  it('gives every incident and question a unique id', () => {
    expect(new Set(incidents.map((i) => i.id)).size).toBe(26);
    const qids = days.flatMap((d) => d.questions.map((q) => q.id));
    expect(new Set(qids).size).toBe(630);
  });
});
