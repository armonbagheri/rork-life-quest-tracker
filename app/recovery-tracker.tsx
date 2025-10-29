import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Stack } from 'expo-router';
import { 
  Shield, 
  Plus, 
  TrendingUp, 
  AlertCircle,
  Trophy,
  X,
  Check,
  Clock,
  MessageCircle,
  Trash2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRecovery } from '@/context/RecoveryContext';
import { RecoveryItem } from '@/types';
import { CATEGORY_DATA } from '@/constants/categories';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RecoveryTrackerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { recoveryItems, addRecoveryItem, logRelapse, logSuccess, deleteRecoveryItem } = useRecovery();

  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');

  const [selectedItem, setSelectedItem] = useState<RecoveryItem | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logNote, setLogNote] = useState('');
  const [logType, setLogType] = useState<'success' | 'relapse'>('success');

  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      Alert.alert('Error', 'Please enter a name for what you want to quit');
      return;
    }

    await addRecoveryItem(newItemName.trim(), newItemDescription.trim() || undefined);
    setNewItemName('');
    setNewItemDescription('');
    setShowAddModal(false);

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleLog = async () => {
    if (!selectedItem) return;

    if (logType === 'relapse') {
      await logRelapse(selectedItem.id, logNote.trim() || undefined);
    } else {
      await logSuccess(selectedItem.id, logNote.trim() || undefined);
    }

    setLogNote('');
    setShowLogModal(false);
    setSelectedItem(null);

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(
        logType === 'relapse' 
          ? Haptics.NotificationFeedbackType.Warning 
          : Haptics.NotificationFeedbackType.Success
      );
    }
  };

  const handleDelete = (item: RecoveryItem) => {
    Alert.alert(
      'Delete Recovery Item',
      `Are you sure you want to delete "${item.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteRecoveryItem(item.id);
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          },
        },
      ]
    );
  };

  const formatDays = (days: number) => {
    if (days === 0) return 'Today';
    if (days === 1) return '1 day';
    if (days < 7) return `${days} days`;
    if (days < 30) {
      const weeks = Math.floor(days / 7);
      const remainingDays = days % 7;
      if (remainingDays === 0) return `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
      return `${weeks}w ${remainingDays}d`;
    }
    if (days < 365) {
      const months = Math.floor(days / 30);
      const remainingDays = days % 30;
      if (remainingDays === 0) return `${months} ${months === 1 ? 'month' : 'months'}`;
      return `${months}m ${remainingDays}d`;
    }
    const years = Math.floor(days / 365);
    const remainingDays = days % 365;
    if (remainingDays === 0) return `${years} ${years === 1 ? 'year' : 'years'}`;
    return `${years}y ${remainingDays}d`;
  };

  const renderRecoveryCard = (item: RecoveryItem) => {
    const recoveryColor = CATEGORY_DATA.recovery.color;

    return (
      <View key={item.id} style={styles.recoveryCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.iconContainer, { backgroundColor: recoveryColor }]}>
              <Shield size={20} color="#fff" />
            </View>
            <View style={styles.cardTitleContainer}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              {item.description && (
                <Text style={styles.cardDescription}>{item.description}</Text>
              )}
            </View>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item)}
          >
            <Trash2 size={18} color="#ff4757" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <TrendingUp size={20} color="#4ECDC4" />
            </View>
            <Text style={styles.statLabel}>Current Streak</Text>
            <Text style={styles.statValue}>{formatDays(item.currentStreak)}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Trophy size={20} color="#FFD700" />
            </View>
            <Text style={styles.statLabel}>Longest Streak</Text>
            <Text style={styles.statValue}>{formatDays(item.longestStreak)}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Clock size={20} color="#667eea" />
            </View>
            <Text style={styles.statLabel}>Total Days</Text>
            <Text style={styles.statValue}>{formatDays(item.totalDays)}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <AlertCircle size={20} color="#ff4757" />
            </View>
            <Text style={styles.statLabel}>Relapses</Text>
            <Text style={styles.statValue}>{item.relapseCount}</Text>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.successButton]}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setSelectedItem(item);
              setLogType('success');
              setShowLogModal(true);
            }}
          >
            <Check size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Log Milestone</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.relapseButton]}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setSelectedItem(item);
              setLogType('relapse');
              setShowLogModal(true);
            }}
          >
            <AlertCircle size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Log Relapse</Text>
          </TouchableOpacity>
        </View>

        {item.logs.length > 0 && (
          <View style={styles.logsContainer}>
            <Text style={styles.logsTitle}>Recent Activity</Text>
            {item.logs
              .slice()
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .slice(0, 3)
              .map((log) => {
                const logDate = new Date(log.timestamp);
                const formattedDate = logDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <View key={log.id} style={styles.logItem}>
                    <View
                      style={[
                        styles.logDot,
                        { backgroundColor: log.type === 'success' ? '#4ECDC4' : '#ff4757' },
                      ]}
                    />
                    <View style={styles.logContent}>
                      <Text style={styles.logType}>
                        {log.type === 'success' ? 'Milestone' : 'Relapse'}
                      </Text>
                      <Text style={styles.logDate}>{formattedDate}</Text>
                      {log.note && <Text style={styles.logNote}>{log.note}</Text>}
                    </View>
                  </View>
                );
              })}
          </View>
        )}
      </View>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Recovery Tracker',
          headerStyle: {
            backgroundColor: '#1a1a2e',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerBackTitle: 'Back',
        }}
      />
      <View style={styles.container}>
        <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.background}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingTop: 24, paddingBottom: Math.max(insets.bottom, 20) + 24 }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <View style={styles.headerTextContainer}>
                <Text style={styles.title}>Recovery Tracker</Text>
                <Text style={styles.subtitle}>
                  Track your journey to freedom from addictions
                </Text>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setShowAddModal(true);
                }}
              >
                <Plus size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {recoveryItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Shield size={48} color={CATEGORY_DATA.recovery.color} />
                <Text style={styles.emptyStateTitle}>Start Your Recovery Journey</Text>
                <Text style={styles.emptyStateText}>
                  Add something you want to quit and track your progress day by day
                </Text>
                <TouchableOpacity
                  style={[styles.emptyStateButton, { backgroundColor: CATEGORY_DATA.recovery.color }]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setShowAddModal(true);
                  }}
                >
                  <Plus size={16} color="#fff" />
                  <Text style={styles.emptyStateButtonText}>Add Recovery Item</Text>
                </TouchableOpacity>

                <View style={styles.aiCoachPrompt}>
                  <MessageCircle size={20} color="#667eea" />
                  <Text style={styles.aiCoachPromptText}>
                    Need help? Talk to your AI Coach for personalized support and strategies
                  </Text>
                  <TouchableOpacity
                    style={styles.aiCoachButton}
                    onPress={() => {
                      if (Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      router.push('/ai-coach');
                    }}
                  >
                    <Text style={styles.aiCoachButtonText}>Talk to AI Coach</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                {recoveryItems.map(renderRecoveryCard)}

                <View style={styles.aiCoachPrompt}>
                  <MessageCircle size={20} color="#667eea" />
                  <Text style={styles.aiCoachPromptText}>
                    Get personalized support from your AI Coach
                  </Text>
                  <TouchableOpacity
                    style={styles.aiCoachButton}
                    onPress={() => {
                      if (Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      router.push('/ai-coach');
                    }}
                  >
                    <Text style={styles.aiCoachButtonText}>Talk to AI Coach</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </LinearGradient>

        <Modal
          visible={showAddModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAddModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Recovery Item</Text>
                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                  <X size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>What do you want to quit?</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Alcohol, Smoking, etc."
                placeholderTextColor="#ffffff60"
                value={newItemName}
                onChangeText={setNewItemName}
              />

              <Text style={styles.inputLabel}>Description (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Why do you want to quit?"
                placeholderTextColor="#ffffff60"
                value={newItemDescription}
                onChangeText={setNewItemDescription}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: CATEGORY_DATA.recovery.color }]}
                onPress={handleAddItem}
              >
                <Text style={styles.modalButtonText}>Start Tracking</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showLogModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowLogModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {logType === 'success' ? 'Log Milestone' : 'Log Relapse'}
                </Text>
                <TouchableOpacity onPress={() => setShowLogModal(false)}>
                  <X size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>
                {logType === 'success'
                  ? 'Share your progress (optional)'
                  : 'What happened? (optional)'}
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={
                  logType === 'success'
                    ? 'How are you feeling?'
                    : 'Understanding what led to this can help you avoid it next time'
                }
                placeholderTextColor="#ffffff60"
                value={logNote}
                onChangeText={setLogNote}
                multiline
                numberOfLines={4}
              />

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  {
                    backgroundColor: logType === 'success' ? '#4ECDC4' : '#ff4757',
                  },
                ]}
                onPress={handleLog}
              >
                <Text style={styles.modalButtonText}>
                  {logType === 'success' ? 'Log Milestone' : 'Log Relapse'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#ffffff99',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    backgroundColor: '#ffffff10',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#ffffff99',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  recoveryCard: {
    backgroundColor: '#ffffff10',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#ffffff99',
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#ffffff08',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#ffffff99',
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  successButton: {
    backgroundColor: '#4ECDC4',
  },
  relapseButton: {
    backgroundColor: '#ff4757',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  logsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#ffffff20',
    paddingTop: 16,
  },
  logsTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 12,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  logDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  logContent: {
    flex: 1,
  },
  logType: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 2,
  },
  logDate: {
    fontSize: 12,
    color: '#ffffff99',
    marginBottom: 4,
  },
  logNote: {
    fontSize: 13,
    color: '#ffffff99',
  },
  aiCoachPrompt: {
    backgroundColor: '#667eea20',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#667eea40',
    alignItems: 'center',
  },
  aiCoachPromptText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  aiCoachButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  aiCoachButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#fff',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff10',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#ffffff20',
    marginBottom: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
