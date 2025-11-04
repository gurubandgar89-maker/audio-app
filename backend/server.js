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

const upload = multer({ dest: "uploads/" });

// ✅ POST: /api/transcribe
app.post("/api/transcribe", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const filePath = req.file.path;
  console.log("🟢 Received file:", filePath);

  // Run Whisper Python script
  const command = `python ./whisper/transcribe.py "${filePath}"`;
  console.log("Running:", command);

  exec(command, (error, stdout, stderr) => {
    // Clean up uploaded file
    fs.unlinkSync(filePath);

    if (error) {
      console.error("❌ Whisper error:", stderr || error.message);
      return res.status(500).json({ error: "Transcription failed" });
    }

    try {
      const result = JSON.parse(stdout);
      res.json(result);
    } catch (err) {
      console.error("❌ JSON Parse Error:", err);
      res.status(500).json({ error: "Invalid JSON from Whisper" });
    }
  });
});

// ✅ Basic route
app.get("/", (req, res) => res.send("Whisper Transcription Backend Running ✅"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
