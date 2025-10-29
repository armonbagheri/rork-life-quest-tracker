import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Star, Send } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuests } from '@/context/QuestContext';

export default function PostQuestReflectionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { completeQuest } = useQuests();
  
  const questId = params.questId as string;
  
  const [learned, setLearned] = useState('');
  const [feeling, setFeeling] = useState('');
  const [difficulty, setDifficulty] = useState(0);
  const [satisfaction, setSatisfaction] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setIsSubmitting(true);

    await completeQuest(questId, {
      learned,
      feeling,
      difficulty,
      satisfaction,
      timestamp: new Date().toISOString(),
    });

    setIsSubmitting(false);

    router.dismissAll();
  };

  const handleSkip = async () => {
    if (isSubmitting) return;
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setIsSubmitting(true);

    await completeQuest(questId);
    
    setIsSubmitting(false);

    router.dismissAll();
  };

  const renderStars = (
    rating: number,
    onPress: (value: number) => void,
    color: string
  ) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              onPress(star);
            }}
            activeOpacity={0.7}
          >
            <Star
              size={32}
              color={star <= rating ? color : '#ffffff40'}
              fill={star <= rating ? color : 'transparent'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.background}
      >
        <View
          style={[
            styles.safeArea,
            { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Quest Complete! 🎉</Text>
            <Text style={styles.subtitle}>Take a moment to reflect</Text>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.section}>
              <Text style={styles.label}>What did you learn?</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={learned}
                onChangeText={setLearned}
                placeholder="Share your insights..."
                placeholderTextColor="#ffffff60"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>How did this feel?</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={feeling}
                onChangeText={setFeeling}
                placeholder="Describe your experience..."
                placeholderTextColor="#ffffff60"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Difficulty</Text>
              <Text style={styles.ratingDesc}>How challenging was this quest?</Text>
              {renderStars(difficulty, setDifficulty, '#FFD700')}
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Satisfaction</Text>
              <Text style={styles.ratingDesc}>How satisfied are you with your achievement?</Text>
              {renderStars(satisfaction, setSatisfaction, '#4ECDC4')}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!learned && !feeling && difficulty === 0 && satisfaction === 0) &&
                  styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <Send size={20} color="#fff" />
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
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
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff99',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 28,
  },
  label: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 8,
  },
  ratingDesc: {
    fontSize: 14,
    color: '#ffffff99',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#ffffff10',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  textArea: {
    minHeight: 100,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#ffffff10',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#667eea',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
});
