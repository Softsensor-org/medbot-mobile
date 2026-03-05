import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import EvidenceProgressBar from '../src/components/EvidenceProgressBar';
import { EvidenceSlot } from '../src/types/ai';

describe('EvidenceProgressBar', () => {
  const mockSlots: EvidenceSlot[] = [
    { name: 'location', state: 'provided', value: 'left arm' },
    { name: 'duration', state: 'pending' },
    { name: 'severity', state: 'unknown' },
  ];

  const defaultProps = {
    evidenceSlots: mockSlots,
    evidenceCompleteness: 0.33,
    missingEvidence: ['duration'],
    onPress: jest.fn(),
  };

  it('renders correctly with given progress', () => {
    const { getByText, getByLabelText } = render(<EvidenceProgressBar {...defaultProps} />);
    
    expect(getByText('33%')).toBeTruthy();
    expect(getByText('INTAKE PROGRESS')).toBeTruthy();
    expect(getByLabelText('View intake progress details')).toBeTruthy();
  });

  it('renders slot chips with correct labels', () => {
    const { getByText } = render(<EvidenceProgressBar {...defaultProps} />);
    
    expect(getByText('location')).toBeTruthy();
    expect(getByText('duration')).toBeTruthy();
    expect(getByText('severity')).toBeTruthy();
  });

  it('shows missing hint text when slots are pending', () => {
    const { getByText } = render(<EvidenceProgressBar {...defaultProps} />);
    
    expect(getByText(/Still needed: duration/i)).toBeTruthy();
  });

  it('does not render when evidenceCompleteness is 0', () => {
    const { toJSON } = render(
      <EvidenceProgressBar {...defaultProps} evidenceCompleteness={0} />
    );
    expect(toJSON()).toBeNull();
  });

  it('does not render when evidenceCompleteness is 1', () => {
    const { toJSON } = render(
      <EvidenceProgressBar {...defaultProps} evidenceCompleteness={1} />
    );
    expect(toJSON()).toBeNull();
  });

  it('calls onPress when clicked', () => {
    const { getByRole } = render(<EvidenceProgressBar {...defaultProps} />);
    
    fireEvent.press(getByRole('button'));
    expect(defaultProps.onPress).toHaveBeenCalled();
  });
});
