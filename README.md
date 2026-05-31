# Frostxa Fullstack Dashboard

Aplikasi full-stack berbahasa Indonesia dengan login, dashboard, dan CRUD data. Aplikasi dibuat tanpa dependency eksternal agar mudah dijalankan di lingkungan apa pun: frontend memakai HTML/CSS/JavaScript modern, backend memakai Node.js HTTP server, dan database memakai file JSON lokal sebagai embedded document database.

## Fitur

- Login dan registrasi pengguna dengan token bertanda tangan HMAC.
- Dashboard admin responsif dengan statistik ringkas.
- CRUD data lengkap: tambah, lihat, edit, dan hapus.
- Validasi input di backend.
- Database lokal di `data/database.json` yang otomatis dibuat saat aplikasi berjalan atau saat seed.
- UI modern bernuansa 3D/glassmorphism dan seluruh teks utama berbahasa Indonesia.

## Teknologi

- Frontend: HTML, CSS, JavaScript modular.
- Backend: Node.js built-in `http`, `crypto`, dan `fs`.
- Database rekomendasi untuk demo lokal: JSON file database karena tidak butuh instalasi tambahan.
- Rekomendasi produksi: migrasikan layer `server/database.js` ke PostgreSQL agar mendukung transaksi multi-user skala besar.

## Menjalankan aplikasi

1. Siapkan data demo:

   ```bash
   npm run db:seed
   ```

2. Jalankan aplikasi:

   ```bash
   npm run dev
   ```

3. Buka aplikasi di `http://localhost:4000`.

## Akun demo

- Email: `admin@frostxa.local`
- Password: `admin123`

## Testing

```bash
npm test
```
