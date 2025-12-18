import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config(); // load API key from .env

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.GOOGLE_API_KEY;
const PORT = process.env.PORT || 3000;

// Backend endpoint for frontend
app.post("/api/chat", async (req, res) => {
  try {
    const chatHistory = req.body.chatHistory;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: chatHistory }),
      }
    );

    const data = await response.json();

    // Ensure we always return a candidates array
    if (!data.candidates || data.candidates.length === 0) {
      return res.json({
        candidates: [{ content: { parts: [{ text: "No response received from API." }] } }]
      });
    }

    res.json(data);

  } catch (err) {
    // Return error in same structure as candidates for frontend safety
    res.json({
      candidates: [{ content: { parts: [{ text: `Error: ${err.message}` }] } }]
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
