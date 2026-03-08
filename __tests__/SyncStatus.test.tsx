import React from 'react';
import { render } from '@testing-library/react-native';
import { SyncStatus } from '../src/components/common/SyncStatus';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';

// Mocks
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
}));

const queryClient = new QueryClient();

describe('SyncStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (NetInfo.addEventListener as jest.Mock).mockReturnValue(jest.fn());
  });

  it('renders nothing when online and not syncing', () => {
    const { queryByText } = render(
      <QueryClientProvider client={queryClient}>
        <SyncStatus />
      </QueryClientProvider>
    );
    expect(queryByText('Offline Mode')).toBeNull();
    expect(queryByText(/Syncing/)).toBeNull();
  });
});
