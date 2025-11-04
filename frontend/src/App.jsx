import React, { useState } from "react";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [transcriptData, setTranscriptData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please choose a file first.");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:5000/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to transcribe");

      const data = await response.json();
      setTranscriptData(data);
    } catch (err) {
      console.error(err);
      setError("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <h2>🎧 Audio Transcription App</h2>

      <div>
        <input type="file" onChange={handleFileChange} />
        <button onClick={handleUpload} disabled={loading}>
          {loading ? "Processing..." : "Upload & Transcribe"}
        </button>
      </div>

      <div className="output-box">
        <h3>📝 Transcription Output</h3>

        {error && <p className="error">{error}</p>}

        {!error && !transcriptData && (
          <p>Your transcription will appear here...</p>
        )}

        {transcriptData && (
          <div className="transcript">
            {transcriptData.segments.map((segment, index) => (
              <p key={index}>
                {segment.words.map((w, i) => (
                  <span
                    key={i}
                    title={`Start: ${w.start.toFixed(2)}s`}
                    className="word"
                  >
                    {w.word}
                  </span>
                ))}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
