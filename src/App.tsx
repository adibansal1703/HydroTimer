import { useState, useEffect } from "react";
import { Droplet, Sparkles, TrendingUp, HelpCircle } from "lucide-react";
import { motion } from "motion/react";
import confetti from "canvas-confetti";
import { WaterLog, CoachMode, ReminderSettings } from "./types";
import WaterWave from "./components/WaterWave";
import TimerCard from "./components/TimerCard";
import IntakeLog from "./components/IntakeLog";
import CoachBubble from "./components/CoachBubble";
import TrendsChart from "./components/TrendsChart";
import WeatherSuggestedIntake from "./components/WeatherSuggestedIntake";
import SMSNotificationsCard from "./components/SMSNotificationsCard";

export default function App() {
  // 1. Core Persistence States
  const [currentIntake, setCurrentIntake] = useState<number>(() => {
    const saved = localStorage.getItem("hydro_intake");
    return saved ? parseInt(saved) : 0;
  });

  const [dailyGoal, setDailyGoal] = useState<number>(() => {
    const saved = localStorage.getItem("hydro_goal");
    return saved ? parseInt(saved) : 2000; // Default 2L
  });

  const [history, setHistory] = useState<WaterLog[]>(() => {
    const saved = localStorage.getItem("hydro_history");
    return saved ? JSON.parse(saved) : [];
  });

  const [coachMode, setCoachMode] = useState<CoachMode>(() => {
    const saved = localStorage.getItem("hydro_coach_mode");
    return (saved as CoachMode) || "witty";
  });

  const [settings, setSettings] = useState<ReminderSettings>(() => {
    const saved = localStorage.getItem("hydro_settings");
    return saved
      ? JSON.parse(saved)
      : {
          intervalMinutes: 120, // 2 hours default
          soundEnabled: true,
          notificationsEnabled: false,
        };
  });

  // 2. Gemini Coach Tips State
  const [currentTip, setCurrentTip] = useState(
    "Water is the driving force of all nature. Take a sip and let's conquer your goals!"
  );
  const [loadingTip, setLoadingTip] = useState(false);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem("hydro_intake", String(currentIntake));
  }, [currentIntake]);

  useEffect(() => {
    localStorage.setItem("hydro_goal", String(dailyGoal));
  }, [dailyGoal]);

  useEffect(() => {
    localStorage.setItem("hydro_history", JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem("hydro_coach_mode", coachMode);
  }, [coachMode]);

  useEffect(() => {
    localStorage.setItem("hydro_settings", JSON.stringify(settings));
  }, [settings]);

  // Fetch Personalized Gemini Coach Tip
  const fetchCoachTip = async (modeOverride?: CoachMode) => {
    setLoadingTip(true);
    try {
      const selectedMode = modeOverride || coachMode;
      const response = await fetch(
        `/api/hydration-tip?mode=${selectedMode}&intake=${currentIntake}&goal=${dailyGoal}`
      );
      const data = await response.json();
      if (data.tip) {
        setCurrentTip(data.tip);
      }
    } catch (err) {
      console.error("Failed to load Gemini hydration tip:", err);
    } finally {
      setLoadingTip(false);
    }
  };

  // Trigger tip fetch on mount
  useEffect(() => {
    fetchCoachTip();
  }, []);

  // 3. User Actions Handlers
  const handleAddWater = (amount: number) => {
    const nextIntake = currentIntake + amount;
    
    // Confetti explosion when the user meets or exceeds their daily hydration goal!
    if (currentIntake < dailyGoal && nextIntake >= dailyGoal) {
      confetti({
        particleCount: 150,
        spread: 85,
        origin: { y: 0.6 },
        colors: ["#38bdf8", "#0ea5e9", "#0284c7", "#f59e0b", "#10b981"]
      });
    }

    setCurrentIntake(nextIntake);
    const newLog: WaterLog = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      amount,
      timestamp: new Date().toISOString(),
    };
    setHistory((prev) => [newLog, ...prev]);

    // Encourage a new quick tip when water intake reaches a new level!
    if (Math.random() > 0.4) {
      setTimeout(() => fetchCoachTip(), 1200);
    }
  };

  const handleRemoveLog = (id: string) => {
    const entry = history.find((l) => l.id === id);
    if (entry) {
      setCurrentIntake((prev) => Math.max(0, prev - entry.amount));
      setHistory((prev) => prev.filter((l) => l.id !== id));
    }
  };

  const handleResetLogs = () => {
    if (window.confirm("Are you sure you want to reset all of today's water intake logs?")) {
      setCurrentIntake(0);
      setHistory([]);
    }
  };

  const handleUpdateGoal = (newGoal: number) => {
    setDailyGoal(newGoal);
  };

  const handleIntervalChange = (mins: number) => {
    setSettings((prev) => ({ ...prev, intervalMinutes: mins }));
  };

  const handleSoundToggle = () => {
    setSettings((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  };

  const handleNotificationToggle = () => {
    setSettings((prev) => ({ ...prev, notificationsEnabled: !prev.notificationsEnabled }));
  };

  const handleCoachModeChange = (newMode: CoachMode) => {
    setCoachMode(newMode);
    fetchCoachTip(newMode);
  };

  return (
    <div>
      <div className="bg-gradient-to-tr from-slate-50 via-slate-100/50 to-sky-50/40 min-h-screen font-sans text-slate-900 transition-colors duration-300 relative">
        
        {/* Decorative background ambient blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-200/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-indigo-200/10 rounded-full blur-3xl pointer-events-none" />

        {/* Main Container */}
        <div className="max-w-6xl mx-auto px-4 py-8 relative z-10">
          
          {/* Sleek App Header Bar */}
          <header className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-200/60 pb-6 mb-8 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center shadow-md shadow-sky-500/15">
                <Droplet className="w-6 h-6 text-white animate-[pulse_3s_infinite]" />
              </div>
              <div>
                <h1 className="text-2xl font-sans font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                  HydroTimer
                </h1>
                <p className="text-slate-400 font-sans text-xs font-semibold uppercase tracking-wider mt-0.5">
                  Full-Stack Hydration Guide
                </p>
              </div>
            </div>

            {/* Header Right: Controls & Metrics */}
            <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-end">
              
              {/* Quick HUD Metrics */}
              <div className="flex items-center gap-4 bg-white/70 border border-slate-200/50 rounded-2xl py-2 px-4 shadow-sm backdrop-blur-md">
                <div className="text-center pr-4 border-r border-slate-200/60">
                  <span className="block text-[10px] font-sans font-bold text-slate-400 uppercase tracking-widest">
                    Intake
                  </span>
                  <span className="font-mono text-sm font-bold text-slate-700">
                    {currentIntake} mL
                  </span>
                </div>
                <div className="text-center">
                  <span className="block text-[10px] font-sans font-bold text-slate-400 uppercase tracking-widest">
                    Target
                  </span>
                  <span className="font-mono text-sm font-bold text-slate-700">
                    {dailyGoal} mL
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* Bento Grid Layout */}
          <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* COLUMN 1: Overlapping Wave visualizer & Goals progress (lg:col-span-5) */}
            <section id="visualizer-panel" className="lg:col-span-5 bg-white rounded-3xl p-6 shadow-md border border-slate-100 flex flex-col items-center justify-center min-h-[460px] gap-6 relative">
              <div className="text-center">
                <h2 className="text-slate-800 font-sans font-bold text-lg">Your Hydration Wave</h2>
                <p className="text-slate-400 font-sans text-xs">Visually track your daily water absorption</p>
              </div>

              {/* Dynamic visual glass wave */}
              <WaterWave currentIntake={currentIntake} dailyGoal={dailyGoal} />

              {/* Motivational statement or stat indicator */}
              <div className="flex items-center gap-2 text-slate-500 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100/80 text-xs font-sans">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span>
                  {currentIntake >= dailyGoal 
                    ? "Daily target unlocked! Magnificent job!" 
                    : `Just ${dailyGoal - currentIntake} mL to complete today's objective.`}
                </span>
              </div>
            </section>

            {/* COLUMN 2: Bento Grid of Controls & AI (lg:col-span-7) */}
            <section id="controls-panel" className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Cell 1: Count down timer with sounds & permissions */}
              <div className="md:col-span-1 h-full">
                <TimerCard
                  intervalMinutes={settings.intervalMinutes}
                  soundEnabled={settings.soundEnabled}
                  notificationsEnabled={settings.notificationsEnabled}
                  onIntervalChange={handleIntervalChange}
                  onSoundToggle={handleSoundToggle}
                  onNotificationToggle={handleNotificationToggle}
                  onWaterDrank={handleAddWater}
                />
              </div>

              {/* Cell 2: Gemini Coach speech bubble */}
              <div className="md:col-span-1 h-full">
                <CoachBubble
                  mode={coachMode}
                  tip={currentTip}
                  loading={loadingTip}
                  onModeChange={handleCoachModeChange}
                  onRefresh={fetchCoachTip}
                />
              </div>

              {/* Cell 3: Log intake details with quick buttons & manual entry */}
              <div className="md:col-span-2">
                <IntakeLog
                  currentIntake={currentIntake}
                  dailyGoal={dailyGoal}
                  history={history}
                  onAddWater={handleAddWater}
                  onRemoveLog={handleRemoveLog}
                  onResetLogs={handleResetLogs}
                  onUpdateGoal={handleUpdateGoal}
                />
              </div>

            </section>
          </main>

          {/* SECONDARY BENTO LINE: Weather Grounding, Trends, and SMS Reminders */}
          <section id="dashboard-analytics-bento" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
            <WeatherSuggestedIntake
              currentGoal={dailyGoal}
              onApplyGoal={handleUpdateGoal}
            />
            <TrendsChart
              history={history}
            />
            <SMSNotificationsCard
              currentIntake={currentIntake}
              dailyGoal={dailyGoal}
              onRefreshCoachTip={() => fetchCoachTip(coachMode)}
            />
          </section>

          {/* Footer */}
          <footer className="mt-12 text-center text-[11px] text-slate-400 font-sans max-w-xl mx-auto border-t border-slate-200/50 pt-6">
            <p className="flex items-center justify-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" />
              Designed as a professional hydration coach. Always consult with medical guidelines for specific water intake needs.
            </p>
            <p className="mt-1">
              Powered by modern full-stack Node.js server, React, Vite, Google Search grounding, and Gemini AI.
            </p>
          </footer>

        </div>
      </div>
    </div>
  );
}
