
import { Pod, Namespace, Cluster } from '../types';
import { CLUSTERS } from '../constants';

const API_BASE = '/api';

export const fetchNamespaces = async (): Promise<Namespace[]> => {
  try {
    const res = await fetch(`${API_BASE}/namespaces`);
    if (!res.ok) throw new Error('Failed to fetch namespaces');
    return await res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const fetchPods = async (namespace?: string): Promise<Pod[]> => {
  try {
    const url = namespace && namespace !== 'all' 
      ? `${API_BASE}/pods?namespace=${namespace}`
      : `${API_BASE}/pods`;
      
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch pods');
    return await res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
};

// We don't need a fetchLogs function anymore because we use SSE directly in the component
// But we keep the clusters constant for now as the backend currently only supports "local"
export const getClusters = (): readonly Cluster[] => {
    return CLUSTERS; 
};
