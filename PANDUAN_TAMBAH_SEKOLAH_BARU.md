# 🚀 Panduan Ringkas Menambah Sekolah Baru (Sistem Multi-Tenant)

Karena kita sudah menggunakan sistem arsitektur **SaaS Multi-Tenant** (1 kode sumber untuk banyak sekolah), Bapak tidak perlu lagi mengunggah file HTML/PHP atau membuat folder baru setiap kali ada sekolah yang ingin bergabung. 

Berikut adalah 4 langkah kilat untuk membuat aplikasi absensi menyala untuk sekolah baru (misalnya SDN 3).

---

## 🛠️ Langkah 1: Buat Database Baru
1. Login ke **hPanel Hostinger**.
2. Masuk ke menu **Database Management** (Manajemen Database).
3. Buat database MySQL baru.
   - Nama Database: `sdn3` *(nanti akan otomatis menjadi `u696975859_sdn3`)*
   - Username: `sdn3` *(nanti akan otomatis menjadi `u696975859_sdn3`)*
   - Password: Buat password yang kuat dan catat baik-baik.
4. Klik **Create** (Buat).

> **Aturan Wajib Multi-Tenant:**
> Nama database yang dibuat (setelah prefix) **WAJIB** sama persis dengan nama subdomain yang akan dibuat nanti. Jika nama subdomain adalah `sdn3`, maka nama database harus diakhiri dengan `_sdn3`.

## 📥 Langkah 2: Import Struktur Tabel Kosong
1. Masih di Hostinger, klik tombol **Enter phpMyAdmin** di sebelah database `sdn3` yang baru Bapak buat.
2. Klik menu **Import** (Impor) di bagian atas.
3. Klik **Choose File** (Pilih File).
4. Pilih file bernama `database.sql` yang ada di laptop Bapak (berada di dalam folder `backend-php`).
5. Scroll ke paling bawah dan klik **Go** (Kirim).
*(Sekarang database sdn3 sudah punya struktur tabel yang siap diisi data).*

## 🌐 Langkah 3: Buat Subdomain
1. Kembali ke hPanel Hostinger, buka menu **Domains** -> **Subdomains**.
2. Masukkan nama subdomain: `sdn3`
3. Centang kotak warna ungu: **"Custom folder untuk subdomain"**.
4. **TOMBOL RAHASIA:** Centang kotak di bawahnya yang berbunyi **"Gunakan direktori public_html"**. 
   *(Ini sangat krusial! Tujuannya agar subdomain `sdn3` meminjam file kode dari folder utama `public_html`, sehingga Bapak tidak perlu upload file lagi).*
5. Klik **Create** (Buat).
*(Dalam 1 menit, subdomain akan aktif. Kadang butuh waktu hingga 15 menit agar gembok SSL HTTPS menyala).*

## 🔄 Langkah 4: Tarik Data Lama (Migrasi)
*Langkah ini hanya dilakukan jika SDN 3 sudah punya data absensi lama di Google Sheet.*
1. Buka tab baru di browser Google Chrome Bapak.
2. Ketikkan URL rahasia ini:
   `http://sdn3.absensikula.online/backend-php/migrate.php?old_api=LINK_GOOGLE_SCRIPT_SDN_3_DISINI`
3. Tekan **Enter**.
4. Tunggu beberapa detik sampai muncul tulisan JSON: `{"success":true,"message":"Migrasi Selesai! Berhasil memindahkan: ..."}`

## 🎉 Langkah 5: Login & Ganti Nama Sekolah
1. Minta Admin SDN 3 untuk membuka web mereka: `https://sdn3.absensikula.online`
2. Login menggunakan username dan password Admin.
3. Masuk ke menu **Pengaturan**.
4. Ubah **Nama Sekolah** menjadi "SDN 3 Banda Aceh" dan upload logo sekolah mereka.
5. Klik Simpan. (Halaman Login mereka akan otomatis berubah menyapa dengan nama SDN 3).

---
> **Cara Update Aplikasi ke Depannya:**
> Jika Bapak ingin menambahkan fitur baru, memperbaiki bug, atau mengganti warna, Bapak cukup mengeditnya di VS Code lalu klik **Commit & Push** di Github Desktop. 
> Perubahan tersebut akan **OTOMATIS** diterapkan ke SDN 1, SDN 2, SDN 3, dan ke-15 sekolah lainnya dalam hitungan detik secara serentak! Inilah keajaiban sistem Multi-Tenant.
