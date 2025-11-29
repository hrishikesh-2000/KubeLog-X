export const GEMINI_MODEL_FLASH = 'gemini-2.5-flash';

// Simulated latency for "network" calls
export const SIMULATED_LATENCY_MS = 400;

export const CLUSTERS = [
  { id: 'c1', name: 'production-us-east-1', status: 'active', version: 'v1.28.2' },
  { id: 'c2', name: 'staging-eu-west', status: 'active', version: 'v1.29.0' },
  { id: 'c3', name: 'dev-cluster-local', status: 'error', version: 'v1.27.5' },
] as const;

export const NAMESPACES = [
  'default',
  'kube-system',
  'ingress-nginx',
  'finance-backend',
  'frontend-app',
  'monitoring'
];