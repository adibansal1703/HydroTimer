import { BrainCircuit, Sparkles, RefreshCw, Sprout, ShieldAlert, Award } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CoachMode } from "../types";

interface CoachBubbleProps {
  mode: CoachMode;
  tip: string;
  loading: boolean;
  onModeChange: (mode: CoachMode) => void;
  onRefresh: () => void;
}

export default function CoachBubble({
  mode,
  tip,
  loading,
  onModeChange,
  onRefresh,
}: CoachBubbleProps) {
  
  const modesList: { value: CoachMode; label: string; icon: any; color: string; hoverColor: string }[] = [
    { value: "witty", label: "Witty 🧠", icon: BrainCircuit, color: "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-300 border-purple-100 dark:border-purple-900/50", hoverColor: "hover:bg-purple-100/50 dark:hover:bg-purple-900/20" },
    { value: "mindful", label: "Mindful 🧘", icon: Sprout, color: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/50", hoverColor: "hover:bg-emerald-100/50 dark:hover:bg-emerald-900/20" },
    { value: "scientific", label: "Scientific 🔬", icon: ShieldAlert, color: "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-300 border-indigo-100 dark:border-indigo-900/50", hoverColor: "hover:bg-indigo-100/50 dark:hover:bg-indigo-900/20" },
    { value: "energetic", label: "Energetic ⚡", icon: Award, color: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-300 border-amber-100 dark:border-amber-900/50", hoverColor: "hover:bg-amber-100/50 dark:hover:bg-amber-900/20" },
  ];

  return (
    <div id="coach-section-container" className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-md border border-slate-100 dark:border-slate-800 flex flex-col justify-between h-full">
      {/* Coach Mode Selector */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-slate-800 dark:text-slate-100 font-sans font-bold text-base flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-sky-500 animate-pulse" />
              Gemini Hydration Coach
            </h2>
            <p className="text-slate-400 dark:text-slate-400 font-sans text-[11px]">Select your coach's motivation style</p>
          </div>
        </div>

        {/* Style selectors */}
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
          {modesList.map((item) => {
            const Icon = item.icon;
            const isSelected = mode === item.value;
            return (
              <button
                key={item.value}
                id={`coach-mode-btn-${item.value}`}
                onClick={() => onModeChange(item.value)}
                className={`flex items-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-xl border text-[11px] sm:text-xs font-sans font-semibold transition min-w-0 ${
                  isSelected
                    ? `${item.color} font-bold ring-2 ring-sky-100 dark:ring-sky-950`
                    : "bg-white border-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200 border-slate-200 dark:border-slate-700"
                }`}
              >
                <Icon className={`w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0 ${isSelected ? "animate-bounce" : ""}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Speech Bubble Display */}
      <div className="flex-1 flex flex-col justify-center min-h-[120px] relative">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading-skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-2 p-5 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 rounded-2xl animate-pulse"
            >
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
            </motion.div>
          ) : (
            <motion.div
              key={tip}
              initial={{ opacity: 0, scale: 0.98, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -5 }}
              transition={{ duration: 0.25 }}
              className="relative p-5 bg-gradient-to-br from-sky-50/40 to-indigo-50/20 dark:from-sky-950/20 dark:to-indigo-950/10 border border-sky-100/40 dark:border-sky-900/40 rounded-2xl flex flex-col justify-between"
            >
              {/* Little quote block */}
              <div className="relative">
                <span className="absolute -left-1.5 -top-4 text-4xl text-sky-200/60 font-serif font-black">“</span>
                <p className="font-sans text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-3 pr-2 italic relative z-10">
                  {tip}
                </p>
                <span className="absolute -right-1 -bottom-4 text-4xl text-sky-200/60 font-serif font-black">”</span>
              </div>

              {/* Bot Meta */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100/60 dark:border-slate-800/60">
                <span className="text-[10px] font-mono font-medium text-sky-500 flex items-center gap-1 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                  Gemini Coach
                </span>
                
                <button
                  id="refresh-tip-btn"
                  onClick={onRefresh}
                  className="text-slate-400 dark:text-slate-400 hover:text-sky-500 p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-100 dark:hover:border-slate-700 shadow-sm transition flex items-center gap-1 text-[10px] font-sans font-bold"
                  title="Ask Coach for Another Tip"
                >
                  <RefreshCw className="w-3 h-3" />
                  Ask Again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
