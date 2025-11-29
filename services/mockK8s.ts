import { Pod, LogEntry, LogLevel, Namespace } from '../types';
import { NAMESPACES } from '../constants';

// Helper to generate random ID
const uuid = () => Math.random().toString(36).substring(2, 9);

// Mock Pods Data
const MOCK_PODS: Pod[] = [
  { id: 'p1', name: 'auth-service-7d8b9c4f-x2z9a', namespace: 'finance-backend', status: 'Running', restarts: 0, age: '2d', cpu: '120m', memory: '256Mi' },
  { id: 'p2', name: 'auth-service-7d8b9c4f-h4k2l', namespace: 'finance-backend', status: 'Running', restarts: 0, age: '2d', cpu: '115m', memory: '240Mi' },
  { id: 'p3', name: 'payment-processor-5f6a2b-9q1w2', namespace: 'finance-backend', status: 'CrashLoopBackOff', restarts: 12, age: '15m', cpu: '0m', memory: '0Mi' },
  { id: 'p4', name: 'frontend-web-6c7d8e9f-p0o9i', namespace: 'frontend-app', status: 'Running', restarts: 1, age: '5h', cpu: '45m', memory: '120Mi' },
  { id: 'p5', name: 'redis-master-0', namespace: 'default', status: 'Running', restarts: 0, age: '10d', cpu: '200m', memory: '512Mi' },
  { id: 'p6', name: 'coredns-559b5db4d7-4k2l1', namespace: 'kube-system', status: 'Running', restarts: 0, age: '15d', cpu: '20m', memory: '45Mi' },
];

export const fetchNamespaces = async (): Promise<Namespace[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(NAMESPACES.map(n => ({ name: n, status: 'Active' })));
    }, 200);
  });
};

export const fetchPods = async (namespace?: string): Promise<Pod[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (namespace && namespace !== 'all') {
        resolve(MOCK_PODS.filter(p => p.namespace === namespace));
      } else {
        resolve(MOCK_PODS);
      }
    }, 300);
  });
};

// Log Generator for "Streaming" effect
const LOG_MESSAGES = {
  INFO: ['Received request GET /api/v1/users', 'Health check passed', 'Updating cache...', 'Transaction committed', 'Job scheduled'],
  WARN: ['High memory usage detected', 'Response time > 500ms', 'Deprecation warning: API v1 is sunsetting'],
  ERROR: [
    'Connection refused to database:5432',
    'NullPointerException at Service.process(Service.java:45)',
    'Timeout waiting for downstream service',
    'Fatal error: Out of memory (OOMKilled)',
    'Failed to mount volume "pvc-123": timeouts'
  ],
  DEBUG: ['Payload: { user_id: 123 }', 'Parsing config file...', 'Variable dump: foo=bar']
};

export const generateLogEntry = (pod: Pod): LogEntry => {
  let level = LogLevel.INFO;
  const rand = Math.random();

  if (pod.status === 'CrashLoopBackOff' || pod.status === 'Error') {
    if (rand > 0.3) level = LogLevel.ERROR;
    else if (rand > 0.1) level = LogLevel.WARN;
  } else {
    if (rand > 0.95) level = LogLevel.ERROR;
    else if (rand > 0.85) level = LogLevel.WARN;
    else if (rand > 0.7) level = LogLevel.DEBUG;
  }

  const messages = LOG_MESSAGES[level];
  const message = messages[Math.floor(Math.random() * messages.length)];

  return {
    id: uuid(),
    timestamp: new Date().toISOString(),
    level,
    message: `[${pod.name}] ${message}`,
    podId: pod.id
  };
};