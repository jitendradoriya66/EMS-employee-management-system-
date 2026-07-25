export type SocketEventCallback = (data: any) => void;

class ChatSocketManager {
  private socket: WebSocket | null = null;
  private url: string = '';
  private listeners: Map<string, Set<SocketEventCallback>> = new Map();
  private reconnectInterval: number = 3000;
  private isConnecting: boolean = false;
  private reconnectTimer: any = null;

  constructor() {
    let wsUrl = import.meta.env.VITE_WS_URL || '';
    let apiUrl = import.meta.env.VITE_API_URL || '';
    let host = '';
    
    if (wsUrl && wsUrl.length > 5 && (wsUrl.includes('.') || wsUrl.includes('/') || wsUrl.includes(':'))) {
      if (wsUrl.startsWith('ws://') || wsUrl.startsWith('wss://')) {
        this.url = wsUrl.endsWith('/') ? wsUrl : `${wsUrl}/`;
        return;
      }
      host = wsUrl;
    } else if (apiUrl && apiUrl.length > 5) {
      host = apiUrl;
    }
    
    if (host) {
      host = host.replace(/^https:/i, 'wss:').replace(/^http:/i, 'ws:');
      if (!host.startsWith('ws://') && !host.startsWith('wss://')) {
        const isSecure = window.location.protocol === 'https:';
        host = (isSecure ? 'wss://' : 'ws://') + host;
      }
      this.url = host.endsWith('/') ? `${host}ws/communication/chat/` : `${host}/ws/communication/chat/`;
    } else {
      const isSecure = window.location.protocol === 'https:';
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        this.url = isSecure ? 'wss://localhost:8000/ws/communication/chat/' : 'ws://localhost:8000/ws/communication/chat/';
      } else {
        this.url = isSecure ? `wss://${window.location.host}/ws/communication/chat/` : `ws://${window.location.host}/ws/communication/chat/`;
      }
    }
    
    this.url = this.url.replace(/([^:]\/)\/+/g, "$1");
  }

  public connect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    if (this.isConnecting) return;
    this.isConnecting = true;

    const storage = localStorage.getItem('access_token') ? localStorage : sessionStorage;
    const token = storage.getItem('access_token');
    
    if (!token) {
      this.isConnecting = false;
      return;
    }

    const fullUrl = `${this.url}?token=${token}`;
    this.socket = new WebSocket(fullUrl);

    this.socket.onopen = () => {
      this.isConnecting = false;
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      this.triggerEvent('status', { status: 'connected' });
    };

    this.socket.onclose = () => {
      this.isConnecting = false;
      this.socket = null;
      this.triggerEvent('status', { status: 'disconnected' });
      
      // Auto reconnect
      this.reconnectTimer = setTimeout(() => {
        this.connect();
      }, this.reconnectInterval);
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket Error:', error);
      this.triggerEvent('status', { status: 'error', error });
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type) {
          this.triggerEvent(data.type, data);
        }
      } catch (e) {
        console.error('Error parsing WebSocket message:', e);
      }
    };
  }

  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  public on(event: string, callback: SocketEventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return off subscription function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  public send(data: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket not connected. Unable to send:', data);
    }
  }

  public sendTyping(conversationId: string, isTyping: boolean): void {
    this.send({
      type: 'typing',
      conversation_id: conversationId,
      is_typing: isTyping
    });
  }

  public sendReadReceipt(conversationId: string, messageId: string): void {
    this.send({
      type: 'read_receipt',
      conversation_id: conversationId,
      message_id: messageId
    });
  }

  private triggerEvent(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error(`Error in callback for event ${event}:`, e);
        }
      });
    }
  }
}

export const socketManager = new ChatSocketManager();
