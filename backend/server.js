// backend/server.js
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { execFile } from "child_process";
import fs from "fs";

// --- Setup paths for ES Modules ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Static files (frontend build) ---
const frontendPath = path.join(__dirname, "../frontend/dist");
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
  console.log("✅ Serving frontend from:", frontendPath);
} else {
  console.warn("⚠️ Frontend build not found at:", frontendPath);
}

// --- API route for transcription ---
app.post("/api/transcribe", (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: "No audio file uploaded." });
    }

    const audioFile = req.files.file;
    const tempPath = path.join(__dirname, "temp_audio.mp3");

    // Save uploaded file temporarily
    audioFile.mv(tempPath, (err) => {
      if (err) {
        console.error("File save error:", err);
        return res.status(500).json({ error: "Failed to save uploaded file." });
      }

      console.log("🎵 File saved:", tempPath);

      // Run the Python transcription script
      const pyScript = path.join(__dirname, "whisper", "transcribe.py");
      execFile("python", [pyScript, tempPath], (error, stdout, stderr) => {
        fs.unlink(tempPath, () => {}); // Clean up temp file

        if (error) {
          console.error("Transcription error:", stderr || error);
          return res.status(500).json({ error: "Transcription failed." });
        }

        try {
          const output = JSON.parse(stdout);
          res.json(output);
        } catch (parseErr) {
          console.error("JSON parse error:", parseErr);
          res.status(500).json({ error: "Invalid transcription output." });
        }
      });
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// --- Catch-all route (for React Router) ---
// ✅ Fixed for Express 5 (Node 22 compatibility)
app.get("/*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
