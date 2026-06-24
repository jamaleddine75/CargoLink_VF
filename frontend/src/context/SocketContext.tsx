import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
// @ts-ignore - ignoring JS imports in TS for now
import stompClient from '../services/websocket/stompClient';

interface SocketContextType {
  connected: boolean;
  connectionId: number;
  subscribe: (topic: string, callback: (message: any) => void) => any;
  send: (topic: string, payload: any) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [connectionId, setConnectionId] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (user && token) {
      stompClient.connect(
        token,
        () => {
          setConnected(true);
          setConnectionId(prev => prev + 1);
        },
        () => setConnected(false)
      );
    } else {
      if (typeof stompClient.disconnect === 'function') {
        stompClient.disconnect();
      }
      setConnected(false);
    }

    return () => {
      if (typeof stompClient.disconnect === 'function') {
        stompClient.disconnect();
      }
    };
  }, [user]);

  const subscribe = useCallback((topic: string, callback: (message: any) => void) => {
    return stompClient.subscribe(topic, callback);
  }, []);

  const send = useCallback((topic: string, payload: any) => {
    if (stompClient.client && stompClient.client.connected) {
      stompClient.client.publish({ destination: topic, body: JSON.stringify(payload) });
    }
  }, []);

  return (
    <SocketContext.Provider value={{ connected, connectionId, subscribe, send }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
