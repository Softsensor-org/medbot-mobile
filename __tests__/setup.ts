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
  interface MockMMKV {
    set: jest.Mock;
    getString: jest.Mock;
    getNumber: jest.Mock;
    getBoolean: jest.Mock;
    contains: jest.Mock;
    delete: jest.Mock;
    remove: jest.Mock;
    clearAll: jest.Mock;
  }

  const instances = new Map<string, MockMMKV>();

  function createStatefulStorage(config?: { id?: string }): MockMMKV {
    const id = config?.id ?? '__default__';
    if (instances.has(id)) return instances.get(id)!;
    const store = new Map<string, string | number | boolean>();
    const instance: MockMMKV = {
      set: jest.fn((key: string, value: string | number | boolean) => { store.set(key, value); }),
      getString: jest.fn((key: string) => { const v = store.get(key); return typeof v === 'string' ? v : undefined; }),
      getNumber: jest.fn((key: string) => { const v = store.get(key); return typeof v === 'number' ? v : undefined; }),
      getBoolean: jest.fn((key: string) => { const v = store.get(key); return typeof v === 'boolean' ? v : undefined; }),
      contains: jest.fn((key: string) => store.has(key)),
      delete: jest.fn((key: string) => { store.delete(key); }),
      remove: jest.fn((key: string) => { store.delete(key); }),
      clearAll: jest.fn(() => { store.clear(); }),
    };
    instances.set(id, instance);
    return instance;
  }

  return {
    MMKV: jest.fn().mockImplementation(createStatefulStorage),
    createMMKV: jest.fn().mockImplementation(createStatefulStorage),
    __resetAllMMKVInstances: () => { instances.forEach((i: MockMMKV) => i.clearAll()); instances.clear(); },
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

jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (key: string) => store.get(key) || null),
    setItemAsync: jest.fn(async (key: string, value: string) => { store.set(key, value); }),
    deleteItemAsync: jest.fn(async (key: string) => { store.delete(key); }),
    __resetSecureStore: () => store.clear(),
  };
});

jest.mock('../src/api/client', () => ({
  __esModule: true,
  default: {
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn(), handlers: [] },
      response: { use: jest.fn(), eject: jest.fn(), handlers: [] },
    },
    get: jest.fn().mockResolvedValue({ data: { success: true } }),
    post: jest.fn().mockResolvedValue({ data: { success: true } }),
    put: jest.fn().mockResolvedValue({ data: { success: true } }),
    delete: jest.fn().mockResolvedValue({ data: { success: true } }),
  },
  api: {
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn(), handlers: [] },
      response: { use: jest.fn(), eject: jest.fn(), handlers: [] },
    },
  }
}));

// Global teardown to ensure no open handles or leaked state
afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
  
  // @ts-ignore - access internal mock reset
  const mmkv = require('react-native-mmkv');
  if (mmkv.__resetAllMMKVInstances) mmkv.__resetAllMMKVInstances();
  
  const secureStore = require('expo-secure-store');
  if (secureStore.__resetSecureStore) secureStore.__resetSecureStore();
});
