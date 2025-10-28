import { Category, CategoryType } from '@/types';

export const CATEGORY_DATA: Record<CategoryType, Omit<Category, 'xp' | 'level' | 'privacy'>> = {
  health: {
    id: 'health',
    name: 'Health',
    icon: 'heart',
    color: '#FF4757',
    description: 'Physical wellness, training, nutrition',
  },
  wealth: {
    id: 'wealth',
    name: 'Wealth',
    icon: 'dollar-sign',
    color: '#2ECC71',
    description: 'Finance, career, entrepreneurship',
  },
  social: {
    id: 'social',
    name: 'Social',
    icon: 'users',
    color: '#3498DB',
    description: 'Connection, communication, confidence',
  },
  discipline: {
    id: 'discipline',
    name: 'Discipline',
    icon: 'target',
    color: '#9B59B6',
    description: 'Habits, self-control, focus',
  },
  mental: {
    id: 'mental',
    name: 'Mental',
    icon: 'brain',
    color: '#F39C12',
    description: 'Learning, reflection, mindfulness',
  },
  recovery: {
    id: 'recovery',
    name: 'Recovery',
    icon: 'shield',
    color: '#1ABC9C',
    description: 'Overcoming addictions, resilience, healing',
  },
};

export const XP_PER_LEVEL = 1000;

export const QUEST_XP_VALUES = {
  daily: 50,
  short: 350,
  long: 1500,
  custom: 100,
};

export const MAX_DAILY_XP_PER_CATEGORY = 250;

export const calculateLevel = (xp: number): number => {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
};

export const calculateXPForNextLevel = (xp: number): number => {
  const currentLevel = calculateLevel(xp);
  return currentLevel * XP_PER_LEVEL - xp;
};

export const calculateProgress = (xp: number): number => {
  const currentLevelXP = xp % XP_PER_LEVEL;
  return currentLevelXP / XP_PER_LEVEL;
};
