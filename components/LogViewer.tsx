import React, { useEffect, useRef, useState } from 'react';
import { LogEntry, LogLevel, Pod } from '../types';
import { Play, Pause, Download, Trash2, Search, BrainCircuit } from 'lucide-react';

interface LogViewerProps {
  selectedPod: Pod | null;
  logs: LogEntry[];
  isStreaming: boolean;
  onToggleStream: () => void;
  onClear: () => void;
  onAnalyze: () => void;
}

const LogViewer: React.FC<LogViewerProps> = ({ 
  selectedPod, 
  logs, 
  isStreaming, 
  onToggleStream, 
  onClear,
  onAnalyze
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [filterText, setFilterText] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto-scroll logic
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  // Handle manual scroll detection to disable autoscroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const atBottom = scrollHeight - scrollTop === clientHeight;
    if (atBottom) setAutoScroll(true);
    else if (autoScroll) setAutoScroll(false);
  };

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case LogLevel.INFO: return 'text-blue-400';
      case LogLevel.WARN: return 'text-yellow-400';
      case LogLevel.ERROR: return 'text-red-500 font-bold';
      case LogLevel.DEBUG: return 'text-gray-500';
      default: return 'text-gray-300';
    }
  };

  const filteredLogs = logs.filter(log => 
    log.message.toLowerCase().includes(filterText.toLowerCase())
  );

  if (!selectedPod) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900/50 text-gray-500 border-l border-gray-800">
        <div className="text-center">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Select a pod to view logs</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0d1117] border-l border-gray-800">
      
      {/* Log Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-900">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
             <div className={`w-2 h-2 rounded-full ${selectedPod.status === 'Running' ? 'bg-green-500' : 'bg-red-500'}`}></div>
             <span className="font-mono text-sm font-semibold text-gray-200">{selectedPod.name}</span>
          </div>
          <span className="px-2 py-0.5 rounded text-xs bg-gray-800 text-gray-400 border border-gray-700">{selectedPod.namespace}</span>
        </div>

        <div className="flex items-center gap-2">
            <div className="relative group">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input 
                    type="text" 
                    placeholder="Grep logs..." 
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className="pl-9 pr-3 py-1.5 bg-gray-950 border border-gray-700 rounded text-sm text-gray-200 focus:outline-none focus:border-indigo-500 w-48 transition-all focus:w-64"
                />
            </div>
            
            <div className="h-6 w-px bg-gray-700 mx-2"></div>

            <button 
                onClick={onToggleStream}
                className={`p-1.5 rounded transition ${isStreaming ? 'text-yellow-400 hover:bg-yellow-400/10' : 'text-green-400 hover:bg-green-400/10'}`}
                title={isStreaming ? "Pause Stream" : "Resume Stream"}
            >
                {isStreaming ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            <button 
                onClick={onClear} 
                className="p-1.5 rounded text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition"
                title="Clear Logs"
            >
                <Trash2 className="w-4 h-4" />
            </button>

            <button 
                className="p-1.5 rounded text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 transition"
                title="Download Logs"
            >
                <Download className="w-4 h-4" />
            </button>
            
            <div className="h-6 w-px bg-gray-700 mx-2"></div>

            <button
                onClick={onAnalyze}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded shadow-lg shadow-indigo-500/20 transition-all hover:scale-105"
            >
                <BrainCircuit className="w-4 h-4" />
                <span>Analyze</span>
            </button>
        </div>
      </div>

      {/* Terminal View */}
      <div 
        className="flex-1 overflow-y-auto font-mono text-sm p-4 space-y-1 scrollbar-dark"
        onScroll={handleScroll}
      >
        {filteredLogs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-600">
                <span className="italic">Waiting for logs...</span>
            </div>
        ) : (
            filteredLogs.map((log) => (
            <div key={log.id} className="flex gap-3 hover:bg-gray-800/30 -mx-4 px-4 py-0.5 group">
                <span className="text-gray-600 select-none shrink-0 w-36 text-xs pt-0.5">{log.timestamp.split('T')[1].replace('Z','')}</span>
                <span className={`shrink-0 w-12 font-bold text-xs pt-0.5 ${getLevelColor(log.level)}`}>{log.level}</span>
                <span className="text-gray-300 break-all whitespace-pre-wrap">{log.message}</span>
            </div>
            ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Status Footer */}
      <div className="bg-gray-900 border-t border-gray-800 px-4 py-1 flex justify-between text-xs text-gray-500">
        <span>Showing {filteredLogs.length} lines</span>
        <span className={isStreaming ? "text-green-500 flex items-center gap-1" : "text-yellow-500 flex items-center gap-1"}>
            <span className={`w-1.5 h-1.5 rounded-full ${isStreaming ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></span>
            {isStreaming ? 'Live' : 'Paused'}
        </span>
      </div>
    </div>
  );
};

export default LogViewer;