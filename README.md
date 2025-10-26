EMOTION APP - Full package (Frontend + Backend)
===============================================
Saya sudah menyiapkan project lengkap: backend (Flask) dan frontend (React + Tailwind).
Folder 'backend' berisi server Flask; folder 'frontend' berisi React app yang elegan.

Langkah cepat untuk mencoba di lokal:
------------------------------------
1) Backend:
   - Buka terminal, pindah ke folder backend:
     cd emotion_app/backend
   - Buat venv & aktifkan, lalu install:
     python -m venv venv
     source venv/bin/activate   # Mac/Linux
     venv\Scripts\activate    # Windows
     pip install -r requirements.txt
   - Salin semua file .pkl model ke folder backend/models
   - Jalankan:
     python app.py
   - Backend akan jalan di http://localhost:5000

2) Frontend:
   - Buka terminal baru, pindah ke folder frontend:
     cd emotion_app/frontend
   - Install dependensi:
     npm install
   - Jalankan dev server:
     npm run dev
   - Buka alamat yang diberikan oleh Vite (biasanya http://localhost:5173)

3) Ketika backend & frontend jalan, buka UI dan coba submit review.
   Jika model belum tersedia, server akan mengembalikan 'dummy response' agar UI bisa tetap diuji.

Catatan penting:
- Untuk deploy production, build frontend (npm run build) lalu letakkan hasil build (folder dist) agar backend bisa serve static files, atau deploy frontend ke Vercel dan backend ke Render/Railway.
- Saya membuat tampilan UI yang rapi, modern, dan enak dilihat, namun kamu boleh tweak warna dan layout di file 'frontend/src/index.css' dan komponen React.
