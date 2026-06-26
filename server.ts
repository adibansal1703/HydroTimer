import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client lazily
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        aiClient = new GoogleGenAI({
          apiKey: apiKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });
      } catch (e) {
        console.error("Failed to initialize Gemini client:", e);
      }
    } else {
      console.warn("GEMINI_API_KEY environment variable is not set. Using fallback hydration tips.");
    }
  }
  return aiClient;
}

// Fallback tips if Gemini is unavailable
const FALLBACK_TIPS = [
  "Water is the driving force of all nature. Take a sip!",
  "Your brain is 73% water. Give it a quick splash to stay sharp!",
  "Hydrate before you dehydrate! A glass of water is a small step for health.",
  "Feeling sluggish? Don't reach for caffeine yet, try a tall glass of water first!",
  "Keep your skin glowing, your muscles primed, and your energy flowing. Bottoms up!",
  "Drinking water is the simplest form of self-care. Treat yourself right now!",
  "Water has zero calories but infinite benefits. Keep that bottle close!",
  "Stay fluid, stay fresh. Your body will thank you for this glass!",
  "A hydrated body is a happy body. Take a refreshing break and drink some water!",
  "Don't wait until you're thirsty to drink. Hydrate proactively!",
];

// Endpoint to generate a personalized motivational hydration message
app.get("/api/hydration-tip", async (req, res) => {
  const mode = req.query.mode as string || "witty"; // witty, mindful, scientific, athletic, energetic
  const currentIntake = req.query.intake as string || "0";
  const dailyGoal = req.query.goal as string || "2000";

  const ai = getGeminiClient();
  if (!ai) {
    // If Gemini is not set up, pick a random fallback tip
    const randomTip = FALLBACK_TIPS[Math.floor(Math.random() * FALLBACK_TIPS.length)];
    return res.json({ tip: randomTip, source: "fallback" });
  }

  try {
    const prompt = `Write a single-sentence, highly engaging, highly encouraging reminder to drink water. 
The user is tracking their water consumption. 
Current progress: ${currentIntake}ml out of a daily goal of ${dailyGoal}ml.
The tone style should be: ${mode} (e.g. witty, mindful, scientific, or energetic).
Keep it under 120 characters, exciting, fresh, and friendly. Do not include any quotes around the text.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const tip = response.text?.trim().replace(/^["']|["']$/g, "") || FALLBACK_TIPS[0];
    res.json({ tip, source: "gemini" });
  } catch (error: any) {
    console.error("Gemini API error:", error);
    const randomTip = FALLBACK_TIPS[Math.floor(Math.random() * FALLBACK_TIPS.length)];
    res.json({ tip: randomTip, source: "fallback", error: error.message });
  }
});

// Endpoint to calculate suggested water intake based on weather retrieved via search grounding
app.get("/api/suggested-intake", async (req, res) => {
  const location = req.query.location as string || "New York";

  const ai = getGeminiClient();
  if (!ai) {
    // Return standard fallback if Gemini client isn't configured
    return res.json({
      suggestedIntake: 2000,
      temperature: "22°C",
      condition: "Unknown",
      explanation: "Using standard 2000 mL default as the AI coach is in offline mode.",
      location: location,
    });
  }

  try {
    const prompt = `Find the current weather and temperature for "${location}" using Google Search.
Based on the current weather/temperature (e.g. hotter days need more water, cold days require standard hydration), calculate a suggested daily water intake in milliliters (mL) for a typical active adult.
Respond ONLY with a JSON object containing these exact fields:
{
  "suggestedIntake": <number representing water in mL, e.g. 2450>,
  "temperature": "<string representing the temperature, e.g. 28°C / 82°F>",
  "condition": "<string representing weather conditions, e.g. Sunny>",
  "explanation": "<a short explanation under 110 characters linking the weather to the water intake, e.g. Since it is hot in London, we recommend an extra 400ml.>",
  "location": "<the actual city and country found, e.g. London, UK>"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text?.trim() || "";
    
    // Safely parse JSON by removing markdown code fences if present
    let cleanedText = text;
    if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```(?:json)?\s*/i, "");
      cleanedText = cleanedText.replace(/\s*```$/, "");
    }
    const parsed = JSON.parse(cleanedText.trim());
    res.json(parsed);
  } catch (error: any) {
    console.error("Failed to generate suggested intake via search grounding:", error);
    res.json({
      suggestedIntake: 2000,
      temperature: "unknown",
      condition: "unknown",
      explanation: "Could not fetch live weather. Defaulted to standard 2000 mL.",
      location: location,
      error: error.message,
    });
  }
});

// Import SMS service and preferences database
import { getPreferences, savePreferences, SMSService, SMSProvider } from "./server/smsService.js";

// Endpoint to retrieve SMS and Plan Preferences
app.get("/api/sms/preferences", (req, res) => {
  const prefs = getPreferences();
  res.json(prefs);
});

// Endpoint to save SMS and Plan Preferences
app.post("/api/sms/preferences", (req, res) => {
  const existing = getPreferences();
  const updated = {
    ...existing,
    ...req.body,
  };
  
  // If downgraded to free, turn off SMS reminders automatically
  if (updated.plan === "free") {
    updated.smsProgressEnabled = false;
    updated.smsCompletedEnabled = false;
    updated.smsSummaryEnabled = false;
  }
  
  savePreferences(updated);
  res.json({ success: true, preferences: updated });
});

// Endpoint to send phone number verification code
app.post("/api/sms/send-code", (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) {
    return res.status(400).json({ error: "Phone number is required." });
  }

  try {
    const code = SMSService.generateVerificationCode(phoneNumber);
    res.json({ 
      success: true, 
      message: "Verification code sent successfully.", 
      debugCode: code // Expose for testing so users can enter it easily in the UI
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to verify the 6-digit code
app.post("/api/sms/verify-code", (req, res) => {
  const { phoneNumber, code } = req.body;
  if (!phoneNumber || !code) {
    return res.status(400).json({ error: "Phone number and verification code are required." });
  }

  const verified = SMSService.verifyCode(phoneNumber, code);
  if (verified) {
    const existing = getPreferences();
    const updated = {
      ...existing,
      phoneNumber,
      isVerified: true,
    };
    savePreferences(updated);
    res.json({ success: true, preferences: updated });
  } else {
    res.status(400).json({ error: "Invalid or expired verification code." });
  }
});

// Endpoint to send a simulated/test SMS message
app.post("/api/sms/send-test", async (req, res) => {
  const { eventType, currentIntake, dailyGoal, provider } = req.body;
  const prefs = getPreferences();

  if (!prefs.isVerified || !prefs.phoneNumber) {
    return res.status(400).json({ error: "Phone number must be verified before sending notifications." });
  }

  if (prefs.plan !== "premium") {
    return res.status(403).json({ error: "SMS notifications are a Premium feature." });
  }

  if (provider) {
    SMSService.setProvider(provider as SMSProvider);
  }

  let message = "";
  const current = currentIntake || 0;
  const goal = dailyGoal || 2000;

  switch (eventType) {
    case "progress":
      message = `HydroTimer Progress Alert: You're currently behind your goal! You've logged ${current} mL of your ${goal} mL target. Stay hydrated! 💧`;
      break;
    case "completed":
      message = `HydroTimer Goal Complete! 🎉 Outstanding! You reached your daily hydration target of ${goal} mL. Your body says thank you!`;
      break;
    case "summary":
      const pct = Math.round((current / goal) * 100);
      message = `HydroTimer Daily Summary: Today you achieved ${pct}% of your hydration target (${current}/${goal} mL). Let's lock in the goal tomorrow! 🌟`;
      break;
    default:
      message = `HydroTimer: This is a test reminder to stay hydrated. Currently logged: ${current}/${goal} mL.`;
  }

  try {
    const result = await SMSService.sendSMS(prefs.phoneNumber, message);
    res.json({ success: true, message: "Test SMS sent successfully.", details: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server
async function startServer() {
  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // SPA routing: catch-all
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
