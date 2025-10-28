import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Share,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  X,
  BookOpen,
  Download,
  Heart,
  DollarSign,
  Brain,
  Target,
  Users,
  Shield,
  Calendar,
  Star,
  Zap,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuests } from '@/context/QuestContext';
import { CATEGORY_DATA } from '@/constants/categories';
import { CategoryType } from '@/types';

export default function GrowthJournalScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { completedQuests } = useQuests();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('all');

  const filteredQuests = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (selectedPeriod) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0);
    }

    return completedQuests
      .filter((q) => {
        const completedDate = new Date(q.completedDate || '');
        return completedDate >= startDate;
      })
      .sort((a, b) => {
        const dateA = new Date(a.completedDate || 0).getTime();
        const dateB = new Date(b.completedDate || 0).getTime();
        return dateB - dateA;
      });
  }, [completedQuests, selectedPeriod]);

  const stats = useMemo(() => {
    const totalXP = filteredQuests.reduce((sum, q) => sum + q.xpValue, 0);
    const withReflections = filteredQuests.filter((q) => q.reflection).length;
    const categoryCount: Record<CategoryType, number> = {
      health: 0,
      wealth: 0,
      social: 0,
      discipline: 0,
      mental: 0,
      recovery: 0,
    };

    filteredQuests.forEach((q) => {
      categoryCount[q.category]++;
    });

    return { totalXP, withReflections, categoryCount };
  }, [filteredQuests]);

  const exportJournal = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const journalText = `Growth Journal - ${selectedPeriod.toUpperCase()}\n\n` +
      `Total Quests Completed: ${filteredQuests.length}\n` +
      `Total XP Earned: ${stats.totalXP}\n` +
      `Reflections: ${stats.withReflections}\n\n` +
      `=== QUEST LOG ===\n\n` +
      filteredQuests.map((quest, index) => {
        const category = CATEGORY_DATA[quest.category];
        const date = new Date(quest.completedDate || '').toLocaleDateString();
        let entry = `${index + 1}. ${quest.title}\n`;
        entry += `   Category: ${category.name}\n`;
        entry += `   Date: ${date}\n`;
        entry += `   XP: ${quest.xpValue}\n`;
        
        if (quest.reflection) {
          entry += `\n   REFLECTION:\n`;
          if (quest.reflection.learned) {
            entry += `   What I learned: ${quest.reflection.learned}\n`;
          }
          if (quest.reflection.feeling) {
            entry += `   How I felt: ${quest.reflection.feeling}\n`;
          }
          entry += `   Difficulty: ${quest.reflection.difficulty}/5\n`;
          entry += `   Satisfaction: ${quest.reflection.satisfaction}/5\n`;
        }
        
        return entry;
      }).join('\n\n');

    try {
      if (Platform.OS === 'web') {
        const blob = new Blob([journalText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `growth-journal-${selectedPeriod}.txt`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        await Share.share({
          message: journalText,
          title: 'My Growth Journal',
        });
      }
    } catch (error) {
      console.error('Export failed:', error);
      if (Platform.OS !== 'web') {
        Alert.alert('Export Failed', 'Could not export journal');
      }
    }
  };

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
          <Text style={styles.title}>Growth Journal</Text>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={exportJournal}
          >
            <Download size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.periodSelector}>
          {(['week', 'month', 'all'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive,
              ]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setSelectedPeriod(period);
              }}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === period && styles.periodButtonTextActive,
                ]}
              >
                {period === 'week' ? 'Week' : period === 'month' ? 'Month' : 'All Time'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <BookOpen size={20} color="#4ECDC4" />
            <Text style={styles.statValue}>{filteredQuests.length}</Text>
            <Text style={styles.statLabel}>Quests</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Zap size={20} color="#FFD700" />
            <Text style={styles.statValue}>{stats.totalXP}</Text>
            <Text style={styles.statLabel}>XP</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Star size={20} color="#FF6B6B" />
            <Text style={styles.statValue}>{stats.withReflections}</Text>
            <Text style={styles.statLabel}>Reflections</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredQuests.length === 0 ? (
            <View style={styles.emptyState}>
              <BookOpen size={64} color="#ffffff40" />
              <Text style={styles.emptyText}>No entries yet</Text>
              <Text style={styles.emptySubtext}>
                Complete quests to build your growth journal
              </Text>
            </View>
          ) : (
            filteredQuests.map((quest) => {
              const category = CATEGORY_DATA[quest.category];
              const date = new Date(quest.completedDate || '').toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <View key={quest.id} style={styles.entryCard}>
                  <View style={styles.entryHeader}>
                    <View
                      style={[
                        styles.categoryIcon,
                        { backgroundColor: category.color },
                      ]}
                    >
                      {getCategoryIcon(quest.category)}
                    </View>
                    <View style={styles.entryHeaderText}>
                      <Text style={styles.entryTitle}>{quest.title}</Text>
                      <View style={styles.entryMeta}>
                        <Calendar size={14} color="#ffffff99" />
                        <Text style={styles.entryDate}>{date}</Text>
                      </View>
                    </View>
                    <View style={styles.xpBadge}>
                      <Zap size={14} color="#FFD700" fill="#FFD700" />
                      <Text style={styles.xpBadgeText}>{quest.xpValue}</Text>
                    </View>
                  </View>

                  {quest.reflection && (
                    <View style={styles.reflectionContent}>
                      {quest.reflection.learned && (
                        <View style={styles.reflectionItem}>
                          <Text style={styles.reflectionLabel}>What I Learned</Text>
                          <Text style={styles.reflectionText}>{quest.reflection.learned}</Text>
                        </View>
                      )}

                      {quest.reflection.feeling && (
                        <View style={styles.reflectionItem}>
                          <Text style={styles.reflectionLabel}>How I Felt</Text>
                          <Text style={styles.reflectionText}>{quest.reflection.feeling}</Text>
                        </View>
                      )}

                      <View style={styles.reflectionRatings}>
                        <View style={styles.ratingBox}>
                          <Text style={styles.ratingBoxLabel}>Difficulty</Text>
                          <View style={styles.stars}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={12}
                                color={star <= quest.reflection!.difficulty ? '#FFD700' : '#ffffff40'}
                                fill={star <= quest.reflection!.difficulty ? '#FFD700' : 'transparent'}
                              />
                            ))}
                          </View>
                        </View>
                        <View style={styles.ratingBox}>
                          <Text style={styles.ratingBoxLabel}>Satisfaction</Text>
                          <View style={styles.stars}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={12}
                                color={star <= quest.reflection!.satisfaction ? '#4ECDC4' : '#ffffff40'}
                                fill={star <= quest.reflection!.satisfaction ? '#4ECDC4' : 'transparent'}
                              />
                            ))}
                          </View>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              );
            })
          )}

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
  exportButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#ffffff10',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  periodButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ffffff99',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff10',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#ffffff99',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#ffffff20',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#fff',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ffffff99',
    marginTop: 8,
    textAlign: 'center',
  },
  entryCard: {
    backgroundColor: '#ffffff10',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryHeaderText: {
    flex: 1,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 4,
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  entryDate: {
    fontSize: 12,
    color: '#ffffff99',
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFD70020',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  xpBadgeText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFD700',
  },
  reflectionContent: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ffffff20',
  },
  reflectionItem: {
    marginBottom: 12,
  },
  reflectionLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#ffffff99',
    marginBottom: 4,
  },
  reflectionText: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
  reflectionRatings: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  ratingBox: {
    flex: 1,
    backgroundColor: '#ffffff10',
    borderRadius: 8,
    padding: 8,
  },
  ratingBoxLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#ffffff99',
    marginBottom: 4,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
});
