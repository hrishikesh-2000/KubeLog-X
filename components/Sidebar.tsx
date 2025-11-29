import React, { useState } from 'react';
import { Cluster, Namespace, Pod } from '../types';
import { 
  Server, 
  Layers, 
  Box, 
  Activity, 
  Search, 
  Filter,
  AlertCircle
} from 'lucide-react';

interface SidebarProps {
  clusters: readonly Cluster[];
  namespaces: Namespace[];
  pods: Pod[];
  selectedCluster: string;
  selectedNamespace: string;
  selectedPodId: string | null;
  onSelectCluster: (id: string) => void;
  onSelectNamespace: (ns: string) => void;
  onSelectPod: (pod: Pod) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  clusters,
  namespaces,
  pods,
  selectedCluster,
  selectedNamespace,
  selectedPodId,
  onSelectCluster,
  onSelectNamespace,
  onSelectPod
}) => {
  const [podSearch, setPodSearch] = useState('');

  const filteredPods = pods.filter(p => 
    p.name.toLowerCase().includes(podSearch.toLowerCase())
  );

  return (
    <div className="w-80 bg-[#161b22] flex flex-col h-full border-r border-gray-800">
      
      {/* App Header */}
      <div className="h-14 flex items-center px-4 border-b border-gray-800">
        <div className="flex items-center gap-2 text-indigo-400 font-bold tracking-tight">
          <Activity className="w-6 h-6" />
          <span className="text-white text-lg">KubeLog-X</span>
        </div>
      </div>

      {/* Cluster Select */}
      <div className="p-4 space-y-4">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Cluster</label>
          <div className="relative">
            <Server className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select 
              value={selectedCluster}
              onChange={(e) => onSelectCluster(e.target.value)}
              className="w-full bg-gray-900 text-gray-200 text-sm rounded border border-gray-700 pl-9 pr-3 py-2 focus:ring-1 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
            >
              {clusters.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Namespace Select */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Namespace</label>
          <div className="relative">
            <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select 
              value={selectedNamespace}
              onChange={(e) => onSelectNamespace(e.target.value)}
              className="w-full bg-gray-900 text-gray-200 text-sm rounded border border-gray-700 pl-9 pr-3 py-2 focus:ring-1 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
            >
              <option value="all">All Namespaces</option>
              {namespaces.map(ns => (
                <option key={ns.name} value={ns.name}>{ns.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Pod List Header */}
      <div className="px-4 pb-2">
         <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pods ({filteredPods.length})</label>
            <Filter className="w-3 h-3 text-gray-600 cursor-pointer hover:text-gray-400" />
         </div>
         <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
            <input 
              type="text" 
              placeholder="Filter pods..." 
              value={podSearch}
              onChange={(e) => setPodSearch(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded text-xs text-gray-300 py-1.5 pl-8 pr-2 focus:border-indigo-500 outline-none"
            />
         </div>
      </div>

      {/* Scrollable Pod List */}
      <div className="flex-1 overflow-y-auto scrollbar-dark px-2 pb-2 space-y-0.5">
        {filteredPods.map(pod => (
          <button
            key={pod.id}
            onClick={() => onSelectPod(pod)}
            className={`w-full flex flex-col gap-1 p-2 rounded-md text-left transition group ${
              selectedPodId === pod.id 
                ? 'bg-indigo-600/10 border border-indigo-500/30' 
                : 'hover:bg-gray-800 border border-transparent'
            }`}
          >
            <div className="flex items-center justify-between w-full">
               <span className={`text-sm font-medium truncate w-40 ${selectedPodId === pod.id ? 'text-indigo-300' : 'text-gray-300'}`}>
                 {pod.name}
               </span>
               {pod.status !== 'Running' && (
                 <AlertCircle className="w-3 h-3 text-red-500" />
               )}
            </div>
            <div className="flex items-center gap-2">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-mono uppercase ${
                    pod.status === 'Running' ? 'bg-green-900/30 text-green-400' : 
                    pod.status === 'CrashLoopBackOff' ? 'bg-red-900/30 text-red-400' : 'bg-gray-800 text-gray-400'
                }`}>
                    {pod.status}
                </span>
                <span className="text-[10px] text-gray-600">{pod.namespace}</span>
            </div>
          </button>
        ))}
      </div>

      {/* User / Auth Footer (Mock) */}
      <div className="p-4 border-t border-gray-800 bg-gray-900/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
            JD
          </div>
          <div className="flex flex-col">
             <span className="text-xs font-medium text-white">John Doe</span>
             <span className="text-[10px] text-gray-500">DevOps Engineer</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Sidebar;