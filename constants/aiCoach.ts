import { AICoachLevel, CategoryType } from '@/types';

export const AI_COACH_LEVELS: AICoachLevel[] = [
  {
    level: 1,
    name: 'Starter Coach',
    features: [
      'Daily quest suggestions',
      'Basic motivational prompts',
      'Progress tracking',
    ],
    isPremium: false,
  },
  {
    level: 2,
    name: 'Growth Coach',
    features: [
      'All Level 1 features',
      'Break long-term quests into micro-goals',
      'Smart quest recommendations',
      'Weekly XP summaries',
    ],
    isPremium: false,
  },
  {
    level: 3,
    name: 'Advanced Coach',
    features: [
      'All Level 2 features',
      'Adaptive weekly insights',
      'Personalized strategies',
      'Detailed performance analytics',
      'Category-specific coaching',
    ],
    isPremium: true,
  },
  {
    level: 4,
    name: 'Master Coach',
    features: [
      'All Level 3 features',
      'Full AI mentor experience',
      'Tone & mood tracking',
      'Deep reflection feedback',
      'Predictive goal planning',
      'Real-time motivation',
    ],
    isPremium: true,
  },
];

export const generateDailyMotivation = (
  username: string,
  streakCount: number,
  category?: CategoryType
): string => {
  const motivations = [
    `Great job, ${username}! You're on a ${streakCount}-day streak. Keep the momentum going!`,
    `${username}, you're crushing it! ${streakCount} days of consistency shows true dedication.`,
    `Hey ${username}! Another day, another opportunity to level up. Let's make it count!`,
    `${username}, your ${streakCount}-day streak is inspiring. What will you conquer today?`,
    `Rise and grind, ${username}! Your future self will thank you for today's efforts.`,
  ];

  if (category) {
    const categoryMotivations: Record<CategoryType, string[]> = {
      health: [
        `Your body is your temple, ${username}. Let's make it stronger today!`,
        `Every workout is a step toward a healthier you. You've got this!`,
      ],
      wealth: [
        `Financial freedom starts with today's decisions. Make them count!`,
        `Building wealth is a marathon, not a sprint. Stay consistent!`,
      ],
      social: [
        `Every connection you make enriches your life. Put yourself out there!`,
        `Your network is your net worth. Let's expand it today!`,
      ],
      discipline: [
        `Discipline is choosing between what you want now and what you want most.`,
        `Small consistent actions create extraordinary results. Stay disciplined!`,
      ],
      mental: [
        `Feed your mind with knowledge and watch your world expand.`,
        `Learning is a treasure that follows you everywhere. Keep growing!`,
      ],
      recovery: [
        `Every day sober is a victory. You're stronger than you know.`,
        `Healing isn't linear, but you're moving forward. Be proud!`,
      ],
    };

    const categorySpecific = categoryMotivations[category];
    if (categorySpecific && Math.random() > 0.5) {
      return categorySpecific[Math.floor(Math.random() * categorySpecific.length)];
    }
  }

  return motivations[Math.floor(Math.random() * motivations.length)];
};

export const generateQuestBreakdown = (
  questTitle: string,
  questType: string,
  category: CategoryType
): string[] => {
  const breakdowns: Record<CategoryType, Record<string, string[]>> = {
    health: {
      default: [
        'Start with a warm-up to prevent injury',
        'Focus on proper form over speed',
        'Stay hydrated throughout',
        'Cool down and stretch after',
      ],
    },
    wealth: {
      default: [
        'Set up expense tracking system',
        'Review and categorize spending',
        'Identify areas to cut costs',
        'Allocate savings to goals',
      ],
    },
    social: {
      default: [
        'Choose a comfortable social setting',
        'Prepare conversation starters',
        'Practice active listening',
        'Follow up with new connections',
      ],
    },
    discipline: {
      default: [
        'Define your morning routine',
        'Set clear boundaries',
        'Remove temptations',
        'Track daily completion',
      ],
    },
    mental: {
      default: [
        'Set aside dedicated learning time',
        'Take notes on key concepts',
        'Practice active recall',
        'Apply what you learn',
      ],
    },
    recovery: {
      default: [
        'Identify your triggers',
        'Have a support system ready',
        'Practice self-compassion',
        'Celebrate small wins',
      ],
    },
  };

  return breakdowns[category]?.default || [
    'Break it into smaller steps',
    'Set daily milestones',
    'Track your progress',
    'Adjust as needed',
  ];
};

export const generateWeeklySummary = (
  totalXP: number,
  categoriesXP: Record<CategoryType, number>,
  completedQuests: number
): string => {
  const topCategory = Object.entries(categoriesXP).sort((a, b) => b[1] - a[1])[0];

  return `This week you earned ${totalXP} XP across ${completedQuests} quests! 
You were most consistent in ${topCategory[0]} with ${topCategory[1]} XP. 
${totalXP > 500 ? 'Outstanding progress!' : 'Keep building momentum!'}`;
};
