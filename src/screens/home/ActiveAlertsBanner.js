import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated } from 'react-native';
import { useBencanaPoints } from '../../hooks/useBencanaPoints';
import { useCalamityPoints } from '../../hooks/useCalamityPoints';
import { PALETTE } from '../../constants/palette';

const SPEED = 70; // px/s

export default function ActiveAlertsBanner() {
  const { bencanaPoints } = useBencanaPoints();
  const { calamityPoints } = useCalamityPoints();

  const [containerWidth, setContainerWidth] = useState(0);
  const [textWidth, setTextWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const items = [
    ...bencanaPoints
      .filter((p) => p.status !== 'resolved' && p.category)
      .map((p) => ({ type: 'bencana', category: p.category })),
    ...calamityPoints
      .filter((p) => p.category)
      .map((p) => ({ type: 'kecemasan', category: p.category })),
  ];

  const text = items.map((i) => i.category).join(' ');

  useEffect(() => {
    if (!containerWidth || !textWidth || !text) return;
    const distance = containerWidth + textWidth;
    const duration = (distance / SPEED) * 1000;

    let stopped = false;

    const runPass = () => {
      translateX.setValue(containerWidth);
      Animated.timing(translateX, {
        toValue: -textWidth,
        duration,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished && !stopped) runPass();
      });
    };
    runPass();

    return () => { stopped = true; };
  }, [containerWidth, textWidth, text, translateX]);

  if (items.length === 0) return null;

  const bgColor = pulseAnim.interpolate({
    inputRange: [0.3, 1],
    outputRange: ['#fecaca', PALETTE.cardLight],
  });

  return (
    <View
      style={{
        borderBottomWidth: 3,
        borderBottomColor: '#fdba74',
      }}
    >
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: bgColor,
        }}
      />

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 14,
          paddingVertical: 8,
          gap: 8,
        }}
      >
        

      <View
        style={{ flex: 1, overflow: 'hidden' }}
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      >
        <Animated.Text
          onLayout={(e) => setTextWidth(e.nativeEvent.layout.width)}
          style={{
            alignSelf: 'flex-start',
            flexShrink: 0,
            fontWeight: '700',
            fontSize: 14,
            whiteSpace: 'nowrap',
            transform: [{ translateX }],
          }}
        >
          {items.map((item, idx) => (
            <Text
              key={idx}
              style={{ color: item.type === 'bencana' ? '#dc2626' : PALETTE.orange }}
            >
              {item.type === 'bencana' ? 'BENCANA: ' : 'KECEMASAN: '}
              {item.category}
              {idx < items.length - 1 ? '   •   ' : ''}
            </Text>
          ))}
        </Animated.Text>
      </View>
      </View>
    </View>
  );
}