export const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];
export type RoutineStatus = "pending" | "completed" | "failed";

export interface RoutineItem {
  id: string;
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  title: string;
  status: RoutineStatus;
}

export interface DailyStats {
  completed: number;
  failed: number;
  pending: number;
  percentage: number;
}
