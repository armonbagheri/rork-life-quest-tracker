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
import { X, Sparkles, Lock, Check, Send, AlertCircle, CheckCircle } from 'lucide-react-native';
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
  const { quests: activeQuests, addCustomQuest, hobbies } = useQuests();
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

  const handleAcceptQuest = async () => {
    if (!pendingQuest) return;

    const microGoals: MicroGoal[] | undefined = pendingQuest.microGoals?.map((mg, idx) => ({
      id: `milestone-${Date.now()}-${idx}`,
      title: mg.title,
      completed: false,
      xpValue: mg.xpValue
    }));

    console.log('[AI Coach] Creating quest:', pendingQuest.title);
    
    await addCustomQuest(
      pendingQuest.category,
      pendingQuest.title,
      pendingQuest.description,
      pendingQuest.type,
      pendingQuest.xpValue,
      microGoals,
      undefined,
      pendingQuest.hobbySubcategory
    );

    console.log('[AI Coach] Quest created successfully');
    setPendingQuest(null);
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
                      switch (part.type) {
                        case 'text':
                          return (
                            <View key={`${m.id}-${i}`}>
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
                                <View key={`${m.id}-${i}`} style={styles.toolCall}>
                                  <ActivityIndicator size="small" color="#4ECDC4" />
                                  <Text style={styles.toolCallText}>Thinking...</Text>
                                </View>
                              );
                            case 'output-available':
                              return null;
                            case 'output-error':
                              return (
                                <View key={`${m.id}-${i}`} style={styles.toolError}>
                                  <AlertCircle size={16} color="#ff6b6b" />
                                  <Text style={styles.toolErrorText}>Error: {part.errorText}</Text>
                                </View>
                              );
                          }
                      }
                      return null;
                    })}
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
                <Text style={styles.questProposalButtonTextPrimary}>Create Quest!</Text>
              </TouchableOpacity>
            </View>
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
    borderRadius: 20,
    marginHorizontal: 20,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  questProposalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  questProposalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#000',
  },
  questProposalScroll: {
    padding: 20,
  },
  questProposalQuestTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#000',
    marginBottom: 12,
  },
  questProposalMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  questProposalBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  questProposalBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#fff',
  },
  questProposalDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  questProposalMilestones: {
    gap: 12,
  },
  questProposalMilestonesTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#000',
    marginBottom: 8,
  },
  questProposalMilestone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 12,
  },
  questProposalMilestoneText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  questProposalMilestoneXP: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#4ECDC4',
  },
  questProposalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  questProposalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  questProposalButtonPrimary: {
    backgroundColor: '#4ECDC4',
  },
  questProposalButtonSecondary: {
    backgroundColor: '#f0f0f0',
  },
  questProposalButtonTextPrimary: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  questProposalButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#666',
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
});
