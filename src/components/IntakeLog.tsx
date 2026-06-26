import { useState, FormEvent } from "react";
import { Coffee, GlassWater, Milestone, Plus, RefreshCw, Trash2, Edit3, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { WaterLog } from "../types";
import { playSipSound } from "../utils/audio";

interface IntakeLogProps {
  currentIntake: number;
  dailyGoal: number;
  history: WaterLog[];
  onAddWater: (amount: number) => void;
  onRemoveLog: (id: string) => void;
  onResetLogs: () => void;
  onUpdateGoal: (goal: number) => void;
}

export default function IntakeLog({
  currentIntake,
  dailyGoal,
  history,
  onAddWater,
  onRemoveLog,
  onResetLogs,
  onUpdateGoal,
}: IntakeLogProps) {
  const [customAmount, setCustomAmount] = useState("");
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(String(dailyGoal));

  const handleCustomSubmit = (e: FormEvent) => {
    e.preventDefault();
    const amount = parseInt(customAmount);
    if (!isNaN(amount) && amount > 0) {
      onAddWater(amount);
      playSipSound();
      setCustomAmount("");
    }
  };

  const handleGoalSubmit = (e: FormEvent) => {
    e.preventDefault();
    const newGoal = parseInt(goalInput);
    if (!isNaN(newGoal) && newGoal > 0) {
      onUpdateGoal(newGoal);
      setIsEditingGoal(false);
    }
  };

  const handleQuickAdd = (amount: number) => {
    onAddWater(amount);
    playSipSound();
  };

  // Pre-configured vessels
  const vessels = [
    { label: "Cup", amount: 250, icon: Coffee, title: "+250 mL" },
    { label: "Glass", amount: 350, icon: GlassWater, title: "+350 mL" },
    { label: "Sml Bottle", amount: 500, icon: Milestone, title: "+500 mL" },
    { label: "Lrg Bottle", amount: 750, icon: Milestone, title: "+750 mL" },
  ];

  // Helper to format timestamp
  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <div id="intake-log-card" className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-md border border-slate-100 dark:border-slate-800 flex flex-col justify-between h-full">
      
      {/* Target Goal Setup */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <span className="text-slate-400 dark:text-slate-400 font-sans text-xs">Daily Hydration Target</span>
          <AnimatePresence mode="wait">
            {isEditingGoal ? (
              <motion.form
                key="edit-goal"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                onSubmit={handleGoalSubmit}
                className="flex items-center gap-1.5 mt-1"
              >
                <input
                  type="number"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  className="w-20 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-sans font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:outline-none focus:border-sky-500"
                  autoFocus
                  min="100"
                  max="10000"
                />
                <span className="text-slate-500 dark:text-slate-400 font-sans text-xs font-bold">mL</span>
                <button
                  id="save-goal-btn"
                  type="submit"
                  className="p-1 rounded-md bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900 transition"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="view-goal"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex items-center gap-2 mt-0.5"
              >
                <span className="text-xl font-sans font-black text-slate-800 dark:text-slate-100">
                  {dailyGoal.toLocaleString()} mL
                </span>
                <button
                  id="edit-goal-btn"
                  onClick={() => {
                    setGoalInput(String(dailyGoal));
                    setIsEditingGoal(true);
                  }}
                  className="p-1 rounded-md text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  title="Change Daily Goal"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Clear/Reset Day's Log */}
        <button
          id="reset-logs-btn"
          onClick={onResetLogs}
          disabled={history.length === 0}
          className={`flex items-center gap-1 py-1.5 px-3 rounded-xl border text-xs font-sans font-semibold transition ${
            history.length > 0
              ? "bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100/60 dark:hover:bg-rose-900/40"
              : "bg-slate-50/50 dark:bg-slate-800/30 border-slate-200/50 dark:border-slate-800/60 text-slate-300 dark:text-slate-600 cursor-not-allowed"
          }`}
          title="Clear Today's Hydration Logs"
        >
          <RefreshCw className="w-3 h-3" />
          Reset Today
        </button>
      </div>

      {/* Quick Add Vessels Section */}
      <div className="mb-5">
        <label className="text-slate-500 dark:text-slate-400 font-sans font-medium text-xs block mb-2.5">
          Quick Drink Logger
        </label>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {vessels.map((vessel, i) => {
            const IconComponent = vessel.icon;
            return (
              <button
                key={i}
                id={`vessel-btn-${vessel.label.toLowerCase().replace(" ", "-")}`}
                onClick={() => handleQuickAdd(vessel.amount)}
                className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-sky-50/40 dark:hover:bg-sky-950/20 hover:border-sky-100 dark:hover:border-sky-900 transition group text-left active:scale-[0.98]"
              >
                <div className="p-1.5 sm:p-2.5 rounded-xl bg-white dark:bg-slate-800 shadow-sm text-sky-500 group-hover:bg-sky-500 group-hover:text-white transition flex-shrink-0">
                  <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div className="min-w-0">
                  <span className="block font-sans font-bold text-[11px] sm:text-xs text-slate-700 dark:text-slate-200 truncate">{vessel.label}</span>
                  <span className="block font-mono text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">{vessel.title}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Log input form */}
      <form onSubmit={handleCustomSubmit} className="flex gap-2 mb-5">
        <div className="relative flex-1">
          <input
            type="number"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder="Enter custom intake"
            min="10"
            max="3000"
            className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/30 dark:bg-slate-800/20 text-sm font-sans focus:outline-none focus:border-sky-500/80 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-100 transition"
          />
          <span className="absolute right-3 top-3 text-[10px] font-mono text-slate-400 font-bold">mL</span>
        </div>
        <button
          id="custom-log-submit-btn"
          type="submit"
          disabled={!customAmount}
          className={`p-2.5 rounded-xl flex items-center justify-center transition ${
            customAmount 
              ? "bg-sky-500 text-white hover:bg-sky-600 shadow-md shadow-sky-500/10 active:scale-95" 
              : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
          }`}
        >
          <Plus className="w-5 h-5" />
        </button>
      </form>

      {/* Log History */}
      <div className="flex-1 flex flex-col min-h-[140px]">
        <label className="text-slate-500 dark:text-slate-400 font-sans font-medium text-xs block mb-2">
          Today's Sip Logs
        </label>
        
        <div className="flex-1 overflow-y-auto max-h-[160px] border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/30 dark:bg-slate-800/10 p-2.5">
          <AnimatePresence initial={false}>
            {history.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-6 text-center">
                <span className="text-xl">🏜️</span>
                <p className="text-[11px] font-sans text-slate-400 dark:text-slate-500 mt-1">No logs recorded yet today.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {history.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center justify-between bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-100/80 dark:border-slate-700/50 shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                      <span className="text-xs font-sans font-extrabold text-slate-700 dark:text-slate-200">+{log.amount} mL</span>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 font-medium">at {formatTime(log.timestamp)}</span>
                    </div>
                    
                    <button
                      id={`delete-log-${log.id}`}
                      onClick={() => onRemoveLog(log.id)}
                      className="text-slate-300 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      title="Delete log entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
