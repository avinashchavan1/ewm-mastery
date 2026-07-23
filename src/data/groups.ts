// Process-area grouping — ground truth: ux/03-information-architecture.md.
// 26 processArea values → 7 parent groups. UI-layer mapping only; JSON untouched.

export const GROUP_ORDER = [
  'Integration & Master Data',
  'Inbound',
  'Outbound',
  'RF & Resources',
  'Inventory & Internal',
  'Output & Printing',
  'Automation, Yard & Technical',
] as const;

export type Group = (typeof GROUP_ORDER)[number];

// processArea (exact JSON string) → parent group.
export const AREA_TO_GROUP: Record<string, Group> = {
  // Integration & Master Data (4)
  'ERP-EWM Integration': 'Integration & Master Data',
  'Master Data / CIF': 'Integration & Master Data',
  'Stock Reconciliation': 'Integration & Master Data',
  'Quality Management Integration': 'Integration & Master Data',
  // Inbound (4)
  'Inbound / Putaway': 'Inbound',
  'Inbound / Configuration': 'Inbound',
  'Inbound / POSC': 'Inbound',
  'Inbound / Corrections': 'Inbound',
  // Outbound (7)
  'Outbound / Wave Management': 'Outbound',
  'Outbound / Stock Types': 'Outbound',
  'Outbound / Delivery Processing': 'Outbound',
  'Outbound / WOCR': 'Outbound',
  'Outbound / Serial Numbers': 'Outbound',
  'Outbound / Kitting & VAS': 'Outbound',
  'Outbound / Stock Removal': 'Outbound',
  // RF & Resources (3)
  'RF / Resource Management': 'RF & Resources',
  'RF / Handling Units': 'RF & Resources',
  'RF / Exception Handling': 'RF & Resources',
  // Inventory & Internal (3)
  'Physical Inventory': 'Inventory & Internal',
  'Internal Movements / Replenishment': 'Inventory & Internal',
  'Internal / Housekeeping': 'Inventory & Internal',
  // Output & Printing (2)
  'PPF / Output Management': 'Output & Printing',
  'Output / Printing': 'Output & Printing',
  // Automation, Yard & Technical (3)
  'MFS / Automation': 'Automation, Yard & Technical',
  'Yard / Shipping & Receiving': 'Automation, Yard & Technical',
  'Performance / Basis': 'Automation, Yard & Technical',
};

export function groupFor(processArea: string): Group | undefined {
  return AREA_TO_GROUP[processArea];
}

// Slug helpers for URL params (?group=outbound).
export const GROUP_SLUG: Record<Group, string> = {
  'Integration & Master Data': 'integration',
  Inbound: 'inbound',
  Outbound: 'outbound',
  'RF & Resources': 'rf',
  'Inventory & Internal': 'inventory',
  'Output & Printing': 'output',
  'Automation, Yard & Technical': 'automation',
};

export const SLUG_TO_GROUP: Record<string, Group> = Object.fromEntries(
  Object.entries(GROUP_SLUG).map(([g, s]) => [s, g as Group]),
) as Record<string, Group>;

export const PRIORITY_ORDER: Record<string, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};
