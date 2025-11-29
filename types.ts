export interface Cluster {
  id: string;
  name: string;
  status: 'active' | 'connecting' | 'error';
  version: string;
}

export interface Namespace {
  name: string;
  status: 'Active' | 'Terminating';
}

export interface Pod {
  id: string;
  name: string;
  namespace: string;
  status: 'Running' | 'Pending' | 'CrashLoopBackOff' | 'Error' | 'Completed';
  restarts: number;
  age: string;
  cpu?: string;
  memory?: string;
}

export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
  UNKNOWN = 'UNKNOWN'
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  podId: string;
}

export interface AIAnalysisResult {
  summary: string;
  rootCause: string;
  suggestedFix: string;
  kubectlCommand?: string;
  isAnalyzing: boolean;
}

export type ViewMode = 'dashboard' | 'logs';