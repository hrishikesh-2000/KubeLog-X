import React from 'react';
import { X, Sparkles, Terminal, AlertTriangle, CheckCircle } from 'lucide-react';
import { AIAnalysisResult } from '../types';

interface AIAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: AIAnalysisResult | null;
  isLoading: boolean;
}

const AIAnalysisModal: React.FC<AIAnalysisModalProps> = ({ isOpen, onClose, result, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-800/50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">Gemini Log Analysis</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-400 animate-pulse">Analyzing log patterns...</p>
            </div>
          ) : result ? (
            <div className="space-y-6">
              
              {/* Summary */}
              <div className="bg-gray-800/40 rounded-lg p-4 border border-gray-700/50">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-1">Summary</h3>
                <p className="text-white text-lg">{result.summary}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Root Cause */}
                <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2 text-red-400">
                        <AlertTriangle className="w-4 h-4" />
                        <h3 className="font-semibold">Likely Root Cause</h3>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">{result.rootCause}</p>
                </div>

                {/* Suggested Fix */}
                <div className="bg-green-950/20 border border-green-900/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2 text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <h3 className="font-semibold">Suggested Fix</h3>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">{result.suggestedFix}</p>
                </div>
              </div>

              {/* Kubectl Command */}
              {result.kubectlCommand && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
                    <Terminal className="w-4 h-4" /> Recommended Action
                  </h3>
                  <div className="bg-black rounded-lg p-3 border border-gray-700 font-mono text-sm text-green-400 overflow-x-auto">
                    {result.kubectlCommand}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
                No analysis available.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-800/50 border-t border-gray-800 flex justify-end">
            <button 
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md text-sm font-medium transition"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default AIAnalysisModal;