import express from "express";
import cors from "cors";
import multer from "multer";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// --- Setup paths ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// --- Multer setup for uploads ---
const upload = multer({ dest: path.join(__dirname, "uploads/") });

// --- Transcription API ---
app.post("/api/transcribe", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = req.file.path; // e.g. uploads/abc123
    const outputDir = path.join(__dirname, "uploads");
    const baseName = path.basename(filePath);
    const jsonPath = path.join(outputDir, `${baseName}.json`);

    // --- Command for Whisper with word timestamps ---
    const command = `python -m whisper "${filePath}" --model tiny --output_format json --output_dir "${outputDir}" --word_timestamps True`;

    console.log("🟢 Running command:", command);

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("❌ Whisper Error:", stderr || error.message);
        return res.status(500).json({ error: "Transcription failed" });
      }

      // Check if Whisper generated JSON output
      if (!fs.existsSync(jsonPath)) {
        console.error("❌ JSON output not found:", jsonPath);
        return res.status(500).json({ error: "No JSON output generated" });
      }

      // Parse Whisper JSON
      const transcription = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

      // Prepare structured response
      const segments = transcription.segments.map((s) => ({
        start: s.start,
        end: s.end,
        text: s.text.trim(),
        words: s.words?.map((w) => ({
          word: w.word.trim(),
          start: w.start,
          end: w.end,
        })),
      }));

      // Respond with clean data
      res.json({
        text: transcription.text,
        segments,
      });

      // Optional: delete uploaded files later to save space
      setTimeout(() => {
        try {
          fs.unlinkSync(filePath);
          fs.unlinkSync(jsonPath);
        } catch {}
      }, 20000);
    });
  } catch (err) {
    console.error("❌ Server error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// --- Start server ---
const PORT = 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
