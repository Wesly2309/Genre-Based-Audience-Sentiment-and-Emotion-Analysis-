Instruksi singkat backend (Flask)
=================================
1. Salin semua file model (.pkl) ke folder backend/models.
   Nama file yang diharapkan:
   - logreg_sentiment.pkl
   - svm_sentiment.pkl
   - logreg_emotion_genre.pkl
   - tfidf_emotion.pkl
   - mlb_genres.pkl
   - mlb_emotions.pkl
   - scaler_maxabs.pkl

2. Buat virtual environment:
   python -m venv venv
   source venv/bin/activate   # mac/linux
   venv\Scripts\activate    # windows

3. Install dependency:
   pip install -r requirements.txt

4. Jalankan server:
   python app.py

5. API endpoint:
   POST http://localhost:5000/predict
   Body (JSON):
   {
     "review": "Teks review film di sini",
     "genres": ["drama", "thriller"]
   }
