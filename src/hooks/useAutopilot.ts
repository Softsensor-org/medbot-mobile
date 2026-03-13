import { useMemo } from 'react';
import { useRoutineAssignments } from './useRoutineAssignments';
import { useCompleteAssignment, useDeferAssignment } from './useRoutineActions';
import { usePatientProgress } from './useProgress';
import { hapticService } from '../api/HapticService';
import { RoutineAssignment } from '../types/medical';

export type AutopilotStepType = 'routine' | 'symptom' | 'photo' | 'complete';

export interface AutopilotStep {
  id: string;
  type: AutopilotStepType;
  title: string;
  subtitle: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
}

export function useAutopilot() {
  const { data: assignments = [], isLoading: isLoadingRoutines } = useRoutineAssignments();
  const { data: progress, isLoading: isLoadingProgress } = usePatientProgress(1);
  
  const completeRoutine = useCompleteAssignment();
  const deferRoutine = useDeferAssignment();

  const activeRoutines = useMemo(() => 
    assignments.filter(a => a.status === 'active'),
    [assignments]
  );

  const steps = useMemo(() => {
    const s: AutopilotStep[] = [];

    // Add active routines as steps
    activeRoutines.forEach(r => {
      s.push({
        id: `routine-${r.id}`,
        type: 'routine',
        title: r.routine_name || 'Routine',
        subtitle: r.routine_description || 'Daily task',
        data: r
      });
    });

    // If all routines done, check if photo is needed (simplified logic: if none today)
    if (s.length === 0 && (!progress?.photos || progress.photos.length === 0)) {
        s.push({
            id: 'daily-photo',
            type: 'photo',
            title: 'Daily Progress Photo',
            subtitle: 'Keep your timeline up to date',
        });
    }

    // Add final completion step
    if (s.length === 0) {
        s.push({
            id: 'autopilot-complete',
            type: 'complete',
            title: 'All Caught Up!',
            subtitle: 'You\'ve completed your plan for now.',
        });
    }

    return s;
  }, [activeRoutines, progress]);

  const currentStep = steps[0];

  const handleDone = async () => {
    if (currentStep.type === 'routine') {
      const r = currentStep.data as RoutineAssignment;
      hapticService.triggerSuccess();
      await completeRoutine.mutateAsync({
        assignmentId: r.id,
        payload: {
          action: 'complete',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          completed_at: new Date().toISOString(),
          completion_rate: 1.0
        }
      });
    }
  };

  const handleSnooze = async () => {
    if (currentStep.type === 'routine') {
      const r = currentStep.data as RoutineAssignment;
      hapticService.triggerWarning();
      // Snooze = later today
      await deferRoutine.mutateAsync({
        assignmentId: r.id,
        payload: {
          action: 'defer',
          defer_reason_code: 'too_busy',
          reschedule_intent: { type: 'later_today' }
        }
      });
    }
  };

  const handleSkip = async () => {
    if (currentStep.type === 'routine') {
      const r = currentStep.data as RoutineAssignment;
      hapticService.triggerSelection();
      // Skip = tomorrow
      await deferRoutine.mutateAsync({
        assignmentId: r.id,
        payload: {
          action: 'defer',
          defer_reason_code: 'too_busy',
          reschedule_intent: { type: 'tomorrow' }
        }
      });
    }
  };

  return {
    currentStep,
    totalSteps: steps.length,
    remainingRoutines: activeRoutines.length,
    isLoading: isLoadingRoutines || isLoadingProgress,
    handleDone,
    handleSnooze,
    handleSkip,
    isProcessing: completeRoutine.isPending || deferRoutine.isPending
  };
}
