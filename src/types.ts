export interface WaterLog {
  id: string;
  amount: number; // in mL
  timestamp: string; // ISO date-time
}

export type CoachMode = "witty" | "mindful" | "scientific" | "energetic";

export interface ReminderSettings {
  intervalMinutes: number; // e.g. 120 for 2 hours
  soundEnabled: boolean;
  notificationsEnabled: boolean;
}

export interface DailyRecord {
  date: string; // ISO date string (YYYY-MM-DD)
  intake: number; // total intake for that day in mL
  goal: number; // goal for that day in mL
  logs: WaterLog[]; // logs for that day
  completed: boolean; // whether goal was achieved
}

export interface StreakData {
  currentStreak: number; // consecutive days with goal achieved
  longestStreak: number; // longest streak ever
  lastCompletedDate: string | null; // ISO date string of last completed day
  totalDaysCompleted: number; // total number of days goal was achieved
}

export interface StorageData {
  version: number; // data structure version for migrations
  currentIntake: number;
  dailyGoal: number;
  coachMode: CoachMode;
  settings: ReminderSettings;
  dailyHistory: DailyRecord[]; // historical data by date
  streaks: StreakData;
  lastVisitDate: string; // ISO date string of last app visit
}

export interface HydrationState {
  currentIntake: number; // in mL
  dailyGoal: number; // in mL
  history: WaterLog[];
  coachMode: CoachMode;
  currentTip: string;
  loadingTip: boolean;
  settings: ReminderSettings;
  streaks: StreakData;
}
