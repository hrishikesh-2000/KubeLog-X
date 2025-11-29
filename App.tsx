import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import LogViewer from './components/LogViewer';
import AIAnalysisModal from './components/AIAnalysisModal';
import { fetchNamespaces, fetchPods, generateLogEntry } from './services/mockK8s';
import { analyzeLogsWithGemini } from './services/geminiService';
import { CLUSTERS } from './constants';
import { Namespace, Pod, LogEntry, AIAnalysisResult } from './types';

function App() {
  // --- State ---
  const [selectedCluster, setSelectedCluster] = useState<string>(CLUSTERS[0].id);
  const [selectedNamespace, setSelectedNamespace] = useState<string>('all');
  const [selectedPod, setSelectedPod] = useState<Pod | null>(null);
  
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [pods, setPods] = useState<Pod[]>([]);
  
  // Log State
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  
  // AI State
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);

  // --- Effects ---

  // Initial Data Load
  useEffect(() => {
    const loadData = async () => {
      const ns = await fetchNamespaces();
      setNamespaces(ns);
      const ps = await fetchPods('all');
      setPods(ps);
    };
    loadData();
  }, []);

  // Filter Pods when Namespace changes
  useEffect(() => {
    const updatePods = async () => {
      setPods([]); // clear momentarily to show loading if we had a loading state
      const ps = await fetchPods(selectedNamespace);
      setPods(ps);
      // Deselect pod if it's no longer in the list
      if (selectedPod && !ps.find(p => p.id === selectedPod.id)) {
        setSelectedPod(null);
        setLogs([]);
        setIsStreaming(false);
      }
    };
    updatePods();
  }, [selectedNamespace, selectedPod]);

  // Streaming Logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isStreaming && selectedPod) {
      interval = setInterval(() => {
        const newLog = generateLogEntry(selectedPod);
        setLogs(prev => {
           // Keep buffer limited to 500 lines
           const newLogs = [...prev, newLog];
           if (newLogs.length > 500) return newLogs.slice(newLogs.length - 500);
           return newLogs;
        });
      }, 800); // New log every 800ms
    }

    return () => clearInterval(interval);
  }, [isStreaming, selectedPod]);

  // --- Handlers ---

  const handlePodSelect = (pod: Pod) => {
    if (selectedPod?.id === pod.id) return;
    
    setSelectedPod(pod);
    setLogs([]); // Clear logs when switching
    setIsStreaming(true); // Auto start streaming
    
    // Simulate initial fetch of historical logs (last 10 lines)
    const initialLogs = Array.from({ length: 10 }).map(() => generateLogEntry(pod));
    // Sort by timestamp if we were generating real times, but here order of creation matches
    setLogs(initialLogs);
  };

  const handleAIAnalyze = async () => {
    if (!selectedPod || logs.length === 0) return;
    
    setIsAIModalOpen(true);
    setIsAnalyzing(true);
    setAiResult(null);

    // Take last 50 logs for context
    const recentLogs = logs.slice(-50);
    
    const result = await analyzeLogsWithGemini(recentLogs);
    
    setAiResult(result);
    setIsAnalyzing(false);
  };

  return (
    <div className="flex h-screen w-screen bg-black text-white overflow-hidden font-sans">
      
      {/* Sidebar */}
      <Sidebar 
        clusters={CLUSTERS}
        namespaces={namespaces}
        pods={pods}
        selectedCluster={selectedCluster}
        selectedNamespace={selectedNamespace}
        selectedPodId={selectedPod?.id || null}
        onSelectCluster={setSelectedCluster}
        onSelectNamespace={setSelectedNamespace}
        onSelectPod={handlePodSelect}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full min-w-0">
        <LogViewer 
          selectedPod={selectedPod}
          logs={logs}
          isStreaming={isStreaming}
          onToggleStream={() => setIsStreaming(!isStreaming)}
          onClear={() => setLogs([])}
          onAnalyze={handleAIAnalyze}
        />
      </main>

      {/* Modals */}
      <AIAnalysisModal 
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        result={aiResult}
        isLoading={isAnalyzing}
      />

    </div>
  );
}

export default App;