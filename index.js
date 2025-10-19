import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { v4 as uuidv4 } from "uuid";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 8080;
const USE_MOCK = process.env.USE_MOCK === "1" || !process.env.OPENAI_API_KEY;

let openai = null;
if (!USE_MOCK) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const history = [];

app.post("/generate", async (req, res) => {
  try {
    const { poem, style = "", referenceAudioUrl = null, imageUrl = null } = req.body || {};
    if (!poem || poem.trim().length === 0) {
      return res.status(400).json({ error: "poem is required" });
    }

    let lyrics;
    if (!USE_MOCK) {
      const prompt = `Rewrite the following poem into song lyrics in the style: "${style}". Keep verses and chorus if appropriate.\n\nPoem:\n${poem}`;
      const resp = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 600
      });
      lyrics = resp.choices?.[0]?.message?.content?.trim() || "Failed to generate lyrics";
    } else {
      lyrics = `(mock lyrics — style: ${style})\n\n${poem}\n\n(chorus: la la la)`;
    }

    let audio_url;
    if (!USE_MOCK) {
      audio_url = `https://example.com/audio/${uuidv4()}.mp3`;
    } else {
      audio_url = `https://example.com/audio/mock-${Date.now()}.mp3`;
    }

    const song = {
      id: uuidv4(),
      poem,
      style,
      lyrics,
      audio_url,
      referenceAudioUrl,
      imageUrl,
      createdAt: new Date().toISOString()
    };
    history.unshift(song);
    if (history.length > 100) history.pop();

    return res.json({ songId: song.id, lyrics: song.lyrics, audio_url: song.audio_url });
  } catch (err) {
    console.error("Generate error:", err);
    return res.status(500).json({ error: "Server error", details: err?.message || err });
  }
});

app.get("/history", (req, res) => {
  const list = history.map(s => ({
    id: s.id,
    poem: s.poem,
    style: s.style,
    audio_url: s.audio_url,
    createdAt: s.createdAt
  }));
  res.json({ count: list.length, songs: list });
});

app.get("/song/:id", (req, res) => {
  const id = req.params.id;
  const song = history.find(s => s.id === id);
  if (!song) return res.status(404).json({ error: "Not found" });
  res.json(song);
});

app.get("/health", (req, res) => res.json({ status: "ok" }));
app.get("/", (req, res) => res.json({ message: "Poetic Music Backend (Node) is running" }));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT} (USE_MOCK=${USE_MOCK})`);
});