export const DAYS_OF_WEEK = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jum'at",
  "Sabtu",
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
