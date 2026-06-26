import React, { useState, useEffect, FormEvent } from "react";
import { 
  Smartphone, 
  CheckCircle, 
  Lock, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  Send, 
  Zap, 
  Check, 
  ChevronRight, 
  Settings2,
  AlertTriangle,
  Play
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";

interface SMSPreferences {
  phoneNumber: string;
  isVerified: boolean;
  plan: "free" | "premium";
  smsProgressEnabled: boolean;
  smsCompletedEnabled: boolean;
  smsSummaryEnabled: boolean;
}

interface SMSNotificationsCardProps {
  currentIntake: number;
  dailyGoal: number;
  onRefreshCoachTip: () => void;
}

export default function SMSNotificationsCard({
  currentIntake,
  dailyGoal,
  onRefreshCoachTip,
}: SMSNotificationsCardProps) {
  // 1. Component State
  const [prefs, setPrefs] = useState<SMSPreferences | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);
  const [debugCode, setDebugCode] = useState<string | null>(null);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isUpdatingPrefs, setIsUpdatingPrefs] = useState(false);
  const [isTestingSMS, setIsTestingSMS] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; provider?: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"setup" | "simulators">("setup");
  const [provider, setProvider] = useState<"twilio" | "messagebird" | "awssns">("twilio");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasTriggeredCompleted, setHasTriggeredCompleted] = useState(false);

  // 2. Load Preferences on Mount
  const fetchPrefs = async () => {
    try {
      const res = await fetch("/api/sms/preferences");
      if (res.ok) {
        const data = await res.json();
        setPrefs(data);
        if (data.phoneNumber) {
          setPhoneNumber(data.phoneNumber);
        }
      }
    } catch (err) {
      console.error("Failed to load SMS preferences:", err);
    }
  };

  useEffect(() => {
    fetchPrefs();
  }, []);

  // Auto-send goal completed celebration SMS
  useEffect(() => {
    if (!prefs) return;
    if (currentIntake >= dailyGoal) {
      if (!hasTriggeredCompleted) {
        if (prefs.plan === "premium" && prefs.isVerified && prefs.smsCompletedEnabled) {
          triggerTestSMS("completed");
        }
        setHasTriggeredCompleted(true);
      }
    } else {
      setHasTriggeredCompleted(false);
    }
  }, [currentIntake, dailyGoal, prefs]);

  // 3. Save Preferences to Backend
  const updatePrefs = async (updatedFields: Partial<SMSPreferences>) => {
    if (!prefs) return;
    setIsUpdatingPrefs(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/sms/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields),
      });
      if (res.ok) {
        const data = await res.json();
        setPrefs(data.preferences);
      } else {
        const errorData = await res.json();
        setErrorMsg(errorData.error || "Failed to update preferences.");
      }
    } catch (err) {
      setErrorMsg("Connection issue. Please try again.");
    } finally {
      setIsUpdatingPrefs(false);
    }
  };

  // 4. Send SMS Verification Code
  const handleSendCode = async (e: FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;
    setIsSendingCode(true);
    setErrorMsg(null);
    setDebugCode(null);
    try {
      const res = await fetch("/api/sms/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });
      const data = await res.json();
      if (res.ok) {
        setVerificationSent(true);
        setDebugCode(data.debugCode); // Expose to user for immediate easy testing!
      } else {
        setErrorMsg(data.error || "Failed to send verification code.");
      }
    } catch (err) {
      setErrorMsg("Network error sending code.");
    } finally {
      setIsSendingCode(false);
    }
  };

  // 5. Verify SMS Code
  const handleVerifyCode = async (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !phoneNumber.trim()) return;
    setIsVerifying(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/sms/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, code }),
      });
      const data = await res.json();
      if (res.ok) {
        setPrefs(data.preferences);
        setVerificationSent(false);
        setDebugCode(null);
        setCode("");
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 }
        });
      } else {
        setErrorMsg(data.error || "Verification failed. Check the code.");
      }
    } catch (err) {
      setErrorMsg("Connection error verifying code.");
    } finally {
      setIsVerifying(false);
    }
  };

  // 6. Handle Mock Premium Upgrade
  const handleUpgradeToPremium = async () => {
    if (!prefs) return;
    try {
      const res = await fetch("/api/sms/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "premium" }),
      });
      if (res.ok) {
        const data = await res.json();
        setPrefs(data.preferences);
        setShowPaywall(false);
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 },
          colors: ["#38bdf8", "#fbbf24", "#34d399"]
        });
      }
    } catch (err) {
      console.error("Upgrade error:", err);
    }
  };

  // 7. Toggle Toggles - If Free, show Paywall!
  const handleToggleSMSSetting = (field: keyof SMSPreferences) => {
    if (!prefs) return;
    if (prefs.plan !== "premium") {
      setShowPaywall(true);
      return;
    }
    const currentVal = prefs[field] as boolean;
    updatePrefs({ [field]: !currentVal });
  };

  // 8. Trigger Simulated Test SMS Notifications
  const triggerTestSMS = async (eventType: "progress" | "completed" | "summary") => {
    if (!prefs) return;
    if (!prefs.isVerified) {
      setErrorMsg("Please verify your phone number first to trigger test SMS reminders.");
      return;
    }
    setIsTestingSMS(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/sms/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType,
          currentIntake,
          dailyGoal,
          provider,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestResult({
          success: true,
          message: data.message,
          provider: data.details.provider,
        });
      } else {
        setErrorMsg(data.error || "Failed to deliver test SMS alert.");
      }
    } catch (err) {
      setErrorMsg("Network error transmitting test SMS.");
    } finally {
      setIsTestingSMS(false);
    }
  };

  // 9. Reset Phone Number Settings
  const resetPhoneSetup = () => {
    updatePrefs({
      phoneNumber: "",
      isVerified: false,
      smsProgressEnabled: false,
      smsCompletedEnabled: false,
      smsSummaryEnabled: false,
    });
    setPhoneNumber("");
    setVerificationSent(false);
    setDebugCode(null);
    setCode("");
  };

  if (!prefs) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 flex items-center justify-center h-full min-h-[300px]">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
      </div>
    );
  }

  const isPremium = prefs.plan === "premium";

  return (
    <div id="sms-reminders-card" className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 flex flex-col justify-between h-full relative overflow-hidden">
      
      {/* Decorative Card Header */}
      <div>
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-1.5">
            <Smartphone className="w-5 h-5 text-sky-500" />
            <h2 className="text-slate-800 font-sans font-bold text-lg">Smart SMS Reminders</h2>
          </div>
          {isPremium ? (
            <span className="bg-amber-50 text-amber-600 border border-amber-100/80 px-2.5 py-1 rounded-full text-[10px] font-sans font-extrabold flex items-center gap-1 uppercase tracking-wider animate-pulse">
              <Zap className="w-3 h-3 fill-amber-500 text-amber-500" /> Pro active
            </span>
          ) : (
            <span className="bg-slate-100 text-slate-500 border border-slate-200/80 px-2.5 py-1 rounded-full text-[10px] font-sans font-bold uppercase tracking-wider">
              Free plan
            </span>
          )}
        </div>
        <p className="text-slate-400 font-sans text-xs mb-5">
          Get real-time hydration nudges and completion alerts texted directly to your phone.
        </p>

        {/* Tab Selection */}
        <div className="flex gap-2 border-b border-slate-100 pb-3 mb-4 text-xs font-sans font-semibold text-slate-500">
          <button
            onClick={() => setActiveTab("setup")}
            className={`pb-1 px-1 relative transition ${activeTab === "setup" ? "text-sky-500 font-bold" : "hover:text-slate-700"}`}
          >
            Settings & Setup
            {activeTab === "setup" && (
              <motion.div layoutId="activeSMSTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("simulators")}
            className={`pb-1 px-1 relative transition flex items-center gap-1 ${activeTab === "simulators" ? "text-sky-500 font-bold" : "hover:text-slate-700"}`}
          >
            SMS Test Sandbox
            <span className="bg-indigo-50 text-indigo-600 text-[9px] px-1.5 py-0.2 rounded-full font-sans font-extrabold uppercase">Beta</span>
            {activeTab === "simulators" && (
              <motion.div layoutId="activeSMSTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500" />
            )}
          </button>
        </div>

        {errorMsg && (
          <div className="text-rose-500 text-xs font-sans bg-rose-50 border border-rose-100/50 rounded-xl p-3 mb-4 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === "setup" ? (
            <motion.div
              key="setup-tab"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-4"
            >
              {/* Phone Verification Area */}
              <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100/60">
                {!prefs.isVerified ? (
                  <div>
                    {!verificationSent ? (
                      <form onSubmit={handleSendCode} className="space-y-3">
                        <label className="text-slate-500 font-sans font-medium text-xs block">
                          Phone Number Setup
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="+1 (555) 123-4567"
                            className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200/80 bg-white text-sm font-sans text-slate-800 focus:outline-none focus:border-sky-500/80 transition"
                            required
                          />
                          <button
                            type="submit"
                            disabled={isSendingCode || !phoneNumber.trim()}
                            className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-sans text-xs font-bold transition disabled:bg-slate-100 disabled:text-slate-400 flex items-center gap-1 cursor-pointer"
                          >
                            {isSendingCode ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            Send PIN
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400 font-sans">
                          Enter your mobile number with country code (e.g. +1). Works globally.
                        </p>
                      </form>
                    ) : (
                      <form onSubmit={handleVerifyCode} className="space-y-3">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-slate-500 font-sans font-medium text-xs block">
                            Enter 6-Digit PIN sent to {phoneNumber}
                          </label>
                          <button 
                            type="button" 
                            onClick={() => setVerificationSent(false)} 
                            className="text-sky-500 hover:underline text-[10px] font-sans font-bold"
                          >
                            Change Number
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={6}
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                            placeholder="654321"
                            className="flex-1 tracking-[0.5em] text-center px-3 py-2.5 rounded-xl border border-slate-200/80 bg-white text-sm font-sans text-slate-800 font-bold focus:outline-none focus:border-sky-500/80 transition"
                            required
                          />
                          <button
                            type="submit"
                            disabled={isVerifying || code.length < 6}
                            className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-sans text-xs font-bold transition disabled:bg-slate-100 disabled:text-slate-400 flex items-center gap-1 cursor-pointer"
                          >
                            {isVerifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Verify PIN"}
                          </button>
                        </div>
                        
                        {/* Simulation Helper */}
                        {debugCode && (
                          <div className="bg-sky-50/50 border border-sky-100 p-2.5 rounded-xl text-[11px] font-sans text-sky-700 flex items-center justify-between">
                            <span>📱 <strong>Local Test SIM:</strong> Use code <strong>{debugCode}</strong> to verify instantly.</span>
                            <button 
                              type="button"
                              onClick={() => setCode(debugCode)} 
                              className="bg-sky-500 text-white px-2 py-0.5 rounded text-[10px] font-sans font-bold hover:bg-sky-600 transition"
                            >
                              Auto-fill
                            </button>
                          </div>
                        )}
                      </form>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                        <ShieldCheck className="w-5 h-5 text-emerald-500 animate-pulse" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[10px] font-sans font-bold text-slate-400 uppercase tracking-widest">Verified Target</span>
                        <span className="block font-mono text-xs font-bold text-slate-700 truncate">{prefs.phoneNumber}</span>
                      </div>
                    </div>
                    <button
                      onClick={resetPhoneSetup}
                      className="text-[10px] text-rose-500 hover:bg-rose-50 hover:text-rose-600 font-sans font-bold px-2.5 py-1.5 rounded-xl transition cursor-pointer"
                    >
                      Reset Phone
                    </button>
                  </div>
                )}
              </div>

              {/* SMS Feature Config Toggles */}
              <div className="space-y-3.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="font-sans font-bold text-xs text-slate-700">Receive Hydration Reminders</span>
                </div>

                {/* Toggle 1: Progress Nudges */}
                <div className="flex items-start justify-between p-3 rounded-2xl bg-slate-50/30 border border-slate-100">
                  <div className="mr-3">
                    <span className="font-sans font-semibold text-xs text-slate-700 flex items-center gap-1.5">
                      Progress Alerts
                      {!isPremium && <Lock className="w-3 h-3 text-slate-400 flex-shrink-0" />}
                    </span>
                    <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                      Sends an alert to your phone if you fall behind your objective pace.
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleSMSSetting("smsProgressEnabled")}
                    disabled={isUpdatingPrefs}
                    className={`relative w-9 h-5 rounded-full transition flex-shrink-0 cursor-pointer ${
                      prefs.smsProgressEnabled ? "bg-sky-500" : "bg-slate-200"
                    }`}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                      prefs.smsProgressEnabled ? "translate-x-4" : ""
                    }`} />
                  </button>
                </div>

                {/* Toggle 2: Goal Achieved */}
                <div className="flex items-start justify-between p-3 rounded-2xl bg-slate-50/30 border border-slate-100">
                  <div className="mr-3">
                    <span className="font-sans font-semibold text-xs text-slate-700 flex items-center gap-1.5">
                      Goal Completed Celebrations
                      {!isPremium && <Lock className="w-3 h-3 text-slate-400 flex-shrink-0" />}
                    </span>
                    <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                      Sends a celebratory SMS message once you achieve your target daily intake.
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleSMSSetting("smsCompletedEnabled")}
                    disabled={isUpdatingPrefs}
                    className={`relative w-9 h-5 rounded-full transition flex-shrink-0 cursor-pointer ${
                      prefs.smsCompletedEnabled ? "bg-sky-500" : "bg-slate-200"
                    }`}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                      prefs.smsCompletedEnabled ? "translate-x-4" : ""
                    }`} />
                  </button>
                </div>

                {/* Toggle 3: Daily Summary */}
                <div className="flex items-start justify-between p-3 rounded-2xl bg-slate-50/30 border border-slate-100">
                  <div className="mr-3">
                    <span className="font-sans font-semibold text-xs text-slate-700 flex items-center gap-1.5">
                      End-of-Day Performance Recap
                      {!isPremium && <Lock className="w-3 h-3 text-slate-400 flex-shrink-0" />}
                    </span>
                    <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                      Recap of your daily percentage achieved, sent each evening if target wasn't completed.
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleSMSSetting("smsSummaryEnabled")}
                    disabled={isUpdatingPrefs}
                    className={`relative w-9 h-5 rounded-full transition flex-shrink-0 cursor-pointer ${
                      prefs.smsSummaryEnabled ? "bg-sky-500" : "bg-slate-200"
                    }`}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                      prefs.smsSummaryEnabled ? "translate-x-4" : ""
                    }`} />
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="simulators-tab"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100/60">
                <div className="flex items-center gap-2 mb-3">
                  <Settings2 className="w-4 h-4 text-sky-500" />
                  <span className="font-sans font-bold text-xs text-slate-700">Choose Future SMS Provider Provider</span>
                </div>
                
                {/* Provider switcher */}
                <div className="grid grid-cols-3 gap-2">
                  {(["twilio", "messagebird", "awssns"] as const).map((prov) => (
                    <button
                      key={prov}
                      onClick={() => setProvider(prov)}
                      className={`p-2 rounded-xl text-[10px] font-sans font-bold border transition ${
                        provider === prov
                          ? "bg-sky-50 border-sky-400 text-sky-600"
                          : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                      }`}
                    >
                      {prov === "twilio" && "Twilio 📞"}
                      {prov === "messagebird" && "MessageBird 🐦"}
                      {prov === "awssns" && "AWS SNS ☁️"}
                    </button>
                  ))}
                </div>
                <p className="text-[9px] text-slate-400 font-sans mt-2">
                  Switches the backend dispatcher mode to test specific SDK stubs inside our modular code.
                </p>
              </div>

              {/* SMS testing panel */}
              <div className="space-y-2.5">
                <span className="font-sans font-bold text-xs text-slate-700 block">Trigger Simulated Notifications Now</span>
                
                {!isPremium ? (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100/80 text-center flex flex-col items-center justify-center">
                    <Lock className="w-5 h-5 text-slate-400 mb-1.5" />
                    <span className="block font-sans font-bold text-xs text-slate-700">Sandbox Locked</span>
                    <p className="text-[10px] text-slate-400 font-sans mt-1 max-w-xs">
                      Upgrade to Pro to access live SMS sandbox simulation with verified phone delivery.
                    </p>
                    <button
                      onClick={() => setShowPaywall(true)}
                      className="mt-3 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-sky-500 text-white font-sans text-xs font-bold transition flex items-center gap-1.5 active:scale-95 shadow-sm cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      Unlock Sandbox
                    </button>
                  </div>
                ) : !prefs.isVerified ? (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100/80 text-center flex flex-col items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-amber-500 mb-1.5 animate-bounce" />
                    <span className="block font-sans font-bold text-xs text-slate-700">Verification Required</span>
                    <p className="text-[10px] text-slate-400 font-sans mt-1 max-w-xs">
                      Please enter and verify your phone number in the "Settings" tab before launching test SMS alerts.
                    </p>
                    <button
                      onClick={() => setActiveTab("setup")}
                      className="mt-3 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-sans text-xs font-bold transition active:scale-95 cursor-pointer"
                    >
                      Go to Verification Setup
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* Simulator Button 1: Progress */}
                    <button
                      onClick={() => triggerTestSMS("progress")}
                      disabled={isTestingSMS}
                      className="p-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-sky-50 hover:border-sky-200 transition text-left flex flex-col justify-between h-24 active:scale-95 cursor-pointer"
                    >
                      <span className="text-[10px] font-sans font-bold text-sky-500">TEST 1</span>
                      <span className="block font-sans font-bold text-xs text-slate-700 mt-1">Progress Reminder</span>
                      <span className="block text-[9px] text-slate-400 font-sans mt-0.5 truncate w-full">Behind daily goal nudge</span>
                    </button>

                    {/* Simulator Button 2: Completed */}
                    <button
                      onClick={() => triggerTestSMS("completed")}
                      disabled={isTestingSMS}
                      className="p-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-sky-50 hover:border-sky-200 transition text-left flex flex-col justify-between h-24 active:scale-95 cursor-pointer"
                    >
                      <span className="text-[10px] font-sans font-bold text-sky-500">TEST 2</span>
                      <span className="block font-sans font-bold text-xs text-slate-700 mt-1">Goal Achieved</span>
                      <span className="block text-[9px] text-slate-400 font-sans mt-0.5 truncate w-full">Target hit celebration</span>
                    </button>

                    {/* Simulator Button 3: Summary */}
                    <button
                      onClick={() => triggerTestSMS("summary")}
                      disabled={isTestingSMS}
                      className="p-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-sky-50 hover:border-sky-200 transition text-left flex flex-col justify-between h-24 active:scale-95 cursor-pointer"
                    >
                      <span className="text-[10px] font-sans font-bold text-sky-500">TEST 3</span>
                      <span className="block font-sans font-bold text-xs text-slate-700 mt-1">EOD Summary</span>
                      <span className="block text-[9px] text-slate-400 font-sans mt-0.5 truncate w-full">End of day recap recap</span>
                    </button>
                  </div>
                )}

                {/* Simulated SMS Status report */}
                {isTestingSMS && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-center text-xs font-sans text-slate-500 gap-2 animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin text-sky-500" />
                    Transmitting payload through mock {provider.toUpperCase()} servers...
                  </div>
                )}

                {testResult && !isTestingSMS && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-100 text-emerald-800 text-xs font-sans flex items-start gap-2.5"
                  >
                    <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-bold block text-emerald-900">SMS Reminded Delivered!</span>
                      <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                        {testResult.message}
                      </p>
                      <span className="block mt-1 text-[9px] font-mono text-emerald-500 uppercase tracking-wider font-extrabold">
                        Delivered successfully via AWS/Twilio/Bird integration
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-4 leading-normal border-t border-slate-100 pt-3">
        <Smartphone className="w-3 h-3 flex-shrink-0 text-sky-400" />
        Verified subscribers are protected under premium secure end-to-end sandbox gateways.
      </div>

      {/* 10. PREMIUM PAYWALL MODAL */}
      <AnimatePresence>
        {showPaywall && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPaywall(false)}
              className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 15 }}
              className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 z-10 flex flex-col gap-5 overflow-hidden"
            >
              {/* Premium Gradient Background blob decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-sky-200/10 rounded-full blur-2xl pointer-events-none" />

              {/* Close Button */}
              <button
                onClick={() => setShowPaywall(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-sans text-lg font-bold w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center transition"
              >
                ×
              </button>

              <div className="text-center pt-2">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/15 mx-auto mb-3">
                  <Sparkles className="w-6 h-6 text-white animate-spin" />
                </div>
                <h3 className="text-slate-900 font-sans font-black text-xl tracking-tight">Upgrade to HydroTimer Pro</h3>
                <p className="text-slate-400 font-sans text-xs mt-1">Unlock real-time SMS notifications & smart summaries</p>
              </div>

              {/* Benefits list */}
              <div className="space-y-3.5">
                {/* Benefit 1 */}
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-amber-500 font-black" />
                  </div>
                  <div>
                    <span className="block font-sans font-bold text-xs text-slate-800">Automatic Progress Reminders</span>
                    <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                      Never fall behind! Receive personalized hourly check-ins on your phone if you fall behind your pace.
                    </p>
                  </div>
                </div>

                {/* Benefit 2 */}
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-amber-500 font-black" />
                  </div>
                  <div>
                    <span className="block font-sans font-bold text-xs text-slate-800">Goal Achievement Celebrations</span>
                    <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                      Celebrate your successes! Get instant motivational text congratulations right as you reach your goal.
                    </p>
                  </div>
                </div>

                {/* Benefit 3 */}
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-amber-500 font-black" />
                  </div>
                  <div>
                    <span className="block font-sans font-bold text-xs text-slate-800">End-of-Day Performance Recaps</span>
                    <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                      Daily tracking directly in your text messages. Keep yourself accountable day after day.
                    </p>
                  </div>
                </div>

                {/* Benefit 4 */}
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-amber-500 font-black" />
                  </div>
                  <div>
                    <span className="block font-sans font-bold text-xs text-slate-800">Twilio / AWS Provider Gateway Support</span>
                    <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                      Engineered to seamlessly deploy across top-tier telecommunications provider integrations.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={handleUpgradeToPremium}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-sans text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-98 shadow-md shadow-amber-500/10 cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  Upgrade to Premium Instantly (MOCK)
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowPaywall(false)}
                  className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 font-sans text-xs font-bold transition text-center cursor-pointer"
                >
                  Maybe Later
                </button>
              </div>

              <div className="text-[9px] text-slate-400 text-center leading-normal">
                No credit card required. Mock payment flow enabled for demonstration and staging environments.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
