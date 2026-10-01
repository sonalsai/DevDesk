import { describe, it, expect, vi } from 'vitest';
import { WebSocketManager } from '../src/services/webSocketManager';
import { SseManager } from '../src/services/sseManager';

describe('Unit Test: Real-Time Stream Managers (WebSocket & SSE)', () => {
  describe('WebSocketManager', () => {
    it('strictly validates protocol and rejects invalid URLs', () => {
      const onStatus = vi.fn();
      const onMsg = vi.fn();
      const manager = new WebSocketManager({ onStatusChange: onStatus, onMessage: onMsg });

      manager.connect('http://localhost:8080');
      expect(onStatus).toHaveBeenCalledWith('error', expect.stringContaining('ws:// or wss://'));
      expect(onMsg).toHaveBeenCalledWith(
        expect.objectContaining({ direction: 'system', error: 'Invalid protocol' })
      );
    });

    it('supports multiple event listeners with clean unsubscription', () => {
      const manager = new WebSocketManager();
      const listenerA = vi.fn();
      const listenerB = vi.fn();

      const unsubA = manager.onMessage(listenerA);
      const unsubB = manager.onMessage(listenerB);

      // Trigger a protocol error which dispatches a system message
      manager.connect('invalid-url');
      expect(listenerA).toHaveBeenCalledTimes(1);
      expect(listenerB).toHaveBeenCalledTimes(1);

      // Unsubscribe listenerA
      unsubA();
      listenerA.mockClear();
      listenerB.mockClear();

      manager.connect('invalid-url-2');
      expect(listenerA).not.toHaveBeenCalled();
      expect(listenerB).toHaveBeenCalledTimes(1);

      unsubB();
    });

    it('safely handles send() when socket is not open', () => {
      const manager = new WebSocketManager();
      const result = manager.send(JSON.stringify({ action: 'ping' }));
      expect(result).toBe(false);
    });
  });

  describe('SseManager', () => {
    it('strictly validates protocol and rejects non-http URLs', () => {
      const onStatus = vi.fn();
      const onEvent = vi.fn();
      const sse = new SseManager({ onStatusChange: onStatus, onEvent: onEvent });

      sse.connect('ws://localhost:9000/stream');
      expect(onStatus).toHaveBeenCalledWith('error', expect.stringContaining('http:// or https://'));
      expect(onEvent).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'system', data: expect.stringContaining('http:// or https://') })
      );
    });

    it('supports subscriber registration and unsubscription for event stream', () => {
      const sse = new SseManager();
      const listener = vi.fn();
      const unsub = sse.onEvent(listener);

      sse.connect('invalid-sse-url');
      expect(listener).toHaveBeenCalled();

      unsub();
      listener.mockClear();
      sse.connect('invalid-sse-url-2');
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
