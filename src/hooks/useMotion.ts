import { useState, useEffect } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

export function useMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const check = async () => {
      const isEnabled = await AccessibilityInfo.isReduceMotionEnabled();
      setReduceMotion(isEnabled);
    };

    check();
    
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (isEnabled) => {
      setReduceMotion(isEnabled);
    });

    return () => sub.remove();
  }, []);

  return {
    reduceMotion,
    // Animation config helper
    animationConfig: {
        duration: reduceMotion ? 0 : 300,
    }
  };
}
