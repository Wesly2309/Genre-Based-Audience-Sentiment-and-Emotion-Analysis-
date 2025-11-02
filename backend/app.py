from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import joblib, numpy as np, re, os, warnings
from scipy.special import expit as sigmoid, softmax
from scipy.sparse import hstack, csr_matrix
from collections import defaultdict, Counter

warnings.filterwarnings("ignore", category=UserWarning, module="sklearn")

# ==========================================================
#  Flask Config
# ==========================================================
app = Flask(__name__, static_folder="../frontend/dist", static_url_path="/")
CORS(app)

# ==========================================================
#  Load Models
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
    logreg_sent = svm_sent = emotion_model = tfidf = mlb_genre = mlb_emotion = scaler = None

# ==========================================================
#  Emotion Labels
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
#  Text Cleaner
# ==========================================================
def clean_text(t):
    if not t:
        return ""
    t = str(t).lower()
    t = re.sub(r"[^a-zA-Z\s]", " ", t)
    return re.sub(r"\s+", " ", t).strip()

# ==========================================================
#  Genre–Emotion Influence Matrix
# ==========================================================
def genre_emotion_influence():
    if mlb_genre is None or mlb_emotion is None:
        return None

    base = np.ones((len(mlb_genre.classes_), len(mlb_emotion.classes_)))

    mapping = {
        "Drama": {"sadness": 1.8, "anticipation": 1.2, "joy": 1.0},
        "Romance": {"joy": 2.0, "optimism": 1.7, "sadness": 1.3},
        "Comedy": {"joy": 2.3, "optimism": 1.7, "surprise": 1.4},
        "Thriller": {"anticipation": 2.4, "fear": 2.0, "surprise": 1.6},
        "Action": {"anger": 1.5, "anticipation": 2.0, "fear": 1.4, "surprise": 1.3},
        "Fantasy": {"anticipation": 2.0, "joy": 1.8, "optimism": 1.5, "surprise": 1.3},
        "Horror": {"fear": 2.6, "anticipation": 1.8, "surprise": 1.9},
        "Family": {"joy": 1.5, "optimism": 1.3, "sadness": 1.1},
        "Adventure": {"anticipation": 2.2, "joy": 1.8, "optimism": 1.3, "surprise": 1.4},
        "Crime": {"fear": 1.4, "anger": 1.4, "anticipation": 1.2},
        "Science Fiction": {"anticipation": 1.7, "surprise": 1.4, "fear": 1.2},
        "Mystery": {"anticipation": 1.7, "fear": 1.4, "surprise": 1.3},
        "Music": {"joy": 1.5, "optimism": 1.4},
        "Animation": {"joy": 1.4, "optimism": 1.3},
        "Foreign": {"sadness": 1.3, "joy": 1.1},
        "History": {"sadness": 1.4, "fear": 1.1},
        "Documentary": {"sadness": 1.3, "fear": 1.1},
        "War": {"sadness": 1.6, "anger": 1.3, "fear": 1.3},
        "TV Movie": {"joy": 1.3, "sadness": 1.1},
        "Western": {"anger": 1.3, "sadness": 1.2},
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

# ==========================================================
#  Core Prediction Function
# ==========================================================
def predict_emotion_genre(review, genres):
    clean = clean_text(review)
    genres_list = [g.strip().capitalize() for g in genres if g.strip()]
    valid_genres = [g for g in genres_list if g in mlb_genre.classes_]

    # --- Sentiment ---
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

    # --- Emotion ---
    X_text = tfidf.transform([clean])
    X_genre = mlb_genre.transform([valid_genres]) if valid_genres else csr_matrix((1, len(mlb_genre.classes_)))
    X_combined = hstack([X_text, X_genre])

    try:
        X_scaled = scaler.transform(X_combined)
    except Exception:
        X_scaled = X_combined

    try:
        raw = np.column_stack([est.decision_function(X_scaled) for est in emotion_model.estimators_])
    except Exception:
        raw = np.zeros((1, len(mlb_emotion.classes_)))

    probas_text = softmax(raw / 1.3, axis=1).flatten()

    if genre_matrix is not None and valid_genres:
        idx = [list(mlb_genre.classes_).index(g) for g in valid_genres]
        influence = np.mean(genre_matrix[idx, :], axis=0)
        influence = influence / np.max(influence)
        fused = probas_text * influence
    else:
        fused = probas_text

    fused = (fused - fused.min()) / (fused.max() - fused.min() + 1e-6)
    fused = np.round(fused, 3)

    emo_names = list(mlb_emotion.classes_)
    emos = sorted(
        [{"Emotion": emotion_labels.get(n, n.title()), "Score": float(p)} for n, p in zip(emo_names, fused)],
        key=lambda x: x["Score"], reverse=True
    )[:5]

    summary = (
        f"This review is detected as {sentiment}, with dominant emotions: "
        f"{', '.join([e['Emotion'] for e in emos[:2]])}. "
        f"Genre(s) {', '.join(genres_list)} influence emotional interpretation."
    )

    return {"Review": review, "Genre": genres_list, "Sentiment": sentiment, "Emotions": emos, "Summary": summary}

# ==========================================================
#  Prediction Endpoint
# ==========================================================
@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json() or {}
    reviews = data.get("reviews", [])
    genres = data.get("genres", [])

    if not reviews:
        return jsonify({"error": "Harap kirim minimal satu ulasan."}), 400

    results = [predict_emotion_genre(r, genres) for r in reviews]
    sentiment_counts = Counter([r["Sentiment"] for r in results])
    dominant_sentiment = "Positive" if sentiment_counts["Positive"] >= sentiment_counts["Negative"] else "Negative"

    emotion_totals = defaultdict(list)
    genre_emotion_map = defaultdict(lambda: defaultdict(list))

    for r in results:
        for emo in r["Emotions"]:
            emotion_totals[emo["Emotion"]].append(emo["Score"])
        for g in r["Genre"]:
            for emo in r["Emotions"]:
                genre_emotion_map[g][emo["Emotion"]].append(emo["Score"])

    # ===== Summary untuk chart utama =====
    overall_emotion_summary = {e: round(np.mean(scores), 3) for e, scores in emotion_totals.items() if scores}
    chart_data = [{"Emotion": e, "Score": v} for e, v in overall_emotion_summary.items()]

    # ===== Stacked Bar Chart (genre × emotion) =====
    genre_emotion_summary = []
    for g, emos in genre_emotion_map.items():
        avg = {e: round(np.mean(scores), 3) for e, scores in emos.items()}
        genre_emotion_summary.append({"genre": g, **avg})

    summary_text = (
        f"Dari {len(results)} ulasan, sentimen dominan adalah {dominant_sentiment}. "
        f"Distribusi emosi mencerminkan bagaimana ekspektasi genre memengaruhi emosi penonton."
    )

    return jsonify({
        "results": results,
        "overall_sentiment": dominant_sentiment,
        "overall_emotion_summary": overall_emotion_summary,
        "chart_data": chart_data,
        "genre_emotion_summary": genre_emotion_summary,
        "summary": summary_text,
        "Total_Reviews": len(results),
    })

# ==========================================================
#  Home
# ==========================================================
@app.route("/")
def home():
    if os.path.exists(app.static_folder):
        return send_from_directory(app.static_folder, "index.html")
    return jsonify({"message": "Running"})

# ==========================================================
#  Run Flask
# ==========================================================
if __name__ == "__main__":
    print("Running Flask backend...")
    app.run(host="0.0.0.0", port=5000, debug=True)
