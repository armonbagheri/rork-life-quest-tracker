import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, CategoryType, PrivacyLevel, CategoryProgress } from '@/types';
import { calculateLevel } from '@/constants/categories';

const USER_STORAGE_KEY = '@lifequest_user';

const createDefaultUser = (): User => ({
  id: Math.random().toString(36).substr(2, 9),
  username: '',
  email: '',
  avatar: {
    baseStyle: 'default',
    skinTone: 'medium',
    hairstyle: 'short',
    hairColor: 'brown',
    outfit: 'casual',
    accessories: [],
    unlockedItems: ['default'],
  },
  categories: {
    health: { xp: 0, level: 1, privacy: 'public', enabled: false },
    wealth: { xp: 0, level: 1, privacy: 'public', enabled: false },
    social: { xp: 0, level: 1, privacy: 'public', enabled: false },
    discipline: { xp: 0, level: 1, privacy: 'public', enabled: false },
    mental: { xp: 0, level: 1, privacy: 'public', enabled: false },
    recovery: { xp: 0, level: 1, privacy: 'private', enabled: false },
  },
  totalXP: 0,
  level: 1,
  streakCount: 0,
  longestStreak: 0,
  friends: [],
  friendRequestsSent: [],
  friendRequestsReceived: [],
  communities: [],
  joinDate: new Date().toISOString(),
});

export const [UserProvider, useUser] = createContextHook(() => {
  const [user, setUser] = useState<User>(createDefaultUser());
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
    try {
      const stored = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (stored) {
        const userData = JSON.parse(stored);
        const migratedUser = {
          ...userData,
          friends: userData.friends || [],
          friendRequestsSent: userData.friendRequestsSent || [],
          friendRequestsReceived: userData.friendRequestsReceived || [],
        };
        setUser(migratedUser);
        setIsOnboarded(!!migratedUser.username);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setIsLoading(false);
    }
  }
    loadUser();
  }, []);

  const saveUser = useCallback(async (userData: User) => {
    try {
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Failed to save user:', error);
    }
  }, []);

  const completeOnboarding = useCallback(async (
    username: string,
    selectedCategories: CategoryType[],
    categoryPrivacy: Record<CategoryType, PrivacyLevel>,
    communities: string[] = []
  ) => {
    const updatedUser: User = {
      ...user,
      username,
      communities,
      categories: Object.keys(user.categories).reduce((acc, key) => {
        const categoryKey = key as CategoryType;
        acc[categoryKey] = {
          ...user.categories[categoryKey],
          enabled: selectedCategories.includes(categoryKey),
          privacy: categoryPrivacy[categoryKey] || 'public',
        };
        return acc;
      }, {} as Record<CategoryType, CategoryProgress>),
    };

    await saveUser(updatedUser);
    setIsOnboarded(true);
  }, [user, saveUser]);

  const addXP = useCallback(async (category: CategoryType, xpAmount: number) => {
    const updatedCategories = { ...user.categories };
    updatedCategories[category].xp += xpAmount;
    updatedCategories[category].level = calculateLevel(updatedCategories[category].xp);

    const totalXP = Object.values(updatedCategories).reduce((sum, cat) => sum + cat.xp, 0);
    const totalLevel = calculateLevel(totalXP);

    const today = new Date().toISOString().split('T')[0];
    const lastActivityDate = user.lastActivityDate?.split('T')[0];
    const lastXPResetDate = user.lastXPResetDate?.split('T')[0];
    
    let newStreakCount = user.streakCount;
    if (lastActivityDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (lastActivityDate === yesterdayStr) {
        newStreakCount += 1;
      } else if (lastActivityDate !== today) {
        newStreakCount = 1;
      }
    }

    let newTodayXP = (user.todayXP || 0) + xpAmount;
    if (lastXPResetDate !== today) {
      newTodayXP = xpAmount;
    }

    const dayHistory = { ...(user.dayHistory || {}) };
    if (!dayHistory[today]) {
      dayHistory[today] = {
        date: today,
        loggedIn: true,
        xpEarned: 0,
        categoryXP: undefined,
      };
    }
    dayHistory[today].xpEarned += xpAmount;
    
    if (!dayHistory[today].categoryXP) {
      dayHistory[today].categoryXP = {} as Partial<Record<CategoryType, number>>;
    }
    const categoryXP = dayHistory[today].categoryXP!;
    categoryXP[category] = (categoryXP[category] || 0) + xpAmount;

    const updatedUser: User = {
      ...user,
      categories: updatedCategories,
      totalXP,
      level: totalLevel,
      streakCount: newStreakCount,
      longestStreak: Math.max(user.longestStreak, newStreakCount),
      lastActivityDate: new Date().toISOString(),
      todayXP: newTodayXP,
      lastXPResetDate: today,
      dayHistory,
    };

    await saveUser(updatedUser);
  }, [user, saveUser]);

  const updateCategoryPrivacy = useCallback(async (category: CategoryType, privacy: PrivacyLevel) => {
    const updatedUser: User = {
      ...user,
      categories: {
        ...user.categories,
        [category]: {
          ...user.categories[category],
          privacy,
        },
      },
    };
    await saveUser(updatedUser);
  }, [user, saveUser]);

  const enabledCategories = useMemo(() => 
    Object.keys(user.categories).filter(
      key => user.categories[key as CategoryType].enabled
    ) as CategoryType[],
    [user.categories]
  );

  const sendFriendRequest = useCallback(async (userId: string) => {
    if (user.friendRequestsSent.includes(userId) || user.friends.includes(userId)) {
      return;
    }

    const updatedUser: User = {
      ...user,
      friendRequestsSent: [...user.friendRequestsSent, userId],
    };

    await saveUser(updatedUser);
  }, [user, saveUser]);

  const acceptFriendRequest = useCallback(async (userId: string) => {
    if (!user.friendRequestsReceived.includes(userId)) {
      return;
    }

    const updatedUser: User = {
      ...user,
      friends: [...user.friends, userId],
      friendRequestsReceived: user.friendRequestsReceived.filter(id => id !== userId),
    };

    await saveUser(updatedUser);
  }, [user, saveUser]);

  const rejectFriendRequest = useCallback(async (userId: string) => {
    const updatedUser: User = {
      ...user,
      friendRequestsReceived: user.friendRequestsReceived.filter(id => id !== userId),
    };

    await saveUser(updatedUser);
  }, [user, saveUser]);

  const removeFriend = useCallback(async (userId: string) => {
    const updatedUser: User = {
      ...user,
      friends: user.friends.filter(id => id !== userId),
    };

    await saveUser(updatedUser);
  }, [user, saveUser]);

  useEffect(() => {
    if (!isLoading && isOnboarded) {
      const markDayAsActive = async () => {
        const today = new Date().toISOString().split('T')[0];
        const dayHistory = { ...(user.dayHistory || {}) };
        
        if (!dayHistory[today]) {
          dayHistory[today] = {
            date: today,
            loggedIn: true,
            xpEarned: 0,
          };
          
          const updatedUser: User = {
            ...user,
            dayHistory,
          };
          
          await saveUser(updatedUser);
        }
      };
      markDayAsActive();
    }
  }, [isLoading, isOnboarded, user, saveUser]);

  return useMemo(() => ({
    user,
    isOnboarded,
    isLoading,
    completeOnboarding,
    addXP,
    updateCategoryPrivacy,
    enabledCategories,
    saveUser,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
  }), [
    user,
    isOnboarded,
    isLoading,
    completeOnboarding,
    addXP,
    updateCategoryPrivacy,
    enabledCategories,
    saveUser,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
  ]);
});
