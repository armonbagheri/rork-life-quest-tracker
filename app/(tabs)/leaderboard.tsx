import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Trophy, Crown, Medal, Search, UserPlus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useUser } from '@/context/UserContext';
import { CATEGORY_DATA } from '@/constants/categories';
import { CategoryType, LeaderboardEntry } from '@/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


export default function LeaderboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, sendFriendRequest } = useUser();
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const mockLeaderboard = useMemo(() => {
    const entries: LeaderboardEntry[] = [
      {
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
      },
    ];

    for (let i = 0; i < 20; i++) {
      const totalXP = Math.max(0, user.totalXP - Math.floor(Math.random() * 500 * (i + 1)));
      entries.push({
        userId: `user-${i}`,
        username: `Player${i + 1}`,
        avatar: user.avatar,
        totalXP,
        level: Math.floor(totalXP / 1000) + 1,
        rank: i + 2,
      });
    }

    return entries.sort((a, b) => b.totalXP - a.totalXP).map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }, [user]);

  const filteredLeaderboard = useMemo(() => {
    if (!searchQuery.trim()) return mockLeaderboard;
    const query = searchQuery.toLowerCase();
    return mockLeaderboard.filter(entry => 
      entry.username.toLowerCase().includes(query)
    );
  }, [mockLeaderboard, searchQuery]);

  const handleAddFriend = (userId: string, username: string) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    sendFriendRequest(userId);
    console.log('Sent friend request to:', username);
  };

  const getFriendStatus = (userId: string): 'none' | 'friends' | 'pending' => {
    if (user.friends?.includes(userId)) return 'friends';
    if (user.friendRequestsSent?.includes(userId)) return 'pending';
    return 'none';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown size={24} color="#FFD700" fill="#FFD700" />;
    if (rank === 2) return <Medal size={24} color="#C0C0C0" />;
    if (rank === 3) return <Medal size={24} color="#CD7F32" />;
    return null;
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

          <View style={styles.searchContainer}>
            <Search size={20} color="#ffffff99" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search users to add friends..."
              placeholderTextColor="#ffffff66"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
          >
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedCategory === 'all' && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedCategory('all')}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedCategory === 'all' && styles.filterButtonTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {Object.values(CATEGORY_DATA).map(category => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.filterButton,
                  selectedCategory === category.id && styles.filterButtonActive,
                  selectedCategory === category.id && {
                    borderColor: category.color,
                    backgroundColor: `${category.color}20`,
                  },
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedCategory === category.id && styles.filterButtonTextActive,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {!searchQuery && (
            <View style={styles.podium}>
              {mockLeaderboard.slice(0, 3).map((entry, index) => {
                const heights = [140, 180, 120];

                return (
                  <View
                    key={entry.userId}
                    style={[
                      styles.podiumItem,
                      { height: heights[index] },
                    ]}
                  >
                    <View style={styles.podiumRank}>
                      {getRankIcon(entry.rank)}
                    </View>
                    <View style={styles.podiumAvatar}>
                      <Text style={styles.podiumAvatarText}>
                        {entry.username[0].toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.podiumUsername} numberOfLines={1}>
                      {entry.username}
                    </Text>
                    <Text style={styles.podiumXP}>{entry.totalXP.toLocaleString()}</Text>
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.section}>
            {(searchQuery ? filteredLeaderboard : mockLeaderboard.slice(3)).map((entry) => {
              const isCurrentUser = entry.userId === user.id;

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
                    <Text style={styles.leaderboardRank}>#{entry.rank}</Text>
                    <View style={styles.leaderboardAvatar}>
                      <Text style={styles.leaderboardAvatarText}>
                        {entry.username[0].toUpperCase()}
                      </Text>
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
                    <Text style={styles.leaderboardXP}>
                      {entry.totalXP.toLocaleString()} XP
                    </Text>
                    {!isCurrentUser && (
                      <TouchableOpacity
                        style={[
                          styles.addFriendButton,
                          getFriendStatus(entry.userId) !== 'none' && styles.addFriendButtonDisabled,
                        ]}
                        onPress={(e) => {
                          e.stopPropagation();
                          if (getFriendStatus(entry.userId) === 'none') {
                            handleAddFriend(entry.userId, entry.username);
                          }
                        }}
                        disabled={getFriendStatus(entry.userId) !== 'none'}
                      >
                        {getFriendStatus(entry.userId) === 'friends' ? (
                          <Text style={styles.addFriendText}>Friends</Text>
                        ) : getFriendStatus(entry.userId) === 'pending' ? (
                          <Text style={styles.addFriendText}>Pending</Text>
                        ) : (
                          <UserPlus size={16} color="#4ECDC4" />
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
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
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff10',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: '#fff',
    fontSize: 16,
  },
  filterContainer: {
    gap: 8,
    marginBottom: 24,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff10',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#fff',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ffffff99',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: 32,
    gap: 8,
  },
  podiumItem: {
    width: 100,
    backgroundColor: '#ffffff10',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  podiumRank: {
    marginBottom: 8,
  },
  podiumAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  podiumAvatarText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
  },
  podiumUsername: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  podiumXP: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '600' as const,
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
  },
  leaderboardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  leaderboardRank: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#ffffff99',
    width: 32,
  },
  leaderboardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaderboardAvatarText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  leaderboardXP: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFD700',
  },
  addFriendButton: {
    minWidth: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4ECDC415',
    borderWidth: 1,
    borderColor: '#4ECDC4',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  addFriendButtonDisabled: {
    backgroundColor: '#ffffff20',
    borderColor: '#ffffff40',
  },
  addFriendText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#ffffff99',
  },
});
