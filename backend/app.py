from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import joblib, numpy as np, re, os, warnings, json, tempfile
from scipy.special import expit as sigmoid, softmax
from scipy.sparse import hstack, csr_matrix
from collections import defaultdict, Counter

warnings.filterwarnings("ignore", category=UserWarning, module="sklearn")

app = Flask(__name__, static_folder="../frontend/dist", static_url_path="/")
CORS(app)

# ==========================================================
# Load Models
# ==========================================================
MODEL_PATH = os.path.join(os.path.dirname(__file__), "models")
try:
    logreg_sent = joblib.load(os.path.join(MODEL_PATH, "logreg_sentiment.pkl"))
    svm_sent = joblib.load(os.path.join(MODEL_PATH, "svm_sentiment.pkl"))
    emotion_model = joblib.load(os.path.join(MODEL_PATH, "logreg_emotion_genre.pkl"))
    tfidf = joblib.load(os.path.join(MODEL_PATH, "tfidf_emotion.pkl"))
    mlb_genre = joblib.load(os.path.join(MODEL_PATH, "mlb_genres.pkl"))
    mlb_emotion = joblib.load(os.path.join(MODEL_PATH, "mlb_emotions.pkl"))
    scaler = joblib.load(os.path.join(MODEL_PATH, "scaler_maxabs.pkl"))
except Exception as e:
    print("Gagal load model:", e)
    logreg_sent = svm_sent = emotion_model = tfidf = mlb_genre = mlb_emotion = (
        scaler
    ) = None

# ==========================================================
# Emotion labels
# ==========================================================
emotion_labels = {
    "anger": "Anger",
    "anticipation": "Anticipation",
    "disgust": "Disgust",
    "fear": "Fear",
    "joy": "Joy",
    "optimism": "Optimism",
    "sadness": "Sadness",
    "surprise": "Surprise",
}


# ==========================================================
# Clean text
# ==========================================================
def clean_text(t):
    if not t:
        return ""
    t = str(t).lower()
    t = re.sub(r"[^a-z\s]", " ", t)
    return re.sub(r"\s+", " ", t).strip()


# ==========================================================
# Genre–Emotion Mapping (UPDATED)
# ==========================================================
def genre_emotion_influence():
    base = np.ones((len(mlb_genre.classes_), len(mlb_emotion.classes_)))
    mapping = {
        "Drama": {"sadness": 1.8, "anticipation": 1.2, "joy": 1.0, "disgust": 1.1},
        "Romance": {"joy": 2.0, "optimism": 1.7, "sadness": 1.3, "anticipation": 1.1},
        "Comedy": {"joy": 2.3, "optimism": 1.7, "surprise": 1.6},
        "Thriller": {"anticipation": 2.4, "fear": 2.0, "surprise": 1.9},
        "Action": {"anger": 1.5, "anticipation": 2.0, "fear": 1.4, "surprise": 1.6},
        "Fantasy": {"anticipation": 2.0, "joy": 1.8, "optimism": 1.5, "surprise": 1.7},
        "Horror": {"fear": 2.6, "anticipation": 1.8, "surprise": 1.9, "disgust": 1.7},
        "Family": {"joy": 1.5, "optimism": 1.3, "sadness": 1.1},
        "Adventure": {
            "anticipation": 2.2,
            "joy": 1.8,
            "optimism": 1.3,
            "surprise": 1.7,
        },
        "Crime": {"fear": 1.4, "anger": 1.4, "anticipation": 1.2, "disgust": 1.2},
        "Science Fiction": {
            "anticipation": 1.7,
            "surprise": 1.7,
            "fear": 1.2,
            "optimism": 1.3,
        },
        "Mystery": {"anticipation": 1.7, "fear": 1.4, "surprise": 1.7},
        "Music": {"joy": 1.5, "optimism": 1.4},
        "Animation": {"joy": 1.4, "optimism": 1.3, "surprise": 1.4},
        "Foreign": {"sadness": 1.3, "joy": 1.1},
        "History": {"sadness": 1.4, "fear": 1.1, "anticipation": 1.1},
        "Documentary": {"sadness": 1.3, "fear": 1.1, "optimism": 1.2},
        "War": {"sadness": 1.6, "anger": 1.3, "fear": 1.3, "anticipation": 1.2},
        "Tv Movie": {"joy": 1.3, "sadness": 1.1},
        "Western": {"anger": 1.3, "sadness": 1.2, "fear": 1.1},
    }
    for g, emo_map in mapping.items():
        if g in mlb_genre.classes_:
            gi = list(mlb_genre.classes_).index(g)
            for e, v in emo_map.items():
                if e in mlb_emotion.classes_:
                    ei = list(mlb_emotion.classes_).index(e)
                    base[gi, ei] = v
    return base, mapping


genre_matrix, genre_mapping = genre_emotion_influence()

# ==========================================================
# Persistent cache
# ==========================================================
STORAGE_FILE = os.path.join(tempfile.gettempdir(), "emotion_analysis_history.json")


def load_storage():
    if not os.path.exists(STORAGE_FILE):
        return []
    try:
        with open(STORAGE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return []


def save_storage(data):
    with open(STORAGE_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def reset_storage():
    if os.path.exists(STORAGE_FILE):
        os.remove(STORAGE_FILE)


# ==========================================================
# Prediction core (improved Surprise relevance)
# ==========================================================
def predict_emotion_genre(review, genres):
    clean = clean_text(review)
    valid_genres = []
    for g in genres:
        g_clean = g.strip().lower()
        for known in mlb_genre.classes_:
            if known.lower() == g_clean:
                valid_genres.append(known)
                break
            
    # Sentiment
    try:
        log_prob = logreg_sent.predict_proba([clean])[0][1]
        svm_val = float(np.asarray(svm_sent.decision_function([clean])).ravel()[0])
        svm_prob = sigmoid(svm_val)
    except Exception:
        log_prob = svm_prob = 0.5
    sent_score = (log_prob + svm_prob) / 2
    sentiment = "Positive" if sent_score >= 0.5 else "Negative"

    # Emotion prediction
    X_text = tfidf.transform([clean])
    X_genre = (
        mlb_genre.transform([valid_genres])
        if valid_genres
        else csr_matrix((1, len(mlb_genre.classes_)))
    )
    X_combined = hstack([X_text, X_genre])
    try:
        X_scaled = scaler.transform(X_combined)
    except Exception:
        X_scaled = X_combined
    try:
        raw = np.column_stack(
            [est.decision_function(X_scaled) for est in emotion_model.estimators_]
        )
    except Exception:
        raw = np.zeros((1, len(mlb_emotion.classes_)))

    base_probs = softmax(raw / 1.3, axis=1).flatten()

    # Genre-based modulation
    if genre_matrix is not None and valid_genres:
        inf = [genre_matrix[list(mlb_genre.classes_).index(g)] for g in valid_genres]
        influence_final = np.mean(inf, axis=0)
        genre_boost = 0.5 * base_probs + 0.5 * (
            base_probs * (influence_final / np.max(influence_final))
        )
    else:
        genre_boost = base_probs

    # Keyword sensitivity + Surprise context
    word_bias = {
        "funny": "joy",
        "boring": "sadness",
        "shocking": "surprise",
        "suspense": "anticipation",
        "love": "optimism",
        "death": "sadness",
        "angry": "anger",
        "gross": "disgust",
        "fear": "fear",
        "unexpected": "surprise",
        "twist": "surprise",
        "suddenly": "surprise",
        "surprising": "surprise",
        "wow": "surprise",
        "unbelievable": "surprise",
    }
    for w, emo in word_bias.items():
        if w in clean:
            idx = list(mlb_emotion.classes_).index(emo)
            genre_boost[idx] *= 1.35  # lebih kuat untuk Surprise

    # Surprise emphasis by genre
    surprise_idx = list(mlb_emotion.classes_).index("surprise")
    surprise_genres = {
        "Comedy",
        "Action",
        "Thriller",
        "Fantasy",
        "Horror",
        "Adventure",
        "Science Fiction",
        "Mystery",
    }
    if any(g in surprise_genres for g in valid_genres):
        genre_boost[surprise_idx] *= 1.2

    # Adaptive normalization
    surprise_val = genre_boost[surprise_idx]
    if surprise_val < np.mean(genre_boost) * 0.8:
        genre_boost[surprise_idx] = (
            genre_boost[surprise_idx] + np.mean(genre_boost)
        ) / 1.2

    # Normalize
    fused = (genre_boost - np.min(genre_boost)) / (np.ptp(genre_boost) + 1e-6)
    fused = np.clip(0.35 + 0.65 * fused, 0, 1)
    fused = np.round(fused, 3)

    emo_names = list(mlb_emotion.classes_)
    emos_all = [
        {"Emotion": emotion_labels.get(n, n.title()), "Score": float(p)}
        for n, p in zip(emo_names, fused)
    ]
    emos_top5 = sorted(emos_all, key=lambda x: x["Score"], reverse=True)[:5]

    summary = (
        f"This review is {sentiment}, with dominant emotions: "
        f"{', '.join([e['Emotion'] for e in emos_top5[:2]])}. "
        f"Genres: {', '.join(valid_genres)} influence emotional profile."
    )

    return {
        "Review": review,
        "Genre": valid_genres,
        "Sentiment": sentiment,
        "Emotions": emos_top5,
        "Summary": summary,
    }


# ==========================================================
# API
# ==========================================================
@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json() or {}
    new_reviews = data.get("reviews", [])
    genres = data.get("genres", [])

    if not new_reviews:
        return jsonify({"error": "At least one review is required."}), 400

    history = load_storage()
    for r in new_reviews:
        result = predict_emotion_genre(r, genres)
        history.append(result)
    save_storage(history)

    # Aggregate charts
    emotion_totals = defaultdict(list)
    genre_emotion_map = defaultdict(lambda: defaultdict(list))
    time_series = defaultdict(list)

    for idx, r in enumerate(history, start=1):
        for emo in r["Emotions"]:
            emotion_totals[emo["Emotion"]].append(emo["Score"])
            time_series[emo["Emotion"]].append({"x": idx, "y": emo["Score"]})
        if r["Genre"]:
            weight = 1 / len(r["Genre"])
            for g in r["Genre"]:
                for emo in r["Emotions"]:
                    base_score = emo["Score"]
                    genre_bias = genre_mapping.get(g, {}).get(
                        emo["Emotion"].lower(), 1.0
                    )
                    adjusted_score = base_score * genre_bias * weight
                    genre_emotion_map[g][emo["Emotion"]].append(adjusted_score)

    global_chart = []
    for emo_label in emotion_labels.values():
        vals = emotion_totals.get(emo_label, [])
        avg_val = round(float(np.mean(vals)), 3) if vals else 0.0
        global_chart.append({"Emotion": emo_label, "Score": avg_val})

    genre_chart = []
    for g, emos in genre_emotion_map.items():
        entry = {"genre": g}
        for emo_label in emotion_labels.values():
            vals = emos.get(emo_label, [])
            entry[emo_label] = round(float(np.mean(vals)), 3) if vals else 0.0
        genre_chart.append(entry)

    time_chart = [{"Emotion": e, "Points": v} for e, v in time_series.items()]
    sentiment_counts = Counter([r["Sentiment"] for r in history])
    dominant_sentiment = (
        "Positive"
        if sentiment_counts["Positive"] >= sentiment_counts["Negative"]
        else "Negative"
    )

    return jsonify(
        {
            "results": history[-len(new_reviews) :],
            "overall_sentiment": dominant_sentiment,
            "global_emotion_chart": global_chart,
            "genre_emotion_summary": genre_chart,
            "emotion_trend": time_chart,
            "Total_Reviews": len(history),
        }
    )


# ==========================================================
# Tambahan baru: Endpoint /history (memuat ulang data cache lama)
# ==========================================================
@app.route("/history", methods=["GET"])
def history():
    history = load_storage()
    if not history:
        return jsonify({"results": []})

    # Re-aggregate chart sama seperti di /predict
    emotion_totals = defaultdict(list)
    genre_emotion_map = defaultdict(lambda: defaultdict(list))
    time_series = defaultdict(list)

    for idx, r in enumerate(history, start=1):
        for emo in r["Emotions"]:
            emotion_totals[emo["Emotion"]].append(emo["Score"])
            time_series[emo["Emotion"]].append({"x": idx, "y": emo["Score"]})
        if r["Genre"]:
            weight = 1 / len(r["Genre"])
            for g in r["Genre"]:
                for emo in r["Emotions"]:
                    base_score = emo["Score"]
                    genre_bias = genre_mapping.get(g, {}).get(
                        emo["Emotion"].lower(), 1.0
                    )
                    adjusted_score = base_score * genre_bias * weight
                    genre_emotion_map[g][emo["Emotion"]].append(adjusted_score)

    global_chart = []
    for emo_label in emotion_labels.values():
        vals = emotion_totals.get(emo_label, [])
        avg_val = round(float(np.mean(vals)), 3) if vals else 0.0
        global_chart.append({"Emotion": emo_label, "Score": avg_val})

    genre_chart = []
    for g, emos in genre_emotion_map.items():
        entry = {"genre": g}
        for emo_label in emotion_labels.values():
            vals = emos.get(emo_label, [])
            entry[emo_label] = round(float(np.mean(vals)), 3) if vals else 0.0
        genre_chart.append(entry)

    time_chart = [{"Emotion": e, "Points": v} for e, v in time_series.items()]

    return jsonify(
        {
            "results": history,
            "global_emotion_chart": global_chart,
            "genre_emotion_summary": genre_chart,
            "emotion_trend": time_chart,
        }
    )


# ==========================================================
# Reset & Serve
# ==========================================================
@app.route("/reset", methods=["POST"])
def reset():
    reset_storage()
    return jsonify({"message": "Semua data dihapus permanen."})


@app.route("/")
def home():
    if os.path.exists(app.static_folder):
        return send_from_directory(app.static_folder, "index.html")
    return jsonify({"message": "Running"})


if __name__ == "__main__":
    print("Flask backend running at http://localhost:5000")
    app.run(host="0.0.0.0", port=5000, debug=True)
