import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AvatarCustomization } from '@/types';

interface AvatarProps {
  avatar: AvatarCustomization;
  size?: number;
}

const SKIN_TONES: Record<string, string> = {
  light: '#FFE0BD',
  medium: '#FFCD94',
  tan: '#D2A679',
  dark: '#8B5A3C',
};

const HAIR_COLORS: Record<string, string> = {
  brown: '#4A3F35',
  black: '#1C1C1C',
  blonde: '#F5E6C8',
  red: '#A24936',
  blue: '#4169E1',
  pink: '#FF69B4',
  green: '#228B22',
  purple: '#9370DB',
};

export default function Avatar({ avatar, size = 100 }: AvatarProps) {
  const skinColor = SKIN_TONES[avatar.skinTone] || SKIN_TONES.medium;
  const hairColor = HAIR_COLORS[avatar.hairColor] || HAIR_COLORS.brown;

  const renderHairstyle = () => {
    switch (avatar.hairstyle) {
      case 'short':
        return (
          <View
            style={[
              styles.hairShort,
              { backgroundColor: hairColor },
              { width: size * 1.1, height: size * 0.35, top: -size * 0.05 },
            ]}
          />
        );
      case 'long':
        return (
          <View
            style={[
              styles.hairLong,
              { backgroundColor: hairColor },
              { width: size * 1.2, height: size * 0.6, top: -size * 0.08 },
            ]}
          />
        );
      case 'curly':
        return (
          <View
            style={[
              styles.hairCurly,
              { backgroundColor: hairColor },
              { width: size * 1.15, height: size * 0.45, top: -size * 0.06 },
            ]}
          />
        );
      case 'bald':
        return null;
      default:
        return (
          <View
            style={[
              styles.hairShort,
              { backgroundColor: hairColor },
              { width: size * 1.1, height: size * 0.35, top: -size * 0.05 },
            ]}
          />
        );
    }
  };

  const renderOutfit = () => {
    let outfitColor = '#667eea';
    switch (avatar.outfit) {
      case 'casual':
        outfitColor = '#667eea';
        break;
      case 'formal':
        outfitColor = '#2c3e50';
        break;
      case 'sporty':
        outfitColor = '#e74c3c';
        break;
      case 'elegant':
        outfitColor = '#9b59b6';
        break;
    }

    return (
      <View
        style={[
          styles.outfit,
          { backgroundColor: outfitColor },
          { width: size * 0.9, height: size * 0.4, top: size * 0.65 },
        ]}
      />
    );
  };

  const renderAccessories = () => {
    return avatar.accessories.map((accessory, index) => {
      if (accessory === 'glasses') {
        return (
          <View
            key={index}
            style={[
              styles.glasses,
              { width: size * 0.6, height: size * 0.15, top: size * 0.35 },
            ]}
          >
            <View
              style={[
                styles.glassLens,
                { width: size * 0.2, height: size * 0.15 },
              ]}
            />
            <View style={{ width: size * 0.1 }} />
            <View
              style={[
                styles.glassLens,
                { width: size * 0.2, height: size * 0.15 },
              ]}
            />
          </View>
        );
      }
      if (accessory === 'hat') {
        return (
          <View
            key={index}
            style={[
              styles.hat,
              { width: size * 0.7, height: size * 0.2, top: -size * 0.15 },
            ]}
          />
        );
      }
      return null;
    });
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {renderHairstyle()}
      <View
        style={[
          styles.head,
          { backgroundColor: skinColor, width: size, height: size },
        ]}
      >
        <View style={styles.face}>
          <View
            style={[
              styles.eyesContainer,
              { width: size * 0.5, top: size * 0.35 },
            ]}
          >
            <View
              style={[
                styles.eye,
                { width: size * 0.1, height: size * 0.1 },
              ]}
            />
            <View
              style={[
                styles.eye,
                { width: size * 0.1, height: size * 0.1 },
              ]}
            />
          </View>
          <View
            style={[
              styles.mouth,
              { width: size * 0.25, height: size * 0.08, top: size * 0.6 },
            ]}
          />
        </View>
      </View>
      {renderOutfit()}
      {renderAccessories()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  head: {
    borderRadius: 100,
    overflow: 'visible',
  },
  face: {
    flex: 1,
    alignItems: 'center',
  },
  hairShort: {
    position: 'absolute',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
    zIndex: 1,
  },
  hairLong: {
    position: 'absolute',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    zIndex: 1,
  },
  hairCurly: {
    position: 'absolute',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    zIndex: 1,
  },
  outfit: {
    position: 'absolute',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: -1,
  },
  eyesContainer: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eye: {
    backgroundColor: '#2c3e50',
    borderRadius: 100,
  },
  mouth: {
    position: 'absolute',
    backgroundColor: '#e74c3c',
    borderBottomLeftRadius: 100,
    borderBottomRightRadius: 100,
  },
  glasses: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  glassLens: {
    borderWidth: 2,
    borderColor: '#2c3e50',
    borderRadius: 10,
  },
  hat: {
    position: 'absolute',
    backgroundColor: '#34495e',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
    zIndex: 2,
  },
});
