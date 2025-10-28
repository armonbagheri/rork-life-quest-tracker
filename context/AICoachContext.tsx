import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AICoachMessage, CategoryType } from '@/types';
import { AI_COACH_LEVELS } from '@/constants/aiCoach';

const AI_COACH_STORAGE_KEY = '@lifequest_ai_coach';

export const [AICoachProvider, useAICoach] = createContextHook(() => {
  const [messages, setMessages] = useState<AICoachMessage[]>([]);
  const [coachLevel, setCoachLevel] = useState<1 | 2 | 3 | 4>(2);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCoachData() {
      try {
        const stored = await AsyncStorage.getItem(AI_COACH_STORAGE_KEY);
        if (stored) {
          const data = JSON.parse(stored);
          setMessages(data.messages || []);
          setCoachLevel(data.coachLevel || 2);
        }
      } catch (error) {
        console.error('Failed to load AI coach data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadCoachData();
  }, []);

  const saveCoachData = useCallback(async (newMessages: AICoachMessage[], level: number) => {
    try {
      await AsyncStorage.setItem(
        AI_COACH_STORAGE_KEY,
        JSON.stringify({ messages: newMessages, coachLevel: level })
      );
      setMessages(newMessages);
      setCoachLevel(level as 1 | 2 | 3 | 4);
    } catch (error) {
      console.error('Failed to save AI coach data:', error);
    }
  }, []);

  const addMessage = useCallback(async (
    content: string,
    type: AICoachMessage['type'],
    questId?: string,
    category?: CategoryType
  ) => {
    const newMessage: AICoachMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      content,
      type,
      timestamp: new Date().toISOString(),
      questId,
      category,
    };

    const updatedMessages = [newMessage, ...messages].slice(0, 50);
    await saveCoachData(updatedMessages, coachLevel);
  }, [messages, coachLevel, saveCoachData]);









  const upgradeCoach = useCallback(async (newLevel: 1 | 2 | 3 | 4) => {
    await saveCoachData(messages, newLevel);
  }, [messages, saveCoachData]);

  const currentLevel = useMemo(
    () => AI_COACH_LEVELS.find(l => l.level === coachLevel),
    [coachLevel]
  );



  return useMemo(() => ({
    messages,
    coachLevel,
    currentLevel,
    isLoading,
    addMessage,
    upgradeCoach,
    availableLevels: AI_COACH_LEVELS,
  }), [messages, coachLevel, currentLevel, isLoading, addMessage, upgradeCoach]);
});
