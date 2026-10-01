import type { SseEventItem, SseConnectionStatus } from '../types/api';

export const MAX_SSE_EVENTS = 250;

export interface SseManagerCallbacks {
  onStatusChange?: (status: SseConnectionStatus, details?: string) => void;
  onEvent?: (event: SseEventItem) => void;
}

export class SseManager {
  private es: EventSource | null = null;
  private url: string = '';
  private customEventNames: string[] = [];
  private callbacks?: SseManagerCallbacks;

  private eventListeners: Set<(event: SseEventItem) => void> = new Set();
  private statusListeners: Set<(status: SseConnectionStatus) => void> = new Set();

  constructor(callbacks?: SseManagerCallbacks) {
    this.callbacks = callbacks;
  }

  public onEvent(callback: (event: SseEventItem) => void): () => void {
    this.eventListeners.add(callback);
    return () => {
      this.eventListeners.delete(callback);
    };
  }

  public onStatusChange(callback: (status: SseConnectionStatus) => void): () => void {
    this.statusListeners.add(callback);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  private dispatchEvent(event: SseEventItem): void {
    this.callbacks?.onEvent?.(event);
    this.eventListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in SSE event listener:', err);
      }
    });
  }

  private dispatchStatus(status: SseConnectionStatus, details?: string): void {
    this.callbacks?.onStatusChange?.(status, details);
    this.statusListeners.forEach((listener) => {
      try {
        listener(status);
      } catch (err) {
        console.error('Error in SSE status listener:', err);
      }
    });
  }

  public connect(url: string, customEvents: string[] = []): void {
    this.disconnect();
    this.url = url.trim();
    this.customEventNames = customEvents;

    if (!this.url.startsWith('http://') && !this.url.startsWith('https://')) {
      this.dispatchStatus('error', 'URL must begin with http:// or https://');
      this.dispatchEvent({
        id: `sys-${Date.now()}`,
        event: 'system',
        data: 'Invalid URL: SSE endpoints must begin with http:// or https://',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    this.dispatchStatus('connecting');
    this.dispatchEvent({
      id: `sys-${Date.now()}`,
      event: 'system',
      data: `Subscribing to event stream at ${this.url}...`,
      timestamp: new Date().toISOString(),
    });

    try {
      this.es = new EventSource(this.url);

      this.es.onopen = () => {
        this.dispatchStatus('connected');
        this.dispatchEvent({
          id: `sys-${Date.now()}`,
          event: 'open',
          data: `Stream connection established with ${this.url}`,
          timestamp: new Date().toISOString(),
        });
      };

      this.es.onmessage = (event: MessageEvent) => {
        this.dispatchEvent({
          id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          event: 'message',
          data: event.data,
          eventId: event.lastEventId || undefined,
          timestamp: new Date().toISOString(),
        });
      };

      this.es.onerror = () => {
        if (this.es?.readyState === EventSource.CLOSED) {
          this.dispatchStatus('disconnected');
          this.dispatchEvent({
            id: `sys-${Date.now()}`,
            event: 'system',
            data: 'SSE stream closed by server',
            timestamp: new Date().toISOString(),
          });
        } else {
          this.dispatchStatus('error');
          this.dispatchEvent({
            id: `sys-${Date.now()}`,
            event: 'error',
            data: 'Stream error or network disconnect encountered (EventSource reconnecting...)',
            timestamp: new Date().toISOString(),
          });
        }
      };

      // Register listeners for custom named events
      customEvents.forEach((evtName) => {
        if (!evtName || evtName === 'message' || evtName === 'open' || evtName === 'error') return;

        this.es?.addEventListener(evtName, (event: any) => {
          this.dispatchEvent({
            id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            event: evtName,
            data: event.data || '',
            eventId: event.lastEventId || undefined,
            timestamp: new Date().toISOString(),
          });
        });
      });
    } catch (err: any) {
      this.dispatchStatus('error', err.message);
      this.dispatchEvent({
        id: `sys-${Date.now()}`,
        event: 'error',
        data: `Failed to open EventSource: ${err.message}`,
        timestamp: new Date().toISOString(),
      });
      this.es = null;
    }
  }

  public disconnect(): void {
    const wasConnected = this.es !== null;
    if (this.es) {
      this.es.close();
      this.es = null;
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
      this.connect(this.url, this.customEventNames);
    }
  }
}

export const sseManager = new SseManager();
