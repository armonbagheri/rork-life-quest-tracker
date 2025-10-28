import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Heart, DollarSign, Users, Target, Brain, Shield, X, UserPlus, Zap, Flame } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useActivities } from '@/context/ActivityContext';
import { useUser } from '@/context/UserContext';
import { CATEGORY_DATA } from '@/constants/categories';
import Avatar from '@/components/Avatar';
import { CategoryType, User as UserType } from '@/types';

export default function UserProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { mockUsers, myActivities, activities } = useActivities();
  const { user: currentUser, sendFriendRequest } = useUser();

  const getFriendStatus = (userId: string): 'none' | 'friends' | 'pending' => {
    if (currentUser.friends.includes(userId)) return 'friends';
    if (currentUser.friendRequestsSent.includes(userId)) return 'pending';
    return 'none';
  };

  const profileUser = mockUsers.find(u => u.id === userId);

  if (!profileUser) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f3460']}
          style={styles.background}
        >
          <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <X size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>User not found</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  const friendStatus = getFriendStatus(userId || '');
  const isCurrentUser = currentUser.id === userId;

  const userActivities = activities.filter(a => a.userId === userId).slice(0, 10);

  const publicCategories = Object.keys(profileUser.categories).filter(
    key => profileUser.categories[key as CategoryType].privacy === 'public'
  ) as CategoryType[];

  const getCategoryIcon = (categoryId: CategoryType, size = 24) => {
    const category = CATEGORY_DATA[categoryId];
    const iconProps = { size, color: '#fff' };
    
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
      default:
        return <Zap {...iconProps} />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMs = now.getTime() - activityTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.background}
      >
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <X size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileHeader}>
            <Avatar avatar={profileUser.avatar} size={100} />
            <Text style={styles.username}>{profileUser.username}</Text>
            {profileUser.bio && (
              <Text style={styles.bio}>{profileUser.bio}</Text>
            )}
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profileUser.level}</Text>
                <Text style={styles.statLabel}>Level</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profileUser.totalXP.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Total XP</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profileUser.streakCount}</Text>
                <Text style={styles.statLabel}>Streak</Text>
              </View>
            </View>

            {!isCurrentUser && (
              <TouchableOpacity
                style={[
                  styles.addFriendButton,
                  friendStatus !== 'none' && styles.addFriendButtonDisabled,
                ]}
                onPress={() => {
                  if (friendStatus === 'none') {
                    if (Platform.OS !== 'web') {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }
                    sendFriendRequest(userId || '');
                  }
                }}
                disabled={friendStatus !== 'none'}
              >
                <UserPlus size={20} color="#fff" />
                <Text style={styles.addFriendButtonText}>
                  {friendStatus === 'friends' ? 'Friends' : friendStatus === 'pending' ? 'Request Sent' : 'Add Friend'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {publicCategories.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Public Categories</Text>
              <View style={styles.categoriesGrid}>
                {publicCategories.map(categoryId => {
                  const category = CATEGORY_DATA[categoryId];
                  const categoryData = profileUser.categories[categoryId];

                  return (
                    <View key={categoryId} style={styles.categoryCard}>
                      <View
                        style={[
                          styles.categoryIcon,
                          { backgroundColor: category.color },
                        ]}
                      >
                        {getCategoryIcon(categoryId, 20)}
                      </View>
                      <Text style={styles.categoryName}>{category.name}</Text>
                      <Text style={styles.categoryLevel}>Level {categoryData.level}</Text>
                      <View style={styles.categoryXP}>
                        <Zap size={12} color="#FFD700" fill="#FFD700" />
                        <Text style={styles.categoryXPText}>{categoryData.xp} XP</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {userActivities.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              {userActivities.map(activity => {
                const category = CATEGORY_DATA[activity.category];
                
                return (
                  <View key={activity.id} style={styles.activityCard}>
                    <View style={styles.activityHeader}>
                      <View style={[styles.activityIcon, { backgroundColor: category.color }]}>
                        {getCategoryIcon(activity.category, 16)}
                      </View>
                      <View style={styles.activityInfo}>
                        <Text style={styles.activityTitle}>{activity.questTitle}</Text>
                        <Text style={styles.activityTime}>{formatTimeAgo(activity.timestamp)}</Text>
                      </View>
                      <View style={styles.activityXP}>
                        <Zap size={14} color="#FFD700" fill="#FFD700" />
                        <Text style={styles.activityXPText}>+{activity.xpEarned}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {publicCategories.length === 0 && userActivities.length === 0 && (
            <View style={styles.emptyState}>
              <Shield size={48} color="#ffffff33" />
              <Text style={styles.emptyStateText}>Private Profile</Text>
              <Text style={styles.emptyStateSubtext}>
                This user has chosen to keep their information private
              </Text>
            </View>
          )}

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff20',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  username: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#fff',
    marginTop: 16,
  },
  bio: {
    fontSize: 14,
    color: '#ffffff99',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 32,
    marginTop: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#ffffff99',
    marginTop: 4,
  },
  addFriendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 24,
  },
  addFriendButtonDisabled: {
    backgroundColor: '#ffffff30',
  },
  addFriendButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    backgroundColor: '#ffffff10',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '47%',
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 4,
  },
  categoryLevel: {
    fontSize: 12,
    color: '#ffffff99',
    marginBottom: 8,
  },
  categoryXP: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryXPText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FFD700',
  },
  activityCard: {
    backgroundColor: '#ffffff10',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#ffffff66',
  },
  activityXP: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff15',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  activityXPText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FFD700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#ffffff66',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#fff',
  },
});
