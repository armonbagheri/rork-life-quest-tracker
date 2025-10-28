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
import { useRouter } from 'expo-router';
import { X, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useUser } from '@/context/UserContext';
import { useQuests } from '@/context/QuestContext';
import { CATEGORY_DATA } from '@/constants/categories';
import { CategoryType, PrivacyLevel } from '@/types';
import Avatar from '@/components/Avatar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, saveUser, enabledCategories } = useUser();
  const { clearAllQuests } = useQuests();

  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio || '');
  const [selectedCategories, setSelectedCategories] = useState<CategoryType[]>(enabledCategories);
  const [categoryPrivacy, setCategoryPrivacy] = useState<Record<CategoryType, PrivacyLevel>>(
    Object.keys(user.categories).reduce((acc, key) => {
      acc[key as CategoryType] = user.categories[key as CategoryType].privacy;
      return acc;
    }, {} as Record<CategoryType, PrivacyLevel>)
  );

  const [skinTone, setSkinTone] = useState(user.avatar.skinTone);
  const [hairstyle, setHairstyle] = useState(user.avatar.hairstyle);
  const [hairColor, setHairColor] = useState(user.avatar.hairColor);
  const [outfit, setOutfit] = useState(user.avatar.outfit);
  const [accessories, setAccessories] = useState<string[]>(user.avatar.accessories);

  const handleSave = async () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const updatedUser = {
      ...user,
      username,
      bio,
      avatar: {
        ...user.avatar,
        skinTone,
        hairstyle,
        hairColor,
        outfit,
        accessories,
      },
      categories: Object.keys(user.categories).reduce((acc, key) => {
        const categoryKey = key as CategoryType;
        acc[categoryKey] = {
          ...user.categories[categoryKey],
          enabled: selectedCategories.includes(categoryKey),
          privacy: categoryPrivacy[categoryKey],
        };
        return acc;
      }, {} as Record<CategoryType, any>),
    };

    await saveUser(updatedUser);
    router.back();
  };

  const toggleCategory = (category: CategoryType) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const cyclePrivacy = (category: CategoryType) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const privacyLevels: PrivacyLevel[] = ['public', 'friends', 'private'];
    const currentIndex = privacyLevels.indexOf(categoryPrivacy[category]);
    const nextIndex = (currentIndex + 1) % privacyLevels.length;
    setCategoryPrivacy(prev => ({
      ...prev,
      [category]: privacyLevels[nextIndex],
    }));
  };

  const toggleAccessory = (accessory: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setAccessories(prev =>
      prev.includes(accessory)
        ? prev.filter(a => a !== accessory)
        : [...prev, accessory]
    );
  };

  const previewAvatar = {
    baseStyle: user.avatar.baseStyle,
    skinTone,
    hairstyle,
    hairColor,
    outfit,
    accessories,
    unlockedItems: user.avatar.unlockedItems,
  };

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
            <Text style={styles.title}>Settings</Text>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
            >
              <Check size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Avatar</Text>
            <View style={styles.avatarPreview}>
              <Avatar avatar={previewAvatar} size={120} />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionSubtitle}>Skin Tone</Text>
            <View style={styles.optionRow}>
              {['light', 'medium', 'tan', 'dark'].map(tone => (
                <TouchableOpacity
                  key={tone}
                  style={[
                    styles.optionButton,
                    skinTone === tone && styles.optionButtonActive,
                  ]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setSkinTone(tone);
                  }}
                >
                  <Text style={styles.optionText}>
                    {tone.charAt(0).toUpperCase() + tone.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionSubtitle}>Hairstyle</Text>
            <View style={styles.optionRow}>
              {['short', 'long', 'curly', 'bald'].map(style => (
                <TouchableOpacity
                  key={style}
                  style={[
                    styles.optionButton,
                    hairstyle === style && styles.optionButtonActive,
                  ]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setHairstyle(style);
                  }}
                >
                  <Text style={styles.optionText}>
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionSubtitle}>Hair Color</Text>
            <View style={styles.optionRow}>
              {['brown', 'black', 'blonde', 'red'].map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.optionButton,
                    hairColor === color && styles.optionButtonActive,
                  ]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setHairColor(color);
                  }}
                >
                  <Text style={styles.optionText}>
                    {color.charAt(0).toUpperCase() + color.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.optionRow}>
              {['blue', 'pink', 'green', 'purple'].map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.optionButton,
                    hairColor === color && styles.optionButtonActive,
                  ]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setHairColor(color);
                  }}
                >
                  <Text style={styles.optionText}>
                    {color.charAt(0).toUpperCase() + color.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionSubtitle}>Outfit</Text>
            <View style={styles.optionRow}>
              {['casual', 'formal', 'sporty', 'elegant'].map(style => (
                <TouchableOpacity
                  key={style}
                  style={[
                    styles.optionButton,
                    outfit === style && styles.optionButtonActive,
                  ]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setOutfit(style);
                  }}
                >
                  <Text style={styles.optionText}>
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionSubtitle}>Accessories</Text>
            <View style={styles.optionRow}>
              {['glasses', 'hat'].map(accessory => (
                <TouchableOpacity
                  key={accessory}
                  style={[
                    styles.optionButton,
                    accessories.includes(accessory) && styles.optionButtonActive,
                  ]}
                  onPress={() => toggleAccessory(accessory)}
                >
                  <Text style={styles.optionText}>
                    {accessory.charAt(0).toUpperCase() + accessory.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Username</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter username"
                placeholderTextColor="#ffffff60"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Bio</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us about yourself"
                placeholderTextColor="#ffffff60"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <Text style={styles.sectionDescription}>
              Select which life areas you want to track
            </Text>
            {(Object.keys(CATEGORY_DATA) as CategoryType[]).map(categoryId => {
              const category = CATEGORY_DATA[categoryId];
              const isEnabled = selectedCategories.includes(categoryId);
              const privacy = categoryPrivacy[categoryId];

              return (
                <View key={categoryId} style={styles.categoryItem}>
                  <TouchableOpacity
                    style={styles.categoryLeft}
                    onPress={() => toggleCategory(categoryId)}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        isEnabled && [
                          styles.checkboxActive,
                          { backgroundColor: category.color },
                        ],
                      ]}
                    >
                      {isEnabled && <Check size={16} color="#fff" />}
                    </View>
                    <View style={styles.categoryInfo}>
                      <Text style={styles.categoryName}>{category.name}</Text>
                      <Text style={styles.categoryDescription}>
                        {category.description}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  {isEnabled && (
                    <TouchableOpacity
                      style={[
                        styles.privacyButton,
                        privacy === 'public' && styles.privacyPublic,
                        privacy === 'friends' && styles.privacyFriends,
                        privacy === 'private' && styles.privacyPrivate,
                      ]}
                      onPress={() => cyclePrivacy(categoryId)}
                    >
                      <Text style={styles.privacyIcon}>
                        {privacy === 'public' ? '🌍' : privacy === 'friends' ? '👥' : '🔒'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Debug</Text>
            <Text style={styles.sectionDescription}>
              Clear all quest data if you&apos;re experiencing issues
            </Text>
            <TouchableOpacity
              style={styles.dangerButton}
              onPress={async () => {
                if (Platform.OS !== 'web') {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                }
                await clearAllQuests();
                alert('All quests have been cleared!');
              }}
            >
              <Text style={styles.dangerButtonText}>Clear All Quests</Text>
            </TouchableOpacity>
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#ffffff80',
    marginBottom: 16,
  },
  avatarPreview: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#ffffff10',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  optionButton: {
    flex: 1,
    minWidth: '22%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff10',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ffffff20',
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  inputContainer: {
    marginBottom: 16,
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
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff10',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ffffff40',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxActive: {
    borderColor: 'transparent',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 12,
    color: '#ffffff80',
  },
  privacyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  privacyPublic: {
    backgroundColor: '#4ECDC420',
  },
  privacyFriends: {
    backgroundColor: '#667eea20',
  },
  privacyPrivate: {
    backgroundColor: '#FF6B6B20',
  },
  privacyIcon: {
    fontSize: 20,
  },
  dangerButton: {
    backgroundColor: '#FF6B6B20',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#FF6B6B',
    alignItems: 'center',
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FF6B6B',
  },
});
