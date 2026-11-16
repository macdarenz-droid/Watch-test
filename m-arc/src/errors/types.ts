/** 7.5: the wire shape sent to POST {workerBase}/errors. Allowlist only — see docs/ERROR-REPORTS.md. */
export type ReportKind = 'boundary' | 'onerror' | 'unhandledrejection' | 'store-save' | 'boot' | 'backup' | 'escobar-transport';

export interface Frame {
  file: string;
  line: number;
  col: number;
}

export interface Report {
  installId: string;
  ts: string;
  app: string;
  platform: 'android' | 'web';
  os?: string;
  device?: string;
  route: string;
  kind: ReportKind;
  name: string;
  message: string;
  frames: Frame[];
  sig: string;
  count: number;
}
