// Jest setup file for medbot-mobile
import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock('expo-font', () => ({
  isLoaded: jest.fn().mockReturnValue(true),
  loadAsync: jest.fn().mockResolvedValue(true),
}));

jest.mock('expo-asset', () => ({
  Asset: {
    loadAsync: jest.fn().mockResolvedValue(true),
    fromModule: jest.fn().mockReturnValue({
      downloadAsync: jest.fn().mockResolvedValue(true),
    }),
  },
}), { virtual: true });

jest.mock('react-native-mmkv', () => {
  return {
    MMKV: jest.fn().mockImplementation(() => ({
      set: jest.fn(),
      getString: jest.fn(),
      getNumber: jest.fn(),
      getBoolean: jest.fn(),
      contains: jest.fn(),
      delete: jest.fn(),
      clearAll: jest.fn(),
    })),
  };
});

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn().mockReturnValue(jest.fn()),
  fetch: jest.fn().mockResolvedValue({ isConnected: true }),
}));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'fake-token' }),
  scheduleNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  addNotificationReceivedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
}));

jest.mock('expo-sensors', () => ({
  Accelerometer: {
    addListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
    setUpdateInterval: jest.fn(),
  },
}));
