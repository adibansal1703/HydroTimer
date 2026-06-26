import { useState, FormEvent, useEffect } from "react";
import { CloudSun, HelpCircle, Compass, Check, ArrowRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface WeatherSuggestedIntakeProps {
  currentGoal: number;
  onApplyGoal: (goal: number) => void;
}

interface SuggestedIntakeResult {
  suggestedIntake: number;
  temperature: string;
  condition: string;
  explanation: string;
  location: string;
}

export default function WeatherSuggestedIntake({
  currentGoal,
  onApplyGoal,
}: WeatherSuggestedIntakeProps) {
  const [location, setLocation] = useState(() => localStorage.getItem("hydro_location") || "New York");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SuggestedIntakeResult | null>(() => {
    const saved = localStorage.getItem("hydro_weather_result");
    return saved ? JSON.parse(saved) : null;
  });
  const [error, setError] = useState<string | null>(null);

  // Persistence
  useEffect(() => {
    if (result) {
      localStorage.setItem("hydro_weather_result", JSON.stringify(result));
    }
  }, [result]);

  useEffect(() => {
    localStorage.setItem("hydro_location", location);
  }, [location]);

  const fetchSuggestedIntake = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!location.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/suggested-intake?location=${encodeURIComponent(location)}`);
      if (!response.ok) {
        throw new Error("Failed to reach suggested intake api.");
      }
      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error("Failed to fetch suggested intake:", err);
      setError("Unable to calculate weather recommendation. Please check connection.");
    } finally {
      setLoading(false);
    }
  };

  // Run on first mount to have initial suggestion if empty
  useEffect(() => {
    if (!result) {
      fetchSuggestedIntake();
    }
  }, []);

  const handleApply = () => {
    if (result) {
      onApplyGoal(result.suggestedIntake);
    }
  };

  const isApplied = result ? currentGoal === result.suggestedIntake : false;

  return (
    <div id="weather-grounding-card" className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-md border border-slate-100 dark:border-slate-800 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <CloudSun className="w-5 h-5 text-sky-500 animate-pulse" />
          <h2 className="text-slate-800 dark:text-slate-100 font-sans font-bold text-lg">Smart Hydration Calculator</h2>
        </div>
        <p className="text-slate-400 dark:text-slate-400 font-sans text-xs mb-4">
          Calculate daily target based on live local weather search grounding
        </p>

        {/* Input Form */}
        <form onSubmit={fetchSuggestedIntake} className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Compass className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter your city/location"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200/80 bg-slate-50/30 text-sm font-sans text-slate-800 focus:outline-none focus:border-sky-500/80 focus:bg-white transition"
              required
            />
          </div>
          <button
            id="calculate-weather-btn"
            type="submit"
            disabled={loading || !location.trim()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-sans text-xs font-bold transition disabled:bg-slate-100 disabled:text-slate-400 flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer whitespace-nowrap"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Scanning...
              </>
            ) : (
              "Calculate"
            )}
          </button>
        </form>

        {error && (
          <div className="text-rose-500 dark:text-rose-400 text-xs font-sans bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100/50 dark:border-rose-900/30 rounded-xl p-3 mb-4">
            {error}
          </div>
        )}

        {/* Suggested result information */}
        <AnimatePresence mode="wait">
          {result && !loading && (
            <motion.div
              key={result.location}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/50 flex flex-col gap-3.5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider">
                    Weather in {result.location}
                  </span>
                  <span className="text-xs font-sans font-extrabold text-slate-700 dark:text-slate-200 capitalize">
                    {result.condition} • {result.temperature}
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider">
                    Recommended Goal
                  </span>
                  <span className="font-mono text-sm font-black text-sky-600 dark:text-sky-400">
                    {result.suggestedIntake} mL
                  </span>
                </div>
              </div>

              <div className="text-xs font-sans text-slate-600 dark:text-slate-300 italic border-l-2 border-sky-400 pl-3 leading-relaxed">
                {result.explanation}
              </div>

              {/* Action to apply recommended goal */}
              <button
                id="apply-suggested-goal-btn"
                onClick={handleApply}
                disabled={isApplied}
                className={`w-full py-2.5 px-4 rounded-xl font-sans text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95 ${
                  isApplied
                    ? "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 cursor-default"
                    : "bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/30 text-sky-600 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-950/60 cursor-pointer"
                }`}
              >
                {isApplied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    Target Goal Applied!
                  </>
                ) : (
                  <>
                    Apply Suggested Target
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 mt-4 leading-normal">
        <HelpCircle className="w-3 h-3 flex-shrink-0" />
        Calculates daily water levels dynamically based on temperature and climate humidity.
      </div>
    </div>
  );
}
