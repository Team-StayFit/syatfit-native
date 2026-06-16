import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors } from '@/constants/tokens';

interface PropertyImagePlaceholderProps {
  style?: StyleProp<ViewStyle>;
  size?: number;
}

// 매물 이미지가 없을 때 보여줄 기본 이미지 (집 아이콘 + 배경 패턴)
export default function PropertyImagePlaceholder({ style, size = 56 }: PropertyImagePlaceholderProps) {
  const roofWidth = size * 0.62;
  const roofHeight = size * 0.5;
  const bodyWidth = size;
  const bodyHeight = size * 0.74;
  const doorWidth = size * 0.26;
  const doorHeight = size * 0.36;
  const circleSize = size * 3.4;

  return (
    <View style={[styles.root, style]}>
      <View
        style={[
          styles.circle,
          {
            width: circleSize,
            height: circleSize,
            borderRadius: circleSize / 2,
            top: -circleSize * 0.32,
            right: -circleSize * 0.32,
          },
        ]}
      />
      <View
        style={[
          styles.circle,
          styles.circleSmall,
          {
            width: circleSize * 0.55,
            height: circleSize * 0.55,
            borderRadius: circleSize * 0.275,
            bottom: -circleSize * 0.25,
            left: -circleSize * 0.2,
          },
        ]}
      />
      <View style={styles.house}>
        <View
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: roofWidth,
            borderRightWidth: roofWidth,
            borderBottomWidth: roofHeight,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: colors.mint,
          }}
        />
        <View
          style={[
            styles.body,
            {
              width: bodyWidth,
              height: bodyHeight,
            },
          ]}
        >
          <View
            style={[
              styles.door,
              {
                width: doorWidth,
                height: doorHeight,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 199, 140, 0.14)',
  },
  circleSmall: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  house: {
    alignItems: 'center',
  },
  body: {
    backgroundColor: colors.mint,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  door: {
    backgroundColor: colors.navy,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
});
