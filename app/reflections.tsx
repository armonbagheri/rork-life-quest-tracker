import React, { useMemo, useState } from 'react';
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
import { X, BookOpen, Star, Heart, DollarSign, Brain, Target, Users, Shield } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useQuests } from '@/context/QuestContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CATEGORY_DATA } from '@/constants/categories';
import { CategoryType } from '@/types';

export default function ReflectionsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { completedQuests } = useQuests();
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'all'>('all');

  const questsWithReflections = useMemo(() => {
    return completedQuests
      .filter(q => q.reflection)
      .filter(q => selectedCategory === 'all' || q.category === selectedCategory)
      .sort((a, b) => {
        const dateA = new Date(a.completedDate || 0).getTime();
        const dateB = new Date(b.completedDate || 0).getTime();
        return dateB - dateA;
      });
  }, [completedQuests, selectedCategory]);

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

  const categories: (CategoryType | 'all')[] = ['all', 'health', 'wealth', 'social', 'discipline', 'mental', 'recovery'];

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
          <Text style={styles.title}>Reflections</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryScrollContent}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryFilter,
                selectedCategory === cat && styles.categoryFilterActive,
              ]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setSelectedCategory(cat);
              }}
            >
              <Text
                style={[
                  styles.categoryFilterText,
                  selectedCategory === cat && styles.categoryFilterTextActive,
                ]}
              >
                {cat === 'all' ? 'All' : CATEGORY_DATA[cat].name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {questsWithReflections.length === 0 ? (
            <View style={styles.emptyState}>
              <BookOpen size={64} color="#ffffff40" />
              <Text style={styles.emptyText}>No reflections yet</Text>
              <Text style={styles.emptySubtext}>
                Complete quests with reflections to see them here
              </Text>
            </View>
          ) : (
            questsWithReflections.map((quest) => {
              const category = CATEGORY_DATA[quest.category];
              const reflection = quest.reflection!;
              const date = new Date(quest.completedDate || '').toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <View key={quest.id} style={styles.reflectionCard}>
                  <View style={styles.reflectionHeader}>
                    <View
                      style={[
                        styles.categoryBadge,
                        { backgroundColor: category.color },
                      ]}
                    >
                      {getCategoryIcon(quest.category)}
                    </View>
                    <View style={styles.reflectionTitleContainer}>
                      <Text style={styles.questTitle}>{quest.title}</Text>
                      <Text style={styles.questDate}>{date}</Text>
                    </View>
                  </View>

                  {reflection.learned && (
                    <View style={styles.reflectionSection}>
                      <Text style={styles.reflectionLabel}>What I Learned</Text>
                      <Text style={styles.reflectionText}>{reflection.learned}</Text>
                    </View>
                  )}

                  {reflection.feeling && (
                    <View style={styles.reflectionSection}>
                      <Text style={styles.reflectionLabel}>How I Felt</Text>
                      <Text style={styles.reflectionText}>{reflection.feeling}</Text>
                    </View>
                  )}

                  <View style={styles.ratingsContainer}>
                    <View style={styles.ratingItem}>
                      <Text style={styles.ratingLabel}>Difficulty</Text>
                      <View style={styles.stars}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={16}
                            color={star <= reflection.difficulty ? '#FFD700' : '#ffffff40'}
                            fill={star <= reflection.difficulty ? '#FFD700' : 'transparent'}
                          />
                        ))}
                      </View>
                    </View>

                    <View style={styles.ratingItem}>
                      <Text style={styles.ratingLabel}>Satisfaction</Text>
                      <View style={styles.stars}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={16}
                            color={star <= reflection.satisfaction ? '#4ECDC4' : '#ffffff40'}
                            fill={star <= reflection.satisfaction ? '#4ECDC4' : 'transparent'}
                          />
                        ))}
                      </View>
                    </View>
                  </View>
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
  categoryScroll: {
    maxHeight: 60,
    marginBottom: 20,
  },
  categoryScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryFilter: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#ffffff10',
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  categoryFilterActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  categoryFilterText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ffffff99',
  },
  categoryFilterTextActive: {
    color: '#fff',
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
  reflectionCard: {
    backgroundColor: '#ffffff10',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  reflectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  categoryBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reflectionTitleContainer: {
    flex: 1,
  },
  questTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 4,
  },
  questDate: {
    fontSize: 12,
    color: '#ffffff99',
  },
  reflectionSection: {
    marginBottom: 16,
  },
  reflectionLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ffffff99',
    marginBottom: 6,
  },
  reflectionText: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 22,
  },
  ratingsContainer: {
    flexDirection: 'row',
    gap: 20,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ffffff20',
  },
  ratingItem: {
    flex: 1,
  },
  ratingLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#ffffff99',
    marginBottom: 6,
  },
  stars: {
    flexDirection: 'row',
    gap: 4,
  },
});
