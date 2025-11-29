
import { LogEntry, AIAnalysisResult } from "../types";

export const analyzeLogsWithGemini = async (logs: LogEntry[]): Promise<AIAnalysisResult> => {
  if (!logs || logs.length === 0) {
    throw new Error("No logs provided for analysis.");
  }

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ logs }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.rootCause || "Failed to analyze logs");
    }

    return await response.json() as AIAnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      summary: "Failed to analyze logs.",
      rootCause: error instanceof Error ? error.message : "Connection Error",
      suggestedFix: "Ensure backend is running and API Key is valid.",
      isAnalyzing: false,
    };
  }
};
