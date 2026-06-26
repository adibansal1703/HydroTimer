import { motion } from "motion/react";
import { Droplets, FlameKindling, Trophy } from "lucide-react";

interface WaterWaveProps {
  currentIntake: number;
  dailyGoal: number;
}

export default function WaterWave({ currentIntake, dailyGoal }: WaterWaveProps) {
  const percentage = Math.min(Math.max((currentIntake / dailyGoal) * 100, 0), 100);
  const isGoalReached = percentage >= 100;

  return (
    <div id="water-wave-container" className="flex flex-col items-center">
      {/* Visual Glass Representation */}
      <div 
        id="glass-vessel" 
        className="relative w-64 h-80 rounded-b-[40px] rounded-t-[16px] border-4 border-slate-200/80 dark:border-slate-700/80 bg-slate-50/10 shadow-[inset_0_4px_12px_rgba(255,255,255,0.4),0_12px_24px_-8px_rgba(14,165,233,0.15)] overflow-hidden flex items-end backdrop-blur-sm"
      >
        {/* Floating Bubble particles */}
        {percentage > 0 && (
          <div className="absolute inset-0 z-10 pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-sky-200/50"
                style={{
                  left: `${20 + i * 15}%`,
                  bottom: "5%",
                }}
                animate={{
                  y: ["0%", "-350%"],
                  opacity: [0, 0.8, 0],
                  scale: [0.8, 1.2, 0.5],
                }}
                transition={{
                  duration: 3 + i * 0.7,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        )}

        {/* Waves Container - Height is responsive to percentage */}
        <motion.div 
          id="liquid-fill"
          className="absolute left-0 right-0 bottom-0 bg-gradient-to-t from-sky-500 to-sky-400 dark:from-sky-600 dark:to-sky-500"
          style={{ height: `${percentage}%` }}
          animate={{ height: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Wave 1 SVG overlays */}
          {percentage > 0 && percentage < 100 && (
            <div className="absolute w-[200%] h-12 -top-10 left-0">
              <svg 
                viewBox="0 0 1200 120" 
                preserveAspectRatio="none" 
                className="absolute w-full h-full fill-sky-400 dark:fill-sky-500 opacity-60 animate-[wave_12s_infinite_linear]"
              >
                <path d="M0,60 C150,90 350,30 500,60 C650,90 850,30 1000,60 C1150,90 1350,30 1500,60 L1500,120 L0,120 Z" />
              </svg>
              <svg 
                viewBox="0 0 1200 120" 
                preserveAspectRatio="none" 
                className="absolute w-full h-full fill-sky-300 dark:fill-sky-400 opacity-40 animate-[wave_7s_infinite_linear] left-[-50%]"
              >
                <path d="M0,50 C150,20 350,80 500,50 C650,20 850,80 1000,50 C1150,20 1350,80 1500,50 L1500,120 L0,120 Z" />
              </svg>
            </div>
          )}

          {/* Sparkles / Ripples at top of liquid */}
          {percentage > 0 && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-sky-200/60 blur-[1px]" />
          )}
        </motion.div>

        {/* Central Text HUD on Glass */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 text-center select-none pointer-events-none">
          {isGoalReached ? (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center p-3 rounded-2xl bg-white/40 dark:bg-slate-900/60 backdrop-blur-md shadow-lg border border-white/50 dark:border-slate-800/50"
            >
              <Trophy className="w-10 h-10 text-amber-500 animate-bounce" />
              <span className="text-amber-800 dark:text-amber-300 font-sans font-bold text-sm uppercase tracking-wider mt-1">Goal Met!</span>
              <span className="text-slate-800 dark:text-slate-100 font-mono text-xs mt-0.5">{currentIntake} / {dailyGoal} mL</span>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center drop-shadow-md">
              <span className="text-3xl font-sans font-bold text-slate-800 dark:text-slate-100 tabular-nums">
                {percentage.toFixed(0)}%
              </span>
              <span className="text-xs font-sans font-semibold text-slate-600 dark:text-slate-300 tracking-medium uppercase mt-0.5">
                {currentIntake} / {dailyGoal} mL
              </span>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                {Math.max(0, dailyGoal - currentIntake)} mL left
              </span>
            </div>
          )}
        </div>
      </div>

      {/* CSS Animation injection for the liquid wave movement */}
      <style>{`
        @keyframes wave {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
