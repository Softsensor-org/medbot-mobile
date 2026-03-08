import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

export interface HabitStreak {
  id: number;
  routine_id: number;
  routine_name: string;
  current_streak: number;
  longest_streak: number;
  recovery_streak: number;
  last_completed_date: string;
  streak_broken_at: string | null;
}

export interface HabitEvent {
  id: number;
  event_type: "completed" | "skipped" | "streak_broken" | "streak_recovered" | "milestone";
  event_date: string;
  streak_at_event: number;
  routine_name: string;
}

export function useHabitStreaks() {
  return useQuery<HabitStreak[]>({
    queryKey: ["habit-streaks"],
    queryFn: async () => {
      const response = await api.get("/habits/streaks");
      return response.data.data;
    },
  });
}

export function useHabitHistory(limit: number = 20) {
  return useQuery<HabitEvent[]>({
    queryKey: ["habit-history", limit],
    queryFn: async () => {
      const response = await api.get("/habits/history", { params: { limit } });
      return response.data.data;
    },
  });
}
