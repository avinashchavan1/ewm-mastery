import { useSeo } from '../lib/seo';

const base = import.meta.env.BASE_URL || '/';
const href = (file: string) => `${base}templates/${file}`.replace(/\/{2,}/g, '/');

const TEMPLATES = [
  {
    file: 'EWM_Defect_Tracker.xlsx',
    name: 'Defect Tracker',
    size: '33 KB',
    desc: 'Log defects across build/test/hypercare — severity, status, root-cause category, owner, and SLA aging. The backbone of any EWM support handover.',
  },
  {
    file: 'EWM_Incident_Summary_Dashboard.xlsx',
    name: 'Incident Summary Dashboard',
    size: '16 KB',
    desc: 'Roll incidents up by process area and priority with ready-made pivots and charts — the weekly one-pager for service reviews.',
  },
  {
    file: 'EWM_Incident_Governance_Report.xlsx',
    name: 'Governance Report',
    size: '10 KB',
    desc: 'Steering-committee view: trend lines, top offenders, preventive actions, and open-risk register for monthly governance.',
  },
];

export default function Templates() {
  useSeo({
    title: 'SAP EWM Excel Templates — Defect Tracker, Dashboards',
    description:
      'Three free SAP EWM support Excel templates: a Defect Tracker, an Incident Summary Dashboard, and a Governance Report. Download and adapt — no login.',
    path: '/templates',
  });
  return (
    <div className="mx-auto max-w-shell px-4 py-8 pb-24 sm:px-6 lg:pb-16">
      <h1 className="text-[28px] font-bold leading-8 tracking-tight">Templates</h1>
      <p className="mt-1 max-w-2xl text-sm text-text2">
        Three ready-to-use Excel workbooks for running EWM support the way these incidents were
        tracked. Free to download and adapt — no attribution required.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {TEMPLATES.map((t) => (
          <div key={t.file} className="flex flex-col rounded-card border border-border bg-surface p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-card bg-primary-tint text-lg text-primary">
              ▦
            </div>
            <h2 className="text-base font-semibold">{t.name}</h2>
            <p className="mt-1 flex-1 text-[13.5px] leading-5 text-text2">{t.desc}</p>
            <a
              href={href(t.file)}
              download={t.file}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-control bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary no-underline transition-colors hover:bg-primary-strong"
            >
              Download .xlsx
              <span className="font-mono text-[11px] opacity-80">{t.size}</span>
            </a>
          </div>
        ))}
      </div>

      <p className="mt-6 text-[12.5px] text-text3">
        Files are served from this site — nothing is uploaded or tracked.
      </p>
    </div>
  );
}
