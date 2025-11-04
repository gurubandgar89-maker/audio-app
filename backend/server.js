import express from "express";
import cors from "cors";
import multer from "multer";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Static frontend (serves the Vite build)
const buildPath = path.join(__dirname, "../frontend/dist");
app.use(express.static(buildPath));

// ✅ File upload setup
const upload = multer({ dest: "uploads/" });

// ✅ Whisper transcription route
app.post("/api/transcribe", upload.single("file"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const outputDir = path.resolve("uploads");
    const command = `python -m whisper "${filePath}" --model tiny --output_format json --output_dir uploads --word_timestamps True`;

    console.log("🎤 Running Whisper command:", command);

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("❌ Whisper error:", stderr || error.message);
        return res.status(500).json({ error: "Transcription failed" });
      }

      const jsonFileName = path.basename(filePath) + ".json";
      const jsonPath = path.join(outputDir, jsonFileName);

      if (!fs.existsSync(jsonPath)) {
        console.error("❌ JSON not found at:", jsonPath);
        return res.status(500).json({ error: "No transcription JSON created." });
      }

      const transcription = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
      res.json({
        text: transcription.text,
        segments: transcription.segments.map((s) => ({
          start: s.start,
          text: s.text.trim(),
        })),
      });
    });
  } catch (err) {
    console.error("❌ Server error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ For all other routes (serve index.html)
app.get("*", (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
