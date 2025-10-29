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
import { useRouter } from 'expo-router';
import { Settings, Award, Calendar, TrendingUp, Heart, DollarSign, Brain, Target, Users, Shield, BookOpen, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useUser } from '@/context/UserContext';
import { useQuests } from '@/context/QuestContext';
import { CATEGORY_DATA, calculateProgress } from '@/constants/categories';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Avatar from '@/components/Avatar';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, enabledCategories } = useUser();
  const { completedQuests } = useQuests();

  const joinedDate = new Date(user.joinDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

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

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.background}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Profile</Text>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                router.push('/settings');
              }}
            >
              <Settings size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.profileCard}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                router.push('/settings');
              }}
              activeOpacity={0.7}
            >
              <Avatar avatar={user.avatar} size={80} />
            </TouchableOpacity>
            <Text style={styles.username}>{user.username}</Text>
            {user.bio && <Text style={styles.bio}>{user.bio}</Text>}
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>Level {user.level}</Text>
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{user.totalXP.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Total XP</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{user.streakCount}</Text>
                <Text style={styles.statLabel}>Streak</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{completedQuests.length}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Calendar size={20} color="#4ECDC4" />
              <Text style={styles.infoLabel}>Joined</Text>
              <Text style={styles.infoValue}>{joinedDate}</Text>
            </View>
            <View style={styles.infoCard}>
              <Award size={20} color="#FFD700" />
              <Text style={styles.infoLabel}>Longest Streak</Text>
              <Text style={styles.infoValue}>{user.longestStreak} days</Text>
            </View>
            <View style={styles.infoCard}>
              <TrendingUp size={20} color="#FF6B6B" />
              <Text style={styles.infoLabel}>Categories</Text>
              <Text style={styles.infoValue}>{enabledCategories.length}</Text>
            </View>
          </View>

          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                router.push('/weekly-summary');
              }}
            >
              <Calendar size={24} color="#4ECDC4" />
              <View style={styles.actionCardContent}>
                <Text style={styles.actionCardTitle}>Weekly Summary</Text>
                <Text style={styles.actionCardSubtitle}>View your progress</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                router.push('/growth-journal');
              }}
            >
              <BookOpen size={24} color="#FF6B6B" />
              <View style={styles.actionCardContent}>
                <Text style={styles.actionCardTitle}>Growth Journal</Text>
                <Text style={styles.actionCardSubtitle}>
                  {completedQuests.length} completed quests
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                router.push('/reflections');
              }}
            >
              <Sparkles size={24} color="#FFD700" />
              <View style={styles.actionCardContent}>
                <Text style={styles.actionCardTitle}>Reflections</Text>
                <Text style={styles.actionCardSubtitle}>
                  {completedQuests.filter(q => q.reflection).length} reflections saved
                </Text>
              </View>
            </TouchableOpacity>

            {enabledCategories.includes('recovery') && (
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  router.push('/recovery-tracker');
                }}
              >
                <Shield size={24} color="#1ABC9C" />
                <View style={styles.actionCardContent}>
                  <Text style={styles.actionCardTitle}>Recovery Tracker</Text>
                  <Text style={styles.actionCardSubtitle}>
                    Track your journey to freedom
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Categories</Text>
            {enabledCategories.map(categoryId => {
              const category = CATEGORY_DATA[categoryId];
              const categoryData = user.categories[categoryId];
              const progress = calculateProgress(categoryData.xp);

              return (
                <View key={categoryId} style={styles.categoryCard}>
                  <View style={styles.categoryHeader}>
                    <View
                      style={[
                        styles.categoryIcon,
                        { backgroundColor: category.color },
                      ]}
                    >
                      {getCategoryIcon(categoryId)}
                    </View>
                    <View style={styles.categoryInfo}>
                      <Text style={styles.categoryName}>{category.name}</Text>
                      <Text style={styles.categoryLevel}>
                        Level {categoryData.level} • {categoryData.xp.toLocaleString()} XP
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.privacyBadge,
                        categoryData.privacy === 'public' && styles.privacyPublic,
                        categoryData.privacy === 'friends' && styles.privacyFriends,
                        categoryData.privacy === 'private' && styles.privacyPrivate,
                      ]}
                    >
                      <Text style={styles.privacyText}>
                        {categoryData.privacy === 'public' ? '🌍' : 
                         categoryData.privacy === 'friends' ? '👥' : '🔒'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${progress * 100}%`,
                          backgroundColor: category.color,
                        },
                      ]}
                    />
                  </View>
                </View>
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
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    backgroundColor: '#ffffff10',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  avatarContainer: {
    marginBottom: 8,
  },
  username: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    color: '#ffffff99',
    textAlign: 'center',
    marginBottom: 12,
  },
  levelBadge: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  levelText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#ffffff99',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#ffffff10',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff20',
    gap: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: '#ffffff99',
    textAlign: 'center',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 16,
  },
  categoryCard: {
    backgroundColor: '#ffffff10',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 4,
  },
  categoryLevel: {
    fontSize: 14,
    color: '#ffffff99',
  },
  privacyBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyPublic: {
    backgroundColor: '#4ECDC420',
  },
  privacyFriends: {
    backgroundColor: '#667eea20',
  },
  privacyPrivate: {
    backgroundColor: '#FF6B6B20',
  },
  privacyText: {
    fontSize: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#ffffff20',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  actionsSection: {
    marginBottom: 24,
    gap: 12,
  },
  actionCard: {
    backgroundColor: '#ffffff10',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#ffffff20',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionCardContent: {
    flex: 1,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 4,
  },
  actionCardSubtitle: {
    fontSize: 14,
    color: '#ffffff99',
  },
});
