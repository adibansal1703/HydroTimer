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
