import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Users, Trophy, Calendar, Heart, DollarSign, Target, Brain, Shield, Eye, EyeOff, Check } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COMMUNITY_CHALLENGES } from '@/constants/communityChallenges';
import { CATEGORY_DATA } from '@/constants/categories';
import { useQuests } from '@/context/QuestContext';
import { CategoryType } from '@/types';

export default function CommunityChallengesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activateQuest } = useQuests();
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<typeof COMMUNITY_CHALLENGES[0] | null>(null);
  const [privacySetting, setPrivacySetting] = useState<'public' | 'private'>('public');

  const handleClose = () => {
    router.back();
  };

  const handleJoinChallengeClick = (challenge: typeof COMMUNITY_CHALLENGES[0]) => {
    setSelectedChallenge(challenge);
    setShowPrivacyModal(true);
  };

  const handleConfirmJoin = async () => {
    if (!selectedChallenge) return;

    await activateQuest({
      type: 'long',
      category: selectedChallenge.category,
      title: selectedChallenge.title,
      description: selectedChallenge.description,
      xpValue: selectedChallenge.xpValue,
      endDate: selectedChallenge.endDate,
      microGoals: selectedChallenge.microGoals?.map(mg => ({ ...mg, completed: false })),
      isCommunityChallenge: true,
      participants: [privacySetting],
    });

    setShowPrivacyModal(false);
    setSelectedChallenge(null);
    router.back();
  };

  const getCategoryIcon = (category: CategoryType) => {
    switch (category) {
      case 'health': return Heart;
      case 'wealth': return DollarSign;
      case 'social': return Users;
      case 'discipline': return Target;
      case 'mental': return Brain;
      case 'recovery': return Shield;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.background}
      >
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <View style={styles.headerLeft}>
            <View style={styles.iconContainer}>
              <Trophy size={24} color="#FFD700" />
            </View>
            <View>
              <Text style={styles.title}>Community Challenges</Text>
              <Text style={styles.subtitle}>Join global events</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          {COMMUNITY_CHALLENGES.map((challenge) => {
            const category = CATEGORY_DATA[challenge.category];
            const CategoryIcon = getCategoryIcon(challenge.category);

            return (
              <View key={challenge.id} style={styles.challengeCard}>
                <View style={styles.challengeHeader}>
                  <View
                    style={[
                      styles.categoryIcon,
                      { backgroundColor: category.color },
                    ]}
                  >
                    <CategoryIcon size={24} color="#fff" />
                  </View>
                  <View style={styles.challengeTitleContainer}>
                    <Text style={styles.challengeTitle}>{challenge.title}</Text>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{category.name}</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.challengeDescription}>
                  {challenge.description}
                </Text>

                <View style={styles.challengeStats}>
                  <View style={styles.stat}>
                    <Calendar size={16} color="#4ECDC4" />
                    <Text style={styles.statText}>{challenge.duration}</Text>
                  </View>
                  <View style={styles.stat}>
                    <Users size={16} color="#4ECDC4" />
                    <Text style={styles.statText}>
                      {challenge.participants.toLocaleString()} joined
                    </Text>
                  </View>
                  <View style={styles.stat}>
                    <Trophy size={16} color="#FFD700" />
                    <Text style={styles.statText}>{challenge.xpValue} XP</Text>
                  </View>
                </View>

                {challenge.microGoals && challenge.microGoals.length > 0 && (
                  <View style={styles.milestones}>
                    <Text style={styles.milestonesTitle}>Milestones:</Text>
                    {challenge.microGoals.map((milestone) => (
                      <View key={milestone.id} style={styles.milestone}>
                        <Text style={styles.milestoneText}>• {milestone.title}</Text>
                        <Text style={styles.milestoneXP}>{milestone.xpValue} XP</Text>
                      </View>
                    ))}
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.joinButton, { backgroundColor: category.color }]}
                  onPress={() => handleJoinChallengeClick(challenge)}
                >
                  <Text style={styles.joinButtonText}>Join Challenge</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      </LinearGradient>

      <Modal
        visible={showPrivacyModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPrivacyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Privacy Setting</Text>
              <TouchableOpacity onPress={() => setShowPrivacyModal(false)}>
                <X size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Would you like to share your progress with other participants?
            </Text>

            <TouchableOpacity
              style={[
                styles.privacyOption,
                privacySetting === 'public' && styles.privacyOptionActive,
              ]}
              onPress={() => setPrivacySetting('public')}
            >
              <View style={styles.privacyOptionLeft}>
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: privacySetting === 'public' ? '#4ECDC4' : '#f0f0f0' },
                  ]}
                >
                  <Eye size={20} color={privacySetting === 'public' ? '#fff' : '#999'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.privacyOptionTitle}>Public Progress</Text>
                  <Text style={styles.privacyOptionDescription}>
                    Everyone can see your progress and milestones
                  </Text>
                </View>
              </View>
              {privacySetting === 'public' && <Check size={20} color="#4ECDC4" />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.privacyOption,
                privacySetting === 'private' && styles.privacyOptionActive,
              ]}
              onPress={() => setPrivacySetting('private')}
            >
              <View style={styles.privacyOptionLeft}>
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: privacySetting === 'private' ? '#4ECDC4' : '#f0f0f0' },
                  ]}
                >
                  <EyeOff size={20} color={privacySetting === 'private' ? '#fff' : '#999'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.privacyOptionTitle}>Private Progress</Text>
                  <Text style={styles.privacyOptionDescription}>
                    Keep your progress hidden from others
                  </Text>
                </View>
              </View>
              {privacySetting === 'private' && <Check size={20} color="#4ECDC4" />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirmJoin}
            >
              <Text style={styles.confirmButtonText}>Join Challenge</Text>
            </TouchableOpacity>
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
  challengeCard: {
    backgroundColor: '#ffffff10',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  challengeHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeTitleContainer: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 6,
  },
  categoryBadge: {
    backgroundColor: '#ffffff20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#fff',
  },
  challengeDescription: {
    fontSize: 14,
    color: '#ffffff99',
    lineHeight: 20,
    marginBottom: 16,
  },
  challengeStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    color: '#ffffff99',
  },
  milestones: {
    backgroundColor: '#ffffff10',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  milestonesTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 8,
  },
  milestone: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  milestoneText: {
    fontSize: 13,
    color: '#ffffff99',
  },
  milestoneXP: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FFD700',
  },
  joinButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
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
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#000',
  },
  modalDescription: {
    fontSize: 15,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#f0f0f0',
    marginBottom: 12,
  },
  privacyOptionActive: {
    borderColor: '#4ECDC4',
    backgroundColor: '#4ECDC410',
  },
  privacyOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyOptionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#000',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  privacyOptionDescription: {
    fontSize: 13,
    color: '#666',
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  confirmButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
});
