import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { WaterLog } from "../types";
import { TrendingUp, BarChart2 } from "lucide-react";

interface TrendsChartProps {
  history: WaterLog[];
}

export default function TrendsChart({ history }: TrendsChartProps) {
  // Aggregate history for the past 7 days chronologically
  const getPast7DaysData = () => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toLocaleDateString([], { month: "short", day: "numeric" });
      
      const dailySum = history
        .filter((log) => {
          const logDate = new Date(log.timestamp);
          return logDate.toDateString() === date.toDateString();
        })
        .reduce((sum, log) => sum + log.amount, 0);

      data.push({
        day: dateString,
        amount: dailySum,
      });
    }
    return data;
  };

  const chartData = getPast7DaysData();
  const total7Days = chartData.reduce((sum, item) => sum + item.amount, 0);
  const averageIntake = Math.round(total7Days / 7);

  const isDark = false;

  return (
    <div id="trends-chart-card" className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-md border border-slate-100 dark:border-slate-800 flex flex-col justify-between h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-slate-800 dark:text-slate-100 font-sans font-bold text-lg flex items-center gap-1.5">
            <BarChart2 className="w-5 h-5 text-sky-500" />
            Hydration Trends
          </h2>
          <p className="text-slate-400 dark:text-slate-400 font-sans text-xs">Your daily water intake over the last 7 days</p>
        </div>

        {/* Stats indicators */}
        <div className="flex items-center gap-4">
          <div className="text-left">
            <span className="block text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider">7-Day Total</span>
            <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-200">{(total7Days / 1000).toFixed(1)} L</span>
          </div>
          <div className="text-left border-l border-slate-200 dark:border-slate-800 pl-4">
            <span className="block text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider">7-Day Avg</span>
            <span className="font-mono text-sm font-bold text-sky-600 dark:text-sky-400">{averageIntake} mL</span>
          </div>
        </div>
      </div>

      {/* Recharts Container */}
      <div className="h-60 w-full font-mono text-xs">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={isDark ? "#1e293b" : "#f1f5f9"} 
              vertical={false} 
            />
            <XAxis 
              dataKey="day" 
              stroke={isDark ? "#94a3b8" : "#64748b"} 
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke={isDark ? "#94a3b8" : "#64748b"} 
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `${val}ml`}
            />
            <Tooltip 
              cursor={{ fill: isDark ? "rgba(30, 41, 59, 0.4)" : "rgba(241, 245, 249, 0.6)" }}
              contentStyle={{
                backgroundColor: isDark ? "#0f172a" : "#ffffff",
                borderColor: isDark ? "#334155" : "#e2e8f0",
                borderRadius: "12px",
                color: isDark ? "#f8fafc" : "#0f172a",
                fontFamily: "monospace",
                fontSize: "11px",
              }}
              formatter={(value) => [`${value} mL`, "Water Intake"]}
              labelStyle={{ fontWeight: "bold", marginBottom: "4px" }}
            />
            <Bar 
              dataKey="amount" 
              fill={isDark ? "#38bdf8" : "#0ea5e9"} 
              radius={[6, 6, 0, 0]} 
              maxBarSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-800/20 px-3 py-2 rounded-xl border border-slate-100/60 dark:border-slate-800/50 text-[11px] font-sans mt-4">
        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
        <span>
          {averageIntake >= 2000 
            ? "Excellent weekly average! You are fully hydrated." 
            : "Aim to raise your average closer to your recommended daily objective."}
        </span>
      </div>
    </div>
  );
}
