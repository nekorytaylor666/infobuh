import { Axiom } from '@axiomhq/js';

let axiomClient: Axiom | null = null;

// Initialize Axiom client
export function initializeAxiom() {
    const apiToken = process.env.AXIOM_TOKEN;
    const orgId = process.env.AXIOM_ORG_ID;

    if (!apiToken) {
        console.warn('AXIOM_TOKEN not found in environment variables. Logging to console only.');
        return null;
    }

    try {
        axiomClient = new Axiom({
            token: apiToken,
            orgId: orgId, // Optional, only needed for some configurations
        });
        console.log('✅ Axiom client initialized successfully');
        return axiomClient;
    } catch (error) {
        console.error('❌ Failed to initialize Axiom client:', error);
        return null;
    }
}

export interface LogEvent {
    timestamp: string;
    method: string;
    path: string;
    status: number;
    duration_ms: number;
    user_id?: string;
    query_params?: Record<string, string>;
    request_body?: any;
    response_body?: any;
    ip_address?: string;
    user_agent?: string;
    error?: string;
    log_level: 'info' | 'warn' | 'error';
}

export async function logToAxiom(event: LogEvent, dataset: string = 'api-logs') {
    // Always log to console for development
    const consoleMessage = formatConsoleLog(event);
    console.log(consoleMessage);

    // Send to Axiom if client is available
    if (axiomClient) {
        try {
            await axiomClient.ingest(dataset, [event]);
        } catch (error) {
            console.error('Failed to send log to Axiom:', error);
            // Don't throw - we don't want logging to break the application
        }
    }
}

function formatConsoleLog(event: LogEvent): string {
    const logParts: string[] = [];

    // Basic request info
    logParts.push(`${event.method} ${event.path} ${event.status} ${event.duration_ms}ms`);

    // User info
    if (event.user_id) {
        logParts.push(`user:${event.user_id.slice(0, 8)}`);
    }

    // Query parameters (compact format)
    if (event.query_params && Object.keys(event.query_params).length > 0) {
        const queryString = new URLSearchParams(event.query_params).toString();
        logParts.push(`query:${queryString}`);
    }

    // Request body
    if (event.request_body) {
        if (typeof event.request_body === 'string') {
            logParts.push(`body:${event.request_body}`);
        } else {
            logParts.push(`body:${JSON.stringify(event.request_body)}`);
        }
    }

    // Response body (for errors or important endpoints)
    if (event.response_body) {
        if (typeof event.response_body === 'string') {
            logParts.push(`response:${event.response_body}`);
        } else {
            const responseStr = JSON.stringify(event.response_body);
            if (responseStr.length > 200) {
                logParts.push(`response:${responseStr.substring(0, 200)}...`);
            } else {
                logParts.push(`response:${responseStr}`);
            }
        }
    }

    // Error info
    if (event.error) {
        logParts.push(`error:${event.error}`);
    }

    return logParts.join(' | ');
}

// Batch logging for high-volume scenarios
export class AxiomBatchLogger {
    private events: LogEvent[] = [];
    private batchSize: number;
    private flushInterval: number;
    private intervalId: NodeJS.Timeout | null = null;

    constructor(batchSize = 100, flushIntervalMs = 5000) {
        this.batchSize = batchSize;
        this.flushInterval = flushIntervalMs;
        this.startAutoFlush();
    }

    async log(event: LogEvent, dataset: string = 'api-logs') {
        // Always log to console immediately
        const consoleMessage = formatConsoleLog(event);
        console.log(consoleMessage);

        // Add to batch for Axiom
        if (axiomClient) {
            this.events.push(event);

            if (this.events.length >= this.batchSize) {
                await this.flush(dataset);
            }
        }
    }

    async flush(dataset: string = 'api-logs') {
        if (this.events.length === 0 || !axiomClient) return;

        const eventsToSend = [...this.events];
        this.events = [];

        try {
            await axiomClient.ingest(dataset, eventsToSend);
        } catch (error) {
            console.error('Failed to send batch logs to Axiom:', error);
        }
    }

    private startAutoFlush() {
        this.intervalId = setInterval(() => {
            this.flush().catch(console.error);
        }, this.flushInterval);
    }

    async destroy() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        await this.flush();
    }
}

// Initialize on module load
initializeAxiom(); 