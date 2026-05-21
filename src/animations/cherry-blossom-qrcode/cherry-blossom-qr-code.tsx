import {
  Pressable,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import {
  KeyboardStickyView,
  useKeyboardHandler,
} from 'react-native-keyboard-controller';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Canvas, CanvasRef } from 'react-native-wgpu';

import { CONTAINER_BG, DEFAULT_QR_CONTENT } from './constants';
import { useWebGPU } from './hooks';
import { Season } from './types';

const SEASON_THEMES = {
  [Season.Spring]: {
    activeBg: '#e899a8',
    text: 'Spring',
    emoji: '🌸',
  },
  [Season.Summer]: {
    activeBg: '#4a7c4e',
    text: 'Summer',
    emoji: '🌿',
  },
  [Season.Autumn]: {
    activeBg: '#d87d3a',
    text: 'Autumn',
    emoji: '🍁',
  },
  [Season.Winter]: {
    activeBg: '#5f9ea0',
    text: 'Winter',
    emoji: '❄️',
  },
};

// Sub-component for individual tab labels with animated micro-scaling
interface TabLabelProps {
  label: string;
  emoji: string;
  isActive: boolean;
}

const TabLabel = ({ label, emoji, isActive }: TabLabelProps) => {
  const scale = useSharedValue(isActive ? 1.06 : 1.0);
  const opacity = useSharedValue(isActive ? 1.0 : 0.65);

  useEffect(() => {
    scale.value = withSpring(isActive ? 1.06 : 1.0, {
      damping: 14,
      stiffness: 140,
    });
    opacity.value = withSpring(isActive ? 1.0 : 0.65, {
      damping: 14,
      stiffness: 140,
    });
  }, [isActive, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.Text
      style={[
        styles.tabText,
        isActive ? styles.tabTextActive : styles.tabTextInactive,
        animatedStyle,
      ]}>
      {emoji} {label}
    </Animated.Text>
  );
};

export const CherryBlossomQRCode = () => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const canvasWidth = windowWidth;
  const canvasHeight = windowHeight * 0.6;

  const [qrContent, setQrContent] = useState(DEFAULT_QR_CONTENT);
  const [season, setSeason] = useState<Season>(Season.Spring);
  const inputRef = useRef<TextInput>(null);
  const canvasRef = useRef<CanvasRef>(null);
  const isFlat = useRef(false);

  // Keyboard handling
  const keyboardHeight = useSharedValue(0);

  // Segmented slider Reanimated active states
  const activeIndex = useSharedValue(0);
  const pillScaleX = useSharedValue(1.0);
  const pillScaleY = useSharedValue(1.0);

  useKeyboardHandler({
    onMove: e => {
      'worklet';
      keyboardHeight.value = e.height;
    },
  });

  const canvasWrapperStyle = useAnimatedStyle(() => ({
    marginBottom: keyboardHeight.value,
  }));

  // Initialize WebGPU rendering
  useWebGPU({
    canvasRef,
    canvasWidth,
    canvasHeight,
    qrContent,
    isFlat,
    season,
  });

  const handlePress = useCallback(() => {
    isFlat.current = !isFlat.current;
    inputRef.current?.focus();
  }, []);

  const handleInputBlur = useCallback(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, []);

  const handleSeasonChange = useCallback(
    (newSeason: Season) => {
      if (newSeason === season) return;

      // Premium quick spring for position
      activeIndex.value = withSpring(newSeason, {
        damping: 16,
        stiffness: 140,
        mass: 0.8,
      });

      // Squash and stretch simulation based on slide distance
      const distance = Math.abs(newSeason - season);
      const scaleXTarget = 1.0 + Math.min(distance * 0.12, 0.28);
      const scaleYTarget = 1.0 - Math.min(distance * 0.08, 0.18);

      pillScaleX.value = withSpring(
        scaleXTarget,
        { damping: 8, stiffness: 220 },
        () => {
          pillScaleX.value = withSpring(1.0, { damping: 14, stiffness: 150 });
        },
      );

      pillScaleY.value = withSpring(
        scaleYTarget,
        { damping: 8, stiffness: 220 },
        () => {
          pillScaleY.value = withSpring(1.0, { damping: 14, stiffness: 150 });
        },
      );

      setSeason(newSeason);
    },
    [season, activeIndex, pillScaleX, pillScaleY],
  );

  // Dimensions for segmented tab selector
  const paddingOffset = 8;
  const selectorInnerWidth = windowWidth - 24 - paddingOffset;
  const tabWidth = selectorInnerWidth / 4;

  const animatedPillStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: activeIndex.value * tabWidth },
      { scaleX: pillScaleX.value },
      { scaleY: pillScaleY.value },
    ],
    backgroundColor: SEASON_THEMES[season].activeBg,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.canvasWrapper, canvasWrapperStyle]}>
        <Pressable
          accessibilityLabel="Cherry blossom tree QR code"
          onPress={handlePress}
          style={{ width: canvasWidth, height: canvasHeight }}>
          <Canvas ref={canvasRef} style={styles.canvas} />
        </Pressable>
      </Animated.View>
      <KeyboardStickyView style={styles.inputContainer}>
        {/* Seasonal Segmented Selector with Glassmorphism */}
        <View style={styles.selectorContainer}>
          <Animated.View
            style={[styles.activePill, { width: tabWidth }, animatedPillStyle]}
          />
          {([Season.Spring, Season.Summer, Season.Autumn, Season.Winter] as Season[]).map(
            s => {
              const isActive = season === s;
              return (
                <Pressable
                  key={s}
                  onPress={() => handleSeasonChange(s)}
                  style={styles.tabButton}>
                  <TabLabel
                    label={SEASON_THEMES[s].text}
                    emoji={SEASON_THEMES[s].emoji}
                    isActive={isActive}
                  />
                </Pressable>
              );
            },
          )}
        </View>

        <TextInput
          ref={inputRef}
          style={styles.input}
          value={qrContent}
          onChangeText={setQrContent}
          onBlur={handleInputBlur}
          placeholder="https://enzo.fyi"
          placeholderTextColor="#999"
          selectionColor={SEASON_THEMES[season].activeBg}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
          inputMode="url"
          keyboardAppearance="light"
          showSoftInputOnFocus={true}
          autoFocus
        />
      </KeyboardStickyView>
    </View>
  );
};

const styles = StyleSheet.create({
  activePill: {
    borderRadius: 12,
    bottom: 4,
    elevation: 2,
    left: 4,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    top: 4,
  },
  canvas: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  canvasWrapper: {
    flex: 1,
    paddingTop: '10%',
  },
  container: {
    backgroundColor: CONTAINER_BG,
    flex: 1,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1.5,
    borderCurve: 'continuous',
    borderRadius: 16,
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.2,
    marginTop: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },
  inputContainer: {
    paddingBottom: 8,
    paddingHorizontal: 12,
    paddingTop: 16,
  },
  selectorContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.60)',
    borderColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1.5,
    borderCurve: 'continuous',
    borderRadius: 16,
    flexDirection: 'row',
    padding: 4,
    position: 'relative',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  tabButton: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 12,
    zIndex: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.15,
  },
  tabTextActive: {
    color: '#fff',
  },
  tabTextInactive: {
    color: '#657480',
  },
});
