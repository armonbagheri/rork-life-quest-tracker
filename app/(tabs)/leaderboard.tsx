import React, { useState, useMemo } from 'react';
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
import { Trophy, Users, UserCheck, Lock, Info } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useUser } from '@/context/UserContext';
import { CATEGORY_DATA } from '@/constants/categories';
import { CategoryType, LeaderboardEntry } from '@/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Avatar from '@/components/Avatar';

type AudienceFilter = 'all' | 'communities' | 'friends';
type TimeWindow = 'today' | '7d' | '30d';

export default function LeaderboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'all'>('all');
  const [audienceFilter, setAudienceFilter] = useState<AudienceFilter>('all');
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('30d');

  const mockLeaderboard = useMemo(() => {
    const entries: LeaderboardEntry[] = [];
    
    const userEntry: LeaderboardEntry = {
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
      totalXP: user.totalXP,
      level: user.level,
      rank: 1,
      categoryXP: {
        health: user.categories.health.xp,
        wealth: user.categories.wealth.xp,
        social: user.categories.social.xp,
        discipline: user.categories.discipline.xp,
        mental: user.categories.mental.xp,
        recovery: user.categories.recovery.xp,
      },
      isFriend: false,
      inCommunity: user.communities.length > 0,
      isMasked: false,
    };
    entries.push(userEntry);

    for (let i = 0; i < 30; i++) {
      const isFriend = i < 5 && Math.random() > 0.3;
      const inCommunity = user.communities.length > 0 && Math.random() > 0.4;
      
      const baseXP = Math.max(0, user.totalXP - Math.floor(Math.random() * 500 * (i + 1)));
      const randomVariation = Math.floor(Math.random() * 200) - 100;
      const totalXP = Math.max(0, baseXP + randomVariation);
      
      const privacySetting = Math.random() > 0.8 ? 'private' : 'public';
      const isMasked = privacySetting === 'private' && !isFriend;
      
      const categoryXP: Record<CategoryType, number> = {
        health: Math.floor(Math.random() * (totalXP * 0.3)),
        wealth: Math.floor(Math.random() * (totalXP * 0.25)),
        social: Math.floor(Math.random() * (totalXP * 0.2)),
        discipline: Math.floor(Math.random() * (totalXP * 0.15)),
        mental: Math.floor(Math.random() * (totalXP * 0.1)),
        recovery: Math.floor(Math.random() * (totalXP * 0.1)),
      };

      entries.push({
        userId: `user-${i}`,
        username: `Player${i + 1}`,
        avatar: user.avatar,
        totalXP,
        level: Math.floor(totalXP / 1000) + 1,
        rank: i + 2,
        categoryXP,
        isFriend,
        inCommunity,
        isMasked,
      });
    }

    let filtered = entries;

    if (audienceFilter === 'friends') {
      filtered = entries.filter(e => e.userId === user.id || e.isFriend);
    } else if (audienceFilter === 'communities') {
      filtered = entries.filter(e => e.userId === user.id || e.inCommunity);
    }

    filtered = filtered.sort((a, b) => {
      const aXP = selectedCategory === 'all' ? a.totalXP : (a.categoryXP?.[selectedCategory] || 0);
      const bXP = selectedCategory === 'all' ? b.totalXP : (b.categoryXP?.[selectedCategory] || 0);
      
      if (bXP !== aXP) return bXP - aXP;
      return a.username.localeCompare(b.username);
    });

    return filtered.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }, [user, selectedCategory, audienceFilter, timeWindow]);

  const handleCategoryChange = (category: CategoryType | 'all') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedCategory(category);
  };

  const handleAudienceChange = (filter: AudienceFilter) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setAudienceFilter(filter);
  };

  const handleTimeWindowChange = (window: TimeWindow) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setTimeWindow(window);
  };

  const getEmptyStateMessage = () => {
    if (audienceFilter === 'all') {
      return 'Nobody public in this category yet.';
    } else if (audienceFilter === 'communities') {
      return 'No one from your communities in this category yet.';
    } else {
      return 'No friends visible in this category yet.';
    }
  };

  const getCategoryTip = () => {
    if (selectedCategory === 'all') return null;
    const category = CATEGORY_DATA[selectedCategory];
    return `Earn XP here by completing ${category.name} quests.`;
  };

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.background}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Leaderboard</Text>
            <Trophy size={32} color="#FFD700" />
          </View>

          {getCategoryTip() && (
            <View style={styles.tipBanner}>
              <Info size={16} color="#4ECDC4" />
              <Text style={styles.tipText}>{getCategoryTip()}</Text>
            </View>
          )}

          <View style={styles.filtersSection}>
            <Text style={styles.filterLabel}>Audience</Text>
            <View style={styles.audienceFilters}>
              <TouchableOpacity
                style={[
                  styles.audienceButton,
                  audienceFilter === 'all' && styles.audienceButtonActive,
                ]}
                onPress={() => handleAudienceChange('all')}
              >
                <Users size={16} color={audienceFilter === 'all' ? '#fff' : '#ffffff99'} />
                <Text
                  style={[
                    styles.audienceButtonText,
                    audienceFilter === 'all' && styles.audienceButtonTextActive,
                  ]}
                >
                  All Users
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.audienceButton,
                  audienceFilter === 'communities' && styles.audienceButtonActive,
                ]}
                onPress={() => handleAudienceChange('communities')}
              >
                <Trophy size={16} color={audienceFilter === 'communities' ? '#fff' : '#ffffff99'} />
                <Text
                  style={[
                    styles.audienceButtonText,
                    audienceFilter === 'communities' && styles.audienceButtonTextActive,
                  ]}
                >
                  My Communities
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.audienceButton,
                  audienceFilter === 'friends' && styles.audienceButtonActive,
                ]}
                onPress={() => handleAudienceChange('friends')}
              >
                <UserCheck size={16} color={audienceFilter === 'friends' ? '#fff' : '#ffffff99'} />
                <Text
                  style={[
                    styles.audienceButtonText,
                    audienceFilter === 'friends' && styles.audienceButtonTextActive,
                  ]}
                >
                  Friends
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.filtersSection}>
            <Text style={styles.filterLabel}>Time Window</Text>
            <View style={styles.timeFilters}>
              <TouchableOpacity
                style={[
                  styles.timeButton,
                  timeWindow === 'today' && styles.timeButtonActive,
                ]}
                onPress={() => handleTimeWindowChange('today')}
              >
                <Text
                  style={[
                    styles.timeButtonText,
                    timeWindow === 'today' && styles.timeButtonTextActive,
                  ]}
                >
                  Today
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.timeButton,
                  timeWindow === '7d' && styles.timeButtonActive,
                ]}
                onPress={() => handleTimeWindowChange('7d')}
              >
                <Text
                  style={[
                    styles.timeButtonText,
                    timeWindow === '7d' && styles.timeButtonTextActive,
                  ]}
                >
                  7 Days
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.timeButton,
                  timeWindow === '30d' && styles.timeButtonActive,
                ]}
                onPress={() => handleTimeWindowChange('30d')}
              >
                <Text
                  style={[
                    styles.timeButtonText,
                    timeWindow === '30d' && styles.timeButtonTextActive,
                  ]}
                >
                  30 Days
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryFilterContainer}
          >
            <TouchableOpacity
              style={[
                styles.categoryFilterButton,
                selectedCategory === 'all' && styles.categoryFilterButtonActive,
              ]}
              onPress={() => handleCategoryChange('all')}
            >
              <Text
                style={[
                  styles.categoryFilterButtonText,
                  selectedCategory === 'all' && styles.categoryFilterButtonTextActive,
                ]}
              >
                All Categories
              </Text>
            </TouchableOpacity>
            {Object.values(CATEGORY_DATA).map(category => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryFilterButton,
                  selectedCategory === category.id && styles.categoryFilterButtonActive,
                  selectedCategory === category.id && {
                    borderColor: category.color,
                    backgroundColor: `${category.color}20`,
                  },
                ]}
                onPress={() => handleCategoryChange(category.id)}
              >
                <Text
                  style={[
                    styles.categoryFilterButtonText,
                    selectedCategory === category.id && styles.categoryFilterButtonTextActive,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.section}>
            {mockLeaderboard.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>{getEmptyStateMessage()}</Text>
              </View>
            ) : (
              mockLeaderboard.map((entry) => {
                const isCurrentUser = entry.userId === user.id;
                const xpToDisplay = selectedCategory === 'all' 
                  ? entry.totalXP 
                  : (entry.categoryXP?.[selectedCategory] || 0);

                return (
                  <TouchableOpacity
                    key={entry.userId}
                    style={[
                      styles.leaderboardCard,
                      isCurrentUser && styles.leaderboardCardHighlighted,
                    ]}
                    onPress={() => {
                      if (!isCurrentUser) {
                        if (Platform.OS !== 'web') {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                        router.push({
                          pathname: '/user-profile' as any,
                          params: { userId: entry.userId },
                        });
                      }
                    }}
                    disabled={isCurrentUser}
                    activeOpacity={isCurrentUser ? 1 : 0.7}
                  >
                    <View style={styles.leaderboardLeft}>
                      <Text style={styles.leaderboardRank}>{getRankDisplay(entry.rank)}</Text>
                      <View style={styles.avatarContainer}>
                        <Avatar avatar={entry.avatar} size={40} />
                      </View>
                      <View style={styles.leaderboardInfo}>
                        <Text style={styles.leaderboardUsername}>
                          {entry.username}
                          {isCurrentUser && <Text style={styles.youBadge}> (You)</Text>}
                        </Text>
                        <Text style={styles.leaderboardLevel}>Level {entry.level}</Text>
                      </View>
                    </View>
                    <View style={styles.leaderboardRight}>
                      {entry.isMasked ? (
                        <View style={styles.maskedXP}>
                          <Lock size={16} color="#ffffff60" />
                          <Text style={styles.maskedText}>—</Text>
                        </View>
                      ) : (
                        <Text style={styles.leaderboardXP}>
                          {xpToDisplay.toLocaleString()} XP
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          <View style={{ height: 40 }} />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#fff',
  },
  tipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4ECDC420',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: '#4ECDC4',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#4ECDC4',
    fontWeight: '500' as const,
  },
  filtersSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ffffff99',
    marginBottom: 12,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  audienceFilters: {
    flexDirection: 'row',
    gap: 8,
  },
  audienceButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff10',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  audienceButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#fff',
  },
  audienceButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#ffffff99',
  },
  audienceButtonTextActive: {
    color: '#fff',
  },
  timeFilters: {
    flexDirection: 'row',
    gap: 8,
  },
  timeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff10',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  timeButtonActive: {
    backgroundColor: '#4ECDC4',
    borderColor: '#fff',
  },
  timeButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ffffff99',
  },
  timeButtonTextActive: {
    color: '#fff',
  },
  categoryFilterContainer: {
    gap: 8,
    marginBottom: 24,
  },
  categoryFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff10',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryFilterButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#fff',
  },
  categoryFilterButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ffffff99',
  },
  categoryFilterButtonTextActive: {
    color: '#fff',
  },
  section: {
    marginBottom: 24,
  },
  leaderboardCard: {
    backgroundColor: '#ffffff10',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  leaderboardCardHighlighted: {
    backgroundColor: '#667eea20',
    borderColor: '#667eea',
    borderWidth: 2,
  },
  leaderboardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  leaderboardRank: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFD700',
    width: 40,
  },
  avatarContainer: {
    width: 40,
    height: 40,
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardUsername: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 2,
  },
  youBadge: {
    color: '#4ECDC4',
    fontWeight: '700' as const,
  },
  leaderboardLevel: {
    fontSize: 12,
    color: '#ffffff99',
  },
  leaderboardRight: {
    alignItems: 'flex-end',
  },
  leaderboardXP: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFD700',
  },
  maskedXP: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  maskedText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#ffffff60',
  },
  emptyState: {
    backgroundColor: '#ffffff10',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffff99',
    textAlign: 'center',
  },
});
