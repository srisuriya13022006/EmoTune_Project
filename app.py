
from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import re
import logging
import os
import google.generativeai as genai
from gradio_client import Client

app = Flask(__name__)
CORS(app, resources={r"/predict": {"origins": "*"}}, supports_credentials=True)

logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(levelname)s - %(message)s')

# ==============================
# Gemini setup
# ==============================
logging.info("Setting up Gemini API...")
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))  # <-- put your key here
model = genai.GenerativeModel("gemini-3-flash-preview")
logging.info("Gemini API configured.")

# ==============================
# Hugging Face Space client
# ==============================
logging.info("Connecting to Hugging Face Gradio Space...")
hf_client = Client("https://agrawaltanmay-speech-emotion-recognition-7789d5f.hf.space/")
logging.info("Connected to HF Space.")

# ==============================
# Gemini recommendation logic
# ==============================
def get_gemini_recommendations(emotion):
    logging.info(f"Generating recommendations for emotion: {emotion}")

    prompt = f"""
You are a recommendation engine.

Based on the user's emotion: "{emotion}", return ONLY a valid JSON object with:
- 3 books
- 3 songs
- 3 movies

Each item must include:
- title
- link (Spotify for music, Goodreads for books, IMDb for movies)

Return ONLY JSON, no explanation.

Format:
{{
  "books": [
    {{"title": "...", "link": "..."}},
    {{"title": "...", "link": "..."}},
    {{"title": "...", "link": "..."}}
  ],
  "music": [
    {{"title": "...", "link": "..."}},
    {{"title": "...", "link": "..."}},
    {{"title": "...", "link": "..."}}
  ],
  "movies": [
    {{"title": "...", "link": "..."}},
    {{"title": "...", "link": "..."}},
    {{"title": "...", "link": "..."}}
  ]
}}
"""

    try:
        response = model.generate_content(prompt)

        if not response.candidates:
            raise ValueError("No candidates returned by Gemini")

        candidate = response.candidates[0]

        if not candidate.content or not candidate.content.parts:
            raise ValueError("Gemini returned empty content")

        raw_text = candidate.content.parts[0].text.strip()
        logging.info(f"Gemini raw output: {raw_text}")

        # Extract JSON safely
        match = re.search(r'\{.*\}', raw_text, re.DOTALL)
        if not match:
            raise ValueError(f"No JSON found in Gemini output")

        parsed_json = json.loads(match.group(0))
        return parsed_json

    except Exception as e:
        logging.error(f"Gemini API error: {e}", exc_info=True)
        return {"books": [], "music": [], "movies": []}

# ==============================
# API Route
# ==============================
@app.route('/predict', methods=['POST'])
def predict():
    logging.info("==> /predict endpoint hit")

    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        # Save uploaded file
        file_path = "temp.wav"
        file.save(file_path)
        logging.info(f"Saved uploaded audio to {file_path}")

        # ==============================
        # Send audio to HF Gradio Space
        # ==============================
        logging.info("Sending audio to HF Space API...")

        try:
            emotion = hf_client.predict(
                file_path,
                api_name="/predict"
            )

            emotion = emotion.lower()
            logging.info(f"Predicted emotion: {emotion}")

        except Exception:
            logging.error("HF Space API error", exc_info=True)
            return jsonify({'error': 'Failed to get emotion from HF Space'}), 500

        # ==============================
        # Gemini recommendations
        # ==============================
        recommendations = get_gemini_recommendations(emotion)

        # Cleanup
        if os.path.exists(file_path):
            os.remove(file_path)

        return jsonify({
            "emotion": emotion,
            "recommendations": recommendations
        })

    except Exception as e:
        logging.error("Prediction error occurred", exc_info=True)
        return jsonify({'error': str(e)}), 500

# ==============================
# Run app
# ==============================
if __name__ == '__main__':
    logging.info("Starting Flask backend...")
    app.run(host="0.0.0.0", port=7860)
