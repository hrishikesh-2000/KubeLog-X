
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import LogViewer from './components/LogViewer';
import AIAnalysisModal from './components/AIAnalysisModal';
import { fetchNamespaces, fetchPods, getClusters } from './services/k8sService';
import { analyzeLogsWithGemini } from './services/geminiService';
import { Namespace, Pod, LogEntry, AIAnalysisResult, LogLevel } from './types';

function App() {
  // --- State ---
  const [selectedCluster, setSelectedCluster] = useState<string>('c1');
  const [selectedNamespace, setSelectedNamespace] = useState<string>('all');
  const [selectedPod, setSelectedPod] = useState<Pod | null>(null);
  
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [pods, setPods] = useState<Pod[]>([]);
  
  // Log State
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  
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
    
    // Refresh Pod list every 10 seconds to catch status changes
    const interval = setInterval(async () => {
        const ps = await fetchPods(selectedNamespace);
        setPods(ps);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Filter Pods when Namespace changes
  useEffect(() => {
    const updatePods = async () => {
      // Don't clear pods immediately to avoid flicker
      const ps = await fetchPods(selectedNamespace);
      setPods(ps);
      
      // If selected pod is gone (e.g. deleted), deselect it
      if (selectedPod && !ps.find(p => p.id === selectedPod.id)) {
        // Optional: Keep viewing logs of dead pod? For now, we clear.
        // setSelectedPod(null); 
      }
    };
    updatePods();
  }, [selectedNamespace]);

  // Streaming Logic (Real SSE)
  useEffect(() => {
    // Cleanup previous stream
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (isStreaming && selectedPod) {
      const url = `/api/logs/stream?namespace=${selectedPod.namespace}&pod=${selectedPod.name}`;
      console.log("Connecting to stream:", url);
      
      const evtSource = new EventSource(url);
      eventSourceRef.current = evtSource;

      evtSource.onmessage = (event) => {
        try {
          const newEntry: Partial<LogEntry> = JSON.parse(event.data);
          
          // Naive level parser since K8s raw logs are just strings usually
          let level = LogLevel.INFO;
          const msgUpper = newEntry.message?.toUpperCase() || '';
          if (msgUpper.includes('ERROR') || msgUpper.includes('EXCEPTION')) level = LogLevel.ERROR;
          else if (msgUpper.includes('WARN')) level = LogLevel.WARN;
          else if (msgUpper.includes('DEBUG')) level = LogLevel.DEBUG;

          const logWithId: LogEntry = {
            id: Math.random().toString(36).substring(2, 9),
            timestamp: newEntry.timestamp || new Date().toISOString(),
            message: newEntry.message || '',
            level: level,
            podId: selectedPod.id
          };

          setLogs(prev => {
             const newLogs = [...prev, logWithId];
             // Limit buffer to 1000 lines
             if (newLogs.length > 1000) return newLogs.slice(newLogs.length - 1000);
             return newLogs;
          });
        } catch (e) {
          console.error("Error parsing log event", e);
        }
      };

      evtSource.onerror = (err) => {
        console.error("EventSource failed:", err);
        evtSource.close();
        setIsStreaming(false); // Stop UI toggle
      };
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [isStreaming, selectedPod]);

  // --- Handlers ---

  const handlePodSelect = (pod: Pod) => {
    if (selectedPod?.id === pod.id) return;
    
    setSelectedPod(pod);
    setLogs([]); // Clear logs when switching
    setIsStreaming(true); // Auto start streaming on select
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
        clusters={getClusters()}
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
