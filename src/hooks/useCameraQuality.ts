import { useState, useEffect } from 'react';
import { Accelerometer } from 'expo-sensors';

export interface CameraQualityState {
  isLevel: boolean;
  isStable: boolean;
  pitch: number;
  roll: number;
  feedback: string;
}

export function useCameraQuality() {
  const [state, setState] = useState<CameraQualityState>({
    isLevel: false,
    isStable: false,
    pitch: 0,
    roll: 0,
    feedback: 'Initializing sensors...',
  });

  useEffect(() => {
    let lastX = 0, lastY = 0, lastZ = 0;
    
    // Set update interval to 100ms for smooth feedback
    Accelerometer.setUpdateInterval(100);

    const subscription = Accelerometer.addListener(data => {
      const { x, y, z } = data;
      
      // 1. Leveling (assuming portrait capture)
      // pitch is rotation around x-axis, roll around y-axis
      // For a perfectly vertical phone: y is ~ -1 or 1, x and z are ~ 0
      // For a perfectly flat phone: z is ~ 1, x and y are ~ 0
      
      // Simplified leveling logic: we want the phone to be relatively flat or perfectly vertical
      // Depending on what the user is photographing. For skin, usually parallel to surface.
      // Let's aim for 'stable' and 'near zero tilt' in at least one axis.
      
      const pitch = Math.atan2(y, z) * (180 / Math.PI);
      const roll = Math.atan2(x, z) * (180 / Math.PI);
      
      const isLevel = Math.abs(roll) < 5 && (Math.abs(pitch) < 5 || Math.abs(pitch - 90) < 5);

      // 2. Stability (detecting movement)
      const delta = Math.abs(x - lastX) + Math.abs(y - lastY) + Math.abs(z - lastZ);
      const isStable = delta < 0.1;

      lastX = x; lastY = y; lastZ = z;

      let feedback = 'Hold steady...';
      if (!isStable) feedback = 'Hold still';
      else if (!isLevel) feedback = 'Adjust angle';
      else feedback = 'Perfect! Capture when ready.';

      setState({
        isLevel,
        isStable,
        pitch,
        roll,
        feedback
      });
    });

    return () => subscription.remove();
  }, []);

  return state;
}
