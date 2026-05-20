import { useMemo } from 'react';
import { usePatientData } from './usePatientData';
import { useSubscription } from './useSubscription';

const FREE_WEEKLY_LIMIT = 2;

export function useSessionLimits() {
  const [completedSessions] = usePatientData('completed_sessions', []);
  const { isFreeTier } = useSubscription();

  return useMemo(() => {
    if (!isFreeTier) {
      return { sessionsThisWeek: 0, maxSessions: Infinity, canStartSession: true, remainingSessions: Infinity, isFreeTier: false };
    }

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const sessionsThisWeek = completedSessions.filter(s => {
      const d = new Date(s.date);
      return d >= weekAgo;
    }).length;

    return {
      sessionsThisWeek,
      maxSessions: FREE_WEEKLY_LIMIT,
      canStartSession: sessionsThisWeek < FREE_WEEKLY_LIMIT,
      remainingSessions: Math.max(0, FREE_WEEKLY_LIMIT - sessionsThisWeek),
      isFreeTier: true,
    };
  }, [completedSessions, isFreeTier]);
}
