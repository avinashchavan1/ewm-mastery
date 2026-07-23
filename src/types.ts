// ── Data contract (content/*.json). Validated at startup in DataContext. ──

export type Priority = 'Critical' | 'High' | 'Medium' | 'Low';

export interface Meta {
  product: string;
  author: string;
  version: string;
  generated?: string;
  incidents: number; // 26
  days: number; // 21
  totalQuestions: number; // 630
  processAreas: string[];
  priorities: Priority[];
}

export interface Incident {
  id: string; // "EWM-001"
  number: number;
  title: string;
  priority: Priority;
  processArea: string;
  tcodes: string[];
  description: string;
  systemAnalysis: string[];
  rootCause: string;
  resolution: string[];
  prevention: string;
}

export interface Question {
  id: string; // "D01-Q01"
  question: string;
  answer: string;
}

export interface DayQA {
  day: number; // 1..21
  title: string;
  questionCount: number; // 30
  questions: Question[];
}
