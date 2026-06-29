import { StorageData, DailyRecord, StreakData, WaterLog } from "../types";

const STORAGE_KEY = "hydro_timer_data";
const CURRENT_VERSION = 1;

// Default values for new users or corrupted data
const DEFAULT_STORAGE_DATA: StorageData = {
  version: CURRENT_VERSION,
  currentIntake: 0,
  dailyGoal: 2000,
  coachMode: "witty",
  settings: {
    intervalMinutes: 120,
    soundEnabled: true,
    notificationsEnabled: false,
  },
  dailyHistory: [],
  streaks: {
    currentStreak: 0,
    longestStreak: 0,
    lastCompletedDate: null,
    totalDaysCompleted: 0,
  },
  lastVisitDate: new Date().toISOString().split("T")[0],
};

/**
 * Get today's date in ISO format (YYYY-MM-DD)
 */
const getTodayDate = (): string => {
  return new Date().toISOString().split("T")[0];
};

/**
 * Calculate the difference in days between two dates
 */
const getDaysDifference = (date1: string, date2: string): number => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Check if a date is yesterday
 */
const isYesterday = (date: string): boolean => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date === yesterday.toISOString().split("T")[0];
};

/**
 * Calculate streaks based on daily history
 */
const calculateStreaks = (dailyHistory: DailyRecord[]): StreakData => {
  const completedDays = dailyHistory
    .filter((record) => record.completed)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (completedDays.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastCompletedDate: null,
      totalDaysCompleted: 0,
    };
  }

  const lastCompletedDate = completedDays[0].date;
  const today = getTodayDate();

  // Calculate current streak
  let currentStreak = 0;
  if (lastCompletedDate === today || isYesterday(lastCompletedDate)) {
    currentStreak = 1;
    for (let i = 1; i < completedDays.length; i++) {
      const prevDate = completedDays[i - 1].date;
      const currDate = completedDays[i].date;
      if (getDaysDifference(prevDate, currDate) === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 1;
  for (let i = 1; i < completedDays.length; i++) {
    const prevDate = completedDays[i - 1].date;
    const currDate = completedDays[i].date;
    if (getDaysDifference(prevDate, currDate) === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return {
    currentStreak,
    longestStreak,
    lastCompletedDate,
    totalDaysCompleted: completedDays.length,
  };
};

/**
 * Migration functions for different data versions
 */
const migrations: Record<number, (data: any) => StorageData> = {
  // Migration from version 0 (old format) to version 1
  0: (oldData: any): StorageData => {
    // Handle old format where data was stored in separate keys
    const intake = oldData.currentIntake || parseInt(localStorage.getItem("hydro_intake") || "0");
    const goal = oldData.dailyGoal || parseInt(localStorage.getItem("hydro_goal") || "2000");
    const coachMode = oldData.coachMode || (localStorage.getItem("hydro_coach_mode") as any) || "witty";
    const settings = oldData.settings || JSON.parse(localStorage.getItem("hydro_settings") || "{}");
    const history = oldData.history || JSON.parse(localStorage.getItem("hydro_history") || "[]");

    // Convert old history to daily records
    const dailyHistoryMap = new Map<string, DailyRecord>();
    history.forEach((log: WaterLog) => {
      const date = log.timestamp.split("T")[0];
      if (!dailyHistoryMap.has(date)) {
        dailyHistoryMap.set(date, {
          date,
          intake: 0,
          goal,
          logs: [],
          completed: false,
        });
      }
      const record = dailyHistoryMap.get(date)!;
      record.intake += log.amount;
      record.logs.push(log);
      record.completed = record.intake >= goal;
    });

    const dailyHistory = Array.from(dailyHistoryMap.values());
    const streaks = calculateStreaks(dailyHistory);

    return {
      version: CURRENT_VERSION,
      currentIntake: intake,
      dailyGoal: goal,
      coachMode,
      settings: {
        intervalMinutes: settings.intervalMinutes || 120,
        soundEnabled: settings.soundEnabled !== false,
        notificationsEnabled: settings.notificationsEnabled || false,
      },
      dailyHistory,
      streaks,
      lastVisitDate: getTodayDate(),
    };
  },
};

/**
 * Migrate data to current version
 */
const migrateData = (data: any): StorageData => {
  const version = data.version || 0;
  
  if (version === CURRENT_VERSION) {
    return data as StorageData;
  }

  // Apply migrations sequentially
  let migratedData = data;
  for (let v = version; v < CURRENT_VERSION; v++) {
    if (migrations[v]) {
      migratedData = migrations[v](migratedData);
    }
  }

  return migratedData;
};

/**
 * Load data from localStorage with migration support
 */
export const loadStorageData = (): StorageData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return DEFAULT_STORAGE_DATA;
    }

    const parsed = JSON.parse(stored);
    const migrated = migrateData(parsed);
    
    // Save migrated data back to storage
    if (migrated.version !== CURRENT_VERSION) {
      saveStorageData(migrated);
    }

    return migrated;
  } catch (error) {
    console.error("Error loading storage data:", error);
    return DEFAULT_STORAGE_DATA;
  }
};

/**
 * Save data to localStorage
 */
export const saveStorageData = (data: StorageData): void => {
  try {
    const toSave = {
      ...data,
      version: CURRENT_VERSION,
      lastVisitDate: getTodayDate(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (error) {
    console.error("Error saving storage data:", error);
  }
};

/**
 * Handle day transition - create new daily record if needed
 */
export const handleDayTransition = (data: StorageData): StorageData => {
  const today = getTodayDate();
  const lastVisit = data.lastVisitDate;

  if (lastVisit === today) {
    // Same day, no transition needed
    return data;
  }

  // Save yesterday's progress to history
  const yesterdayRecord: DailyRecord = {
    date: lastVisit,
    intake: data.currentIntake,
    goal: data.dailyGoal,
    logs: [], // Logs would need to be tracked separately
    completed: data.currentIntake >= data.dailyGoal,
  };

  // Update daily history
  const updatedHistory = [...data.dailyHistory];
  const existingIndex = updatedHistory.findIndex((r) => r.date === lastVisit);
  if (existingIndex >= 0) {
    updatedHistory[existingIndex] = yesterdayRecord;
  } else {
    updatedHistory.push(yesterdayRecord);
  }

  // Keep only last 90 days of history
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const filteredHistory = updatedHistory.filter(
    (r) => new Date(r.date) >= ninetyDaysAgo
  );

  // Recalculate streaks
  const updatedStreaks = calculateStreaks(filteredHistory);

  // Reset for new day
  return {
    ...data,
    currentIntake: 0,
    dailyHistory: filteredHistory,
    streaks: updatedStreaks,
    lastVisitDate: today,
  };
};

/**
 * Update current intake and save to storage
 */
export const updateIntake = (data: StorageData, amount: number): StorageData => {
  const updated = {
    ...data,
    currentIntake: data.currentIntake + amount,
  };
  saveStorageData(updated);
  return updated;
};

/**
 * Update daily goal and save to storage
 */
export const updateGoal = (data: StorageData, goal: number): StorageData => {
  const updated = {
    ...data,
    dailyGoal: goal,
  };
  saveStorageData(updated);
  return updated;
};

/**
 * Update coach mode and save to storage
 */
export const updateCoachMode = (data: StorageData, mode: string): StorageData => {
  const updated = {
    ...data,
    coachMode: mode as any,
  };
  saveStorageData(updated);
  return updated;
};

/**
 * Update settings and save to storage
 */
export const updateSettings = (
  data: StorageData,
  settings: Partial<StorageData["settings"]>
): StorageData => {
  const updated = {
    ...data,
    settings: {
      ...data.settings,
      ...settings,
    },
  };
  saveStorageData(updated);
  return updated;
};

/**
 * Add water log to today's record and save to storage
 */
export const addWaterLog = (
  data: StorageData,
  amount: number,
  log: WaterLog
): StorageData => {
  const today = getTodayDate();
  const updatedIntake = data.currentIntake + amount;
  
  const updatedHistory = [...data.dailyHistory];
  const todayRecordIndex = updatedHistory.findIndex((r) => r.date === today);
  
  if (todayRecordIndex >= 0) {
    // Update existing today record
    updatedHistory[todayRecordIndex] = {
      ...updatedHistory[todayRecordIndex],
      intake: updatedIntake,
      logs: [...updatedHistory[todayRecordIndex].logs, log],
      completed: updatedIntake >= data.dailyGoal,
    };
  } else {
    // Create new today record
    updatedHistory.push({
      date: today,
      intake: updatedIntake,
      goal: data.dailyGoal,
      logs: [log],
      completed: updatedIntake >= data.dailyGoal,
    });
  }

  // Recalculate streaks if goal was just achieved
  let updatedStreaks = data.streaks;
  if (updatedIntake >= data.dailyGoal && data.currentIntake < data.dailyGoal) {
    updatedStreaks = calculateStreaks(updatedHistory);
  }

  const updated = {
    ...data,
    currentIntake: updatedIntake,
    dailyHistory: updatedHistory,
    streaks: updatedStreaks,
  };
  
  saveStorageData(updated);
  return updated;
};

/**
 * Clear all storage data (for testing or reset)
 */
export const clearStorageData = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    // Also clear old keys for migration purposes
    localStorage.removeItem("hydro_intake");
    localStorage.removeItem("hydro_goal");
    localStorage.removeItem("hydro_history");
    localStorage.removeItem("hydro_coach_mode");
    localStorage.removeItem("hydro_settings");
  } catch (error) {
    console.error("Error clearing storage data:", error);
  }
};

/**
 * Export data for backup
 */
export const exportStorageData = (): string => {
  const data = loadStorageData();
  return JSON.stringify(data, null, 2);
};

/**
 * Import data from backup
 */
export const importStorageData = (jsonData: string): boolean => {
  try {
    const parsed = JSON.parse(jsonData);
    const migrated = migrateData(parsed);
    saveStorageData(migrated);
    return true;
  } catch (error) {
    console.error("Error importing storage data:", error);
    return false;
  }
};
