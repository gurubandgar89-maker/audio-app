import sys
import json
import whisper

if len(sys.argv) < 2:
    print(json.dumps({"error": "No file provided"}))
    sys.exit(1)

audio_path = sys.argv[1]

model = whisper.load_model("base")  # "tiny" for faster, "base" for better accuracy
result = model.transcribe(audio_path, word_timestamps=True)

segments = []
if "segments" in result:
    for seg in result["segments"]:
        start = round(seg["start"], 2)
        end = round(seg["end"], 2)
        text = seg["text"].strip()
        words = []
        if "words" in seg:
            for w in seg["words"]:
                words.append({
                    "word": w["word"].strip(),
                    "start": round(w["start"], 2)
                })
        segments.append({
            "start": start,
            "end": end,
            "text": text,
            "words": words
        })

output = {
    "text": result["text"].strip(),
    "segments": segments
}

print(json.dumps(output))
