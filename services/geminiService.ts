import { GoogleGenAI, Type } from "@google/genai";
import { LogEntry, AIAnalysisResult } from "../types";
import { GEMINI_MODEL_FLASH } from "../constants";

// Initialize the API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeLogsWithGemini = async (logs: LogEntry[]): Promise<AIAnalysisResult> => {
  if (!logs || logs.length === 0) {
    throw new Error("No logs provided for analysis.");
  }

  // Prepare the log content string
  const logContent = logs.map(l => `${l.timestamp} [${l.level}] ${l.message}`).join('\n');

  const prompt = `
    You are a Senior Site Reliability Engineer (SRE) and Kubernetes Expert.
    Analyze the following Kubernetes pod logs.
    
    Logs:
    \`\`\`
    ${logContent.substring(0, 10000)} 
    \`\`\`

    Provide a structured analysis in JSON format with the following fields:
    1. summary: A one-sentence summary of what is happening.
    2. rootCause: The likely technical root cause of the errors (if any).
    3. suggestedFix: A specific recommendation to fix the issue.
    4. kubectlCommand: A 'kubectl' command that might help debug or fix this (e.g., fetching events, describing pods, or restarting).
  `;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_FLASH,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            rootCause: { type: Type.STRING },
            suggestedFix: { type: Type.STRING },
            kubectlCommand: { type: Type.STRING },
          },
          required: ["summary", "rootCause", "suggestedFix"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini");

    return JSON.parse(text) as AIAnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      summary: "Failed to analyze logs via AI.",
      rootCause: "API Connection Error or Invalid Key",
      suggestedFix: "Check your API key configuration.",
      isAnalyzing: false,
    };
  }
};