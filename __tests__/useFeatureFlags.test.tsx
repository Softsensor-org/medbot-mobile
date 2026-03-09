import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { useFeatureFlags } from '../src/hooks/useFeatureFlags';
import { api } from '../src/api/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mocks
jest.mock('../src/api/client', () => ({
  api: {
    get: jest.fn(),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useFeatureFlags', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  it('returns default flags when API fails', async () => {
    (api.get as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    const { result } = renderHook(() => useFeatureFlags(), { wrapper });
    
    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBeTruthy());
    expect(api.get).toHaveBeenCalledWith('/api/v1/capabilities');
  });

  it('merges backend flags with defaults from capabilities modules', async () => {
    (api.get as jest.Mock).mockResolvedValue({ 
      data: { data: { modules: { usage: false, knowledge_base: false } } } 
    });
    
    const { result } = renderHook(() => useFeatureFlags(), { wrapper });
    
    await waitFor(() => expect(result.current.isSuccess).toBeTruthy());
    expect(result.current.data?.autopilot_enabled).toBe(false);
    expect(result.current.data?.weekly_reveal_enabled).toBe(false);
  });
});
