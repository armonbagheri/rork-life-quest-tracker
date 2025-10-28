import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useUser } from '@/context/UserContext';
import Avatar from '@/components/Avatar';

interface AvatarHeaderProps {
  position?: 'topRight' | 'topCenter';
}

export default function AvatarHeader({ position = 'topRight' }: AvatarHeaderProps) {
  const router = useRouter();
  const { user } = useUser();

  const handleAvatarPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/settings');
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        position === 'topCenter' ? styles.containerCenter : styles.containerRight,
      ]}
      onPress={handleAvatarPress}
      activeOpacity={0.7}
    >
      <Avatar avatar={user.avatar} size={50} />
      <View style={styles.levelBadge}>
        <Text style={styles.levelText}>LVL {user.level}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 10,
    alignItems: 'center',
  },
  containerRight: {
    top: 0,
    right: 20,
  },
  containerCenter: {
    top: 0,
    alignSelf: 'center',
  },
  levelBadge: {
    backgroundColor: '#667eea',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#fff',
  },
});
