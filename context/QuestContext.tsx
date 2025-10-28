import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Quest, CategoryType, QuestType, MicroGoal, QuestReflection } from '@/types';
import { useUser } from './UserContext';

const QUESTS_STORAGE_KEY = '@lifequest_quests';

export const [QuestProvider, useQuests] = createContextHook(() => {
  const { addXP } = useUser();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [customQuests, setCustomQuests] = useState<Quest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadQuests() {
      try {
        const stored = await AsyncStorage.getItem(QUESTS_STORAGE_KEY);
        if (stored) {
          const questData = JSON.parse(stored);
          console.log('[QuestContext] Loaded from storage:', {
            quests: questData.quests?.length || 0,
            customQuests: questData.customQuests?.length || 0
          });
          console.log('[QuestContext] Quest details:', questData.quests?.map((q: Quest) => ({ 
            id: q.id, 
            title: q.title, 
            status: q.status, 
            type: q.type 
          })));
          setQuests(questData.quests || []);
          setCustomQuests(questData.customQuests || []);
        } else {
          console.log('[QuestContext] No stored quests found - starting fresh');
        }
      } catch (error) {
        console.error('Failed to load quests:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadQuests();
  }, []);

  const saveQuests = useCallback(async (questList: Quest[], customList: Quest[]) => {
    try {
      await AsyncStorage.setItem(
        QUESTS_STORAGE_KEY,
        JSON.stringify({ quests: questList, customQuests: customList })
      );
      setQuests(questList);
      setCustomQuests(customList);
    } catch (error) {
      console.error('Failed to save quests:', error);
    }
  }, []);



  const completeMilestone = useCallback(async (questId: string, milestoneId: string) => {
    const quest = [...quests, ...customQuests].find(q => q.id === questId);
    if (!quest || !quest.microGoals) return;

    const milestone = quest.microGoals.find(m => m.id === milestoneId);
    if (!milestone || milestone.completed) return;

    const updatedMicroGoals = quest.microGoals.map(m => 
      m.id === milestoneId ? { ...m, completed: true } : m
    );

    const updatedQuest: Quest = {
      ...quest,
      microGoals: updatedMicroGoals,
    };

    const updatedQuests = quests.map(q => q.id === questId ? updatedQuest : q);
    const updatedCustomQuests = customQuests.map(q => q.id === questId ? updatedQuest : q);

    await saveQuests(updatedQuests, updatedCustomQuests);
    await addXP(quest.category, milestone.xpValue);
  }, [quests, customQuests, saveQuests, addXP]);

  const completeQuest = useCallback(async (questId: string, reflection?: QuestReflection) => {
    const quest = [...quests, ...customQuests].find(q => q.id === questId);
    if (!quest) return;

    const updatedQuest: Quest = {
      ...quest,
      status: 'completed',
      completedDate: new Date().toISOString(),
      reflection,
    };

    const updatedQuests = quests.map(q => q.id === questId ? updatedQuest : q);
    const updatedCustomQuests = customQuests.map(q => q.id === questId ? updatedQuest : q);

    await saveQuests(updatedQuests, updatedCustomQuests);
    await addXP(quest.category, quest.xpValue);
  }, [quests, customQuests, saveQuests, addXP]);

  const addCustomQuest = useCallback(async (
    category: CategoryType,
    title: string,
    description: string,
    type: QuestType,
    xpValue: number,
    microGoals?: MicroGoal[],
    endDate?: string
  ) => {
    const newQuest: Quest = {
      id: `custom-${Date.now()}-${Math.random()}`,
      type,
      category,
      title,
      description,
      xpValue,
      status: 'active',
      startDate: new Date().toISOString(),
      endDate,
      microGoals,
    };

    console.log('[QuestContext] Adding custom quest:', newQuest.title, 'ID:', newQuest.id, 'Status:', newQuest.status);
    const updatedCustomQuests = [...customQuests, newQuest];
    console.log('[QuestContext] Total custom quests after add:', updatedCustomQuests.length);
    console.log('[QuestContext] All custom quest IDs:', updatedCustomQuests.map(q => q.id));
    
    await saveQuests(quests, updatedCustomQuests);
    
    console.log('[QuestContext] Custom quest saved successfully');
    console.log('[QuestContext] State after save - quests:', quests.length, 'custom:', updatedCustomQuests.length);
  }, [quests, customQuests, saveQuests]);

  const activateQuest = useCallback(async (questTemplate: Omit<Quest, 'id' | 'status' | 'startDate'>) => {
    const today = new Date().toISOString().split('T')[0];
    const newQuest: Quest = {
      ...questTemplate,
      id: `quest-${Date.now()}-${Math.random()}`,
      status: 'active',
      startDate: today,
    };

    console.log('[QuestContext] Activating quest:', newQuest.title, 'ID:', newQuest.id);
    const updatedQuests = [...quests, newQuest];
    console.log('[QuestContext] Updated quests count:', updatedQuests.length);
    await saveQuests(updatedQuests, customQuests);
    console.log('[QuestContext] Quest activated and saved');
  }, [quests, customQuests, saveQuests]);

  const cancelQuest = useCallback(async (questId: string) => {
    console.log('[QuestContext] Cancelling quest:', questId);
    console.log('[QuestContext] Before cancel - quests:', quests.length, 'customQuests:', customQuests.length);
    const updatedQuests = quests.filter(q => q.id !== questId);
    const updatedCustomQuests = customQuests.filter(q => q.id !== questId);
    console.log('[QuestContext] After cancel - quests:', updatedQuests.length, 'customQuests:', updatedCustomQuests.length);
    await saveQuests(updatedQuests, updatedCustomQuests);
    console.log('[QuestContext] Quest cancelled and saved successfully');
  }, [quests, customQuests, saveQuests]);

  const allQuests = useMemo(
    () => {
      const combined = [...quests, ...customQuests];
      console.log('[QuestContext] allQuests memo - quests:', quests.length, 'customQuests:', customQuests.length, 'combined:', combined.length);
      console.log('[QuestContext] All quest statuses:', combined.map(q => ({ id: q.id, title: q.title, status: q.status, type: q.type })));
      return combined;
    },
    [quests, customQuests]
  );

  const activeQuests = useMemo(
    () => {
      const active = allQuests.filter(q => q.status === 'active');
      console.log('[QuestContext] activeQuests memo - total:', allQuests.length, 'active:', active.length);
      console.log('[QuestContext] Active quest IDs:', active.map(q => ({ id: q.id, title: q.title, status: q.status, type: q.type })));
      return active;
    },
    [allQuests]
  );

  const completedQuests = useMemo(
    () => allQuests.filter(q => q.status === 'completed'),
    [allQuests]
  );

  const todayQuests = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return activeQuests.filter(q => q.type === 'daily' && q.startDate === today);
  }, [activeQuests]);

  const clearAllQuests = useCallback(async () => {
    console.log('[QuestContext] Clearing all quests');
    await saveQuests([], []);
    console.log('[QuestContext] All quests cleared');
  }, [saveQuests]);

  return useMemo(() => ({
    quests: allQuests,
    activeQuests,
    completedQuests,
    todayQuests,
    isLoading,
    completeQuest,
    completeMilestone,
    addCustomQuest,
    activateQuest,
    cancelQuest,
    clearAllQuests,
  }), [
    allQuests,
    activeQuests,
    completedQuests,
    todayQuests,
    isLoading,
    completeQuest,
    completeMilestone,
    addCustomQuest,
    activateQuest,
    cancelQuest,
    clearAllQuests,
  ]);
});
