# Catatan Revisi & Pembaruan Aplikasi Absensi Wajah

Dokumen ini berisi daftar perubahan, perbaikan *bug*, dan penambahan fitur yang dilakukan pada aplikasi. Catatan ini dibuat agar riwayat perubahan lebih mudah dilacak dan dipahami di kemudian hari.

---

## [21 Juli 2026] - Revisi Audit Aksesibilitas, UI, dan Keamanan

### 1. Perbaikan Tata Letak Mobile (Responsivitas UI)
*   **Masalah:** Saat tombol menu sidebar (garis tiga) ditekan melalui layar *smartphone*, halaman utama bergeser terlalu jauh ke samping (280px) sehingga layar menjadi *error* dan menimbulkan *scroll* menyamping.
*   **File yang diubah:** `assets/css/dashboard.css`
*   **Solusi:** Menghapus aturan CSS `margin-left: 280px` pada bagian `@media (max-width: 991.98px)`. Saat ini, sidebar akan muncul mengambang (*overlay*) di atas konten utama tanpa merusak tata letak layar HP.

### 2. Perbaikan Celah Keamanan Halaman Admin (Bug Logic)
*   **Masalah:** Halaman khusus admin (seperti `pegawai.html`, `pengaturan.html`) diproteksi di sisi-klien menggunakan fungsi `endsWith()`. Hal ini menimbulkan celah di mana akun biasa dapat meretas perlindungan ini dengan menambahkan parameter asal di akhir tautan (misalnya: `pegawai.html?admin=true`).
*   **File yang diubah:** `assets/js/dashboard.js`
*   **Solusi:** Merombak fungsi `restrictAdminPages()`. Kode sekarang difilter menggunakan `split('/').pop()` yang secara spesifik akan mengambil dan memverifikasi nama asli dari file HTML tersebut, sehingga parameter URL apapapun tidak akan mampu menembus blokade.

### 3. Peningkatan Standar Aksesibilitas (a11y)
*   **Masalah:** Beberapa tombol interaktif di *header* tidak memiliki teks penjelas (hanya berupa lambang atau ikon). Hal ini membuat aplikasi kurang bersahabat bagi penyandang disabilitas yang harus menggunakan *Screen Reader* (pembaca layar otomatis).
*   **File yang diubah:** `dashboard.html` & `absensi.html`
*   **Solusi:** 
    * Menambahkan atribut `aria-label="Tampilkan Sidebar"` pada tombol pembuka menu utama.
    * Menambahkan atribut `aria-label="Ubah Tema"` pada tombol mode gelap/terang.
    * Menambahkan `aria-hidden="true"` pada ikon-ikon dekorasi (logo Bootstrap Icons) agar pembaca layar mengabaikannya dan tidak menimbulkan suara *error* atau berisik pada pengguna.

### 4. Perbaikan Bug Geofencing (Tombol Absen Tetap Aktif)
*   **Masalah:** Pada saat pemindaian wajah, meskipun pengguna berada di luar radius sekolah yang diizinkan (Geofencing), tombol **Absen Masuk** dan **Absen Pulang** tetap menyala hijau dan bisa ditekan. Terkadang membingungkan karena tidak ada indikasi yang jelas pada tombol.
*   **File yang diubah:** `assets/js/absensi.js`
*   **Solusi:** Memodifikasi fungsi `checkReadyState()` agar menghitung kembali jarak. Jika berada di luar radius (`distance > maxRadius`), tombol akan dimatikan (disabled), diubah warnanya menjadi abu-abu, dan label tombolnya akan diubah secara dinamis menjadi peringatan **"Di Luar Area Sekolah"**. Ditambahkan pula pengaman sekunder pada fungsi `processAbsensi()` untuk memblokir pendaftaran absen dan menampilkan pop-up gagal jika berhasil ditekan.

### 5. Mengaktifkan Widget Pengumuman dan Izin (Dashboard)
*   **Masalah:** Daftar *Pengumuman* dan *Izin Menunggu Persetujuan* pada halaman *Dashboard* masih menggunakan tampilan sementara (statis) dan tidak menampilkan data asli.
*   **File yang diubah:** `Code.gs`, `dashboard.html`, `assets/js/dashboard.js`
*   **Solusi:** Menambahkan fungsi untuk memuat data pengumuman (`ANNOUNCEMENTS`) secara dinamis dari pengaturan (*Settings*) *database* Google Sheets. Selain itu, mengubah tampilan daftar *Izin Menunggu Persetujuan* agar otomatis memfilter dan menampilkan data pengajuan izin dari para pegawai yang berstatus **"Menunggu Persetujuan"**. Kini keduanya berfungsi secara nyata.

### 6. Fitur Persetujuan Izin (Approve/Reject) oleh Admin
*   **Masalah:** Tombol "Review" pada Dashboard salah arah (menuju ke halaman cetak Laporan). Sistem juga tidak memiliki fungsi yang nyata bagi Admin untuk menyetujui atau menolak permohonan izin.
*   **File yang diubah:** `Code.gs`, `assets/js/dashboard.js`, `assets/js/izin.js`
*   **Solusi:** Mengarahkan ulang tombol "Review" di Dashboard agar menuju ke halaman `izin.html`. Halaman `izin.html` dimodifikasi agar berfungsi ganda:
    *   Jika yang membuka adalah **Pegawai**, tabel hanya menampilkan status pengajuan (Menunggu/Disetujui/Ditolak).
    *   Jika yang membuka adalah **Admin**, tabel akan memunculkan tombol aksi **Setujui** (Hijau) dan **Tolak** (Merah) di samping setiap izin yang masih berstatus menunggu. Admin dapat langsung mengklik tombol tersebut dan sistem akan memperbarui *database* (melalui *endpoint* baru `updatePermitStatus`).

### 7. Fitur Deteksi Lokasi Otomatis (Pengaturan Geofencing)
*   **Masalah:** Mengisi koordinat sekolah secara manual (menggeser pin atau mengetik angka) dirasa kurang praktis bagi admin yang sedang berada di lokasi sekolah tersebut.
*   **File yang diubah:** `geofencing.html`, `assets/js/geofence.js`
*   **Solusi:** Menambahkan tombol sekunder **"Dapatkan Lokasi Sekarang"** tepat di atas tombol *Simpan Pengaturan*. Tombol ini akan otomatis meminta akses GPS *browser*, membaca koordinat lokasi Admin saat ini, mengisinya ke kolom Latitude/Longitude, serta menggeser posisi peta (*map*) ke lokasi tersebut seketika.

### 8. Papan Ringkasan Kehadiran Harian (Dashboard)
*   **Masalah:** Grafik Kehadiran Mingguan yang menggunakan garis dinilai kurang informatif untuk pemantauan *real-time* setiap pagi.
*   **File yang diubah:** `dashboard.html`, `assets/js/dashboard.js`
*   **Solusi:** Mengganti secara total kanvas grafik tersebut dengan 4 daftar interaktif (Grid List) bernama **Ringkasan Kehadiran Hari Ini**:
    1.  **Hadir Tepat Waktu:** Menampilkan seluruh pegawai yang sudah absen masuk. 5 pegawai yang melakukan absen paling pagi otomatis mendapatkan *badge* **Top (Ikon Medali)** sebagai bentuk apresiasi (gamifikasi).
    2.  **Terlambat:** Menampilkan pegawai yang jam kedatangannya melewati batas toleransi.
    3.  **Izin / Cuti:** Menampilkan mereka yang sedang menjalani masa izin/cuti khusus pada hari ini saja (berdasarkan rentang tanggal izin).
    4.  **Belum Absen:** Sistem secara otomatis menyilangkan data seluruh pegawai dengan data kehadiran dan izin. Jika ada yang tersisa (tidak hadir dan tidak izin), mereka akan dimasukkan ke daftar Belum Absen/Alpa.

### 9. Menu Riwayat Absensi Khusus Pegawai (Sisi User) & Laporan Kalender Penuh
*   **Masalah:** Pegawai tidak memiliki akses langsung untuk melihat riwayat kehadiran mereka sendiri. Format cetakan sebelumnya juga hanya menampilkan hari saat pegawai absen (tidak berurutan secara kalender penuh).
*   **File yang dibuat/diubah:** `riwayat.html`, `assets/js/riwayat.js`, penyisipan navigasi di seluruh halaman utama.
*   **Solusi:** 
    *   Membuat halaman khusus **Riwayat Absensi** di bawah Modul Absensi yang hanya menampilkan data milik pegawai yang *login*.
    *   Sistem tabel dan cetak PDF kini berubah menjadi **Laporan Kalender Penuh**. Sistem akan meng-*generate* seluruh tanggal dari tanggal 1 sampai akhir bulan.
    *   Sistem melakukan pengecekan berjenjang untuk mendeteksi status per hari: Cek Kehadiran $\rightarrow$ Cek Hari Libur $\rightarrow$ Cek Libur Akhir Pekan (Minggu) $\rightarrow$ Cek Pengajuan Izin/Cuti (Disetujui) $\rightarrow$ Jika tidak ada, di-set sebagai **Alpa / Tidak Hadir**.
    *   Menambahkan kolom **Hari** pada tabel *web* maupun tabel unduhan PDF. Hasil cetak PDF diformat menyerupai surat resmi dengan ruang tanda tangan untuk Kepala Sekolah di sudut kanan bawah.

### 10. Pemisahan Kolom Waktu Absensi (Masuk & Pulang)
*   **Masalah:** Format laporan sebelumnya menggabungkan seluruh aktivitas absen (masuk/pulang) dalam satu kolom secara berderet ke bawah per hari, sehingga tabel menjadi terlalu panjang.
*   **File yang diubah:** `riwayat.html`, `assets/js/riwayat.js`
*   **Solusi:** Merombak struktur generator tabel agar memisahkan waktu absen menjadi dua kolom spesifik: **Absen Masuk** dan **Absen Pulang**. Keterangan status seperti "Hari Libur" atau "Izin/Cuti" akan dicetak melebar membentangi kedua kolom waktu tersebut, membuat laporan menjadi sangat rapi (satu baris per tanggal).
