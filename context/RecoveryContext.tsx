import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RecoveryItem, RecoveryLog } from '@/types';

const RECOVERY_STORAGE_KEY = '@lifequest_recovery';

export const [RecoveryProvider, useRecovery] = createContextHook(() => {
  const [recoveryItems, setRecoveryItems] = useState<RecoveryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRecoveryData() {
      try {
        const stored = await AsyncStorage.getItem(RECOVERY_STORAGE_KEY);
        if (stored) {
          setRecoveryItems(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Failed to load recovery data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadRecoveryData();
  }, []);

  const saveRecoveryData = useCallback(async (items: RecoveryItem[]) => {
    try {
      await AsyncStorage.setItem(RECOVERY_STORAGE_KEY, JSON.stringify(items));
      setRecoveryItems(items);
    } catch (error) {
      console.error('Failed to save recovery data:', error);
    }
  }, []);

  const calculateStreak = useCallback((logs: RecoveryLog[], startDate: string): number => {
    if (logs.length === 0) {
      const start = new Date(startDate);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - start.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }

    const sortedLogs = [...logs].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const lastLog = sortedLogs[0];
    if (lastLog.type === 'relapse') {
      const relapseDate = new Date(lastLog.timestamp);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - relapseDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }

    let streak = 0;
    let lastRelapseDate: Date | null = null;

    for (const log of sortedLogs) {
      if (log.type === 'relapse') {
        lastRelapseDate = new Date(log.timestamp);
        break;
      }
    }

    const referenceDate = lastRelapseDate || new Date(startDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - referenceDate.getTime());
    streak = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return streak;
  }, []);

  const calculateLongestStreak = useCallback((logs: RecoveryLog[], startDate: string): number => {
    if (logs.length === 0) {
      return calculateStreak(logs, startDate);
    }

    const sortedLogs = [...logs].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    let longestStreak = 0;
    let currentStreakStart = new Date(startDate);

    for (const log of sortedLogs) {
      if (log.type === 'relapse') {
        const streakEnd = new Date(log.timestamp);
        const diffTime = Math.abs(streakEnd.getTime() - currentStreakStart.getTime());
        const streak = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        longestStreak = Math.max(longestStreak, streak);
        currentStreakStart = streakEnd;
      }
    }

    const now = new Date();
    const diffTime = Math.abs(now.getTime() - currentStreakStart.getTime());
    const currentStreak = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    longestStreak = Math.max(longestStreak, currentStreak);

    return longestStreak;
  }, [calculateStreak]);

  const calculateTotalDays = useCallback((startDate: string): number => {
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }, []);

  const addRecoveryItem = useCallback(async (name: string, description?: string) => {
    const newItem: RecoveryItem = {
      id: `recovery-${Date.now()}-${Math.random()}`,
      name,
      description,
      startDate: new Date().toISOString(),
      logs: [],
      currentStreak: 0,
      longestStreak: 0,
      totalDays: 0,
      relapseCount: 0,
    };

    const updatedItems = [...recoveryItems, newItem];
    await saveRecoveryData(updatedItems);
    return newItem;
  }, [recoveryItems, saveRecoveryData]);

  const logRelapse = useCallback(async (itemId: string, note?: string) => {
    const item = recoveryItems.find(i => i.id === itemId);
    if (!item) return;

    const newLog: RecoveryLog = {
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      type: 'relapse',
      note,
    };

    const updatedLogs = [...item.logs, newLog];
    const currentStreak = calculateStreak(updatedLogs, item.startDate);
    const longestStreak = calculateLongestStreak(updatedLogs, item.startDate);
    const totalDays = calculateTotalDays(item.startDate);
    const relapseCount = updatedLogs.filter(l => l.type === 'relapse').length;

    const updatedItem: RecoveryItem = {
      ...item,
      logs: updatedLogs,
      currentStreak,
      longestStreak,
      totalDays,
      relapseCount,
    };

    const updatedItems = recoveryItems.map(i => i.id === itemId ? updatedItem : i);
    await saveRecoveryData(updatedItems);
  }, [recoveryItems, saveRecoveryData, calculateStreak, calculateLongestStreak, calculateTotalDays]);

  const logSuccess = useCallback(async (itemId: string, note?: string) => {
    const item = recoveryItems.find(i => i.id === itemId);
    if (!item) return;

    const newLog: RecoveryLog = {
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      type: 'success',
      note,
    };

    const updatedLogs = [...item.logs, newLog];
    const currentStreak = calculateStreak(updatedLogs, item.startDate);
    const longestStreak = calculateLongestStreak(updatedLogs, item.startDate);
    const totalDays = calculateTotalDays(item.startDate);

    const updatedItem: RecoveryItem = {
      ...item,
      logs: updatedLogs,
      currentStreak,
      longestStreak,
      totalDays,
    };

    const updatedItems = recoveryItems.map(i => i.id === itemId ? updatedItem : i);
    await saveRecoveryData(updatedItems);
  }, [recoveryItems, saveRecoveryData, calculateStreak, calculateLongestStreak, calculateTotalDays]);

  const deleteRecoveryItem = useCallback(async (itemId: string) => {
    const updatedItems = recoveryItems.filter(i => i.id !== itemId);
    await saveRecoveryData(updatedItems);
  }, [recoveryItems, saveRecoveryData]);

  const updateRecoveryItem = useCallback(async (itemId: string, updates: Partial<RecoveryItem>) => {
    const updatedItems = recoveryItems.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    );
    await saveRecoveryData(updatedItems);
  }, [recoveryItems, saveRecoveryData]);

  const updateStreaksForAllItems = useCallback(() => {
    return recoveryItems.map(item => {
      const currentStreak = calculateStreak(item.logs, item.startDate);
      const longestStreak = calculateLongestStreak(item.logs, item.startDate);
      const totalDays = calculateTotalDays(item.startDate);
      return {
        ...item,
        currentStreak,
        longestStreak,
        totalDays,
      };
    });
  }, [recoveryItems, calculateStreak, calculateLongestStreak, calculateTotalDays]);

  const updatedRecoveryItems = useMemo(() => {
    return updateStreaksForAllItems();
  }, [updateStreaksForAllItems]);

  return useMemo(() => ({
    recoveryItems: updatedRecoveryItems,
    isLoading,
    addRecoveryItem,
    logRelapse,
    logSuccess,
    deleteRecoveryItem,
    updateRecoveryItem,
  }), [updatedRecoveryItems, isLoading, addRecoveryItem, logRelapse, logSuccess, deleteRecoveryItem, updateRecoveryItem]);
});
