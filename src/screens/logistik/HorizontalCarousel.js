import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Animated, PanResponder, ScrollView } from 'react-native';
import { logistikStyles as styles } from './logistikStyles';

const PX_PER_SECOND = 20;
const SCROLLBAR_TRACK_WIDTH = 160;
const MIN_THUMB_WIDTH = 28;

export default function HorizontalCarousel({ items, cardWidth, cardGap = 10, renderItem, pauseAutoScroll = false, interacting = false }) {
  const scrollRef = useRef(null);
  const scrollXRef = useRef(0);
  const viewportWidthRef = useRef(1);
  const [viewportWidth, setViewportWidth] = useState(1);
  const rafRef = useRef(null);
  const lastFrameTimeRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const directionRef = useRef(1);
  const userInteractingRef = useRef(false);
  const [hovered, setHovered] = useState(false);

  const contentWidth = Math.max(1, items.length * (cardWidth + cardGap) - cardGap);
  const active = items.length > 1 && !pauseAutoScroll && !hovered && !interacting;

  const stopAutoScroll = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    lastFrameTimeRef.current = null;
  }, []);

  const startAutoScroll = useCallback(() => {
    stopAutoScroll();
    const step = (timestamp) => {
      if (lastFrameTimeRef.current === null) lastFrameTimeRef.current = timestamp;
      const dt = (timestamp - lastFrameTimeRef.current) / 1000;
      lastFrameTimeRef.current = timestamp;

      const maxScroll = Math.max(0, contentWidth - viewportWidthRef.current);
      if (maxScroll <= 0) {
        rafRef.current = requestAnimationFrame(step);
        return;
      }

      let next = scrollXRef.current + directionRef.current * PX_PER_SECOND * dt;
      if (next >= maxScroll) { next = maxScroll; directionRef.current = -1; }
      else if (next <= 0) { next = 0; directionRef.current = 1; }

      scrollXRef.current = next;
      scrollRef.current?.scrollTo({ x: next, animated: false });
      scrollX.setValue(next);
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  }, [contentWidth, scrollX, stopAutoScroll]);

  useEffect(() => {
    if (active && !userInteractingRef.current) startAutoScroll();
    else stopAutoScroll();
    return stopAutoScroll;
  }, [active, startAutoScroll, stopAutoScroll]);

  // Quand le pop-up se ferme (interacting repasse à false), reprendre le scroll
  useEffect(() => {
    if (!interacting) {
      userInteractingRef.current = false;
      if (active) startAutoScroll();
    }
  }, [interacting]);

  const pauseForInteraction = () => { userInteractingRef.current = true; stopAutoScroll(); };
  const resumeAfterInteraction = () => { userInteractingRef.current = false; if (active) startAutoScroll(); };

  const handleNativeScroll = (e) => {
    const x = e.nativeEvent.contentOffset.x;
    scrollXRef.current = x;
    scrollX.setValue(x);
  };

  const maxScroll = Math.max(1, contentWidth - viewportWidth);

  // ── Glisser directement le contenu avec le clic gauche (souris) ──
  const dragStartScrollXContentRef = useRef(0);

  const contentPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => Math.abs(gestureState.dx) > 3,
      onPanResponderGrant: () => {
        pauseForInteraction();
        dragStartScrollXContentRef.current = scrollXRef.current;
      },
      onPanResponderMove: (evt, gestureState) => {
        // Glisser vers la gauche (dx négatif) doit avancer le contenu (x augmente) — d'où le signe inversé
        const x = Math.max(0, Math.min(maxScroll, dragStartScrollXContentRef.current - gestureState.dx));
        scrollRef.current?.scrollTo({ x, animated: false });
        scrollXRef.current = x;
        scrollX.setValue(x);
      },
      onPanResponderRelease: () => resumeAfterInteraction(),
      onPanResponderTerminate: () => resumeAfterInteraction(),
    })
  ).current;

  // ── Scrollbar draggable en bas ──
  const thumbWidth = Math.max(MIN_THUMB_WIDTH, SCROLLBAR_TRACK_WIDTH * Math.min(1, viewportWidth / contentWidth));
  const thumbTravel = Math.max(0, SCROLLBAR_TRACK_WIDTH - thumbWidth);
  const dragStartScrollXThumbRef = useRef(0);

  const thumbPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => { pauseForInteraction(); dragStartScrollXThumbRef.current = scrollXRef.current; },
      onPanResponderMove: (evt, gestureState) => {
        const deltaX = (gestureState.dx / Math.max(1, thumbTravel)) * maxScroll;
        const x = Math.max(0, Math.min(maxScroll, dragStartScrollXThumbRef.current + deltaX));
        scrollRef.current?.scrollTo({ x, animated: false });
        scrollXRef.current = x;
        scrollX.setValue(x);
      },
      onPanResponderRelease: () => resumeAfterInteraction(),
      onPanResponderTerminate: () => resumeAfterInteraction(),
    })
  ).current;

  const handleTrackPress = (evt) => {
    const trackX = evt.nativeEvent.locationX;
    const ratio = Math.max(0, Math.min(1, (trackX - thumbWidth / 2) / thumbTravel));
    const x = ratio * maxScroll;
    pauseForInteraction();
    scrollRef.current?.scrollTo({ x, animated: true });
    scrollXRef.current = x;
    scrollX.setValue(x);
    setTimeout(resumeAfterInteraction, 300);
  };

  return (
    <View>
      <View
        style={styles.categoryCarouselViewport}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          viewportWidthRef.current = w;
          setViewportWidth(w);
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onMouseDown={() => pauseForInteraction()}
        {...contentPanResponder.panHandlers}
      >
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          scrollEnabled={false}
          onScroll={handleNativeScroll}
          contentContainerStyle={styles.categoryCarouselTrack}
        >
          {items.map((item, index) => renderItem(item, index))}
        </ScrollView>
      </View>

      {contentWidth > viewportWidth && (
        <View
          style={styles.categoryScrollTrack}
          onStartShouldSetResponder={() => true}
          onResponderRelease={handleTrackPress}
        >
          <Animated.View
            {...thumbPanResponder.panHandlers}
            style={[
              styles.categoryScrollThumb,
              {
                width: thumbWidth,
                transform: [{
                  translateX: scrollX.interpolate({
                    inputRange: [0, Math.max(1, maxScroll)],
                    outputRange: [0, thumbTravel],
                    extrapolate: 'clamp',
                  }),
                }],
              },
            ]}
          />
        </View>
      )}
    </View>
  );
}