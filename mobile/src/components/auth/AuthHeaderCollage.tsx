import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

const IMAGES = {
  skyline:
    'https://images.unsplash.com/photo-1658863714664-bced34d5606f?auto=format&fit=crop&w=1200&q=80',
  fishingPier:
    'https://images.unsplash.com/photo-1625729410412-2294315b517b?auto=format&fit=crop&w=1200&q=80',
  fishingRod:
    'https://images.unsplash.com/photo-1646211059552-9a61fc7ef457?auto=format&fit=crop&w=1200&q=80',
  localEvent:
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
  beach:
    'https://images.unsplash.com/photo-1646211059552-9a61fc7ef457?auto=format&fit=crop&w=1200&q=80',
  desertRoad:
    'https://images.unsplash.com/photo-1646211059552-9a61fc7ef457?auto=format&fit=crop&w=1200&q=80',
};

type Props = {
  mode: 'login' | 'register';
};

export function AuthHeaderCollage({ mode }: Props) {
  if (mode === 'register') {
    return (
      <View style={[styles.wrap, styles.wrapRegister]}>
        <View style={styles.bgShape} />

        <View style={[styles.card, styles.registerLeftTall]}>
          <Image source={{ uri: IMAGES.beach }} style={styles.image} />
        </View>

        <View style={[styles.card, styles.registerCenterLarge]}>
          <Image source={{ uri: IMAGES.fishingPier }} style={styles.image} />
        </View>

        <View style={[styles.card, styles.registerTopRight]}>
          <Image source={{ uri: IMAGES.localEvent }} style={styles.image} />
        </View>

        <View style={[styles.card, styles.registerBottomRight]}>
          <Image source={{ uri: IMAGES.desertRoad }} style={styles.image} />
        </View>

        <View style={[styles.badge, styles.badgeLeft]}>
          <Text style={styles.badgeText}>P</Text>
        </View>

        <View style={[styles.badge, styles.badgeTopRightRed]}>
          <Text style={styles.badgeTextWhite}>31</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.bgShape} />

      <View style={[styles.card, styles.loginTopLeft]}>
        <Image source={{ uri: IMAGES.skyline }} style={styles.image} />
      </View>

      <View style={[styles.card, styles.loginRightTall]}>
        <Image source={{ uri: IMAGES.fishingPier }} style={styles.image} />
      </View>

      <View style={[styles.card, styles.loginBottomLeft]}>
        <Image source={{ uri: IMAGES.fishingRod }} style={styles.image} />
      </View>

      <View style={[styles.card, styles.loginBottomCenter]}>
        <Image source={{ uri: IMAGES.localEvent }} style={styles.image} />
      </View>

      <View style={[styles.badge, styles.badgeBottomLeft]}>
        <Text style={styles.badgeHeart}>H</Text>
      </View>

      <View style={[styles.badge, styles.badgeUpperRight]}>
        <Text style={styles.badgeText}>P</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 250,
    marginTop: 14,
    marginBottom: 16,
    justifyContent: 'center',
  },
  wrapRegister: {
    height: 230,
    marginTop: 12,
    marginBottom: 14,
  },
  bgShape: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 10,
    height: 150,
    borderRadius: 999,
    backgroundColor: '#FBEFEB',
  },
  card: {
    position: 'absolute',
    overflow: 'hidden',
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: '#EDE7E0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loginTopLeft: {
    left: 46,
    top: 12,
    width: 230,
    height: 110,
    transform: [{ rotate: '-4deg' }],
  },
  loginRightTall: {
    right: 18,
    top: 26,
    width: 138,
    height: 200,
    transform: [{ rotate: '4deg' }],
  },
  loginBottomLeft: {
    left: 18,
    bottom: 20,
    width: 108,
    height: 102,
  },
  loginBottomCenter: {
    left: 128,
    bottom: 16,
    width: 126,
    height: 98,
  },
  registerLeftTall: {
    left: 12,
    bottom: 18,
    width: 92,
    height: 152,
  },
  registerCenterLarge: {
    left: 92,
    top: 8,
    width: 176,
    height: 178,
  },
  registerTopRight: {
    right: 18,
    top: 18,
    width: 112,
    height: 110,
  },
  registerBottomRight: {
    right: 18,
    bottom: 18,
    width: 112,
    height: 88,
  },
  badge: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#20150E',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  badgeBottomLeft: {
    left: 6,
    bottom: 18,
  },
  badgeUpperRight: {
    right: 78,
    top: 42,
  },
  badgeLeft: {
    left: 40,
    top: 84,
  },
  badgeTopRightRed: {
    right: 56,
    top: -2,
    backgroundColor: '#F55445',
  },
  badgeText: {
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '800',
    color: '#F55445',
  },
  badgeTextWhite: {
    fontSize: 20,
    lineHeight: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  badgeHeart: {
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '800',
    color: '#F55445',
  },
});
