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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Zap, Heart, DollarSign, Brain, Target, Users, Shield } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useQuests } from '@/context/QuestContext';
import { CATEGORY_DATA } from '@/constants/categories';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { QuestType, CategoryType } from '@/types';

export default function QuestHistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { quests, completedQuests } = useQuests();
  
  const categoryId = params.categoryId as CategoryType;
  const [selectedTab, setSelectedTab] = useState<'active' | 'completed'>('active');
  const [selectedFilter, setSelectedFilter] = useState<QuestType | 'all'>('all');

  const activeQuestsForCategory = useMemo(
    () => quests.filter(q => q.category === categoryId),
    [quests, categoryId]
  );

  const completedQuestsForCategory = useMemo(
    () => completedQuests.filter(q => q.category === categoryId),
    [completedQuests, categoryId]
  );

  const filteredActiveQuests = useMemo(() => {
    if (selectedFilter === 'all') return activeQuestsForCategory;
    return activeQuestsForCategory.filter(q => q.type === selectedFilter);
  }, [activeQuestsForCategory, selectedFilter]);

  const filteredCompletedQuests = useMemo(() => {
    if (selectedFilter === 'all') return completedQuestsForCategory;
    return completedQuestsForCategory.filter(q => q.type === selectedFilter);
  }, [completedQuestsForCategory, selectedFilter]);

  if (!categoryId || !CATEGORY_DATA[categoryId]) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Category not found</Text>
      </View>
    );
  }

  const category = CATEGORY_DATA[categoryId];

  const getCategoryIcon = (categoryId: string) => {
    const iconProps = { size: 32, color: '#fff' };
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

  const displayedQuests = selectedTab === 'active' ? filteredActiveQuests : filteredCompletedQuests;

  const getQuestTypeLabel = (type: QuestType) => {
    switch (type) {
      case 'daily':
        return 'Daily';
      case 'short':
        return 'Short Term';
      case 'long':
        return 'Long Term';
      case 'custom':
        return 'Custom';
    }
  };

  const getQuestIcon = (questCategory: string) => {
    const iconProps = { size: 20, color: '#fff' };
    switch (questCategory) {
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
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
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
          <View style={styles.headerCenter}>
            <View
              style={[
                styles.categoryIconLarge,
                { backgroundColor: category.color },
              ]}
            >
              {getCategoryIcon(categoryId)}
            </View>
            <Text style={styles.headerTitle}>{category.name}</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === 'active' && styles.tabActive,
            ]}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setSelectedTab('active');
            }}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === 'active' && styles.tabTextActive,
              ]}
            >
              Active
            </Text>
            <View
              style={[
                styles.tabBadge,
                { backgroundColor: category.color + '30' },
              ]}
            >
              <Text
                style={[
                  styles.tabBadgeText,
                  { color: category.color },
                ]}
              >
                {activeQuestsForCategory.length}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === 'completed' && styles.tabActive,
            ]}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setSelectedTab('completed');
            }}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === 'completed' && styles.tabTextActive,
              ]}
            >
              Completed
            </Text>
            <View
              style={[
                styles.tabBadge,
                { backgroundColor: category.color + '30' },
              ]}
            >
              <Text
                style={[
                  styles.tabBadgeText,
                  { color: category.color },
                ]}
              >
                {completedQuestsForCategory.length}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={styles.filtersContainer}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedFilter === 'all' && [styles.filterChipActive, { backgroundColor: category.color }],
            ]}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setSelectedFilter('all');
            }}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedFilter === 'all' && styles.filterChipTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedFilter === 'daily' && [styles.filterChipActive, { backgroundColor: category.color }],
            ]}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setSelectedFilter('daily');
            }}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedFilter === 'daily' && styles.filterChipTextActive,
              ]}
            >
              Daily
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedFilter === 'short' && [styles.filterChipActive, { backgroundColor: category.color }],
            ]}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setSelectedFilter('short');
            }}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedFilter === 'short' && styles.filterChipTextActive,
              ]}
            >
              Short Term
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedFilter === 'long' && [styles.filterChipActive, { backgroundColor: category.color }],
            ]}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setSelectedFilter('long');
            }}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedFilter === 'long' && styles.filterChipTextActive,
              ]}
            >
              Long Term
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {displayedQuests.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No {selectedTab} quests
              </Text>
              <Text style={styles.emptyStateSubtext}>
                {selectedTab === 'active'
                  ? 'Start new quests from the Quests tab'
                  : 'Complete quests to see them here'}
              </Text>
            </View>
          ) : (
            displayedQuests.map((quest) => (
              <TouchableOpacity
                key={quest.id}
                style={styles.questCard}
                activeOpacity={0.7}
                onPress={() => {
                  if (selectedTab === 'active') {
                    router.push({
                      pathname: '/quest-detail' as any,
                      params: { questId: quest.id },
                    });
                  }
                }}
              >
                <View style={styles.questLeft}>
                  <View
                    style={[
                      styles.questIcon,
                      { backgroundColor: category.color },
                    ]}
                  >
                    {getQuestIcon(quest.category)}
                  </View>
                  <View style={styles.questInfo}>
                    <Text style={styles.questTitle}>{quest.title}</Text>
                    <View style={styles.questMeta}>
                      <View
                        style={[
                          styles.questTypeBadge,
                          { backgroundColor: category.color + '30' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.questTypeText,
                            { color: category.color },
                          ]}
                        >
                          {getQuestTypeLabel(quest.type)}
                        </Text>
                      </View>
                      {quest.completedDate && (
                        <Text style={styles.questDate}>
                          {new Date(quest.completedDate).toLocaleDateString()}
                        </Text>
                      )}
                      {quest.startDate && !quest.completedDate && (
                        <Text style={styles.questDate}>
                          Started {new Date(quest.startDate).toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
                <View style={styles.questRight}>
                  <View style={styles.questXP}>
                    <Zap size={14} color="#FFD700" fill="#FFD700" />
                    <Text style={styles.questXPText}>{quest.xpValue}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
    gap: 12,
  },
  categoryIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#fff',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#ffffff10',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#ffffff20',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffff66',
  },
  tabTextActive: {
    color: '#fff',
  },
  tabBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  filtersScroll: {
    marginBottom: 20,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff10',
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  filterChipActive: {
    borderColor: 'transparent',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ffffff66',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  questCard: {
    backgroundColor: '#ffffff10',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  questLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  questIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questInfo: {
    flex: 1,
    gap: 6,
  },
  questTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  questMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  questTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  questTypeText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  questDate: {
    fontSize: 12,
    color: '#ffffff66',
  },
  questRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  questXP: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff15',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  questXPText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFD700',
  },
  emptyState: {
    backgroundColor: '#ffffff10',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff20',
    marginTop: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#ffffff99',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginTop: 100,
  },
});
