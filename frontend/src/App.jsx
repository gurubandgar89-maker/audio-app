import React, { useState } from "react";
import axios from "axios";
import "./App.css";

const App = () => {
  const [file, setFile] = useState(null);
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setSegments([]);
    setError("");
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please choose an audio file!");
      return;
    }

    setLoading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      // ✅ Backend API endpoint
      const res = await axios.post("http://localhost:5000/api/transcribe", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSegments(res.data.segments);
    } catch (err) {
      console.error("Error uploading file:", err);
      setError("Transcription failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>🎧 Audio Transcription App</h1>

      <input type="file" accept="audio/*" onChange={handleFileChange} />
      {file && <p>{file.name}</p>}

      <button
        onClick={handleUpload}
        disabled={loading}
        style={{
          backgroundColor: "#22c55e",
          color: "white",
          padding: "10px 20px",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontWeight: "bold",
          marginTop: "10px",
        }}
      >
        {loading ? "Transcribing..." : "Upload & Transcribe"}
      </button>

      <div className="transcription-box">
        <h2>📄 Transcription Output</h2>
        {error && <p style={{ color: "red" }}>{error}</p>}

        {!error && !loading && segments.length > 0 && (
          <div style={{ lineHeight: "1.8" }}>
            {segments.map((seg, i) => (
              <div key={i} style={{ marginBottom: "10px" }}>
                {seg.words && seg.words.length > 0
                  ? seg.words.map((w, j) => (
                      <span
                        key={j}
                        className="word"
                        data-timestamp={`${w.start.toFixed(2)}s`}
                      >
                        {w.word + " "}
                      </span>
                    ))
                  : seg.text}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
