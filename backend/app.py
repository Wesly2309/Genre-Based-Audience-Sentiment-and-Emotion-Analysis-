from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import joblib, numpy as np, re, os, warnings
from scipy.special import expit as sigmoid, softmax
from scipy.sparse import hstack, csr_matrix

warnings.filterwarnings("ignore", category=UserWarning, module="sklearn")

app = Flask(__name__, static_folder="../frontend/dist", static_url_path="/")
CORS(app)

# === LOAD MODELS ===
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
    logreg_sent = svm_sent = emotion_model = tfidf = mlb_genre = mlb_emotion = scaler = None


# === EMOTION LABELS ===
emotion_labels = {
    "anger": "Anger", "anticipation": "Anticipation", "disgust": "Disgust",
    "fear": "Fear", "joy": "Joy", "optimism": "Optimism",
    "sadness": "Sadness", "surprise": "Surprise",
}


# === TEXT CLEANER ===
def clean_text(t):
    if t is None:
        return ""
    t = str(t).lower()
    t = re.sub(r"[^a-zA-Z\s]", " ", t)
    return re.sub(r"\s+", " ", t).strip()


# === GENRE–EMOTION INFLUENCE MATRIX  ===
def genre_emotion_influence():
    if mlb_genre is None or mlb_emotion is None:
        return None

    base = np.ones((len(mlb_genre.classes_), len(mlb_emotion.classes_)))
    mapping = {
        "horror": {"fear": 2.6, "anticipation": 1.8, "surprise": 1.9},
        "thriller": {"anticipation": 2.4, "fear": 2.0, "surprise": 1.6},
        "drama": {"sadness": 1.8, "anticipation": 1.2, "joy": 1.0},
        "romance": {"joy": 2.0, "optimism": 1.7, "sadness": 1.3},
        "comedy": {"joy": 2.3, "optimism": 1.7, "surprise": 1.4},
        "action": {"anger": 1.5, "anticipation": 2.0, "fear": 1.4, "surprise": 1.3},
        "adventure": {"anticipation": 2.2, "joy": 1.8, "optimism": 1.3, "surprise": 1.4},
        "fantasy": {"anticipation": 2.0, "joy": 1.8, "optimism": 1.5, "surprise": 1.3},
        "science fiction": {"anticipation": 1.7, "surprise": 1.4, "fear": 1.2},
        "crime": {"fear": 1.4, "anger": 1.4, "anticipation": 1.2},
        "mystery": {"anticipation": 1.7, "fear": 1.4, "surprise": 1.3},
        "psychological": {"fear": 1.6, "sadness": 1.3, "anticipation": 1.2},
        "slice of life": {"joy": 1.4, "optimism": 1.2, "sadness": 1.1},
        "shoujo": {"joy": 1.5, "optimism": 1.3},
        "shounen": {"anticipation": 1.6, "joy": 1.3, "optimism": 1.2},
        "seinen": {"sadness": 1.4, "anger": 1.2},
        "super power": {"anticipation": 1.5, "joy": 1.3},
        "samurai": {"anticipation": 1.4, "anger": 1.2, "fear": 1.1},
        "martial arts": {"anticipation": 1.6, "anger": 1.3},
        "military": {"fear": 1.4, "sadness": 1.3, "anticipation": 1.2},
        "war": {"sadness": 1.6, "anger": 1.3, "fear": 1.3},
        "magic": {"anticipation": 1.6, "joy": 1.5, "surprise": 1.3},
        "supernatural": {"fear": 1.5, "anticipation": 1.3, "surprise": 1.3},
        "demons": {"fear": 1.6, "anticipation": 1.3},
        "vampire": {"fear": 1.6, "sadness": 1.2},
        "mecha": {"anticipation": 1.4, "fear": 1.2, "optimism": 1.1},
        "space": {"anticipation": 1.4, "surprise": 1.3},
        "historical": {"sadness": 1.4, "fear": 1.1},
        "biography": {"sadness": 1.4, "optimism": 1.2},
        "foreign": {"sadness": 1.3, "joy": 1.1},
        "documentary": {"sadness": 1.3, "fear": 1.1},
        "animation": {"joy": 1.4, "optimism": 1.3},
        "music": {"joy": 1.5, "optimism": 1.4},
        "school": {"joy": 1.3, "anticipation": 1.3},
        "parody": {"joy": 1.3, "surprise": 1.3},
        "family": {"joy": 1.5, "optimism": 1.3, "sadness": 1.1},
        "sports": {"anticipation": 1.8, "joy": 1.4, "optimism": 1.3},
        "game": {"anticipation": 1.5, "joy": 1.3, "surprise": 1.2},
        "western": {"anger": 1.3, "sadness": 1.2},
    }

    for g, emo_map in mapping.items():
        if g in mlb_genre.classes_:
            gi = list(mlb_genre.classes_).index(g)
            for e, v in emo_map.items():
                if e in mlb_emotion.classes_:
                    ei = list(mlb_emotion.classes_).index(e)
                    base[gi, ei] = v
    return base


genre_matrix = genre_emotion_influence()


# === PREDICTION (Enhanced Confidence Scaling Version) ===
def predict_emotion_genre(review, genres):
    clean = clean_text(review)
    genres_list = [g.strip().lower() for g in (genres if isinstance(genres, list) else [genres]) if g.strip()]
    valid_genres = [g for g in genres_list if g in mlb_genre.classes_]

    # Sentiment prediction fusion
    try:
        log_prob = logreg_sent.predict_proba([clean])[0][1]
    except Exception:
        log_prob = 0.5
    try:
        svm_val = float(np.asarray(svm_sent.decision_function([clean])).ravel()[0])
        svm_prob = sigmoid(svm_val)
    except Exception:
        svm_prob = 0.5
    sent_score = (log_prob + svm_prob) / 2
    sentiment = "Positive" if sent_score >= 0.5 else "Negative"

    # TF-IDF + Genre features
    X_text = tfidf.transform([clean])
    X_genre = mlb_genre.transform([valid_genres]) if valid_genres else csr_matrix((1, len(mlb_genre.classes_)))
    X_combined = hstack([X_text, X_genre])
    try:
        X_scaled = scaler.transform(X_combined)
    except Exception:
        X_scaled = X_combined

    # Handle OneVsRestClassifier correctly
    try:
        raw = np.column_stack([est.decision_function(X_scaled) for est in emotion_model.estimators_])
    except Exception:
        raw = np.zeros((1, len(mlb_emotion.classes_)))

    # Convert raw → probability (temperature softmax)
    temperature = 1.2
    probas_text = softmax(raw / temperature, axis=1).flatten()

    # Apply genre influence fusion
    if genre_matrix is not None and valid_genres:
        idx = [list(mlb_genre.classes_).index(g) for g in valid_genres]
        influence = np.mean(genre_matrix[idx, :], axis=0)
        influence = np.log1p(influence)
        influence = influence / np.max(influence)
        genre_weight = np.clip(1 + (0.25 * len(valid_genres)), 1.0, 1.6)
        fused = probas_text * (influence ** genre_weight)
    else:
        fused = probas_text

    # === Enhanced Confidence Scaling ===
    fused = fused / fused.max()
    fused = np.power(fused, 1.8)  # perbesar kontras
    fused = fused / fused.max()
    fused = np.clip(fused, 0.05, 1.0)
    fused = np.round(fused, 3)

    emo_names = list(mlb_emotion.classes_)
    emos = sorted(
        [{"Emotion": emotion_labels.get(n, n.title()), "Score": float(p)} for n, p in zip(emo_names, fused)],
        key=lambda x: x["Score"], reverse=True
    )[:4]

    top_emo = [e["Emotion"] for e in emos[:2]]
    summary = (
        f"This review is detected as {sentiment}, "
        f"with dominant emotions: {', '.join(top_emo)}. "
        f"Genre(s) {', '.join(genres_list)} automatically influence emotional interpretation."
    )

    return {
        "Review": review,
        "Genre": genres_list,
        "Sentiment": sentiment,
        "Emotions": emos,
        "Summary": summary,
    }


# === ROUTES ===
@app.route("/")
def home():
    if os.path.exists(app.static_folder):
        return send_from_directory(app.static_folder, "index.html")
    return jsonify({"message": "Emotion Analysis API running."})


@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json() or {}
    review = data.get("review", "")
    genres = data.get("genres", [])
    if not review:
        return jsonify({"error": "Harap kirim 'review'."}), 400
    return jsonify(predict_emotion_genre(review, genres))


if __name__ == "__main__":
    print("Running — Multi-Emotion Fusion v5 (Enhanced Confidence Scaling & Full Genre Support)")
    app.run(host="0.0.0.0", port=5000, debug=True)