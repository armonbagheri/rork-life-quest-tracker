import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Check, Plus, Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useQuests } from '@/context/QuestContext';
import { CATEGORY_DATA, QUEST_XP_VALUES } from '@/constants/categories';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CategoryType, QuestType, MicroGoal } from '@/types';

export default function CreateQuestScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { addCustomQuest, hobbies } = useQuests();

  const isEditMode = params.editMode === 'true';
  const defaultCategory = (params.defaultCategory as CategoryType) || (params.questCategory as CategoryType) || 'health';
  const defaultHobbySubcategory = params.hobbySubcategory as string | undefined;

  const [title, setTitle] = useState(isEditMode ? (params.questTitle as string || '') : '');
  const [description, setDescription] = useState(isEditMode ? (params.questDescription as string || '') : '');
  const [category, setCategory] = useState<CategoryType>(defaultCategory);
  const [questType, setQuestType] = useState<QuestType>(isEditMode ? (params.questType as QuestType || 'daily') : 'daily');
  const [microGoals, setMicroGoals] = useState<MicroGoal[]>(isEditMode && params.questMicroGoals ? JSON.parse(params.questMicroGoals as string) : []);
  const [newMicroGoalTitle, setNewMicroGoalTitle] = useState('');
  const [hobbySubcategory, setHobbySubcategory] = useState<string | undefined>(defaultHobbySubcategory);

  const xpValue = questType === 'daily' ? QUEST_XP_VALUES.daily :
                 questType === 'short' ? QUEST_XP_VALUES.short :
                 questType === 'long' ? QUEST_XP_VALUES.long :
                 QUEST_XP_VALUES.daily;

  const handleAddMicroGoal = () => {
    if (newMicroGoalTitle.trim()) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      const microGoalXP = Math.floor(xpValue / (microGoals.length + 2));
      setMicroGoals([
        ...microGoals,
        {
          id: `${Date.now()}-${Math.random()}`,
          title: newMicroGoalTitle.trim(),
          completed: false,
          xpValue: microGoalXP,
        },
      ]);
      setNewMicroGoalTitle('');
    }
  };

  const handleRemoveMicroGoal = (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setMicroGoals(microGoals.filter(goal => goal.id !== id));
  };

  const handleCreate = async () => {
    if (!title.trim() || !description.trim()) {
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    await addCustomQuest(
      category,
      title.trim(),
      description.trim(),
      questType,
      xpValue,
      microGoals.length > 0 ? microGoals : undefined,
      undefined,
      hobbySubcategory
    );
    
    router.back();
  };

  const categoryData = CATEGORY_DATA[category];

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
            <Text style={styles.title}>{isEditMode ? 'Customize Quest' : 'Create Quest'}</Text>
            <TouchableOpacity
              style={[
                styles.saveButton,
                (!title.trim() || !description.trim()) && styles.saveButtonDisabled,
              ]}
              onPress={handleCreate}
              disabled={!title.trim() || !description.trim()}
            >
              <Check size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter quest title"
              placeholderTextColor="#ffffff60"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your quest"
              placeholderTextColor="#ffffff60"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.optionScroll}
            >
              {(Object.keys(CATEGORY_DATA) as CategoryType[]).filter(cat => cat !== 'hobbies').map(cat => {
                const catData = CATEGORY_DATA[cat];
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.optionButton,
                      category === cat && [
                        styles.optionButtonActive,
                        { backgroundColor: catData.color, borderColor: catData.color },
                      ],
                    ]}
                    onPress={() => {
                      if (Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      setCategory(cat);
                    }}
                  >
                    <Text style={styles.optionText}>{catData.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {category === 'hobbies' && hobbySubcategory && (
            <View style={styles.hobbyInfo}>
              <Text style={styles.hobbyInfoLabel}>Hobby:</Text>
              <Text style={styles.hobbyInfoValue}>
                {hobbies.find(h => h.id === hobbySubcategory)?.name || 'Unknown Hobby'}
              </Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.label}>Quest Type</Text>
            <View style={styles.optionRow}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  questType === 'daily' && styles.typeButtonActive,
                ]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setQuestType('daily');
                }}
              >
                <Text style={[
                  styles.typeButtonText,
                  questType === 'daily' && styles.typeButtonTextActive,
                ]}>
                  Daily
                </Text>
                <Text style={styles.typeXP}>{QUEST_XP_VALUES.daily} XP</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  questType === 'short' && styles.typeButtonActive,
                ]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setQuestType('short');
                }}
              >
                <Text style={[
                  styles.typeButtonText,
                  questType === 'short' && styles.typeButtonTextActive,
                ]}>
                  Short-Term
                </Text>
                <Text style={styles.typeXP}>{QUEST_XP_VALUES.short} XP</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  questType === 'long' && styles.typeButtonActive,
                ]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setQuestType('long');
                }}
              >
                <Text style={[
                  styles.typeButtonText,
                  questType === 'long' && styles.typeButtonTextActive,
                ]}>
                  Long-Term
                </Text>
                <Text style={styles.typeXP}>{QUEST_XP_VALUES.long} XP</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>
                {questType === 'long' ? 'Milestones' : 'Steps'} (Optional)
              </Text>
              <Text style={styles.labelHint}>Break down your quest</Text>
            </View>
            {microGoals.map((goal, index) => (
              <View key={goal.id} style={styles.microGoalItem}>
                <View style={styles.microGoalLeft}>
                  <View
                    style={[
                      styles.microGoalNumber,
                      { backgroundColor: categoryData.color + '20', borderColor: categoryData.color },
                    ]}
                  >
                    <Text style={[styles.microGoalNumberText, { color: categoryData.color }]}>
                      {index + 1}
                    </Text>
                  </View>
                  <Text style={styles.microGoalText}>{goal.title}</Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleRemoveMicroGoal(goal.id)}
                >
                  <Trash2 size={16} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
            ))}
            <View style={styles.addMicroGoalRow}>
              <TextInput
                style={styles.microGoalInput}
                value={newMicroGoalTitle}
                onChangeText={setNewMicroGoalTitle}
                placeholder={`Add a ${questType === 'long' ? 'milestone' : 'step'}`}
                placeholderTextColor="#ffffff60"
                onSubmitEditing={handleAddMicroGoal}
              />
              <TouchableOpacity
                style={[
                  styles.addMicroGoalButton,
                  { backgroundColor: categoryData.color },
                ]}
                onPress={handleAddMicroGoal}
              >
                <Plus size={20} color="#fff" />
              </TouchableOpacity>
            </View>
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
  saveButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4ECDC4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  labelHint: {
    fontSize: 12,
    color: '#ffffff60',
  },
  input: {
    backgroundColor: '#ffffff10',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  optionScroll: {
    gap: 8,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#ffffff10',
    borderWidth: 2,
    borderColor: '#ffffff20',
  },
  optionButtonActive: {
    borderColor: '#667eea',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  typeButton: {
    flex: 1,
    backgroundColor: '#ffffff10',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#ffffff20',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ffffff99',
    marginBottom: 4,
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  typeXP: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '600' as const,
  },
  microGoalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff10',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  microGoalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  microGoalNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  microGoalNumberText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  microGoalText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
    flex: 1,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B6B20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMicroGoalRow: {
    flexDirection: 'row',
    gap: 8,
  },
  microGoalInput: {
    flex: 1,
    backgroundColor: '#ffffff10',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  addMicroGoalButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hobbyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FF6B9D20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FF6B9D40',
  },
  hobbyInfoLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FF6B9D',
  },
  hobbyInfoValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
