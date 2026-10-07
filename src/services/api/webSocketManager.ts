import type { WsMessage, WsConnectionStatus } from '../../types/api';

export const MAX_WS_MESSAGES = 250;

export interface WsManagerCallbacks {
  onStatusChange?: (status: WsConnectionStatus, details?: string, latencyMs?: number) => void;
  onMessage?: (message: WsMessage) => void;
}

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string = '';
  private protocols: string[] = [];
  private callbacks?: WsManagerCallbacks;
  private connectStartTime: number = 0;
  private reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;

  private messageListeners: Set<(msg: WsMessage) => void> = new Set();
  private statusListeners: Set<(status: WsConnectionStatus, latencyMs?: number) => void> = new Set();

  constructor(callbacks?: WsManagerCallbacks) {
    this.callbacks = callbacks;
  }

  public onMessage(callback: (msg: WsMessage) => void): () => void {
    this.messageListeners.add(callback);
    return () => {
      this.messageListeners.delete(callback);
    };
  }

  public onStatusChange(callback: (status: WsConnectionStatus, latencyMs?: number) => void): () => void {
    this.statusListeners.add(callback);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  private dispatchMessage(msg: WsMessage): void {
    this.callbacks?.onMessage?.(msg);
    this.messageListeners.forEach((listener) => {
      try {
        listener(msg);
      } catch (err) {
        console.error('Error in WS message listener:', err);
      }
    });
  }

  private dispatchStatus(status: WsConnectionStatus, details?: string, latencyMs?: number): void {
    if (latencyMs !== undefined) {
      this.callbacks?.onStatusChange?.(status, details, latencyMs);
    } else if (details !== undefined) {
      this.callbacks?.onStatusChange?.(status, details);
    } else {
      this.callbacks?.onStatusChange?.(status);
    }

    this.statusListeners.forEach((listener) => {
      try {
        listener(status, latencyMs);
      } catch (err) {
        console.error('Error in WS status listener:', err);
      }
    });
  }

  public connect(url: string, protocols: string[] = []): void {
    this.disconnect();
    this.url = url.trim();
    this.protocols = protocols;

    if (!this.url.startsWith('ws://') && !this.url.startsWith('wss://')) {
      this.dispatchStatus('error', 'URL must begin with ws:// or wss://');
      this.dispatchMessage({
        id: `sys-${Date.now()}`,
        direction: 'system',
        data: 'Invalid protocol: Connection URL must start with ws:// or wss://',
        timestamp: new Date().toISOString(),
        error: 'Invalid protocol',
      });
      return;
    }

    this.dispatchStatus('connecting');
    this.dispatchMessage({
      id: `sys-${Date.now()}`,
      direction: 'system',
      data: `Connecting to ${this.url}...`,
      timestamp: new Date().toISOString(),
    });

    this.connectStartTime = performance.now();

    try {
      this.ws = protocols.length > 0 ? new WebSocket(this.url, protocols) : new WebSocket(this.url);

      this.ws.onopen = () => {
        const elapsed = Math.round(performance.now() - this.connectStartTime);
        this.dispatchStatus('connected', undefined, elapsed);
        this.dispatchMessage({
          id: `sys-${Date.now()}`,
          direction: 'system',
          data: `Connected to ${this.url} (${elapsed}ms handshake)`,
          timestamp: new Date().toISOString(),
        });
      };

      this.ws.onmessage = (event: MessageEvent) => {
        const isBinary = typeof event.data !== 'string';
        const dataStr = isBinary ? `[Binary Data: ${event.data.size || event.data.byteLength || 0} bytes]` : event.data;
        const sizeBytes = isBinary ? (event.data.size || event.data.byteLength || 0) : new Blob([dataStr]).size;

        this.dispatchMessage({
          id: `msg-in-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          direction: 'in',
          data: dataStr,
          timestamp: new Date().toISOString(),
          isBinary,
          sizeBytes,
        });
      };

      this.ws.onerror = () => {
        this.dispatchStatus('error', 'WebSocket error event occurred');
        this.dispatchMessage({
          id: `sys-${Date.now()}`,
          direction: 'error',
          data: 'Connection error encountered. Either server is unreachable or refused connection.',
          timestamp: new Date().toISOString(),
          error: 'Connection error',
        });
      };

      this.ws.onclose = (event: CloseEvent) => {
        this.dispatchStatus('disconnected');
        this.dispatchMessage({
          id: `sys-${Date.now()}`,
          direction: 'system',
          data: `Connection closed (Code: ${event.code}${event.reason ? ` - ${event.reason}` : ''})`,
          timestamp: new Date().toISOString(),
        });
        this.ws = null;
      };
    } catch (err: any) {
      this.dispatchStatus('error', err.message);
      this.dispatchMessage({
        id: `sys-${Date.now()}`,
        direction: 'error',
        data: `Failed to initiate WebSocket connection: ${err.message}`,
        timestamp: new Date().toISOString(),
        error: err.message,
      });
      this.ws = null;
    }
  }

  public send(payload: string): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.dispatchMessage({
        id: `sys-${Date.now()}`,
        direction: 'error',
        data: 'Cannot send message: WebSocket is not in OPEN state',
        timestamp: new Date().toISOString(),
        error: 'Socket not open',
      });
      return false;
    }

    try {
      this.ws.send(payload);
      const sizeBytes = new Blob([payload]).size;

      this.dispatchMessage({
        id: `msg-out-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        direction: 'out',
        data: payload,
        timestamp: new Date().toISOString(),
        sizeBytes,
      });
      return true;
    } catch (err: any) {
      this.dispatchMessage({
        id: `sys-${Date.now()}`,
        direction: 'error',
        data: `Failed to send payload: ${err.message}`,
        timestamp: new Date().toISOString(),
        error: err.message,
      });
      return false;
    }
  }

  public disconnect(): void {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    const wasConnected = this.ws !== null;
    if (this.ws) {
      this.ws.close(1000, 'Client disconnected');
      this.ws = null;
    }
    if (wasConnected) {
      this.dispatchStatus('disconnected');
    }
  }

  public clearHistory(): void {
    // History is managed in client state, method provided for interface completeness
  }

  public reconnect(): void {
    if (this.url) {
      this.disconnect();
      this.connect(this.url, this.protocols);
    }
  }
}

export const webSocketManager = new WebSocketManager();
