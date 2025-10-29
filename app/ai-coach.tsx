import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Sparkles, Lock, Check, Send, AlertCircle, CheckCircle, Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAICoach } from '@/context/AICoachContext';
import { useQuests } from '@/context/QuestContext';
import { CATEGORY_DATA } from '@/constants/categories';
import { CategoryType, MicroGoal } from '@/types';
import { createRorkTool, useRorkAgent } from '@rork/toolkit-sdk';
import { z } from 'zod';

export default function AICoachScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { 
    coachLevel, 
    currentLevel, 
    availableLevels,
    upgradeCoach,
  } = useAICoach();
  const { quests: activeQuests, addCustomQuest, hobbies, addHobby } = useQuests();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [input, setInput] = useState('');
  const [pendingQuest, setPendingQuest] = useState<{
    title: string;
    description: string;
    category: CategoryType;
    type: 'daily' | 'short' | 'long';
    xpValue: number;
    microGoals?: { title: string; xpValue: number; }[];
    hobbySubcategory?: string;
  } | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('health');
  const [selectedHobby, setSelectedHobby] = useState<string | undefined>(undefined);
  const [newHobbyName, setNewHobbyName] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  const proposeQuestTool = createRorkTool({
    description: "Propose a quest to the user with detailed steps/milestones. Use this when the user asks for help with a goal or wants a plan. Always break down long-term and short-term quests into actionable milestones. For hobbies, make sure to provide hobby-specific advice.",
    zodSchema: z.object({
      title: z.string().describe("Quest title - clear and motivating"),
      description: z.string().describe("Detailed description of the quest"),
      category: z.enum(['health', 'wealth', 'social', 'discipline', 'mental', 'recovery', 'hobbies']).describe("Category that best fits this quest. Use 'hobbies' for hobby-specific quests."),
      type: z.enum(['daily', 'short', 'long']).describe("Quest duration: daily (1 day), short (2-7 days), long (1+ weeks)"),
      xpValue: z.number().describe("XP reward: 10-20 for daily, 30-50 for short, 60-100 for long"),
      microGoals: z.array(z.object({
        title: z.string(),
        xpValue: z.number()
      })).optional().describe("Break down into 3-5 actionable milestones for short/long quests. Each milestone should have 5-15 XP."),
      hobbySubcategory: z.string().optional().describe("For hobbies category, the hobby ID. Use this when proposing hobby-specific quests.")
    }),
    execute: async (input) => {
      console.log('[AI Coach] Quest proposed:', input);
      setPendingQuest(input);
      return "Quest proposal presented to user for confirmation.";
    }
  });

  const findQuestHelpTool = createRorkTool({
    description: "Get information about the user's active quests to provide help and guidance. Use this when user asks for help with an active quest.",
    zodSchema: z.object({
      searchQuery: z.string().optional().describe("Optional search term to filter quests")
    }),
    execute: async (input) => {
      const questsList = activeQuests
        .filter(q => !input.searchQuery || 
          q.title.toLowerCase().includes(input.searchQuery.toLowerCase()) ||
          q.description.toLowerCase().includes(input.searchQuery.toLowerCase())
        )
        .slice(0, 5)
        .map(q => ({
          title: q.title,
          description: q.description,
          category: q.category,
          type: q.type,
          hasSteps: !!q.microGoals,
          completedSteps: q.microGoals?.filter(m => m.completed).length || 0,
          totalSteps: q.microGoals?.length || 0
        }));
      
      return `Found ${questsList.length} active quest(s):\n${questsList.map(q => `- ${q.title} (${q.category}, ${q.type}): ${q.description.slice(0, 100)}...`).join('\n')}`;
    }
  });

  const { messages, error, sendMessage } = useRorkAgent({
    tools: {
      proposeQuest: proposeQuestTool,
      findQuestHelp: findQuestHelpTool,
    }
  });

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleClose = () => {
    router.back();
  };

  const handleUpgrade = (level: 1 | 2 | 3 | 4) => {
    if (level <= 2 || level <= coachLevel) {
      upgradeCoach(level);
      setShowUpgradeModal(false);
    }
  };

  const handleSendMessage = () => {
    if (input.trim()) {
      sendMessage(input.trim());
      setInput('');
    }
  };

  const [questToCreate, setQuestToCreate] = useState<{
    title: string;
    description: string;
    category: CategoryType;
    type: 'daily' | 'short' | 'long';
    xpValue: number;
    microGoals?: { title: string; xpValue: number; }[];
    hobbySubcategory?: string;
  } | null>(null);

  const handleAcceptQuest = async () => {
    if (!pendingQuest) return;

    setQuestToCreate(pendingQuest);
    setSelectedCategory(pendingQuest.category);
    setSelectedHobby(pendingQuest.hobbySubcategory);
    setPendingQuest(null);
    setShowCategoryModal(true);
  };

  const handleConfirmQuest = async () => {
    if (!questToCreate) return;

    let finalHobbySubcategory = selectedHobby;
    if (selectedCategory === 'hobbies' && newHobbyName.trim()) {
      finalHobbySubcategory = await addHobby(newHobbyName.trim());
      setNewHobbyName('');
    }

    const microGoals: MicroGoal[] | undefined = questToCreate.microGoals?.map((mg, idx) => ({
      id: `milestone-${Date.now()}-${idx}`,
      title: mg.title,
      completed: false,
      xpValue: mg.xpValue
    }));

    console.log('[AI Coach] Creating quest:', questToCreate.title);
    
    await addCustomQuest(
      selectedCategory,
      questToCreate.title,
      questToCreate.description,
      questToCreate.type,
      questToCreate.xpValue,
      microGoals,
      undefined,
      selectedCategory === 'hobbies' ? finalHobbySubcategory : undefined
    );

    console.log('[AI Coach] Quest created successfully');
    const questTitle = questToCreate.title;
    setQuestToCreate(null);
    setShowCategoryModal(false);
    
    setTimeout(() => {
      sendMessage(`I've accepted the quest "${questTitle}"! I'm ready to start working on it.`);
    }, 300);
  };

  const handleDeclineQuest = () => {
    const currentPendingQuest = pendingQuest;
    setPendingQuest(null);
    
    setTimeout(() => {
      if (currentPendingQuest) {
        sendMessage(`I'd like to revise the quest "${currentPendingQuest.title}". Can you suggest some improvements or alternatives?`);
      }
    }, 300);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.background}
      >
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <View style={styles.headerLeft}>
            <View style={styles.iconContainer}>
              <Sparkles size={24} color="#FFD700" />
            </View>
            <View>
              <Text style={styles.title}>AI Coach</Text>
              <Text style={styles.subtitle}>{currentLevel?.name}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              onPress={() => setShowUpgradeModal(true)}
              style={styles.levelButton}
            >
              <Text style={styles.levelButtonText}>L{coachLevel}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 20 }]}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <Sparkles size={48} color="#ffffff40" />
              <Text style={styles.emptyStateText}>Your AI Coach is ready!</Text>
              <Text style={styles.emptyStateSubtext}>
                Ask me anything about your quests, goals, or personal growth.
              </Text>
              <View style={styles.exampleQuestionsContainer}>
                <TouchableOpacity 
                  style={styles.exampleQuestion}
                  onPress={() => setInput("I want to build a meditation habit. Can you help me create a plan?")}
                >
                  <Text style={styles.exampleQuestionText}>🧘 Build meditation habit</Text>
                </TouchableOpacity>
                {hobbies.length > 0 && (
                  <TouchableOpacity 
                    style={styles.exampleQuestion}
                    onPress={() => setInput(`I want to improve in ${hobbies[0].name}. Can you help me create a training plan?`)}
                  >
                    <Text style={styles.exampleQuestionText}>⭐ Improve in {hobbies[0].name}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  style={styles.exampleQuestion}
                  onPress={() => setInput("I'm struggling with my active quest. Can you help?")}
                >
                  <Text style={styles.exampleQuestionText}>💪 Get help with quest</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.exampleQuestion}
                  onPress={() => setInput("I want to improve my social connections. What should I do?")}
                >
                  <Text style={styles.exampleQuestionText}>🤝 Improve social life</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            messages.map((m, idx) => {
              const messageKey = m.id || `message-${idx}-${Date.now()}`;
              return (
              <View key={messageKey} style={{ marginVertical: 8 }}>
                {m.role === 'user' ? (
                  <View style={styles.userMessage}>
                    <Text style={styles.userMessageText}>
                      {m.parts.map((p) => p.type === 'text' ? p.text : '').join('')}
                    </Text>
                  </View>
                ) : m.role === 'system' ? null : (
                  <View style={styles.assistantMessage}>
                    {m.parts.map((part, i) => {
                      const partKey = `${m.id}-part-${i}-${part.type}`;
                      switch (part.type) {
                        case 'text':
                          if (!part.text || part.text.trim() === '') {
                            return null;
                          }
                          return (
                            <View key={partKey}>
                              <Text style={styles.assistantMessageText}>{part.text}</Text>
                            </View>
                          );
                        case 'tool':
                          const toolName = part.toolName;
                          switch (part.state) {
                            case 'input-streaming':
                            case 'input-available':
                              if (toolName === 'proposeQuest') {
                                return null;
                              }
                              return (
                                <View key={partKey} style={styles.toolCall}>
                                  <ActivityIndicator size="small" color="#4ECDC4" />
                                  <Text style={styles.toolCallText}>Thinking...</Text>
                                </View>
                              );
                            case 'output-available':
                              return null;
                            case 'output-error':
                              return (
                                <View key={partKey} style={styles.toolError}>
                                  <AlertCircle size={16} color="#ff6b6b" />
                                  <Text style={styles.toolErrorText}>Error: {part.errorText}</Text>
                                </View>
                              );
                          }
                      }
                      return null;
                    }).filter(Boolean)}
                  </View>
                )}
              </View>
            );
            })
          )}
          {error && (
            <View style={styles.errorContainer}>
              <AlertCircle size={20} color="#ff6b6b" />
              <Text style={styles.errorText}>Something went wrong. Please try again.</Text>
            </View>
          )}
        </ScrollView>

        <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 12 }]}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask your AI coach..."
            placeholderTextColor="#ffffff60"
            multiline
            maxLength={500}
            onSubmitEditing={handleSendMessage}
          />
          <TouchableOpacity 
            style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]} 
            onPress={handleSendMessage}
            disabled={!input.trim()}
          >
            <Send size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <Modal
        visible={!!pendingQuest}
        transparent
        animationType="slide"
        onRequestClose={() => setPendingQuest(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.questProposalModal}>
            <View style={styles.questProposalHeader}>
              <Sparkles size={24} color="#FFD700" />
              <Text style={styles.questProposalTitle}>Quest Proposal</Text>
            </View>
            
            {pendingQuest && (
              <ScrollView style={styles.questProposalScroll}>
                <Text style={styles.questProposalQuestTitle}>{pendingQuest.title}</Text>
                <View style={styles.questProposalMeta}>
                  <View style={[styles.questProposalBadge, { backgroundColor: CATEGORY_DATA[pendingQuest.category].color }]}>
                    <Text style={styles.questProposalBadgeText}>{CATEGORY_DATA[pendingQuest.category].name}</Text>
                  </View>
                  <View style={styles.questProposalBadge}>
                    <Text style={styles.questProposalBadgeText}>{pendingQuest.xpValue} XP</Text>
                  </View>
                  <View style={styles.questProposalBadge}>
                    <Text style={styles.questProposalBadgeText}>{pendingQuest.type}</Text>
                  </View>
                </View>
                <Text style={styles.questProposalDescription}>{pendingQuest.description}</Text>
                
                {pendingQuest.microGoals && pendingQuest.microGoals.length > 0 && (
                  <View style={styles.questProposalMilestones}>
                    <Text style={styles.questProposalMilestonesTitle}>Milestones:</Text>
                    {pendingQuest.microGoals.map((mg, idx) => (
                      <View key={idx} style={styles.questProposalMilestone}>
                        <CheckCircle size={16} color="#4ECDC4" />
                        <Text style={styles.questProposalMilestoneText}>{mg.title}</Text>
                        <Text style={styles.questProposalMilestoneXP}>{mg.xpValue} XP</Text>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
            )}

            <View style={styles.questProposalActions}>
              <TouchableOpacity 
                style={[styles.questProposalButton, styles.questProposalButtonSecondary]}
                onPress={handleDeclineQuest}
              >
                <Text style={styles.questProposalButtonTextSecondary}>Revise Plan</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.questProposalButton, styles.questProposalButtonPrimary]}
                onPress={handleAcceptQuest}
              >
                <Text style={styles.questProposalButtonTextPrimary}>Accept Quest</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.categoryModal}>
            <View style={styles.categoryModalHeader}>
              <Text style={styles.categoryModalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <X size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.categoryModalScroll}>
              <Text style={styles.categoryModalSubtitle}>Choose which category this quest belongs to:</Text>
              
              <View style={styles.categoryGrid}>
                {(Object.keys(CATEGORY_DATA) as CategoryType[]).map(cat => {
                  const catData = CATEGORY_DATA[cat];
                  const isSelected = selectedCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryCard,
                        isSelected && [styles.categoryCardSelected, { borderColor: catData.color }],
                      ]}
                      onPress={() => {
                        setSelectedCategory(cat);
                        if (cat !== 'hobbies') {
                          setSelectedHobby(undefined);
                        }
                      }}
                    >
                      <View style={[styles.categoryCardIcon, { backgroundColor: catData.color + '20' }]}>
                        <Text style={styles.categoryCardIconText}>{catData.icon}</Text>
                      </View>
                      <Text style={styles.categoryCardName}>{catData.name}</Text>
                      {isSelected && (
                        <View style={[styles.categoryCardCheck, { backgroundColor: catData.color }]}>
                          <Check size={16} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {selectedCategory === 'hobbies' && (
                <View style={styles.hobbySelection}>
                  <Text style={styles.hobbySelectionTitle}>Select or Create Hobby:</Text>
                  
                  {hobbies.map(hobby => (
                    <TouchableOpacity
                      key={hobby.id}
                      style={[
                        styles.hobbyOption,
                        selectedHobby === hobby.id && styles.hobbyOptionSelected,
                      ]}
                      onPress={() => {
                        setSelectedHobby(hobby.id);
                        setNewHobbyName('');
                      }}
                    >
                      <Text style={styles.hobbyOptionText}>{hobby.name}</Text>
                      {selectedHobby === hobby.id && (
                        <Check size={20} color="#FF6B9D" />
                      )}
                    </TouchableOpacity>
                  ))}

                  <View style={styles.newHobbyContainer}>
                    <Text style={styles.newHobbyLabel}>Or create new hobby:</Text>
                    <View style={styles.newHobbyRow}>
                      <TextInput
                        style={styles.newHobbyInput}
                        value={newHobbyName}
                        onChangeText={(text) => {
                          setNewHobbyName(text);
                          if (text.trim()) {
                            setSelectedHobby(undefined);
                          }
                        }}
                        placeholder="Enter hobby name"
                        placeholderTextColor="#999"
                      />
                      {newHobbyName.trim() && (
                        <View style={styles.newHobbyIcon}>
                          <Plus size={20} color="#FF6B9D" />
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity 
              style={[
                styles.confirmCategoryButton,
                (!selectedCategory || (selectedCategory === 'hobbies' && !selectedHobby && !newHobbyName.trim())) && styles.confirmCategoryButtonDisabled,
              ]}
              onPress={handleConfirmQuest}
              disabled={!selectedCategory || (selectedCategory === 'hobbies' && !selectedHobby && !newHobbyName.trim())}
            >
              <Text style={styles.confirmCategoryButtonText}>Create Quest!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showUpgradeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUpgradeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Coach Levels</Text>
              <TouchableOpacity onPress={() => setShowUpgradeModal(false)}>
                <X size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {availableLevels.map((level) => {
                const isUnlocked = level.level <= 2 || level.level <= coachLevel;
                const isCurrent = level.level === coachLevel;

                return (
                  <TouchableOpacity
                    key={level.level}
                    style={[
                      styles.levelCard,
                      isCurrent && styles.levelCardActive,
                    ]}
                    onPress={() => handleUpgrade(level.level)}
                    disabled={!isUnlocked}
                  >
                    <View style={styles.levelCardHeader}>
                      <View>
                        <Text style={styles.levelCardTitle}>{level.name}</Text>
                        <Text style={styles.levelCardLevel}>Level {level.level}</Text>
                      </View>
                      {!isUnlocked && <Lock size={20} color="#999" />}
                      {isCurrent && <Check size={20} color="#4ECDC4" />}
                    </View>

                    <View style={styles.levelFeatures}>
                      {level.features.map((feature, index) => (
                        <Text key={index} style={styles.levelFeature}>
                          • {feature}
                        </Text>
                      ))}
                    </View>

                    {level.isPremium && (
                      <View style={styles.premiumBadge}>
                        <Text style={styles.premiumBadgeText}>Premium</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
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
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff20',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFD70020',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#ffffff99',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#FFD70030',
    borderWidth: 1,
    borderColor: '#FFD70060',
  },
  levelButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFD700',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  upgradeCard: {
    backgroundColor: '#FFD70020',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FFD70040',
  },
  upgradeCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upgradeTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 4,
  },
  upgradeSubtitle: {
    fontSize: 14,
    color: '#ffffff99',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flexBasis: '48%',
    flexGrow: 0,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
    textAlign: 'center',
  },
  messageCard: {
    backgroundColor: '#ffffff10',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  messageType: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#4ECDC4',
  },
  messageTime: {
    fontSize: 12,
    color: '#ffffff99',
  },
  messageContent: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
    marginBottom: 8,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#fff',
  },
  emptyState: {
    backgroundColor: '#ffffff10',
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#ffffff99',
    textAlign: 'center',
    marginBottom: 24,
  },
  exampleQuestionsContainer: {
    gap: 12,
    width: '100%',
  },
  exampleQuestion: {
    backgroundColor: '#ffffff10',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  exampleQuestionText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500' as const,
  },
  userMessage: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    alignSelf: 'flex-end',
    maxWidth: '80%',
  },
  userMessageText: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
  assistantMessage: {
    backgroundColor: '#ffffff10',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    alignSelf: 'flex-start',
    maxWidth: '85%',
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  assistantMessageText: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
  toolCall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  toolCallText: {
    fontSize: 12,
    color: '#4ECDC4',
    fontStyle: 'italic' as const,
  },
  toolError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    backgroundColor: '#ff6b6b20',
    padding: 8,
    borderRadius: 8,
  },
  toolErrorText: {
    fontSize: 12,
    color: '#ff6b6b',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
    backgroundColor: '#1a1a2e',
    borderTopWidth: 1,
    borderTopColor: '#ffffff20',
  },
  input: {
    flex: 1,
    backgroundColor: '#ffffff10',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#fff',
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4ECDC4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ffffff20',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ff6b6b20',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#ff6b6b',
    flex: 1,
  },
  questProposalModal: {
    backgroundColor: '#fff',
    borderRadius: 24,
    marginHorizontal: 20,
    maxHeight: '85%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  questProposalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 24,
    backgroundColor: '#fafafa',
  },
  questProposalTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#666',
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  questProposalScroll: {
    padding: 24,
  },
  questProposalQuestTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#1a1a1a',
    marginBottom: 16,
    lineHeight: 34,
  },
  questProposalMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  questProposalBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  questProposalBadgeText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#fff',
  },
  questProposalDescription: {
    fontSize: 15,
    color: '#555',
    lineHeight: 24,
    marginBottom: 24,
  },
  questProposalMilestones: {
    gap: 12,
    marginTop: 8,
  },
  questProposalMilestonesTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 16,
  },
  questProposalMilestone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#4ECDC4',
  },
  questProposalMilestoneText: {
    flex: 1,
    fontSize: 15,
    color: '#2d3436',
    lineHeight: 21,
  },
  questProposalMilestoneXP: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#4ECDC4',
    backgroundColor: '#4ECDC415',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  questProposalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    backgroundColor: '#fafafa',
  },
  questProposalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  questProposalButtonPrimary: {
    backgroundColor: '#4ECDC4',
  },
  questProposalButtonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  questProposalButtonTextPrimary: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  questProposalButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#555',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000080',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#000',
  },
  levelCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  levelCardActive: {
    borderColor: '#4ECDC4',
    backgroundColor: '#4ECDC410',
  },
  levelCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelCardTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#000',
  },
  levelCardLevel: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  levelFeatures: {
    gap: 8,
  },
  levelFeature: {
    fontSize: 14,
    color: '#333',
  },
  premiumBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  premiumBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#000',
  },
  categoryModal: {
    backgroundColor: '#fff',
    borderRadius: 24,
    marginHorizontal: 20,
    maxHeight: '85%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  categoryModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fafafa',
  },
  categoryModalTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#1a1a1a',
  },
  categoryModalScroll: {
    padding: 24,
  },
  categoryModalSubtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  categoryCard: {
    width: '47%',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryCardSelected: {
    backgroundColor: '#fff',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    transform: [{ scale: 1.02 }],
  },
  categoryCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  categoryCardIconText: {
    fontSize: 28,
  },
  categoryCardName: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#2d3436',
    textAlign: 'center',
  },
  categoryCardCheck: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  hobbySelection: {
    marginTop: 12,
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 16,
  },
  hobbySelectionTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 16,
  },
  hobbyOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  hobbyOptionSelected: {
    backgroundColor: '#FF6B9D08',
    borderColor: '#FF6B9D',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  hobbyOptionText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#2d3436',
  },
  newHobbyContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  newHobbyLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#555',
    marginBottom: 12,
  },
  newHobbyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  newHobbyInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    fontSize: 15,
    color: '#2d3436',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  newHobbyIcon: {
    position: 'absolute',
    right: 18,
    backgroundColor: '#FF6B9D15',
    padding: 6,
    borderRadius: 8,
  },
  confirmCategoryButton: {
    backgroundColor: '#4ECDC4',
    margin: 20,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmCategoryButtonDisabled: {
    opacity: 0.4,
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmCategoryButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#fff',
  },
});
