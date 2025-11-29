
import express from 'express';
import cors from 'cors';
import * as k8s from '@kubernetes/client-node';
import path from 'path';
import { fileURLToPath } from 'url';
import { PassThrough } from 'stream';
import { Buffer } from 'buffer';
import { GoogleGenAI, Type } from "@google/genai";

// Configuration
const PORT = process.env.PORT || 3001;
const isDev = process.env.NODE_ENV !== 'production';
const GEMINI_MODEL_FLASH = 'gemini-2.5-flash';

// Initialize App
const app = express();
app.use(cors());
app.use(express.json());

// Initialize Kubernetes Client
const kc = new k8s.KubeConfig();
// This automatically loads from:
// 1. KUBECONFIG env var
// 2. ~/.kube/config
// 3. In-cluster service account (if running inside a pod)
try {
    kc.loadFromDefault();
} catch (e) {
    console.error("Failed to load KubeConfig. Ensure you are running locally with ~/.kube/config or inside a cluster.", e);
}

const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
const log = new k8s.Log(kc);

// Initialize AI Client (Optional for basic usage)
// The API key is obtained exclusively from process.env.API_KEY
const apiKey = process.env.API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

if (!apiKey) {
    console.warn("⚠️ API_KEY is missing. AI features will be disabled, but Log Viewer will work.");
}

// --- API Endpoints ---

// 1. Get Namespaces
app.get('/api/namespaces', async (req, res) => {
    try {
        const response = await k8sApi.listNamespace();
        const namespaces = response.body.items.map(ns => ({
            name: ns.metadata?.name || 'unknown',
            status: ns.status?.phase || 'Unknown'
        }));
        res.json(namespaces);
    } catch (err: any) {
        console.error('Error fetching namespaces:', err);
        res.status(500).json({ error: err.message });
    }
});

// 2. Get Pods
app.get('/api/pods', async (req, res) => {
    try {
        const namespace = req.query.namespace as string;
        let response;
        
        if (!namespace || namespace === 'all') {
            response = await k8sApi.listPodForAllNamespaces();
        } else {
            response = await k8sApi.listNamespacedPod(namespace);
        }

        const pods = response.body.items.map(pod => {
            // Calculate simple age
            const startTime = pod.status?.startTime ? new Date(pod.status.startTime).getTime() : Date.now();
            const ageMs = Date.now() - startTime;
            const ageHours = Math.floor(ageMs / (1000 * 60 * 60));

            // Restart count (sum of all containers)
            const restarts = pod.status?.containerStatuses?.reduce((acc, curr) => acc + curr.restartCount, 0) || 0;

            return {
                id: pod.metadata?.uid || 'unknown',
                name: pod.metadata?.name || 'unknown',
                namespace: pod.metadata?.namespace || 'unknown',
                status: pod.status?.phase || 'Unknown',
                restarts: restarts,
                age: `${ageHours}h`,
                cpu: 'N/A', // Metrics require metrics-server, skipping for lightweight version
                memory: 'N/A'
            };
        });
        res.json(pods);
    } catch (err: any) {
        console.error('Error fetching pods:', err);
        res.status(500).json({ error: err.message });
    }
});

// 3. Stream Logs (Server-Sent Events)
app.get('/api/logs/stream', async (req, res) => {
    const namespace = req.query.namespace as string;
    const podName = req.query.pod as string;
    const container = req.query.container as string;

    if (!namespace || !podName) {
        return res.status(400).json({ error: 'Missing namespace or pod parameters' });
    }

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    console.log(`Starting log stream for ${namespace}/${podName}`);

    // Create a specialized stream to pipe k8s output to SSE format
    const logStream = new PassThrough();
    
    logStream.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n');
        lines.forEach(line => {
            if (line.trim()) {
                const logEntry = {
                    timestamp: new Date().toISOString(), // K8s logs don't always have timestamps attached unless requested, defaulting here for UI
                    message: line,
                    level: 'INFO' // Naive level detection could happen here
                };
                res.write(`data: ${JSON.stringify(logEntry)}\n\n`);
            }
        });
    });

    logStream.on('error', (err: any) => {
        console.error('Log stream error:', err);
        res.write(`event: error\ndata: ${JSON.stringify({ error: 'Stream connection lost' })}\n\n`);
        res.end();
    });

    // Abort controller to kill k8s request if client disconnects
    const abortController = new AbortController();

    req.on('close', () => {
        console.log(`Client disconnected from ${podName}`);
        abortController.abort();
    });

    try {
        await log.log(
            namespace,
            podName,
            container || '',
            logStream, 
            {
                follow: true,
                tailLines: 100,
                pretty: false,
                timestamps: false 
            }
        );
    } catch (err) {
        console.error("K8s Log API Error:", err);
        res.end();
    }
});

// 4. AI Analysis Endpoint
app.post('/api/analyze', async (req, res) => {
    try {
        const { logs } = req.body;
        
        if (!ai) {
            return res.status(503).json({ 
                summary: "AI Not Configured", 
                rootCause: "The server was started without an API_KEY.", 
                suggestedFix: "Restart the backend with export API_KEY='your_key' or set it in deployment.yaml",
                isAnalyzing: false 
            });
        }

        if (!logs || !Array.isArray(logs) || logs.length === 0) {
            return res.status(400).json({ error: "No logs provided" });
        }

        // Prepare the log content string
        const logContent = logs.map((l: any) => `${l.timestamp} [${l.level}] ${l.message}`).join('\n');

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

        res.json(JSON.parse(text));

    } catch (error: any) {
        console.error("Gemini Analysis Error:", error);
        res.status(500).json({ 
            summary: "Analysis Failed",
            rootCause: error.message || "Unknown AI Error",
            suggestedFix: "Check server logs.",
            isAnalyzing: false 
        });
    }
});

// Serve Frontend in Production
if (!isDev) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    app.use(express.static(path.join(__dirname, '../dist')));
    
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../dist', 'index.html'));
    });
}

app.listen(PORT, () => {
    console.log(`KubeLog-X Backend running on port ${PORT}`);
    console.log(`Mode: ${isDev ? 'Development' : 'Production'}`);
});
