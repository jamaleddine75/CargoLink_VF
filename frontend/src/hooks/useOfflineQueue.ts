import { useEffect, useState, useCallback } from 'react';
import { openDB, IDBPDatabase } from 'idb';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import axios from 'axios';
import apiClient from '@/api/client';
const DB_NAME = 'CargoLinkOffline';
const STORE_NAME = 'mutations';
const DB_VERSION = 1;

export interface QueuedMutation {
  id?: number;
  url: string;
  method: string;
  data: unknown;
  headers?: unknown;
  timestamp: number;
  status: 'PENDING' | 'SYNCING' | 'FAILED';
}

export const useOfflineQueue = () => {
  const queryClient = useQueryClient();
  const [isReplaying, setIsReplaying] = useState(false);
  const [queueCount, setQueueCount] = useState(0);

  const initDB = useCallback(async () => {
    return openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
      },
    });
  }, []);

  const updateQueueCount = useCallback(async () => {
    const db = await initDB();
    const count = await db.count(STORE_NAME);
    setQueueCount(count);
  }, [initDB]);

  const queueMutation = async (mutation: Omit<QueuedMutation, 'timestamp' | 'status'>) => {
    const db = await initDB();
    await db.add(STORE_NAME, {
      ...mutation,
      timestamp: Date.now(),
      status: 'PENDING'
    });
    await updateQueueCount();
    toast.info("📡 Action enregistrée localement (Hors ligne)");
  };

  const replayQueue = useCallback(async () => {
    if (!navigator.onLine || isReplaying) return;
    
    const db = await initDB();
    const mutations: QueuedMutation[] = await db.getAll(STORE_NAME);
    
    if (mutations.length === 0) {
        setIsReplaying(false);
        return;
    }

    setIsReplaying(true);
    let successCount = 0;

    for (const m of mutations) {
      try {
        // Convert FormData if it was stored as an object or handle it
        const requestData = m.data;
        
        // Note: Simple objects are fine, but files need special handling in IDB
        // For this task, we assume JSON data or that the user handles complex types
        
        await apiClient({
          url: m.url,
          method: m.method,
          data: requestData,
          headers: {
            ...m.headers,
            'X-Offline-Sync': 'true'
          }
        });

        await db.delete(STORE_NAME, m.id!);
        successCount++;
      } catch (e) {
        console.error("Failed to sync mutation", m, e);
        // Keep in queue for next try
      }
    }

    if (successCount > 0) {
      toast.success(`✅ ${successCount} actions synchronisées`);
      queryClient.invalidateQueries();
    }
    
    await updateQueueCount();
    setIsReplaying(false);
  }, [initDB, isReplaying, queryClient, updateQueueCount]);

  useEffect(() => {
    updateQueueCount();
    
    const handleOnline = () => {
        toast.info("Connexion rétablie, synchronisation...");
        replayQueue();
    };
    
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [replayQueue, updateQueueCount]);

  // Helper for React Query mutations
  const handleMutationError = (error: unknown, variables: unknown, context: unknown, mutationInfo: { url: string, method: string }) => {
    const isNetworkError = !navigator.onLine || error.message === 'Network Error' || error.code === 'ERR_NETWORK';
    
    if (isNetworkError) {
      queueMutation({
        url: mutationInfo.url,
        method: mutationInfo.method,
        data: variables,
        headers: axios.defaults.headers.common
      });
      return true; // Handled
    }
    return false; // Not a network error
  };

  return { 
    queueMutation, 
    replayQueue, 
    isReplaying, 
    queueCount,
    handleMutationError
  };
};
