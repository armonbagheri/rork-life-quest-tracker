import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { X, Check, Star } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useQuests } from '@/context/QuestContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CATEGORY_DATA } from '@/constants/categories';

export default function CreateHobbyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addHobby } = useQuests();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) {
      if (Platform.OS === 'web') {
        alert('Please enter a hobby name');
      } else {
        Alert.alert('Missing Information', 'Please enter a hobby name');
      }
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    await addHobby(name.trim(), description.trim() || undefined);
    router.back();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.background}
      >
        <View style={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
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
            <Text style={styles.title}>Create Hobby</Text>
            <TouchableOpacity
              style={[
                styles.saveButton,
                !name.trim() && styles.saveButtonDisabled,
              ]}
              onPress={handleCreate}
              disabled={!name.trim()}
            >
              <Check size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.iconContainer}>
            <Star size={48} color={CATEGORY_DATA.hobbies.color} />
          </View>

          <Text style={styles.subtitle}>
            Track and improve any hobby you&apos;re passionate about
          </Text>

          <View style={styles.section}>
            <Text style={styles.label}>Hobby Name*</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Basketball, Chess, Guitar"
              placeholderTextColor="#ffffff60"
              autoFocus
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={description}
              onChangeText={setDescription}
              placeholder="What do you want to achieve?"
              placeholderTextColor="#ffffff60"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              💡 After creating your hobby, you can:
            </Text>
            <Text style={styles.infoItem}>• Ask AI Coach for advice</Text>
            <Text style={styles.infoItem}>• Create custom improvement quests</Text>
            <Text style={styles.infoItem}>• Track your progress over time</Text>
          </View>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
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
  iconContainer: {
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF6B9D20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff99',
    textAlign: 'center',
    marginBottom: 32,
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
  infoBox: {
    backgroundColor: '#FF6B9D20',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FF6B9D40',
    marginTop: 8,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 12,
  },
  infoItem: {
    fontSize: 14,
    color: '#ffffff99',
    marginBottom: 4,
  },
});
