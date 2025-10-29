import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  Image,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Camera, Image as ImageIcon, X, ArrowRight, Zap } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useActivities } from '@/context/ActivityContext';
import { useQuests } from '@/context/QuestContext';
import { CATEGORY_DATA } from '@/constants/categories';

export default function PostToFeedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { addActivity } = useActivities();
  const { quests } = useQuests();

  const questId = params.questId as string | undefined;
  const milestoneId = params.milestoneId as string | undefined;
  const milestoneName = params.milestoneName as string | undefined;
  const xpValue = params.xpValue ? parseInt(params.xpValue as string) : undefined;
  const categoryParam = params.category as string | undefined;
  
  const quest = questId ? quests.find(q => q.id === questId) : undefined;
  const isMilestone = !!milestoneId;

  const [wantsToPost, setWantsToPost] = useState<boolean | null>(null);
  const [caption, setCaption] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePickImage = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need access to your photos to attach images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    console.log('Take photo button pressed');
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (!cameraPermission) {
      console.log('Camera permission object not loaded yet');
      return;
    }

    console.log('Camera permission status:', cameraPermission.granted);

    if (!cameraPermission.granted) {
      console.log('Requesting camera permission...');
      const { granted } = await requestCameraPermission();
      console.log('Permission granted:', granted);
      if (!granted) {
        Alert.alert('Permission needed', 'We need access to your camera to take photos.');
        return;
      }
    }

    console.log('Opening camera...');
    setShowCamera(true);
  };

  const handleCapturePhoto = async () => {
    if (!cameraRef.current) {
      console.log('Camera ref not available');
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });
      console.log('Photo captured:', photo);
      setSelectedImage(photo.uri);
      setShowCamera(false);
    } catch (error) {
      console.error('Failed to take photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handlePost = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    if (isMilestone && milestoneName && xpValue && categoryParam) {
      await addActivity(
        milestoneName,
        categoryParam,
        xpValue,
        'milestone_completed',
        selectedImage ? { type: 'image', uri: selectedImage } : undefined,
        caption.trim() || undefined
      );
      
      setTimeout(() => {
        router.back();
      }, 300);
    } else if (quest) {
      await addActivity(
        quest.title,
        quest.category,
        quest.xpValue,
        'quest_completed',
        selectedImage ? { type: 'image', uri: selectedImage } : undefined,
        caption.trim() || undefined
      );
      
      setTimeout(() => {
        router.push({
          pathname: '/post-quest-reflection',
          params: { questId },
        });
      }, 300);
    }
  };

  const handleSkipPosting = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (isMilestone) {
      router.back();
    } else {
      router.push({
        pathname: '/post-quest-reflection',
        params: { questId },
      });
    }
  };

  if (!quest && !isMilestone) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f3460']}
          style={styles.background}
        >
          <View style={[styles.safeArea, { paddingTop: insets.top + 20 }]}>
            <Text style={styles.errorText}>Quest not found</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }



  const category = quest ? CATEGORY_DATA[quest.category] : categoryParam ? CATEGORY_DATA[categoryParam as keyof typeof CATEGORY_DATA] : CATEGORY_DATA['health'];

  if (wantsToPost === null) {
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
            <View style={styles.questionContainer}>
              <Text style={styles.questionTitle}>
                {isMilestone ? 'Milestone Complete! 🎉' : 'Quest Complete! 🎉'}
              </Text>
              <Text style={styles.questionSubtitle}>
                Share your achievement with the community?
              </Text>

              <View style={styles.questInfoCard}>
                <View
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: category.color + '20' },
                  ]}
                >
                  <Text style={[styles.categoryBadgeText, { color: category.color }]}>
                    {category.name}
                  </Text>
                </View>
                <Text style={styles.questTitle}>
                  {isMilestone ? milestoneName : quest?.title}
                </Text>
                <View style={styles.xpBadge}>
                  <Zap size={16} color="#FFD700" fill="#FFD700" />
                  <Text style={styles.xpText}>+{isMilestone ? xpValue : quest?.xpValue} XP</Text>
                </View>
              </View>

              <View style={styles.choiceButtons}>
                <TouchableOpacity
                  style={styles.choiceButtonSecondary}
                  onPress={handleSkipPosting}
                  activeOpacity={0.8}
                >
                  <Text style={styles.choiceButtonSecondaryText}>
                    Skip, Continue
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.choiceButtonPrimary}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setWantsToPost(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.choiceButtonPrimaryText}>
                    Yes, Share
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </LinearGradient>
      </KeyboardAvoidingView>
    );
  }

  if (showCamera) {
    return (
      <View style={styles.container}>
        <CameraView
          style={styles.camera}
          ref={cameraRef}
          facing="back"
        >
          <View style={[styles.cameraHeader, { paddingTop: insets.top + 20 }]}>
            <TouchableOpacity
              style={styles.cameraCloseButton}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setShowCamera(false);
              }}
            >
              <X size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={[styles.cameraFooter, { paddingBottom: insets.bottom + 20 }]}>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={handleCapturePhoto}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

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
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setWantsToPost(null);
                setSelectedImage(null);
                setCaption('');
              }}
            >
              <X size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Customize Post</Text>
            <View style={{ width: 44 }} />
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.section}>
              <Text style={styles.label}>Add a Photo (Optional)</Text>
              <View style={styles.imageSection}>
                {selectedImage ? (
                  <View style={styles.selectedImageContainer}>
                    <Image
                      source={{ uri: selectedImage }}
                      style={styles.selectedImage}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => {
                        if (Platform.OS !== 'web') {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                        setSelectedImage(null);
                      }}
                    >
                      <X size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.imageButtons}>
                    <TouchableOpacity
                      style={styles.imageButton}
                      onPress={handleTakePhoto}
                      activeOpacity={0.8}
                    >
                      <Camera size={24} color="#667eea" />
                      <Text style={styles.imageButtonText}>Take Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.imageButton}
                      onPress={handlePickImage}
                      activeOpacity={0.8}
                    >
                      <ImageIcon size={24} color="#667eea" />
                      <Text style={styles.imageButtonText}>From Library</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Caption (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={caption}
                onChangeText={setCaption}
                placeholder="Share your thoughts about this quest..."
                placeholderTextColor="#ffffff60"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                maxLength={500}
              />
              <Text style={styles.characterCount}>
                {caption.length}/500
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkipPosting}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.postButton}
              onPress={handlePost}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <Text style={styles.postButtonText}>
                {isSubmitting ? 'Posting...' : 'Post'}
              </Text>
              <ArrowRight size={20} color="#fff" />
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
  errorText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  questionContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  questionTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  questionSubtitle: {
    fontSize: 18,
    color: '#ffffff99',
    textAlign: 'center',
    marginBottom: 40,
  },
  questInfoCard: {
    backgroundColor: '#ffffff10',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  categoryBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  categoryBadgeText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  questTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff10',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  xpText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFD700',
  },
  choiceButtons: {
    gap: 16,
  },
  choiceButtonSecondary: {
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#ffffff10',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  choiceButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  choiceButtonPrimary: {
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceButtonPrimaryText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
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
    marginBottom: 12,
  },
  imageSection: {
    marginBottom: 8,
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  imageButton: {
    flex: 1,
    backgroundColor: '#ffffff10',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  imageButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#667eea',
  },
  selectedImageContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  selectedImage: {
    width: '100%',
    height: 250,
    borderRadius: 16,
  },
  removeImageButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00000080',
    alignItems: 'center',
    justifyContent: 'center',
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
    minHeight: 120,
  },
  characterCount: {
    fontSize: 12,
    color: '#ffffff66',
    textAlign: 'right',
    marginTop: 8,
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
  postButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#667eea',
  },
  postButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  camera: {
    flex: 1,
  },
  cameraHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    zIndex: 1,
  },
  cameraCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#00000080',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#ffffff40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
});
