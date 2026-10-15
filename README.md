# ApiPass AI Studio (eksperimen)

Dashboard responsif dengan tema Neon/Sunset/Terminal/Ocean/Studio untuk mengetes menu Suno dan Kling menggunakan API key ApiPass sendiri.

## Deploy ke Vercel
1. Upload isi folder project ini ke repository GitHub.
2. Import repository di Vercel dan deploy dengan default settings (Node.js).
3. Buka URL deployment, tempel API key ApiPass di kolom API key.
4. Pilih menu Suno atau Kling, isi prompt atau URL media publik, lalu jalankan.

## Menu tersedia
- Suno: Generate Music, Generate Lyrics, Cover Generate, Extend Song, Upload & Extend via public URL, Separate Vocals.
- Kling: Kling v3 Text-to-Video, Kling 2.6 Image-to-Video, menu eksperimen URL reference.
- Cek status task memakai taskId.

## Penting
- Versi tes ini menggunakan URL media publik, belum mengunggah file langsung dari galeri.
- Endpoint backend meneruskan API key ke ApiPass tanpa menyimpan key ke file atau localStorage. Jangan masukkan key di website yang tidak lo percaya.
- Parameter tiap model dapat berbeda mengikuti dokumentasi ApiPass yang aktif. Jika model tertentu menolak request, cek respons API mentah dan cocokkan field di halaman model ApiPass.
- Untuk aplikasi produksi, tambahkan autentikasi/rate limit pada endpoint backend sebelum membagikan URL website.


## Diagnostik HTTP 429
Versi ini menandai respons error yang datang dari ApiPass dengan `source: "ApiPass"`,
`upstreamStatus`, `details`, dan header `Retry-After` bila tersedia. API key tidak
ditulis ke log atau dikembalikan ke browser. Jika respons menunjukkan 429 dari ApiPass,
tunggu sesuai `Retry-After` (jika ada), periksa batas penggunaan/kuota akun ApiPass,
dan hindari menekan tombol berulang kali. Kode website tidak dapat melewati rate limit
yang diterapkan oleh layanan upstream.


## Penanganan kredit tidak cukup
Jika ApiPass mengembalikan `Insufficient credit`, server menandai respons dengan
`errorType: INSUFFICIENT_CREDIT` dan UI menampilkan pesan khusus. Ini hanya memperjelas
diagnostik; kredit tidak dapat ditambah atau batas kredit dilewati oleh kode website.
Periksa harga model dan isi ulang kredit ApiPass bila ingin menjalankan model tersebut.


## UI hasil generate
Panel Task ID dan tombol cek manual dihapus. Setelah task dibuat, halaman mengecek status secara otomatis lalu menampilkan gambar, audio, atau video langsung dengan kontrol putar dan tombol unduh. Detail respons hanya ditampilkan ketika terjadi error.


## Suno Upload Cover (Image2URL)

Menu **Cover Generate** memakai model ID `suno/upload-cover` sesuai dokumentasi ApiPass. Upload audio ke Image2URL lalu tempel direct URL MP3 pada kolom URL audio sumber. Link harus publik/tidak memerlukan login, format yang didukung MP3/WAV/OGG/M4A/FLAC, ukuran maksimum 50 MB. Dengan `customMode` aktif, isi `style` dan `title`. Status task dicek melalui endpoint `recordInfo` yang sudah digunakan oleh `/api/status`.

Untuk model `suno/upload-cover`, proxy hanya mengirim `model` dan `input` sesuai contoh dokumentasi; parameter `channel` tidak ditambahkan.
