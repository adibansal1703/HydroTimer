import { HelpCircle, Droplet, Clock, Target, Shield, Zap } from "lucide-react";
import { useState } from "react";

const faqData = [
  {
    id: "how-much-water",
    question: "How much water should I drink daily?",
    answer: "The general recommendation is to drink 8 glasses (64 ounces) of water per day, but individual needs vary based on factors like weight, activity level, and climate. HydroTimer helps you set personalized daily water goals and track your progress toward optimal hydration.",
    icon: Droplet,
  },
  {
    id: "how-tracking-works",
    question: "How does HydroTimer track my water intake?",
    answer: "HydroTimer allows you to log each glass of water you drink with quick-add buttons or custom amounts. The app automatically calculates your total daily intake, shows progress toward your goal, and maintains a history of your hydration habits with streak tracking.",
    icon: Target,
  },
  {
    id: "custom-goals",
    question: "Can I set custom water intake goals?",
    answer: "Yes! HydroTimer lets you set personalized daily water intake goals based on your individual needs. You can adjust your goal at any time, and the app will track your progress against your custom target with visual progress indicators.",
    icon: Target,
  },
  {
    id: "reminders",
    question: "Does HydroTimer send drink water reminders?",
    answer: "HydroTimer includes customizable reminder notifications to help you stay hydrated throughout the day. You can set reminder intervals (30 minutes, 1 hour, 2 hours, or custom) and receive browser notifications when it's time to drink water.",
    icon: Clock,
  },
  {
    id: "privacy",
    question: "Is my hydration data private and secure?",
    answer: "Yes, HydroTimer stores all your hydration data locally in your browser using localStorage. Your water intake logs, goals, and settings never leave your device unless you choose to export them. No account or personal information is required.",
    icon: Shield,
  },
  {
    id: "free-features",
    question: "What features are included in the free version?",
    answer: "HydroTimer is completely free and includes daily water intake tracking, customizable hydration goals, drink water reminders, streak tracking, AI-powered hydration coaching, weather-based intake suggestions, and progress visualization. No premium subscription required.",
    icon: Zap,
  },
];

export default function FAQSection() {
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);

  const toggleFAQ = (id: string) => {
    setOpenFAQ(openFAQ === id ? null : id);
  };

  return (
    <section 
      id="faq-section" 
      className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 mt-8"
      aria-labelledby="faq-heading"
    >
      <div className="flex items-center gap-2 mb-6">
        <HelpCircle className="w-5 h-5 text-sky-500" />
        <h2 id="faq-heading" className="text-slate-800 font-sans font-bold text-lg">
          Frequently Asked Questions
        </h2>
      </div>

      <div className="space-y-3">
        {faqData.map((faq) => {
          const Icon = faq.icon;
          const isOpen = openFAQ === faq.id;
          
          return (
            <div 
              key={faq.id}
              className="border border-slate-100 rounded-2xl overflow-hidden transition-all duration-200 hover:border-sky-200"
            >
              <button
                onClick={() => toggleFAQ(faq.id)}
                className="w-full flex items-center gap-3 p-4 text-left bg-white hover:bg-slate-50 transition-colors"
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${faq.id}`}
              >
                <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-sky-600" />
                </div>
                <span className="flex-1 font-sans font-semibold text-sm text-slate-800">
                  {faq.question}
                </span>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform ${
                  isOpen ? 'rotate-180 bg-sky-100' : 'bg-slate-100'
                }`}>
                  <svg
                    className="w-4 h-4 text-slate-600"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              
              {isOpen && (
                <div
                  id={`faq-answer-${faq.id}`}
                  className="px-4 pb-4 pt-0 pl-15"
                  role="region"
                  aria-labelledby={`faq-question-${faq.id}`}
                >
                  <p className="font-sans text-sm text-slate-600 leading-relaxed pl-11">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100">
        <p className="text-xs text-slate-400 font-sans text-center">
          Have more questions about our water tracker app? Your hydration journey matters to us.
        </p>
      </div>
    </section>
  );
}
