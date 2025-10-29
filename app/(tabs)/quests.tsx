import React, { useState } from 'react';
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
import { Zap, Plus, Heart, DollarSign, Brain, Target, Users, Shield, Star, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useQuests } from '@/context/QuestContext';
import { useUser } from '@/context/UserContext';
import { CATEGORY_DATA } from '@/constants/categories';
import { CategoryType, Quest } from '@/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DEFAULT_SHORT_TERM_QUESTS, DEFAULT_LONG_TERM_QUESTS } from '@/constants/quests';


export default function QuestsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { quests, getAvailableDailyQuests, getDailyQuestProgress, hobbies } = useQuests();
  const { enabledCategories } = useUser();

  const [selectedCategory, setSelectedCategory] = useState<CategoryType>(enabledCategories[0]);
  const [selectedHobby, setSelectedHobby] = useState<string | null>(null);

  console.log('[QuestsScreen] Total active quests:', quests.length);
  console.log('[QuestsScreen] Selected category:', selectedCategory);

  const activeDailyQuests = quests.filter(q => {
    const matchesCategory = q.category === selectedCategory;
    const isActive = q.status === 'active' && q.type === 'daily';
    if (selectedCategory === 'hobbies' && selectedHobby) {
      return matchesCategory && isActive && q.hobbySubcategory === selectedHobby;
    }
    return matchesCategory && isActive;
  });

  const activeShortTermQuests = quests.filter(q => {
    const matchesCategory = q.category === selectedCategory;
    const isActive = q.status === 'active' && q.type === 'short';
    if (selectedCategory === 'hobbies' && selectedHobby) {
      return matchesCategory && isActive && q.hobbySubcategory === selectedHobby;
    }
    return matchesCategory && isActive;
  });

  const activeLongTermQuests = quests.filter(q => {
    const matchesCategory = q.category === selectedCategory;
    const isActive = q.status === 'active' && q.type === 'long';
    if (selectedCategory === 'hobbies' && selectedHobby) {
      return matchesCategory && isActive && q.hobbySubcategory === selectedHobby;
    }
    return matchesCategory && isActive;
  });

  const activeCustomQuests = quests.filter(q => {
    const matchesCategory = q.category === selectedCategory;
    const isActive = q.status === 'active' && q.type === 'custom';
    if (selectedCategory === 'hobbies' && selectedHobby) {
      return matchesCategory && isActive && q.hobbySubcategory === selectedHobby;
    }
    return matchesCategory && isActive;
  });

  const activeQuestTitles = new Set(quests.filter(q => q.status === 'active').map(q => q.title));
  const completedQuestTitlesToday = new Set(
    quests.filter(q => {
      if (q.status !== 'completed' || q.category !== selectedCategory || q.type !== 'daily') return false;
      const today = new Date().toISOString().split('T')[0];
      const completedDate = q.completedDate ? q.completedDate.split('T')[0] : null;
      return completedDate === today;
    }).map(q => q.title)
  );

  const availableDailyQuestsForToday = getAvailableDailyQuests(selectedCategory).filter(
    quest => !activeQuestTitles.has(quest.title) && !completedQuestTitlesToday.has(quest.title)
  );

  const dailyQuestProgress = getDailyQuestProgress(selectedCategory);
  const canCompleteMoreDaily = dailyQuestProgress.completed < dailyQuestProgress.limit;

  const availableShortTermQuests = DEFAULT_SHORT_TERM_QUESTS.filter(quest => 
    quest.category === selectedCategory && !activeQuestTitles.has(quest.title)
  );

  const availableLongTermQuests = DEFAULT_LONG_TERM_QUESTS.filter(quest =>
    quest.category === selectedCategory && !activeQuestTitles.has(quest.title)
  );

  const handleQuestPress = (questId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push({
      pathname: '/quest-detail' as any,
      params: { questId },
    });
  };

  const handleAvailableQuestPress = (questTitle: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push({
      pathname: '/quest-detail' as any,
      params: { availableQuestTitle: questTitle },
    });
  };



  const getCategoryIcon = (categoryId: CategoryType, isTab = false) => {
    const iconProps = { size: isTab ? 16 : 20, color: '#fff' };
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
      case 'hobbies':
        return <Star {...iconProps} />;
    }
  };

  const renderQuestCard = (quest: Quest, isActive: boolean) => {
    const category = CATEGORY_DATA[quest.category];
    const isCompleted = quest.status === 'completed';

    return (
      <TouchableOpacity
        key={quest.id}
        style={[
          styles.questCard,
          isCompleted && styles.questCardCompleted,
        ]}
        onPress={() => handleQuestPress(quest.id)}
        activeOpacity={0.7}
      >
        <View style={styles.questLeft}>
          <View
            style={[
              styles.questIcon,
              { backgroundColor: category.color },
            ]}
          >
            {getCategoryIcon(quest.category)}
          </View>
          <View style={styles.questInfo}>
            <Text
              style={[
                styles.questTitle,
                isCompleted && styles.questTitleCompleted,
              ]}
            >
              {quest.title}
            </Text>
            <Text style={styles.questDescription}>
              {quest.description}
            </Text>
            {quest.microGoals && quest.microGoals.length > 0 && (
              <Text style={styles.questMeta}>
                {quest.microGoals.length} {quest.type === 'long' ? 'milestones' : 'steps'}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.questRight}>
          <View style={styles.questXP}>
            <Zap size={14} color="#FFD700" fill="#FFD700" />
            <Text style={styles.questXPText}>{quest.xpValue}</Text>
          </View>
          {isCompleted && (
            <View style={styles.checkmark}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderAvailableQuestCard = (quest: Omit<Quest, 'id' | 'status' | 'startDate'>, index: number) => {
    const category = CATEGORY_DATA[quest.category];

    return (
      <TouchableOpacity
        key={index}
        style={styles.questCard}
        onPress={() => handleAvailableQuestPress(quest.title)}
        activeOpacity={0.7}
      >
        <View style={styles.questLeft}>
          <View
            style={[
              styles.questIcon,
              { backgroundColor: category.color },
            ]}
          >
            {getCategoryIcon(quest.category)}
          </View>
          <View style={styles.questInfo}>
            <Text style={styles.questTitle}>{quest.title}</Text>
            <Text style={styles.questDescription}>
              {quest.description}
            </Text>
            {quest.microGoals && quest.microGoals.length > 0 && (
              <Text style={styles.questMeta}>
                {quest.microGoals.length} {quest.type === 'long' ? 'milestones' : 'steps'}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.questRight}>
          <View style={styles.questXP}>
            <Zap size={14} color="#FFD700" fill="#FFD700" />
            <Text style={styles.questXPText}>{quest.xpValue}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
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
            <Text style={styles.title}>Quests</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                if (selectedCategory === 'hobbies') {
                  if (!selectedHobby) {
                    router.push('/create-hobby' as any);
                  } else {
                    router.push({
                      pathname: '/create-quest' as any,
                      params: { defaultCategory: selectedCategory, hobbySubcategory: selectedHobby },
                    });
                  }
                } else {
                  router.push({
                    pathname: '/create-quest' as any,
                    params: { defaultCategory: selectedCategory },
                  });
                }
              }}
            >
              <Plus size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabsContainer}
            contentContainerStyle={styles.tabsContent}
          >
            {enabledCategories.map(categoryId => {
              const category = CATEGORY_DATA[categoryId];
              return (
                <TouchableOpacity
                  key={categoryId}
                  style={[
                    styles.tab,
                    selectedCategory === categoryId && styles.tabActive,
                    selectedCategory === categoryId && { backgroundColor: category.color },
                  ]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setSelectedCategory(categoryId);
                    setSelectedHobby(null);
                  }}
                >
                  <View style={styles.tabContent}>
                    {getCategoryIcon(categoryId, true)}
                    <Text
                      style={[
                        styles.tabText,
                        selectedCategory === categoryId && styles.tabTextActive,
                      ]}
                    >
                      {category.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {selectedCategory === 'hobbies' && (
            <View style={styles.hobbiesSection}>
              {hobbies.length === 0 ? (
                <View style={styles.emptyHobbiesState}>
                  <Sparkles size={32} color="#FF6B9D" />
                  <Text style={styles.emptyHobbiesText}>No hobbies yet</Text>
                  <Text style={styles.emptyHobbiesSubtext}>Create a hobby to start tracking your progress</Text>
                  <TouchableOpacity
                    style={[styles.createHobbyButton, { backgroundColor: CATEGORY_DATA.hobbies.color }]}
                    onPress={() => {
                      if (Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      router.push('/create-hobby' as any);
                    }}
                  >
                    <Plus size={16} color="#fff" />
                    <Text style={styles.createHobbyButtonText}>Create Hobby</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={styles.hobbiesLabel}>Select a hobby:</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.hobbiesScroll}
                  >
                    {hobbies.map(hobby => (
                      <TouchableOpacity
                        key={hobby.id}
                        style={[
                          styles.hobbyCard,
                          selectedHobby === hobby.id && styles.hobbyCardActive,
                          selectedHobby === hobby.id && { borderColor: CATEGORY_DATA.hobbies.color },
                        ]}
                        onPress={() => {
                          if (Platform.OS !== 'web') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                          setSelectedHobby(hobby.id);
                        }}
                      >
                        <Star size={20} color={selectedHobby === hobby.id ? CATEGORY_DATA.hobbies.color : '#ffffff99'} />
                        <Text
                          style={[
                            styles.hobbyCardText,
                            selectedHobby === hobby.id && styles.hobbyCardTextActive,
                          ]}
                        >
                          {hobby.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      style={styles.addHobbyCard}
                      onPress={() => {
                        if (Platform.OS !== 'web') {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                        router.push('/create-hobby' as any);
                      }}
                    >
                      <Plus size={20} color="#ffffff99" />
                      <Text style={styles.addHobbyCardText}>Add Hobby</Text>
                    </TouchableOpacity>
                  </ScrollView>
                </>
              )}
            </View>
          )}

          {selectedCategory !== 'hobbies' && (
            <View style={styles.dailyProgressContainer}>
              <Text style={styles.dailyProgressText}>
                Daily Quests: {dailyQuestProgress.completed}/{dailyQuestProgress.limit} completed
              </Text>
              {!canCompleteMoreDaily && (
                <Text style={styles.dailyLimitText}>Come back tomorrow for more!</Text>
              )}
            </View>
          )}

          {(activeDailyQuests.length > 0 || activeShortTermQuests.length > 0 || activeLongTermQuests.length > 0 || activeCustomQuests.length > 0) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Active Quests</Text>
              
              {activeDailyQuests.length > 0 && (
                <>
                  <Text style={styles.subsectionTitle}>Daily</Text>
                  {activeDailyQuests.map(quest => renderQuestCard(quest, true))}
                </>
              )}
              
              {activeShortTermQuests.length > 0 && (
                <>
                  <Text style={styles.subsectionTitle}>Short-Term</Text>
                  {activeShortTermQuests.map(quest => renderQuestCard(quest, true))}
                </>
              )}
              
              {activeLongTermQuests.length > 0 && (
                <>
                  <Text style={styles.subsectionTitle}>Long-Term</Text>
                  {activeLongTermQuests.map(quest => renderQuestCard(quest, true))}
                </>
              )}
              
              {activeCustomQuests.length > 0 && (
                <>
                  <Text style={styles.subsectionTitle}>Custom</Text>
                  {activeCustomQuests.map(quest => renderQuestCard(quest, true))}
                </>
              )}
            </View>
          )}

          {(availableDailyQuestsForToday.length > 0 || availableShortTermQuests.length > 0 || availableLongTermQuests.length > 0) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Available Quests</Text>
              
              {availableDailyQuestsForToday.length > 0 && (
                <>
                  <View style={styles.subsectionHeader}>
                    <Text style={styles.subsectionTitle}>Daily (Today&apos;s Quests)</Text>
                    {!canCompleteMoreDaily && (
                      <View style={styles.limitBadge}>
                        <Text style={styles.limitBadgeText}>LIMIT REACHED</Text>
                      </View>
                    )}
                  </View>
                  {availableDailyQuestsForToday.map((quest, index) => renderAvailableQuestCard(quest, index))}
                </>
              )}
              
              {availableShortTermQuests.length > 0 && (
                <>
                  <Text style={styles.subsectionTitle}>Short-Term</Text>
                  {availableShortTermQuests.map((quest, index) => renderAvailableQuestCard(quest, index))}
                </>
              )}
              
              {availableLongTermQuests.length > 0 && (
                <>
                  <Text style={styles.subsectionTitle}>Long-Term</Text>
                  {availableLongTermQuests.map((quest, index) => renderAvailableQuestCard(quest, index))}
                </>
              )}
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsContainer: {
    marginBottom: 24,
  },
  tabsContent: {
    gap: 8,
    paddingRight: 20,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#ffffff10',
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  tabActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ffffff99',
  },
  tabTextActive: {
    color: '#fff',
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
  subsectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffff99',
  },
  limitBadge: {
    backgroundColor: '#ff4757',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  limitBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#fff',
  },
  dailyProgressContainer: {
    backgroundColor: '#ffffff10',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  dailyProgressText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 4,
  },
  dailyLimitText: {
    fontSize: 12,
    color: '#4ECDC4',
    fontStyle: 'italic' as const,
  },
  questCard: {
    backgroundColor: '#ffffff10',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  questCardCompleted: {
    opacity: 0.6,
  },
  questLeft: {
    flexDirection: 'row',
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
  },
  questTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 4,
  },
  questTitleCompleted: {
    textDecorationLine: 'line-through',
  },
  questDescription: {
    fontSize: 14,
    color: '#ffffff99',
    marginBottom: 4,
  },
  questMeta: {
    fontSize: 12,
    color: '#4ECDC4',
    marginTop: 4,
  },
  questRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
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
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4ECDC4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  hobbiesSection: {
    marginBottom: 20,
  },
  emptyHobbiesState: {
    backgroundColor: '#ffffff10',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  emptyHobbiesText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
    marginTop: 12,
  },
  emptyHobbiesSubtext: {
    fontSize: 14,
    color: '#ffffff99',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  createHobbyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createHobbyButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  hobbiesLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 12,
  },
  hobbiesScroll: {
    gap: 12,
    paddingRight: 20,
  },
  hobbyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff10',
    borderWidth: 2,
    borderColor: '#ffffff20',
  },
  hobbyCardActive: {
    backgroundColor: '#ffffff15',
  },
  hobbyCardText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ffffff99',
  },
  hobbyCardTextActive: {
    color: '#fff',
  },
  addHobbyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff05',
    borderWidth: 2,
    borderColor: '#ffffff20',
    borderStyle: 'dashed' as const,
  },
  addHobbyCardText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ffffff99',
  },
});
