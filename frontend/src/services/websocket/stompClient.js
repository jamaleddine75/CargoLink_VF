import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { WS_BASE_URL } from '../../utils/constants';

class StompService {
  constructor() {
    this.client = null;
    this.token = null;
    this.nextId = 0;
    // id → { topic, callback }  — the queue that survives reconnects
    this.subscriptionRegistry = new Map();
    // id → active STOMP subscription object
    this.activeSubscriptions = new Map();
  }

  connect(token, onConnect, onError) {
    if (this.client?.active) return;

    this.token = token || localStorage.getItem('token');

    if (!WS_BASE_URL) {
      console.error('[WebSocket] WS_BASE_URL is not defined.');
      return;
    }

    this.client = new Client({
      webSocketFactory: () => {
        const normalizedUrl = WS_BASE_URL.trim().replace(/\/+$/, '');
        let sockJsUrl = normalizedUrl.replace(/^ws/, 'http');
        sockJsUrl = sockJsUrl.replace(/([^:]\/)\/+/g, '$1');
        console.log('[WebSocket] Connecting via SockJS to:', sockJsUrl);
        return new SockJS(sockJsUrl);
      },

      beforeConnect: () => {
        const t = localStorage.getItem('token') || this.token;
        if (t) {
          this.client.connectHeaders = { Authorization: `Bearer ${t}` };
        }
      },

      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = (frame) => {
      console.log('[WebSocket] Connected:', frame.headers['user-name'] || 'User');
      // Re-establish every queued subscription after each (re)connect
      this.activeSubscriptions.clear();
      for (const [id, { topic, callback }] of this.subscriptionRegistry) {
        this._doSubscribe(id, topic, callback);
      }
      if (onConnect) onConnect(frame);
    };

    this.client.onStompError = (frame) => {
      console.error('[WebSocket] STOMP Error:', frame.body);
      if (onError) onError(frame);
    };

    this.client.onWebSocketClose = () => {
      console.log('[WebSocket] Connection closed');
      this.activeSubscriptions.clear();
      if (onError) onError();
    };

    this.client.activate();
  }

  _doSubscribe(id, topic, callback) {
    try {
      const stompSub = this.client.subscribe(topic, (message) => {
        try {
          callback(JSON.parse(message.body));
        } catch {
          callback(message.body);
        }
      });
      this.activeSubscriptions.set(id, stompSub);
      console.log('[WebSocket] Subscribed to:', topic, '(id:', id, ')');
    } catch (error) {
      console.warn('[WebSocket] Subscribe failed for topic:', topic, error);
    }
  }

  // Returns a stable handle with unsubscribe().
  // Safe to call before connection is established — queued and auto-applied on connect.
  subscribe(topic, callback) {
    const id = ++this.nextId;
    this.subscriptionRegistry.set(id, { topic, callback });

    if (this.client?.connected) {
      this._doSubscribe(id, topic, callback);
    } else {
      console.log('[WebSocket] Queued subscription for:', topic, '(id:', id, ')');
    }

    return {
      unsubscribe: () => {
        this.subscriptionRegistry.delete(id);
        const stompSub = this.activeSubscriptions.get(id);
        if (stompSub) {
          try { stompSub.unsubscribe(); } catch { /* already gone */ }
          this.activeSubscriptions.delete(id);
        }
        console.log('[WebSocket] Unsubscribed id:', id, 'topic:', topic);
      },
    };
  }

  unsubscribe(topic) {
    for (const [id, entry] of this.subscriptionRegistry) {
      if (entry.topic === topic) {
        this.subscriptionRegistry.delete(id);
        const stompSub = this.activeSubscriptions.get(id);
        if (stompSub) {
          try { stompSub.unsubscribe(); } catch { /* ignore */ }
          this.activeSubscriptions.delete(id);
        }
      }
    }
  }

  disconnect() {
    if (this.client) {
      this.subscriptionRegistry.clear();
      this.activeSubscriptions.clear();
      this.client.deactivate();
      console.log('[WebSocket] Client deactivated');
    }
  }
}

export default new StompService();
