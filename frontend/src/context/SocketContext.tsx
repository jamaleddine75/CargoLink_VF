import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
// @ts-expect-error - ignoring JS imports in TS for now
import stompClient from '../services/websocket/stompClient';

interface SocketContextType {
  connected: boolean;
  connectionId: number;
  subscribe: (topic: string, callback: (message: unknown) => void) => unknown;
  send: (topic: string, payload: unknown) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);
  const [connectionId, setConnectionId] = useState(0);
  const walletSubRef = useRef<{ unsubscribe: () => void } | null>(null);
  const financeSubRef = useRef<{ unsubscribe: () => void } | null>(null);

  const onConnect = useCallback(() => {
    setConnected(true);
    setConnectionId(prev => prev + 1);

    if (user?.id) {
      walletSubRef.current = stompClient.subscribe(
        '/topic/wallet/' + user.id,
        (msg: { type?: string; amount?: number; transactionType?: string }) => {
          if (msg?.type === 'WALLET_UPDATED' || msg?.type === 'BONUS_RECEIVED' || msg?.type === 'DEDUCTION_APPLIED') {
            queryClient.invalidateQueries({ queryKey: ['driver-wallet-balance'] });
            queryClient.invalidateQueries({ queryKey: ['customer-wallet-stats'] });
            queryClient.invalidateQueries({ queryKey: ['customer-wallet-transactions'] });
          }
        }
      );
    }
  }, [user?.id, queryClient]);

  const onDisconnect = useCallback(() => {
    setConnected(false);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (user && token) {
      stompClient.connect(token, onConnect, onDisconnect);
    } else {
      if (typeof stompClient.disconnect === 'function') {
        stompClient.disconnect();
      }
      setConnected(false);
    }

    return () => {
      if (walletSubRef.current) {
        walletSubRef.current.unsubscribe();
        walletSubRef.current = null;
      }
      if (financeSubRef.current) {
        financeSubRef.current.unsubscribe();
        financeSubRef.current = null;
      }
      if (typeof stompClient.disconnect === 'function') {
        stompClient.disconnect();
      }
    };
  }, [user, onConnect, onDisconnect]);

  const subscribe = useCallback((topic: string, callback: (message: unknown) => void) => {
    return stompClient.subscribe(topic, callback);
  }, []);

  const send = useCallback((topic: string, payload: unknown) => {
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
