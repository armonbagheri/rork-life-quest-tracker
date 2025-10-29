import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Quest, CategoryType, QuestType, MicroGoal, QuestReflection, HobbySubcategory } from '@/types';
import { useUser } from './UserContext';
import { DEFAULT_DAILY_QUESTS } from '@/constants/quests';

const QUESTS_STORAGE_KEY = '@lifequest_quests';
const DAILY_QUEST_STATE_KEY = '@lifequest_daily_quest_state';
const HOBBIES_STORAGE_KEY = '@lifequest_hobbies';
const DAILY_QUEST_LIMIT = 3;

interface DailyQuestState {
  date: string;
  availableQuestsByCategory: Record<CategoryType, string[]>;
  completedCountByCategory: Record<CategoryType, number>;
}

export const [QuestProvider, useQuests] = createContextHook(() => {
  const { addXP } = useUser();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [customQuests, setCustomQuests] = useState<Quest[]>([]);
  const [dailyQuestState, setDailyQuestState] = useState<DailyQuestState | null>(null);
  const [hobbies, setHobbies] = useState<HobbySubcategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getTodayDate = useCallback(() => {
    return new Date().toLocaleDateString('en-US', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
  }, []);

  const getRandomQuests = useCallback((category: CategoryType, count: number): string[] => {
    const categoryQuests = DEFAULT_DAILY_QUESTS.filter(q => q.category === category);
    const shuffled = [...categoryQuests].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).map(q => q.title);
  }, []);

  const initializeDailyQuestState = useCallback((): DailyQuestState => {
    const today = getTodayDate();
    const categories: CategoryType[] = ['health', 'wealth', 'social', 'discipline', 'mental', 'recovery', 'hobbies'];
    
    const availableQuestsByCategory: Record<CategoryType, string[]> = {} as Record<CategoryType, string[]>;
    const completedCountByCategory: Record<CategoryType, number> = {} as Record<CategoryType, number>;
    
    categories.forEach(category => {
      availableQuestsByCategory[category] = getRandomQuests(category, DAILY_QUEST_LIMIT);
      completedCountByCategory[category] = 0;
    });

    return {
      date: today,
      availableQuestsByCategory,
      completedCountByCategory,
    };
  }, [getTodayDate, getRandomQuests]);

  useEffect(() => {
    async function loadQuests() {
      try {
        const [storedQuests, storedDailyState, storedHobbies] = await Promise.all([
          AsyncStorage.getItem(QUESTS_STORAGE_KEY),
          AsyncStorage.getItem(DAILY_QUEST_STATE_KEY),
          AsyncStorage.getItem(HOBBIES_STORAGE_KEY),
        ]);

        if (storedQuests) {
          const questData = JSON.parse(storedQuests);
          console.log('[QuestContext] Loaded from storage:', {
            quests: questData.quests?.length || 0,
            customQuests: questData.customQuests?.length || 0
          });
          setQuests(questData.quests || []);
          setCustomQuests(questData.customQuests || []);
        } else {
          console.log('[QuestContext] No stored quests found - starting fresh');
        }

        const today = getTodayDate();
        let dailyState: DailyQuestState;

        if (storedDailyState) {
          dailyState = JSON.parse(storedDailyState);
          
          if (dailyState.date !== today) {
            console.log('[QuestContext] New day detected - resetting daily quests');
            dailyState = initializeDailyQuestState();
            await AsyncStorage.setItem(DAILY_QUEST_STATE_KEY, JSON.stringify(dailyState));
          }
        } else {
          console.log('[QuestContext] No daily quest state found - initializing');
          dailyState = initializeDailyQuestState();
          await AsyncStorage.setItem(DAILY_QUEST_STATE_KEY, JSON.stringify(dailyState));
        }

        setDailyQuestState(dailyState);

        if (storedHobbies) {
          const hobbiesData = JSON.parse(storedHobbies);
          setHobbies(hobbiesData);
          console.log('[QuestContext] Loaded hobbies:', hobbiesData.length);
        }
      } catch (error) {
        console.error('Failed to load quests:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadQuests();
  }, [getTodayDate, initializeDailyQuestState]);

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

    if (quest.type === 'daily' && dailyQuestState) {
      const updatedState: DailyQuestState = {
        ...dailyQuestState,
        completedCountByCategory: {
          ...dailyQuestState.completedCountByCategory,
          [quest.category]: (dailyQuestState.completedCountByCategory[quest.category] || 0) + 1,
        },
      };
      setDailyQuestState(updatedState);
      await AsyncStorage.setItem(DAILY_QUEST_STATE_KEY, JSON.stringify(updatedState));
      console.log('[QuestContext] Daily quest completed - updated state:', updatedState.completedCountByCategory);
    }
  }, [quests, customQuests, saveQuests, addXP, dailyQuestState]);

  const addHobby = useCallback(async (name: string, description?: string) => {
    const newHobby: HobbySubcategory = {
      id: `hobby-${Date.now()}-${Math.random()}`,
      name,
      description,
      createdAt: new Date().toISOString(),
    };

    const updatedHobbies = [...hobbies, newHobby];
    setHobbies(updatedHobbies);
    await AsyncStorage.setItem(HOBBIES_STORAGE_KEY, JSON.stringify(updatedHobbies));
    console.log('[QuestContext] Added hobby:', newHobby.name);
    return newHobby.id;
  }, [hobbies]);

  const removeHobby = useCallback(async (hobbyId: string) => {
    const updatedHobbies = hobbies.filter(h => h.id !== hobbyId);
    setHobbies(updatedHobbies);
    await AsyncStorage.setItem(HOBBIES_STORAGE_KEY, JSON.stringify(updatedHobbies));

    const updatedQuests = quests.filter(q => !(q.category === 'hobbies' && q.hobbySubcategory === hobbyId));
    const updatedCustomQuests = customQuests.filter(q => !(q.category === 'hobbies' && q.hobbySubcategory === hobbyId));
    await saveQuests(updatedQuests, updatedCustomQuests);
    console.log('[QuestContext] Removed hobby and related quests:', hobbyId);
  }, [hobbies, quests, customQuests, saveQuests]);

  const addCustomQuest = useCallback(async (
    category: CategoryType,
    title: string,
    description: string,
    type: QuestType,
    xpValue: number,
    microGoals?: MicroGoal[],
    endDate?: string,
    hobbySubcategory?: string
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
      hobbySubcategory,
    };

    console.log('[QuestContext] Adding custom quest:', newQuest.title, 'ID:', newQuest.id, 'Status:', newQuest.status);
    const updatedCustomQuests = [...customQuests, newQuest];
    console.log('[QuestContext] Total custom quests after add:', updatedCustomQuests.length);
    console.log('[QuestContext] All custom quest IDs:', updatedCustomQuests.map(q => q.id));
    
    await saveQuests(quests, updatedCustomQuests);
    
    console.log('[QuestContext] Custom quest saved successfully');
    console.log('[QuestContext] State after save - quests:', quests.length, 'custom:', updatedCustomQuests.length);
  }, [quests, customQuests, saveQuests]);

  const canActivateDailyQuest = useCallback((category: CategoryType): boolean => {
    if (!dailyQuestState) return false;
    const completedCount = dailyQuestState.completedCountByCategory[category] || 0;
    return completedCount < DAILY_QUEST_LIMIT;
  }, [dailyQuestState]);

  const isDailyQuestAvailable = useCallback((questTitle: string, category: CategoryType): boolean => {
    if (!dailyQuestState) return false;
    const availableQuests = dailyQuestState.availableQuestsByCategory[category] || [];
    return availableQuests.includes(questTitle);
  }, [dailyQuestState]);

  const activateQuest = useCallback(async (questTemplate: Omit<Quest, 'id' | 'status' | 'startDate'>) => {
    if (questTemplate.type === 'daily') {
      if (!canActivateDailyQuest(questTemplate.category)) {
        console.log('[QuestContext] Cannot activate daily quest - limit reached for category:', questTemplate.category);
        throw new Error(`You've completed the maximum of ${DAILY_QUEST_LIMIT} daily quests in this category today. Try again tomorrow!`);
      }
      
      if (!isDailyQuestAvailable(questTemplate.title, questTemplate.category)) {
        console.log('[QuestContext] Cannot activate daily quest - not in today\'s available quests');
        throw new Error('This quest is not available today. Check back tomorrow for different quests!');
      }
    }

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
  }, [quests, customQuests, saveQuests, canActivateDailyQuest, isDailyQuestAvailable]);

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

  const getAvailableDailyQuests = useCallback((category: CategoryType): typeof DEFAULT_DAILY_QUESTS => {
    if (!dailyQuestState) return [];
    
    const availableTitles = dailyQuestState.availableQuestsByCategory[category] || [];
    return DEFAULT_DAILY_QUESTS.filter(q => 
      q.category === category && availableTitles.includes(q.title)
    );
  }, [dailyQuestState]);

  const getDailyQuestProgress = useCallback((category: CategoryType) => {
    if (!dailyQuestState) return { completed: 0, limit: DAILY_QUEST_LIMIT };
    
    return {
      completed: dailyQuestState.completedCountByCategory[category] || 0,
      limit: DAILY_QUEST_LIMIT,
    };
  }, [dailyQuestState]);

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
    getAvailableDailyQuests,
    getDailyQuestProgress,
    canActivateDailyQuest,
    hobbies,
    addHobby,
    removeHobby,
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
    getAvailableDailyQuests,
    getDailyQuestProgress,
    canActivateDailyQuest,
    hobbies,
    addHobby,
    removeHobby,
  ]);
});
