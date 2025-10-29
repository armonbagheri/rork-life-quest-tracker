import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Activity, ActivityMedia, User } from '@/types';
import { useUser } from './UserContext';

const ACTIVITIES_STORAGE_KEY = '@lifequest_activities';
const MOCK_USERS_STORAGE_KEY = '@lifequest_mock_users';

const generateMockUsers = (): User[] => {
  const mockUsernames = [
    'FitWarrior', 'WealthBuilder', 'MindfulSoul', 'DisciplineKing',
    'SocialButterfly', 'RecoveryHero', 'GymRat', 'MoneyMaker',
    'BrainPower', 'HabitMaster', 'FriendlyVibes', 'CleanLiving'
  ];

  return mockUsernames.map((username, index) => ({
    id: `mock-user-${index}`,
    username,
    email: `${username.toLowerCase()}@example.com`,
    avatar: {
      baseStyle: 'default',
      skinTone: ['light', 'medium', 'dark'][index % 3] as string,
      hairstyle: ['short', 'long', 'medium'][index % 3] as string,
      hairColor: ['brown', 'black', 'blonde'][index % 3] as string,
      outfit: 'casual',
      accessories: [],
      unlockedItems: ['default'],
    },
    categories: {
      health: { xp: Math.floor(Math.random() * 5000), level: Math.floor(Math.random() * 20) + 1, privacy: 'public', enabled: true },
      wealth: { xp: Math.floor(Math.random() * 5000), level: Math.floor(Math.random() * 20) + 1, privacy: 'public', enabled: true },
      social: { xp: Math.floor(Math.random() * 5000), level: Math.floor(Math.random() * 20) + 1, privacy: 'public', enabled: true },
      discipline: { xp: Math.floor(Math.random() * 5000), level: Math.floor(Math.random() * 20) + 1, privacy: 'public', enabled: true },
      mental: { xp: Math.floor(Math.random() * 5000), level: Math.floor(Math.random() * 20) + 1, privacy: 'public', enabled: true },
      recovery: { xp: Math.floor(Math.random() * 5000), level: Math.floor(Math.random() * 20) + 1, privacy: 'private', enabled: true },
    },
    totalXP: Math.floor(Math.random() * 10000) + 5000,
    level: Math.floor(Math.random() * 20) + 10,
    streakCount: Math.floor(Math.random() * 30),
    longestStreak: Math.floor(Math.random() * 100),
    friends: [],
    friendRequestsSent: [],
    friendRequestsReceived: [],
    communities: [],
    joinDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
  }));
};

const generateMockActivities = (users: User[]): Activity[] => {
  const activities: Activity[] = [];
  const questTitles = [
    'Morning Workout', 'Save $500', 'Read 30 pages', 'Meditate for 10 minutes',
    'Network with 3 people', 'Stay sober today', 'Train 5x this week',
    'Study for 2 hours', 'Cook a healthy meal', 'Go for a run'
  ];

  users.forEach((user, userIndex) => {
    const activityCount = Math.floor(Math.random() * 5) + 1;
    for (let i = 0; i < activityCount; i++) {
      const categoryKeys = Object.keys(user.categories) as (keyof typeof user.categories)[];
      const category = categoryKeys[Math.floor(Math.random() * categoryKeys.length)];
      
      activities.push({
        id: `activity-${userIndex}-${i}`,
        userId: user.id,
        username: user.username,
        avatar: user.avatar,
        type: 'quest_completed',
        questTitle: questTitles[Math.floor(Math.random() * questTitles.length)],
        category,
        xpEarned: Math.floor(Math.random() * 300) + 50,
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
  });

  return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const [ActivityProvider, useActivities] = createContextHook(() => {
  const { user } = useUser();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [mockUsers, setMockUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [storedActivities, storedMockUsers] = await Promise.all([
        AsyncStorage.getItem(ACTIVITIES_STORAGE_KEY),
        AsyncStorage.getItem(MOCK_USERS_STORAGE_KEY),
      ]);

      let users: User[] = [];
      if (storedMockUsers) {
        users = JSON.parse(storedMockUsers);
      } else {
        users = generateMockUsers();
        await AsyncStorage.setItem(MOCK_USERS_STORAGE_KEY, JSON.stringify(users));
      }
      setMockUsers(users);

      let activitiesList: Activity[] = [];
      if (storedActivities) {
        activitiesList = JSON.parse(storedActivities);
      } else {
        activitiesList = generateMockActivities(users);
        await AsyncStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify(activitiesList));
      }
      setActivities(activitiesList);
    } catch (error) {
      console.error('Failed to load activity data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addActivity = useCallback(async (
    questTitle: string,
    category: string,
    xpEarned: number,
    type: 'quest_completed' | 'milestone_completed',
    media?: ActivityMedia,
    caption?: string
  ) => {
    const newActivity: Activity = {
      id: `activity-${Date.now()}-${Math.random()}`,
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
      type,
      questTitle,
      category: category as any,
      xpEarned,
      media,
      caption,
      timestamp: new Date().toISOString(),
      likes: [],
      comments: [],
    };

    const updatedActivities = [newActivity, ...activities];
    setActivities(updatedActivities);
    
    try {
      await AsyncStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify(updatedActivities));
    } catch (error) {
      console.error('Failed to save activity:', error);
    }
  }, [activities, user]);

  const addFriend = useCallback(async (friendId: string) => {
    console.log('Friend request functionality moved to UserContext');
  }, []);

  const toggleLike = useCallback(async (activityId: string) => {
    const activity = activities.find(a => a.id === activityId);
    if (!activity) return;

    const likes = activity.likes || [];
    const hasLiked = likes.includes(user.id);
    
    const updatedActivity = {
      ...activity,
      likes: hasLiked 
        ? likes.filter(id => id !== user.id)
        : [...likes, user.id]
    };

    const updatedActivities = activities.map(a => 
      a.id === activityId ? updatedActivity : a
    );

    setActivities(updatedActivities);
    
    try {
      await AsyncStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify(updatedActivities));
    } catch (error) {
      console.error('Failed to save like:', error);
    }
  }, [activities, user.id]);

  const addComment = useCallback(async (activityId: string, text: string, parentId?: string) => {
    const activity = activities.find(a => a.id === activityId);
    if (!activity) return;

    const newComment = {
      id: `comment-${Date.now()}-${Math.random()}`,
      userId: user.id,
      username: user.username,
      text,
      timestamp: new Date().toISOString(),
      parentId,
      replies: [],
    };

    let updatedComments = [...(activity.comments || [])];
    
    if (parentId) {
      updatedComments = updatedComments.map(comment => {
        if (comment.id === parentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), newComment]
          };
        }
        return comment;
      });
    } else {
      updatedComments.push(newComment);
    }

    const updatedActivity = {
      ...activity,
      comments: updatedComments
    };

    const updatedActivities = activities.map(a => 
      a.id === activityId ? updatedActivity : a
    );

    setActivities(updatedActivities);
    
    try {
      await AsyncStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify(updatedActivities));
    } catch (error) {
      console.error('Failed to save comment:', error);
    }

    return updatedActivity;
  }, [activities, user.id, user.username]);

  const deleteComment = useCallback(async (activityId: string, commentId: string) => {
    const activity = activities.find(a => a.id === activityId);
    if (!activity) return;

    const filterComments = (comments: any[]): any[] => {
      return comments.filter(comment => {
        if (comment.id === commentId) {
          return comment.userId !== user.id;
        }
        if (comment.replies) {
          comment.replies = filterComments(comment.replies);
        }
        return true;
      });
    };

    const updatedActivity = {
      ...activity,
      comments: filterComments(activity.comments || [])
    };

    const updatedActivities = activities.map(a => 
      a.id === activityId ? updatedActivity : a
    );

    setActivities(updatedActivities);
    
    try {
      await AsyncStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify(updatedActivities));
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }

    return updatedActivity;
  }, [activities, user.id]);

  const friendsActivities = useMemo(() => {
    return activities.filter(activity => 
      user.friends.includes(activity.userId) || activity.userId === user.id
    );
  }, [activities, user]);

  const recommendedActivities = useMemo(() => {
    return activities.filter(activity => 
      !user.friends.includes(activity.userId) && 
      activity.userId !== user.id
    );
  }, [activities, user]);

  const myActivities = useMemo(() => {
    return activities.filter(activity => activity.userId === user.id);
  }, [activities, user]);

  return useMemo(() => ({
    activities,
    friendsActivities,
    recommendedActivities,
    myActivities,
    mockUsers,
    isLoading,
    addActivity,
    addFriend,
    toggleLike,
    addComment,
    deleteComment,
  }), [activities, friendsActivities, recommendedActivities, myActivities, mockUsers, isLoading, addActivity, addFriend, toggleLike, addComment, deleteComment]);
});
