import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  X,
  Zap,
  Heart,
  DollarSign,
  Brain,
  Target,
  Users,
  Shield,
  Flame,
  TrendingUp,
  Award,
  Sparkles,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuests } from '@/context/QuestContext';
import { useUser } from '@/context/UserContext';
import { CATEGORY_DATA } from '@/constants/categories';
import { CategoryType } from '@/types';

export default function WeeklySummaryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { completedQuests } = useQuests();
  const { user } = useUser();

  const weeklyData = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const questsThisWeek = completedQuests.filter((q) => {
      const completedDate = new Date(q.completedDate || '');
      return completedDate >= oneWeekAgo && completedDate <= now;
    });

    const categoryXP: Record<CategoryType, number> = {
      health: 0,
      wealth: 0,
      social: 0,
      discipline: 0,
      mental: 0,
      recovery: 0,
    };

    let totalXP = 0;
    questsThisWeek.forEach((quest) => {
      categoryXP[quest.category] += quest.xpValue;
      totalXP += quest.xpValue;
    });

    const topCategory = Object.entries(categoryXP).reduce(
      (max, [cat, xp]) => (xp > max.xp ? { category: cat as CategoryType, xp } : max),
      { category: 'health' as CategoryType, xp: 0 }
    );

    const questsCompleted = questsThisWeek.length;
    const reflectionsCount = questsThisWeek.filter((q) => q.reflection).length;
    const averageDifficulty =
      reflectionsCount > 0
        ? questsThisWeek
            .filter((q) => q.reflection)
            .reduce((sum, q) => sum + (q.reflection?.difficulty || 0), 0) / reflectionsCount
        : 0;
    const averageSatisfaction =
      reflectionsCount > 0
        ? questsThisWeek
            .filter((q) => q.reflection)
            .reduce((sum, q) => sum + (q.reflection?.satisfaction || 0), 0) / reflectionsCount
        : 0;

    return {
      categoryXP,
      totalXP,
      topCategory,
      questsCompleted,
      reflectionsCount,
      averageDifficulty,
      averageSatisfaction,
    };
  }, [completedQuests]);

  const getCategoryIcon = (categoryId: string) => {
    const iconProps = { size: 20, color: '#fff' };
    switch (categoryId) {
      case 'health':
        return <Heart {...iconProps} />;
      case 'wealth':
        return <DollarSign {...iconProps} />;
      case 'mental':
        return <Brain {...iconProps} />;
      case 'discipline':
        return <Target {...iconProps} />;
      case 'social':
        return <Users {...iconProps} />;
      case 'recovery':
        return <Shield {...iconProps} />;
    }
  };

  const generateAIInsight = () => {
    if (weeklyData.questsCompleted === 0) {
      return "Start completing quests to see your weekly insights!";
    }

    if (weeklyData.topCategory.xp > 0) {
      const categoryName = CATEGORY_DATA[weeklyData.topCategory.category].name;
      return `You were most consistent in ${categoryName} this week — nice job! Keep up the momentum.`;
    }

    return "Great effort this week! Keep building those habits.";
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.background}
      >
        <View
          style={[
            styles.header,
            { paddingTop: insets.top + 20 },
          ]}
        >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.back();
            }}
          >
            <X size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Weekly Summary</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <Sparkles size={32} color="#FFD700" />
            <Text style={styles.heroTitle}>This Week&apos;s Progress</Text>
            <View style={styles.heroStats}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{weeklyData.totalXP}</Text>
                <Text style={styles.heroStatLabel}>XP Earned</Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{weeklyData.questsCompleted}</Text>
                <Text style={styles.heroStatLabel}>Quests Done</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <TrendingUp size={24} color="#4ECDC4" />
              <Text style={styles.sectionTitle}>XP by Category</Text>
            </View>
            {Object.entries(weeklyData.categoryXP).map(([cat, xp]) => {
              const category = CATEGORY_DATA[cat as CategoryType];
              const maxXP = Math.max(...Object.values(weeklyData.categoryXP));
              const percentage = maxXP > 0 ? (xp / maxXP) * 100 : 0;

              return (
                <View key={cat} style={styles.categoryRow}>
                  <View style={styles.categoryInfo}>
                    <View
                      style={[
                        styles.categoryIconSmall,
                        { backgroundColor: category.color },
                      ]}
                    >
                      {getCategoryIcon(cat)}
                    </View>
                    <Text style={styles.categoryName}>{category.name}</Text>
                  </View>
                  <View style={styles.categoryProgress}>
                    <View style={styles.progressBarBg}>
                      <View
                        style={[
                          styles.progressBarFill,
                          { width: `${percentage}%`, backgroundColor: category.color },
                        ]}
                      />
                    </View>
                    <Text style={styles.categoryXP}>{xp} XP</Text>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Flame size={24} color="#FF6B6B" />
              <Text style={styles.sectionTitle}>Streaks & Milestones</Text>
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Flame size={32} color="#FF6B6B" />
                <Text style={styles.statValue}>{user.streakCount}</Text>
                <Text style={styles.statLabel}>Current Streak</Text>
              </View>
              <View style={styles.statCard}>
                <Award size={32} color="#FFD700" />
                <Text style={styles.statValue}>{user.longestStreak}</Text>
                <Text style={styles.statLabel}>Best Streak</Text>
              </View>
              <View style={styles.statCard}>
                <Zap size={32} color="#4ECDC4" />
                <Text style={styles.statValue}>{weeklyData.reflectionsCount}</Text>
                <Text style={styles.statLabel}>Reflections</Text>
              </View>
              <View style={styles.statCard}>
                <TrendingUp size={32} color="#667eea" />
                <Text style={styles.statValue}>
                  {weeklyData.averageSatisfaction.toFixed(1)}
                </Text>
                <Text style={styles.statLabel}>Avg Satisfaction</Text>
              </View>
            </View>
          </View>

          <View style={styles.aiInsightCard}>
            <View style={styles.aiInsightHeader}>
              <Sparkles size={20} color="#FFD700" />
              <Text style={styles.aiInsightTitle}>AI Insight</Text>
            </View>
            <Text style={styles.aiInsightText}>{generateAIInsight()}</Text>
          </View>

          <View style={{ height: Math.max(insets.bottom, 20) + 20 }} />
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  heroCard: {
    backgroundColor: '#667eea',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#fff',
    marginTop: 12,
    marginBottom: 24,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  heroStat: {
    alignItems: 'center',
  },
  heroStatValue: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 4,
  },
  heroStatLabel: {
    fontSize: 14,
    color: '#ffffffcc',
  },
  heroDivider: {
    width: 2,
    height: 40,
    backgroundColor: '#ffffff40',
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  categoryIconSmall: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  categoryProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#ffffff20',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  categoryXP: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
    minWidth: 50,
    textAlign: 'right',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#ffffff10',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#fff',
    marginTop: 12,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#ffffff99',
    textAlign: 'center',
  },
  aiInsightCard: {
    backgroundColor: '#FFD70030',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#FFD70040',
  },
  aiInsightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  aiInsightTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
  },
  aiInsightText: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 24,
  },
});
