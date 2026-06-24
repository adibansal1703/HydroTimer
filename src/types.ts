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

export interface HydrationState {
  currentIntake: number; // in mL
  dailyGoal: number; // in mL
  history: WaterLog[];
  coachMode: CoachMode;
  currentTip: string;
  loadingTip: boolean;
  settings: ReminderSettings;
}
