import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Zap, Heart, DollarSign, Brain, Target, Users, Shield, Check, XCircle, Edit2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useQuests } from '@/context/QuestContext';
import { CATEGORY_DATA } from '@/constants/categories';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Quest } from '@/types';
import { DEFAULT_DAILY_QUESTS, DEFAULT_SHORT_TERM_QUESTS, DEFAULT_LONG_TERM_QUESTS } from '@/constants/quests';

export default function QuestDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { quests, completeMilestone, activateQuest, cancelQuest } = useQuests();
  
  const questId = params.questId as string | undefined;
  const availableQuestTitle = params.availableQuestTitle as string | undefined;
  
  const [showCompleteButton, setShowCompleteButton] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showCancelButton, setShowCancelButton] = useState(false);
  const [pendingMilestone, setPendingMilestone] = useState<{ id: string; title: string } | null>(null);

  const quest = useMemo(() => {
    if (questId) {
      return quests.find(q => q.id === questId);
    }
    if (availableQuestTitle) {
      const allQuests = [...DEFAULT_DAILY_QUESTS, ...DEFAULT_SHORT_TERM_QUESTS, ...DEFAULT_LONG_TERM_QUESTS];
      return allQuests.find(q => q.title === availableQuestTitle);
    }
    return undefined;
  }, [questId, availableQuestTitle, quests]);

  const isAvailableQuest = !questId && availableQuestTitle;

  if (!quest) {
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
          </View>
          <View style={styles.centerContent}>
            <Text style={styles.errorText}>Quest not found</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  const category = CATEGORY_DATA[quest.category];

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

  const handleStartQuest = async () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      await activateQuest(quest as Omit<Quest, 'id' | 'status' | 'startDate'>);
      router.back();
    } catch (error) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      const errorMessage = error instanceof Error ? error.message : 'Failed to start quest';
      Alert.alert('Cannot Start Quest', errorMessage, [{ text: 'OK' }]);
    }
  };

  const handleCompleteQuest = () => {
    if (isCompleting) return;
    
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    setIsCompleting(true);
    router.push({
      pathname: '/post-to-feed',
      params: { questId: questId! },
    });
  };

  const handleCancelQuest = async () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    
    await cancelQuest(questId!);
    router.back();
  };

  const handleEditQuest = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push({
      pathname: '/create-quest' as any,
      params: {
        editMode: 'true',
        questTitle: quest.title,
        questDescription: quest.description,
        questCategory: quest.category,
        questType: quest.type,
        questXP: quest.xpValue.toString(),
        questMicroGoals: quest.microGoals ? JSON.stringify(quest.microGoals) : undefined,
      },
    });
  };

  const handleMilestonePress = (milestoneId: string, milestoneTitle: string) => {
    setPendingMilestone({ id: milestoneId, title: milestoneTitle });
  };

  const handleConfirmMilestone = async () => {
    if (!pendingMilestone) return;
    
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    const milestone = quest.microGoals?.find(m => m.id === pendingMilestone.id);
    if (!milestone) return;
    
    await completeMilestone(questId!, pendingMilestone.id);
    setPendingMilestone(null);
    
    router.push({
      pathname: '/post-to-feed' as any,
      params: {
        milestoneId: pendingMilestone.id,
        milestoneName: pendingMilestone.title,
        xpValue: milestone.xpValue.toString(),
        category: quest.category,
      },
    });
  };

  const handleCancelMilestone = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setPendingMilestone(null);
  };

  const totalMilestones = quest.microGoals?.length || 0;
  const completedMilestones = quest.microGoals?.filter(m => m.completed).length || 0;
  const allMilestonesCompleted = totalMilestones > 0 && completedMilestones === totalMilestones;

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
          {isAvailableQuest && (
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: category.color }]}
              onPress={handleEditQuest}
            >
              <Edit2 size={20} color="#fff" />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.questHeader}>
            <View
              style={[
                styles.categoryIconLarge,
                { backgroundColor: category.color },
              ]}
            >
              {getCategoryIcon(quest.category)}
            </View>
            <Text style={styles.questTitle}>{quest.title}</Text>
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: category.color + '30' },
              ]}
            >
              <Text style={[styles.categoryBadgeText, { color: category.color }]}>
                {category.name}
              </Text>
            </View>
          </View>

          <View style={styles.xpCard}>
            <Zap size={24} color="#FFD700" fill="#FFD700" />
            <Text style={styles.xpLabel}>XP Reward</Text>
            <Text style={styles.xpValue}>{quest.xpValue}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{quest.description}</Text>
          </View>

          {quest.microGoals && quest.microGoals.length > 0 && (
            <View style={styles.section}>
              <View style={styles.milestonesHeader}>
                <Text style={styles.sectionTitle}>
                  {quest.type === 'long' ? 'Milestones' : 'Steps'}
                </Text>
                <Text style={styles.progressText}>
                  {completedMilestones}/{totalMilestones}
                </Text>
              </View>
              {quest.microGoals.map((milestone) => (
                <TouchableOpacity
                  key={milestone.id}
                  style={[
                    styles.milestoneCard,
                    milestone.completed && styles.milestoneCardCompleted,
                  ]}
                  onPress={() => !milestone.completed && !isAvailableQuest && handleMilestonePress(milestone.id, milestone.title)}
                  disabled={milestone.completed || !!isAvailableQuest}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.milestoneCheckbox,
                      milestone.completed && styles.milestoneCheckboxCompleted,
                    ]}
                  >
                    {milestone.completed && <Check size={16} color="#fff" />}
                  </View>
                  <View style={styles.milestoneInfo}>
                    <Text
                      style={[
                        styles.milestoneTitle,
                        milestone.completed && styles.milestoneTitleCompleted,
                      ]}
                    >
                      {milestone.title}
                    </Text>
                    <View style={styles.milestoneXP}>
                      <Zap size={12} color="#FFD700" fill="#FFD700" />
                      <Text style={styles.milestoneXPText}>{milestone.xpValue} XP</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          {isAvailableQuest ? (
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: category.color }]}
              onPress={handleStartQuest}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Start Quest</Text>
            </TouchableOpacity>
          ) : showCancelButton ? (
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setShowCancelButton(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Go Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: '#FF4444' }]}
                onPress={handleCancelQuest}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmButtonText}>Confirm Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : showCompleteButton ? (
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setShowCompleteButton(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Go Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: category.color }]}
                onPress={handleCompleteQuest}
                disabled={isCompleting}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmButtonText}>
                  {isCompleting ? 'Completing...' : 'Confirm Complete'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.cancelQuestButton}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setShowCancelButton(true);
                }}
                activeOpacity={0.8}
              >
                <XCircle size={20} color="#FF4444" />
                <Text style={styles.cancelQuestButtonText}>Cancel Quest</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.completeQuestButton,
                  { backgroundColor: category.color },
                  (allMilestonesCompleted && totalMilestones > 0) && styles.pulseButton,
                ]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                  setShowCompleteButton(true);
                }}
                activeOpacity={0.8}
              >
                <Check size={20} color="#fff" />
                <Text style={styles.completeQuestButtonText}>
                  Complete Quest
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </LinearGradient>

      <Modal
        visible={!!pendingMilestone}
        transparent
        animationType="fade"
        onRequestClose={handleCancelMilestone}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <View style={styles.confirmModalHeader}>
              <Check size={32} color="#4ECDC4" />
            </View>
            <Text style={styles.confirmModalTitle}>Complete Milestone?</Text>
            <Text style={styles.confirmModalMessage}>
              Have you completed:
            </Text>
            <Text style={styles.confirmModalMilestone}>
              &ldquo;{pendingMilestone?.title}&rdquo;
            </Text>
            <View style={styles.confirmModalButtons}>
              <TouchableOpacity
                style={styles.confirmModalButtonCancel}
                onPress={handleCancelMilestone}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmModalButtonCancelText}>Not Yet</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmModalButtonConfirm}
                onPress={handleConfirmMilestone}
                activeOpacity={0.8}
              >
                <Check size={20} color="#fff" />
                <Text style={styles.confirmModalButtonConfirmText}>Yes, Complete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 20,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff10',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  questHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  categoryIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  questTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryBadgeText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  xpCard: {
    backgroundColor: '#ffffff10',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  xpLabel: {
    fontSize: 14,
    color: '#ffffff99',
    marginTop: 12,
    marginBottom: 4,
  },
  xpValue: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: '#FFD700',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#ffffff99',
    lineHeight: 24,
  },
  milestonesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#4ECDC4',
  },
  milestoneCard: {
    backgroundColor: '#ffffff10',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  milestoneCardCompleted: {
    opacity: 0.6,
  },
  milestoneCheckbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#ffffff40',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  milestoneCheckboxCompleted: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 4,
  },
  milestoneTitleCompleted: {
    textDecorationLine: 'line-through',
  },
  milestoneXP: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  milestoneXPText: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '600' as const,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: '#1a1a2e',
    borderTopWidth: 1,
    borderTopColor: '#ffffff10',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#ffffff10',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  confirmButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  pulseButton: {
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  actionButtons: {
    gap: 12,
  },
  cancelQuestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#ffffff10',
    borderWidth: 1,
    borderColor: '#FF6B6B40',
    marginBottom: 12,
  },
  cancelQuestButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FF6B6B',
  },
  completeQuestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  completeQuestButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000080',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  confirmModalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmModalTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#000',
    textAlign: 'center',
    marginBottom: 12,
  },
  confirmModalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmModalMilestone: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#000',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  confirmModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmModalButtonCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmModalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#666',
  },
  confirmModalButtonConfirm: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#4ECDC4',
  },
  confirmModalButtonConfirmText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
