import type { Incident, Priority } from '../types';
import { groupFor, PRIORITY_ORDER, type Group } from '../data/groups';

export interface IncidentFilter {
  group?: Group | null;
  area?: string | null;
  pris?: Priority[];
  q?: string;
}

// Pure incident filter + priority sort. Shared by the Incidents page and tests.
// Full-text query spans id + title + description + rootCause + tcodes.
export function filterIncidents(incidents: Incident[], f: IncidentFilter): Incident[] {
  const { group, area, pris = [], q = '' } = f;
  const ql = q.trim().toLowerCase();
  return incidents
    .filter(
      (i) =>
        (!group || groupFor(i.processArea) === group) &&
        (!area || i.processArea === area) &&
        (pris.length === 0 || pris.includes(i.priority)) &&
        (!ql ||
          `${i.id} ${i.title} ${i.description} ${i.rootCause} ${i.tcodes.join(' ')}`
            .toLowerCase()
            .includes(ql)),
    )
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || a.id.localeCompare(b.id));
}
