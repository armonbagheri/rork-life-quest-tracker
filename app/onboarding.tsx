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
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CategoryType, PrivacyLevel, Community } from '@/types';
import { CATEGORY_DATA } from '@/constants/categories';
import { AVAILABLE_COMMUNITIES } from '@/constants/communities';
import { useUser } from '@/context/UserContext';



const PRIVACY_OPTIONS: { value: PrivacyLevel; label: string; description: string }[] = [
  { value: 'public', label: 'Public', description: 'Everyone can see' },
  { value: 'friends', label: 'Friends', description: 'Only friends see' },
  { value: 'private', label: 'Private', description: 'Only you see' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding } = useUser();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<CategoryType[]>([]);
  const [categoryPrivacy, setCategoryPrivacy] = useState<Record<CategoryType, PrivacyLevel>>({
    health: 'public',
    wealth: 'public',
    social: 'public',
    discipline: 'public',
    mental: 'public',
    recovery: 'private',
  });
  const [selectedCommunities, setSelectedCommunities] = useState<string[]>([]);

  const handleHaptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const toggleCategory = (category: CategoryType) => {
    handleHaptic();
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const updatePrivacy = (category: CategoryType, privacy: PrivacyLevel) => {
    handleHaptic();
    setCategoryPrivacy(prev => ({ ...prev, [category]: privacy }));
  };

  const handleNext = () => {
    handleHaptic();
    if (step === 0 && username.trim()) {
      setStep(1);
    } else if (step === 1 && selectedCategories.length > 0) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleBack = () => {
    handleHaptic();
    setStep(prev => Math.max(0, prev - 1));
  };

  const toggleCommunity = (communityId: string) => {
    handleHaptic();
    setSelectedCommunities(prev =>
      prev.includes(communityId)
        ? prev.filter(c => c !== communityId)
        : [...prev, communityId]
    );
  };

  const handleFinish = async () => {
    handleHaptic();
    if (username.trim() && selectedCategories.length > 0) {
      await completeOnboarding(username, selectedCategories, categoryPrivacy, selectedCommunities);
      router.replace('/(tabs)');
    }
  };

  const renderWelcome = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Welcome to Life Quest</Text>
      <Text style={styles.subtitle}>Level up in real life</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Choose your username</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="Enter username"
          placeholderTextColor="#999"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, !username.trim() && styles.buttonDisabled]}
        onPress={handleNext}
        disabled={!username.trim()}
      >
        <LinearGradient
          colors={username.trim() ? ['#667eea', '#764ba2'] : ['#ccc', '#999']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.buttonGradient}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderCategories = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Choose Your Focus</Text>
      <Text style={styles.subtitle}>Select the areas you want to track</Text>

      <ScrollView style={styles.categoriesScroll} showsVerticalScrollIndicator={false}>
        {Object.values(CATEGORY_DATA).map(category => {
          const isSelected = selectedCategories.includes(category.id);
          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryCard,
                isSelected && { borderColor: category.color, borderWidth: 3 },
              ]}
              onPress={() => toggleCategory(category.id)}
            >
              <View style={styles.categoryHeader}>
                <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                  <Text style={styles.categoryIconText}>{category.name[0]}</Text>
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryDescription}>{category.description}</Text>
                </View>
              </View>
              {isSelected && (
                <View style={[styles.checkmark, { backgroundColor: category.color }]}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.flexButton, selectedCategories.length === 0 && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={selectedCategories.length === 0}
        >
          <LinearGradient
            colors={selectedCategories.length > 0 ? ['#667eea', '#764ba2'] : ['#ccc', '#999']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPrivacy = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Privacy Settings</Text>
      <Text style={styles.subtitle}>Choose who can see your progress</Text>

      <ScrollView style={styles.categoriesScroll} showsVerticalScrollIndicator={false}>
        {selectedCategories.map(categoryId => {
          const category = CATEGORY_DATA[categoryId];
          const privacy = categoryPrivacy[categoryId];

          return (
            <View key={categoryId} style={styles.privacyCard}>
              <View style={styles.privacyHeader}>
                <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                  <Text style={styles.categoryIconText}>{category.name[0]}</Text>
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
              </View>

              <View style={styles.privacyOptions}>
                {PRIVACY_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.privacyOption,
                      privacy === option.value && styles.privacyOptionSelected,
                    ]}
                    onPress={() => updatePrivacy(categoryId, option.value)}
                  >
                    <Text
                      style={[
                        styles.privacyOptionText,
                        privacy === option.value && styles.privacyOptionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.flexButton]}
          onPress={handleNext}
        >
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCommunities = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Join Communities</Text>
      <Text style={styles.subtitle}>Connect with like-minded people (optional)</Text>

      <ScrollView style={styles.categoriesScroll} showsVerticalScrollIndicator={false}>
        {AVAILABLE_COMMUNITIES.map(community => {
          const isSelected = selectedCommunities.includes(community.id);
          return (
            <TouchableOpacity
              key={community.id}
              style={[
                styles.communityCard,
                isSelected && styles.communityCardSelected,
              ]}
              onPress={() => toggleCommunity(community.id)}
            >
              <View style={styles.communityHeader}>
                <Text style={styles.communityIcon}>{community.icon}</Text>
                <View style={styles.communityInfo}>
                  <Text style={styles.communityName}>{community.name}</Text>
                  <Text style={styles.communityDescription}>{community.description}</Text>
                  <Text style={styles.communityMembers}>
                    {community.memberCount?.toLocaleString()} members
                  </Text>
                </View>
              </View>
              {isSelected && (
                <View style={styles.communityCheckmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.flexButton]}
          onPress={handleFinish}
        >
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Start Your Journey</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={styles.container}>
      <View style={{ paddingTop: insets.top }} />
      <View style={styles.progressContainer}>
        {[0, 1, 2, 3].map(i => (
          <View
            key={i}
            style={[
              styles.progressDot,
              i <= step && styles.progressDotActive,
            ]}
          />
        ))}
      </View>

      {step === 0 && renderWelcome()}
      {step === 1 && renderCategories()}
      {step === 2 && renderPrivacy()}
      {step === 3 && renderCommunities()}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ffffff40',
  },
  progressDotActive: {
    backgroundColor: '#fff',
    width: 30,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff99',
    textAlign: 'center',
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#ffffff15',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#ffffff30',
  },
  categoriesScroll: {
    flex: 1,
    marginBottom: 20,
  },
  categoryCard: {
    backgroundColor: '#ffffff10',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryIconText: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#fff',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#ffffff99',
  },
  checkmark: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  privacyCard: {
    backgroundColor: '#ffffff10',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  privacyOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  privacyOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#ffffff10',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  privacyOptionSelected: {
    backgroundColor: '#667eea',
    borderColor: '#fff',
  },
  privacyOptionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ffffff99',
  },
  privacyOptionTextSelected: {
    color: '#fff',
  },
  button: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  flexButton: {
    flex: 1,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 20,
  },
  backButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff15',
    borderWidth: 1,
    borderColor: '#ffffff30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  communityCard: {
    backgroundColor: '#ffffff10',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  communityCardSelected: {
    borderColor: '#667eea',
    borderWidth: 3,
    backgroundColor: '#667eea20',
  },
  communityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  communityIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  communityInfo: {
    flex: 1,
  },
  communityName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 4,
  },
  communityDescription: {
    fontSize: 14,
    color: '#ffffff99',
    marginBottom: 4,
  },
  communityMembers: {
    fontSize: 12,
    color: '#ffffff80',
  },
  communityCheckmark: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
