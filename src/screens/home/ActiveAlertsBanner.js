import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated } from 'react-native';
import { useBencanaPoints } from '../../hooks/useBencanaPoints';
import { useCalamityPoints } from '../../hooks/useCalamityPoints';
import { PALETTE } from '../../constants/palette';

const SPEED = 120; // px/s

export default function ActiveAlertsBanner() {
  const { bencanaPoints } = useBencanaPoints();
  const { calamityPoints } = useCalamityPoints();

  const [containerWidth, setContainerWidth] = useState(0);
  const [textWidth, setTextWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;

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

  return (
    <View
      style={{
        overflow: 'hidden',
        backgroundColor: PALETTE.orange,
        paddingVertical: 8,
        borderRadius: 12,
      }}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <Animated.Text
        onLayout={(e) => setTextWidth(e.nativeEvent.layout.width)}
        numberOfLines={1}
        style={{
          alignSelf: 'flex-start',
          fontWeight: '700',
          fontSize: 14,
          whiteSpace: 'nowrap',
          transform: [{ translateX }],
        }}
      >
        {items.map((item, idx) => (
          <Text
            key={idx}
            style={{ color: item.type === 'bencana' ? PALETTE.white : '#FFD54F' }}
          >
            {item.type === 'bencana' ? 'BENCANA: ' : 'KECEMASAN: '}
            {item.category}
            {idx < items.length - 1 ? '   •   ' : ''}
          </Text>
        ))}
      </Animated.Text>
    </View>
  );
}