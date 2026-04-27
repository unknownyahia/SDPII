import React from 'react';
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

export type AuthIconName =
  | 'mail'
  | 'lock'
  | 'person'
  | 'eye'
  | 'eye-off'
  | 'check';

type AuthIconProps = {
  color?: string;
  name: AuthIconName;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function AuthIcon({
  color = '#9A9088',
  name,
  size = 22,
  style,
}: AuthIconProps) {
  const boxStyle = [{ width: size, height: size }, style];

  if (name === 'mail') {
    return (
      <View style={[styles.iconBox, boxStyle]}>
        <View
          style={[
            styles.mailBox,
            {
              borderColor: color,
              width: size * 0.86,
              height: size * 0.62,
              borderRadius: size * 0.1,
              borderWidth: Math.max(1.5, size * 0.07),
            },
          ]}
        />
        <View
          style={[
            styles.mailFlapLeft,
            {
              backgroundColor: color,
              width: size * 0.42,
              height: Math.max(1.5, size * 0.07),
              top: size * 0.46,
              left: size * 0.16,
            },
          ]}
        />
        <View
          style={[
            styles.mailFlapRight,
            {
              backgroundColor: color,
              width: size * 0.42,
              height: Math.max(1.5, size * 0.07),
              top: size * 0.46,
              right: size * 0.16,
            },
          ]}
        />
      </View>
    );
  }

  if (name === 'lock') {
    return (
      <View style={[styles.iconBox, boxStyle]}>
        <View
          style={[
            styles.lockShackle,
            {
              borderColor: color,
              width: size * 0.46,
              height: size * 0.42,
              borderTopLeftRadius: size * 0.24,
              borderTopRightRadius: size * 0.24,
              borderWidth: Math.max(1.5, size * 0.075),
              top: size * 0.1,
            },
          ]}
        />
        <View
          style={[
            styles.lockBody,
            {
              borderColor: color,
              width: size * 0.7,
              height: size * 0.48,
              borderRadius: size * 0.13,
              borderWidth: Math.max(1.5, size * 0.075),
              bottom: size * 0.1,
            },
          ]}
        >
          <View
            style={[
              styles.lockDot,
              {
                backgroundColor: color,
                width: size * 0.12,
                height: size * 0.12,
                borderRadius: size * 0.06,
              },
            ]}
          />
        </View>
      </View>
    );
  }

  if (name === 'person') {
    return (
      <View style={[styles.iconBox, boxStyle]}>
        <View
          style={[
            styles.personHead,
            {
              borderColor: color,
              width: size * 0.36,
              height: size * 0.36,
              borderRadius: size * 0.18,
              borderWidth: Math.max(1.5, size * 0.075),
              top: size * 0.12,
            },
          ]}
        />
        <View
          style={[
            styles.personBody,
            {
              borderColor: color,
              width: size * 0.72,
              height: size * 0.38,
              borderTopLeftRadius: size * 0.36,
              borderTopRightRadius: size * 0.36,
              borderWidth: Math.max(1.5, size * 0.075),
              bottom: size * 0.1,
            },
          ]}
        />
      </View>
    );
  }

  if (name === 'eye' || name === 'eye-off') {
    return (
      <View style={[styles.iconBox, boxStyle]}>
        <View
          style={[
            styles.eyeOuter,
            {
              borderColor: color,
              width: size * 0.84,
              height: size * 0.5,
              borderRadius: size * 0.42,
              borderWidth: Math.max(1.5, size * 0.07),
            },
          ]}
        />
        <View
          style={[
            styles.eyePupil,
            {
              backgroundColor: color,
              width: size * 0.18,
              height: size * 0.18,
              borderRadius: size * 0.09,
            },
          ]}
        />
        {name === 'eye-off' ? (
          <View
            style={[
              styles.eyeSlash,
              {
                backgroundColor: color,
                width: size * 1.02,
                height: Math.max(1.6, size * 0.075),
              },
            ]}
          />
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.iconBox, boxStyle]}>
      <View
        style={[
          styles.checkShort,
          {
            backgroundColor: color,
            width: size * 0.28,
            height: Math.max(2, size * 0.1),
          },
        ]}
      />
      <View
        style={[
          styles.checkLong,
          {
            backgroundColor: color,
            width: size * 0.55,
            height: Math.max(2, size * 0.1),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  iconBox: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mailBox: {
    position: 'absolute',
  },
  mailFlapLeft: {
    position: 'absolute',
    borderRadius: 999,
    transform: [{ rotate: '34deg' }],
  },
  mailFlapRight: {
    position: 'absolute',
    borderRadius: 999,
    transform: [{ rotate: '-34deg' }],
  },
  lockShackle: {
    position: 'absolute',
    borderBottomWidth: 0,
  },
  lockBody: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockDot: {},
  personHead: {
    position: 'absolute',
  },
  personBody: {
    position: 'absolute',
    borderBottomWidth: 0,
  },
  eyeOuter: {
    position: 'absolute',
  },
  eyePupil: {
    position: 'absolute',
  },
  eyeSlash: {
    position: 'absolute',
    borderRadius: 999,
    transform: [{ rotate: '-38deg' }],
  },
  checkShort: {
    position: 'absolute',
    borderRadius: 999,
    left: '24%',
    top: '54%',
    transform: [{ rotate: '45deg' }],
  },
  checkLong: {
    position: 'absolute',
    borderRadius: 999,
    right: '14%',
    top: '46%',
    transform: [{ rotate: '-45deg' }],
  },
});
