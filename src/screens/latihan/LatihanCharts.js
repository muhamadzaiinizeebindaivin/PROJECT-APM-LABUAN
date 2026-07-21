// src/screens/latihan/LatihanCharts.js
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, Pressable } from 'react-native';
import { PALETTE } from '../../constants/palette';
import { latihanStyles as styles } from './latihanStyles';

export const AnimatedVerticalBar = ({ height, delay, isSelected, isCurrentMonth, onPress, label, value, total }) => {
  const animatedHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const safeHeight = Number.isFinite(height) ? Math.max(height, value > 0 ? 8 : 0) : 0;
    Animated.timing(animatedHeight, {
      toValue: safeHeight, duration: 900, delay,
      easing: Easing.out(Easing.exp), useNativeDriver: false,
    }).start();
  }, [height]);

  return (
    <View style={styles.barWrapper}>
      {isSelected ? (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipText}>{total > 0 ? Math.round((value / total) * 100) : 0}% daripada jumlah</Text>
        </View>
      ) : null}

      {value > 0 ? (
        <Text style={[styles.barValue, isSelected && styles.barValueSelected]}>{value}</Text>
      ) : null}

      <Pressable onPress={onPress} style={styles.barTrack}>
        <Animated.View
          style={[styles.barFill, {
            height: animatedHeight,
            backgroundColor: isSelected ? PALETTE.orangeDark : PALETTE.orange,
          }]}
        />
      </Pressable>

      <Text style={[
        styles.barLabel,
        isCurrentMonth && styles.barLabelCurrent,
        isSelected && { fontWeight: '800' },
      ]}>{label}</Text>
    </View>
  );
};

export const AnimatedHorizontalBar = ({ widthPercent, color, delay }) => {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const safeWidth = Number.isFinite(widthPercent) ? widthPercent : 0;
    Animated.timing(animatedWidth, {
      toValue: safeWidth, duration: 1000, delay,
      easing: Easing.out(Easing.exp), useNativeDriver: false,
    }).start();
  }, [widthPercent]);

  const widthInterp = animatedWidth.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, { width: widthInterp, backgroundColor: color }]} />
    </View>
  );
};

export const StatusDonut = ({ completionRate, completed, upcoming, failed }) => (
  <>
    <View style={styles.donutContainer}>
      <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: PALETTE.surface, transform: [{ rotate: '-90deg' }] }}>
        <View style={{ position: 'absolute', width: 50, height: 100, left: 0, overflow: 'hidden' }}>
          <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: completionRate > 50 ? PALETTE.success : PALETTE.surface, position: 'absolute', left: 0 }} />
        </View>
        <View style={{ position: 'absolute', width: 100, height: 100, transform: [{ rotate: `${(completionRate / 100) * 360}deg` }] }}>
          <View style={{ position: 'absolute', width: 50, height: 100, right: 0, overflow: 'hidden' }}>
            <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: PALETTE.success, position: 'absolute', right: 0 }} />
          </View>
        </View>
        {completionRate <= 50 ? (
          <View style={{ position: 'absolute', width: 50, height: 100, left: 0, overflow: 'hidden' }}>
            <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: PALETTE.surface, position: 'absolute', left: 0 }} />
          </View>
        ) : null}
      </View>

      <View style={styles.donutCenter}>
        <Text style={styles.donutText}>{completionRate}%</Text>
        <Text style={styles.donutSub}>Berjaya</Text>
      </View>
    </View>

    <View style={styles.legendRow}>
      <View style={styles.legendItem}>
        <View style={[styles.dot, { backgroundColor: PALETTE.success }]} />
        <Text style={styles.legendText}>Berjaya ({completed})</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.dot, { backgroundColor: '#eab308' }]} />
        <Text style={styles.legendText}>Akan Diadakan ({upcoming})</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.dot, { backgroundColor: PALETTE.danger }]} />
        <Text style={styles.legendText}>Tidak Berjaya ({failed})</Text>
      </View>
    </View>
  </>
);