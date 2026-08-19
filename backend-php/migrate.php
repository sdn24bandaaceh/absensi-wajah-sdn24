<?php
// Script Migrasi Otomatis dari Google Apps Script ke MySQL (One-Click Migration)
// Dibuat oleh Antigravity

header('Content-Type: application/json');
require_once 'db.php'; // Menggunakan koneksi database yang sudah ada

// 1. Ambil URL Google Script Lama dari Parameter
$oldApiUrl = $_GET['old_api'] ?? '';

if (empty($oldApiUrl)) {
    echo json_encode(['success' => false, 'message' => 'Masukkan parameter ?old_api=URL_GOOGLE_SCRIPT_ANDA']);
    exit;
}

try {
    // 2. Ambil data JSON dari Google Apps Script menggunakan cURL (lebih kuat menembus blokir)
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $oldApiUrl . '?action=getDatabase');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true); // Ikuti redirect Google
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'); // Samarkan sebagai browser
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    $jsonResponse = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if (!$jsonResponse || $httpCode !== 200) {
        throw new Exception("Gagal mengambil data dari Google Sheets. HTTP Code: $httpCode. Pastikan URL benar.");
    }

    $data = json_decode($jsonResponse, true);
    
    // Sesuaikan dengan format JSON dari Google Apps Script (apakah langsung array atau dibungkus dalam 'data')
    $actualData = isset($data['data']) ? $data['data'] : $data;

    if (!$actualData || !isset($actualData['users'])) {
        $jsonError = json_last_error_msg();
        $preview = substr($jsonResponse, 0, 200);
        throw new Exception("Struktur JSON tidak sesuai (Error: $jsonError). Respons dari Google: " . htmlspecialchars($preview));
    }

    $users = $actualData['users'] ?? [];
    $attendance = $actualData['attendance'] ?? [];
    $permits = $actualData['permits'] ?? [];

    $pdo->beginTransaction();

    // 3. Migrasi Users
    $stmtUser = $pdo->prepare("INSERT IGNORE INTO users (foto, nama, nip, pangkat, jabatan, status, username, password, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $userCount = 0;
    foreach ($users as $u) {
        if ($u['username'] == 'admin' || $u['username'] == 'superadmin') continue; // Skip default admin
        $stmtUser->execute([
            $u['foto'] ?? '',
            $u['nama'] ?? '',
            $u['nip'] ?? '-',
            $u['pangkat'] ?? '-',
            $u['jabatan'] ?? '-',
            $u['status'] ?? 'Aktif',
            $u['username'],
            $u['password'],
            $u['role'] ?? 'peserta'
        ]);
        $userCount++;
    }

    // 4. Migrasi Attendance
    $stmtAbsen = $pdo->prepare("INSERT INTO attendance (timestamp, username, nama, status, keterangan, jarak, photo) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $absenCount = 0;
    foreach ($attendance as $a) {
        // Skip base64 foto lama agar database tidak bengkak
        $photoUrl = $a['photo'] ?? '';
        if (strpos($photoUrl, 'data:image') !== false) {
            $photoUrl = ''; // Kosongkan foto lama untuk menghemat space (ratusan MB)
        }

        $stmtAbsen->execute([
            $a['timestamp'],
            $a['username'],
            $a['nama'],
            $a['status'],
            $a['keterangan'] ?? '',
            $a['jarak'] ?? '-',
            $photoUrl
        ]);
        $absenCount++;
    }

    // 5. Migrasi Permits (Izin)
    $stmtIzin = $pdo->prepare("INSERT INTO permits (username, nama, tipe, tanggal_mulai, tanggal_selesai, alasan, status_persetujuan) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $izinCount = 0;
    foreach ($permits as $p) {
        $stmtIzin->execute([
            $p['username'],
            $p['nama'],
            $p['tipe'] ?? 'Izin',
            $p['tanggalMulai'] ?? '',
            $p['tanggalSelesai'] ?? '',
            $p['alasan'] ?? '',
            $p['statusPersetujuan'] ?? 'Menunggu Persetujuan'
        ]);
        $izinCount++;
    }

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => "Migrasi Selesai! Berhasil memindahkan: $userCount Pegawai, $absenCount Riwayat Absen, dan $izinCount Riwayat Izin."
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
