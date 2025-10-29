export type CategoryType = 'health' | 'wealth' | 'social' | 'discipline' | 'mental' | 'recovery';

export type PrivacyLevel = 'public' | 'friends' | 'private';

export type QuestType = 'daily' | 'short' | 'long' | 'custom';

export type QuestStatus = 'active' | 'completed' | 'failed';

export interface Category {
  id: CategoryType;
  name: string;
  icon: string;
  color: string;
  description: string;
  xp: number;
  level: number;
  privacy: PrivacyLevel;
}

export interface Quest {
  id: string;
  type: QuestType;
  category: CategoryType;
  title: string;
  description: string;
  xpValue: number;
  status: QuestStatus;
  startDate: string;
  endDate?: string;
  completedDate?: string;
  streak?: number;
  participants?: string[];
  isJoint?: boolean;
  jointPartner?: string;
  jointPartnerId?: string;
  jointProgress?: Record<string, boolean>;
  isCommunityChallenge?: boolean;
  microGoals?: MicroGoal[];
  reflection?: QuestReflection;
}

export interface MicroGoal {
  id: string;
  title: string;
  completed: boolean;
  xpValue: number;
}

export interface DayHistory {
  date: string;
  loggedIn: boolean;
  xpEarned: number;
  categoryXP?: Partial<Record<CategoryType, number>>;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  memberCount?: number;
  icon?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  bio?: string;
  avatar: AvatarCustomization;
  categories: Record<CategoryType, CategoryProgress>;
  totalXP: number;
  level: number;
  streakCount: number;
  longestStreak: number;
  lastActivityDate?: string;
  todayXP?: number;
  lastXPResetDate?: string;
  dayHistory?: Record<string, DayHistory>;
  friends: string[];
  friendRequestsSent: string[];
  friendRequestsReceived: string[];
  communities: string[];
  joinDate: string;
}

export interface CategoryProgress {
  xp: number;
  level: number;
  privacy: PrivacyLevel;
  enabled: boolean;
}

export interface AvatarCustomization {
  baseStyle: string;
  skinTone: string;
  hairstyle: string;
  hairColor: string;
  outfit: string;
  accessories: string[];
  unlockedItems: string[];
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar: AvatarCustomization;
  totalXP: number;
  level: number;
  rank: number;
  categoryXP?: Record<CategoryType, number>;
  isFriend?: boolean;
  inCommunity?: boolean;
  isMasked?: boolean;
  privacySettings?: Record<CategoryType, CategoryProgress>;
}

export interface DailyStreak {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string;
  xpToday: number;
  goalXP: number;
}

export interface ActivityMedia {
  type: 'image' | 'video';
  uri: string;
  mimeType?: string;
}

export interface Activity {
  id: string;
  userId: string;
  username: string;
  avatar: AvatarCustomization;
  type: 'quest_completed' | 'milestone_completed';
  questTitle: string;
  category: CategoryType;
  xpEarned: number;
  media?: ActivityMedia;
  caption?: string;
  timestamp: string;
  likes?: string[];
  comments?: Comment[];
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: string;
  parentId?: string;
  replies?: Comment[];
}

export interface QuestReflection {
  learned: string;
  feeling: string;
  difficulty: number;
  satisfaction: number;
  timestamp: string;
}

export interface CommunityChallenge {
  id: string;
  title: string;
  description: string;
  category: CategoryType;
  duration: string;
  xpValue: number;
  startDate: string;
  endDate: string;
  participants: number;
  badgeId?: string;
  microGoals?: MicroGoal[];
}

export interface CommunityParticipant {
  userId: string;
  username: string;
  avatar: AvatarCustomization;
  progress: number;
  completedMilestones: string[];
  privacySetting: 'public' | 'private';
  joinedDate: string;
}

export interface AICoachLevel {
  level: 1 | 2 | 3 | 4;
  name: string;
  features: string[];
  isPremium: boolean;
}

export interface AICoachMessage {
  id: string;
  content: string;
  type: 'suggestion' | 'motivation' | 'insight' | 'breakdown' | 'strategy';
  timestamp: string;
  questId?: string;
  category?: CategoryType;
}
