import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Bell, BellOff, Volume2, VolumeX, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { playWaterSound } from "../utils/audio";

interface TimerCardProps {
  intervalMinutes: number;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  onIntervalChange: (mins: number) => void;
  onSoundToggle: () => void;
  onNotificationToggle: () => void;
  onWaterDrank: (amount: number) => void; // Offer to log a glass immediately on alert
}

export default function TimerCard({
  intervalMinutes,
  soundEnabled,
  notificationsEnabled,
  onIntervalChange,
  onSoundToggle,
  onNotificationToggle,
  onWaterDrank,
}: TimerCardProps) {
  const [timeLeft, setTimeLeft] = useState(intervalMinutes * 60);
  const [isRunning, setIsRunning] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<string>("default");

  // Keep track of target end time to handle tab throttling/inactivity
  const targetTimeRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync notification permissions on mount
  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Request browser Notification permissions
  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === "granted") {
        onNotificationToggle();
        // Send a friendly greeting notification
        new Notification("💧 Desktop Reminders Enabled!", {
          body: "I'll alert you right here when it's time to take a sip!",
          silent: false,
        });
      }
    } else {
      alert("This browser does not support desktop notifications.");
    }
  };

  // Re-calculate / Reset the timer whenever the interval changes or manual reset
  const resetTimer = () => {
    const seconds = intervalMinutes * 60;
    setTimeLeft(seconds);
    if (isRunning) {
      targetTimeRef.current = Date.now() + seconds * 1000;
    } else {
      targetTimeRef.current = null;
    }
    setShowAlert(false);
  };

  useEffect(() => {
    resetTimer();
  }, [intervalMinutes]);

  // Handle Play / Pause
  const togglePlay = () => {
    if (!isRunning) {
      // Transitioning to running: set the target end time
      targetTimeRef.current = Date.now() + timeLeft * 1000;
    } else {
      // Transitioning to paused: forget target, keep timeLeft
      targetTimeRef.current = null;
    }
    setIsRunning(!isRunning);
  };

  // Sound and notification triggering logic
  const fireAlert = () => {
    setShowAlert(true);
    setIsRunning(false);
    targetTimeRef.current = null;

    if (soundEnabled) {
      playWaterSound();
    }

    if (notificationsEnabled && "Notification" in window && Notification.permission === "granted") {
      new Notification("💧 Time to Drink Water!", {
        body: "Stay healthy and refreshed! Take a quick water break.",
        tag: "hydration-reminder",
        requireInteraction: true,
      });
    }
  };

  // Timer interval core tick
  useEffect(() => {
    if (isRunning) {
      // Initialize target time if not set
      if (!targetTimeRef.current) {
        targetTimeRef.current = Date.now() + timeLeft * 1000;
      }

      timerRef.current = setInterval(() => {
        if (targetTimeRef.current) {
          const remaining = Math.max(0, Math.ceil((targetTimeRef.current - Date.now()) / 1000));
          setTimeLeft(remaining);

          if (remaining <= 0) {
            if (timerRef.current) clearInterval(timerRef.current);
            fireAlert();
          }
        }
      }, 250); // Frequent checks to ensure UI updates smoothly
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, soundEnabled, notificationsEnabled, timeLeft]);

  // Fast-Forward trigger for testing
  const triggerTestAlert = () => {
    fireAlert();
  };

  const snoozeAlert = () => {
    setShowAlert(false);
    setIsRunning(true);
    const seconds = 15 * 60; // 15 mins snooze
    setTimeLeft(seconds);
    targetTimeRef.current = Date.now() + seconds * 1000;
  };

  const drankFromAlert = () => {
    onWaterDrank(250); // Log standard glass
    setShowAlert(false);
    setIsRunning(true);
    resetTimer();
  };

  // Formatter for MM:SS or HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    const pad = (num: number) => String(num).padStart(2, "0");

    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  // Math for Circular Progress Ring
  const totalSeconds = intervalMinutes * 60;
  const progressRatio = totalSeconds > 0 ? timeLeft / totalSeconds : 0;
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressRatio);

  return (
    <div id="timer-settings-card" className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-md border border-slate-100 dark:border-slate-800 flex flex-col justify-between h-full relative overflow-hidden">
      
      {/* Title Header with Sound/Notification Controls */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-slate-800 dark:text-slate-100 font-sans font-bold text-lg">Reminder Timer</h2>
          <p className="text-slate-400 dark:text-slate-400 font-sans text-xs">Stay on track, drink on time</p>
        </div>
        
        {/* Toggle Panel */}
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-100 dark:border-slate-700">
          {/* Sound Toggle */}
          <button
            id="toggle-sound-btn"
            onClick={onSoundToggle}
            className={`p-2 rounded-lg transition ${
              soundEnabled 
                ? "bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm" 
                : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            }`}
            title={soundEnabled ? "Disable Sound Alarms" : "Enable Sound Alarms"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Desktop Notifications Toggle */}
          <button
            id="toggle-notifications-btn"
            onClick={
              notificationPermission === "granted" 
                ? onNotificationToggle 
                : requestNotificationPermission
            }
            className={`p-2 rounded-lg transition ${
              notificationsEnabled && notificationPermission === "granted"
                ? "bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm" 
                : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            }`}
            title={
              notificationPermission === "default"
                ? "Setup Desktop Reminders"
                : notificationsEnabled ? "Disable Desktop Reminders" : "Enable Desktop Reminders"
            }
          >
            {notificationsEnabled && notificationPermission === "granted" ? (
              <Bell className="w-4 h-4" />
            ) : (
              <BellOff className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Main Circular Countdown Display */}
      <div className="flex flex-col items-center justify-center my-4 relative">
        <div className="relative w-44 h-44 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background Track Circle */}
            <circle
              cx="88"
              cy="88"
              r={radius}
              stroke="currentColor"
              className="text-slate-100 dark:text-slate-800"
              strokeWidth="6"
              fill="transparent"
            />
            {/* Foreground Progress Circle */}
            <motion.circle
              cx="88"
              cy="88"
              r={radius}
              stroke="rgb(14, 165, 233)" // sky-500
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset }}
              transition={{ duration: isRunning ? 0.3 : 0.8, ease: "linear" }}
              strokeLinecap="round"
            />
          </svg>

          {/* Clock Text inside circle */}
          <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
            <span className="text-3xl font-mono font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              {formatTime(timeLeft)}
            </span>
            <span className="text-[10px] font-sans text-slate-400 dark:text-slate-400 uppercase tracking-widest mt-0.5">
              {isRunning ? "Counting Down" : "Paused"}
            </span>
          </div>
        </div>
      </div>

      {/* Play / Pause / Reset Controls */}
      <div className="flex items-center justify-center gap-3 mb-5">
        <button
          id="reset-timer-btn"
          onClick={resetTimer}
          className="p-3 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-slate-700 dark:hover:text-slate-100 transition border border-slate-100"
          title="Reset Timer"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button
          id="play-pause-btn"
          onClick={togglePlay}
          className={`p-4 rounded-full transition shadow-lg flex items-center justify-center ${
            isRunning 
              ? "bg-slate-800 text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 shadow-slate-900/10" 
              : "bg-sky-500 text-white hover:bg-sky-600 shadow-sky-500/20"
          }`}
          title={isRunning ? "Pause Reminder" : "Start Reminder"}
        >
          {isRunning ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white ml-0.5" />}
        </button>

        <button
          id="test-alert-btn"
          onClick={triggerTestAlert}
          className="p-3 rounded-full bg-slate-50 hover:bg-slate-100 text-sky-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-sky-400 dark:border-slate-700 transition border border-sky-100/50 dark:border-sky-950 group"
          title="Trigger Demo Water Reminder Alarm"
        >
          <Sparkles className="w-5 h-5 group-hover:scale-110 transition" />
        </button>
      </div>

      {/* Interval Quick Settings */}
      <div>
        <label className="text-slate-500 dark:text-slate-400 font-sans font-medium text-xs block mb-2">
          Reminder Interval
        </label>
        <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
          {[
            { label: "1m", value: 1, title: "1 Minute Demo" },
            { label: "30m", value: 30, title: "30 Minutes" },
            { label: "1h", value: 60, title: "1 Hour" },
            { label: "2h", value: 120, title: "2 Hours (Recommended)" },
          ].map((item) => (
            <button
              key={item.value}
              id={`interval-btn-${item.value}`}
              onClick={() => onIntervalChange(item.value)}
              className={`py-1.5 px-0.5 sm:px-1 rounded-xl text-[10px] sm:text-xs font-sans font-semibold border transition truncate ${
                intervalMinutes === item.value
                  ? "bg-sky-50 border-sky-400 text-sky-600 dark:bg-sky-950/40 dark:border-sky-800 dark:text-sky-300"
                  : "bg-slate-50/50 border-slate-200/60 text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:bg-slate-800/50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              }`}
              title={item.title}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Immersive Water Alarm Modal Alert Overlay */}
      <AnimatePresence>
        {showAlert && (
          <motion.div
            id="alarm-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-sky-900/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center text-white"
          >
            {/* Visual Droplet Animation */}
            <motion.div
              animate={{ 
                scale: [1, 1.15, 1],
                y: [0, -10, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-16 h-16 rounded-full bg-white/20 border border-white/30 flex items-center justify-center mb-4 shadow-xl"
            >
              <span className="text-4xl">💧</span>
            </motion.div>

            <h3 className="font-sans font-black text-2xl tracking-tight mb-2">Time to Hydrate!</h3>
            <p className="font-sans text-sm text-sky-200 mb-6 max-w-[220px]">
              Keep your energy and focus at peak. Take a water break right now!
            </p>

            {/* Quick Actions inside Alarm */}
            <div className="flex flex-col gap-2 w-full max-w-[200px]">
              <button
                id="alarm-drink-btn"
                onClick={drankFromAlert}
                className="py-3 px-4 rounded-2xl bg-white text-sky-900 font-sans font-bold text-sm shadow-lg hover:bg-sky-50 transition active:scale-95"
              >
                Log standard glass (250ml)
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="alarm-snooze-btn"
                  onClick={snoozeAlert}
                  className="py-2.5 px-3 rounded-xl bg-white/10 border border-white/20 text-sky-100 font-sans font-medium text-xs hover:bg-white/15 transition"
                >
                  Snooze 15m
                </button>
                <button
                  id="alarm-skip-btn"
                  onClick={() => {
                    setShowAlert(false);
                    setIsRunning(true);
                    resetTimer();
                  }}
                  className="py-2.5 px-3 rounded-xl bg-white/10 border border-white/20 text-sky-100 font-sans font-medium text-xs hover:bg-white/15 transition"
                >
                  Skip
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
