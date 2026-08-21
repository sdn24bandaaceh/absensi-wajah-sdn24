<?php
// api.php - Endpoint Utama Sistem Absensi Wajah

// Konfigurasi CORS agar bisa diakses dari PWA/Vercel
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'db.php';

// Helper function untuk menyimpan foto base64
function saveBase64File($base64String, $prefix, $folder) {
    if (!$base64String || strpos($base64String, 'data:') === false) {
        return ""; // Jika bukan base64, kembalikan kosong atau string aslinya jika itu URL
    }
    if (strpos($base64String, 'http') === 0) {
        return $base64String; // Sudah berupa URL
    }
    
    $uploadDir = __DIR__ . '/uploads/' . $folder . '/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }
    
    $parts = explode(',', $base64String);
    if (count($parts) < 2) return "";
    
    $data = base64_decode($parts[1]);
    
    // Mendapatkan ekstensi dari mime type
    $mime = explode(';', explode(':', $parts[0])[1])[0];
    $ext = '.jpg';
    if ($mime == 'image/png') $ext = '.png';
    else if ($mime == 'application/pdf') $ext = '.pdf';
    
    $fileName = $prefix . '_' . time() . '_' . uniqid() . $ext;
    $filePath = $uploadDir . $fileName;
    
    if (file_put_contents($filePath, $data)) {
        // Mengembalikan relative URL
        // Sesuaikan dengan nama domain Anda saat live (misal: https://api.domain.com/uploads/...)
        return 'uploads/' . $folder . '/' . $fileName;
    }
    return "";
}

// Helper untuk format API response
function jsonResponse($success, $message, $data = null) {
    $resp = ['success' => $success, 'message' => $message];
    if ($data !== null) $resp['data'] = $data;
    echo json_encode($resp);
    exit;
}

// Parsing action dari GET atau POST
$action = isset($_GET['action']) ? $_GET['action'] : '';
$payload = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $json = file_get_contents('php://input');
    $payload = json_decode($json, true);
    if (isset($payload['action'])) {
        $action = $payload['action'];
    }
}

try {
    switch ($action) {
        // ==========================================
        // 1. GET DATABASE (SINKRONISASI AWAL)
        // ==========================================
        case 'getDatabase':
            // Ambil semua users
            $stmt = $pdo->query("SELECT * FROM users");
            $users = $stmt->fetchAll();
            
            // Hapus data absensi corrupt (tanpa timestamp) yang menyebabkan dashboard crash
            $pdo->query("DELETE FROM attendance WHERE timestamp IS NULL OR timestamp = '' OR timestamp = '0000-00-00 00:00:00'");
            
            // Ambil absensi (dibatasi 30 hari terakhir agar sangat ringan!)
            $stmt = $pdo->query("SELECT * FROM attendance ORDER BY id DESC LIMIT 5000");
            $attendance = $stmt->fetchAll();
            
            // Normalisasi format timestamp ke Y-m-d\TH:i:s untuk kompatibilitas frontend lama
            foreach ($attendance as &$a) {
                if (preg_match('/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}:\d{2}:\d{2})$/', $a['timestamp'], $m)) {
                    $a['timestamp'] = $m[3] . '-' . $m[2] . '-' . $m[1] . 'T' . $m[4];
                } else if (preg_match('/^(\d{4})-(\d{2})-(\d{2}) (\d{2}:\d{2}:\d{2})$/', $a['timestamp'], $m)) {
                    $a['timestamp'] = $m[1] . '-' . $m[2] . '-' . $m[3] . 'T' . $m[4];
                }
            }
            
            // Hapus data izin corrupt (tanpa tanggal mulai/selesai atau 0000-00-00)
            $pdo->query("DELETE FROM permits WHERE tanggal_mulai IS NULL OR tanggal_mulai = '' OR tanggal_mulai = '0000-00-00' OR tanggal_selesai IS NULL OR tanggal_selesai = '' OR tanggal_selesai = '0000-00-00'");
            
            // Ambil izin
            $stmt = $pdo->query("SELECT * FROM permits ORDER BY id DESC");
            $permits = $stmt->fetchAll();
            
            // Kompatibilitas frontend: copy status_persetujuan ke status
            foreach ($permits as &$p) {
                if (isset($p['status_persetujuan'])) {
                    $p['status'] = $p['status_persetujuan'];
                }
                
                // Bersihkan format migrasi lama (seperti 2026-08-05T17:00:00.000Z) agar jadi YYYY-MM-DD
                if (!empty($p['tanggal_mulai']) && strpos($p['tanggal_mulai'], 'T') !== false) {
                    $p['tanggal_mulai'] = explode('T', $p['tanggal_mulai'])[0];
                }
                if (!empty($p['tanggal_selesai']) && strpos($p['tanggal_selesai'], 'T') !== false) {
                    $p['tanggal_selesai'] = explode('T', $p['tanggal_selesai'])[0];
                }
                
                if (isset($p['tanggal_mulai'])) {
                    $p['tanggalMulai'] = $p['tanggal_mulai'];
                }
                if (isset($p['tanggal_selesai'])) {
                    $p['tanggalSelesai'] = $p['tanggal_selesai'];
                }
                if (isset($p['tanggal_pengajuan'])) {
                    $p['tanggalPengajuan'] = $p['tanggal_pengajuan'];
                }
                if (isset($p['file_data'])) {
                    $p['fileData'] = $p['file_data'];
                }
                if (isset($p['file_name'])) {
                    $p['fileName'] = $p['file_name'];
                }
            }
            
            // Ambil settings dan ubah jadi key-value pair
            $stmt = $pdo->query("SELECT * FROM settings");
            $settingsData = $stmt->fetchAll();
            $settings = [];
            foreach ($settingsData as $row) {
                $settings[$row['key_name']] = $row['value'];
            }
            
            // Ambil tugas luar
            $stmt = $pdo->query("SELECT * FROM tugas_luar ORDER BY id DESC");
            $tugasLuarData = $stmt->fetchAll();
            $tugasLuar = [];
            foreach ($tugasLuarData as $row) {
                if (isset($row['nama_tugas'])) $row['namaTugas'] = $row['nama_tugas'];
                if (isset($row['tanggal_mulai'])) $row['tanggalMulai'] = $row['tanggal_mulai'];
                if (isset($row['tanggal_selesai'])) $row['tanggalSelesai'] = $row['tanggal_selesai'];
                
                $row['pegawai'] = $row['pegawai'] ? explode(',', $row['pegawai']) : [];
                $tugasLuar[] = $row;
            }
            
            jsonResponse(true, "Database berhasil dimuat", [
                'users' => $users,
                'attendance' => $attendance,
                'permits' => $permits,
                'settings' => $settings,
                'tugasLuar' => $tugasLuar
            ]);
            break;

        // ==========================================
        // 2. LOGIN AUTENTIKASI
        // ==========================================
        case 'login':
            $username = isset($_GET['username']) ? $_GET['username'] : '';
            $password = isset($_GET['password']) ? $_GET['password'] : '';
            
            if (!$username || !$password) {
                jsonResponse(false, "Username dan password diperlukan");
            }
            
            $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? AND password = ?");
            $stmt->execute([$username, $password]);
            $user = $stmt->fetch();
            
            if ($user) {
                if (strtolower($user['status']) === 'blokir' || strtolower($user['status']) === 'nonaktif') {
                    jsonResponse(false, "Akun Anda telah dinonaktifkan: " . $user['pesan_blokir']);
                }
                
                // Ambil profil sekolah
                $stmt = $pdo->query("SELECT * FROM settings");
                $settingsData = $stmt->fetchAll();
                $settings = [];
                foreach ($settingsData as $row) {
                    $settings[$row['key_name']] = $row['value'];
                }
                
                // Hapus password dari respons demi keamanan
                unset($user['password']);
                jsonResponse(true, "Login berhasil", ['user' => $user, 'schoolProfile' => $settings]);
            } else {
                jsonResponse(false, "Username atau password salah");
            }
            break;

        // ==========================================
        // 2B. GET PROFIL SEKOLAH (UNTUK HALAMAN LOGIN)
        // ==========================================
        case 'get_school_profile':
            $stmt = $pdo->query("SELECT * FROM settings");
            $settingsData = $stmt->fetchAll();
            $settings = [];
            foreach ($settingsData as $row) {
                $settings[$row['key_name']] = $row['value'];
            }
            jsonResponse(true, "Profil sekolah berhasil dimuat", $settings);
            break;

        // ==========================================
        // 3. SUBMIT ATTENDANCE (ABSENSI)
        // ==========================================
        case 'submitAttendance':
            if (!$payload) jsonResponse(false, "Payload kosong");
            
            // Generate timestamp (Server-side) dalam format standar ISO
            date_default_timezone_set('Asia/Jakarta');
            $timestamp = date('Y-m-d\TH:i:s');
            
            // Proses foto base64 menjadi file
            $photoPath = saveBase64File($payload['photo'] ?? '', 'absen_' . $payload['username'], 'absensi');
            
            // Simpan ke database
            $stmt = $pdo->prepare("INSERT INTO attendance (timestamp, username, nama, status, keterangan, jarak, photo) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $timestamp,
                $payload['username'],
                $payload['nama'],
                $payload['status'],
                $payload['keterangan'] ?? '',
                $payload['jarak'] ?? '',
                $photoPath
            ]);
            
            jsonResponse(true, "Absensi berhasil dicatat!");
            break;

        case 'manualAttendance':
            if (!$payload) jsonResponse(false, "Payload kosong");
            $date = $payload['date'];
            $time = $payload['time'];
            $timestamp = $date . 'T' . $time . ':00';
            
            // Cek apakah sudah ada (kalau forceEdit = false)
            $stmt = $pdo->prepare("SELECT id FROM attendance WHERE username = ? AND status = ? AND timestamp LIKE ?");
            $stmt->execute([$payload['username'], $payload['status'], $date . '%']);
            $existing = $stmt->fetch();
            
            if ($existing && empty($payload['forceEdit'])) {
                echo json_encode(['success' => false, 'requireConfirmation' => true, 'message' => 'Data sudah ada']);
                exit;
            }
            
            if ($existing) {
                // Update
                $stmt = $pdo->prepare("UPDATE attendance SET timestamp = ?, keterangan = ? WHERE id = ?");
                $stmt->execute([$timestamp, $payload['keterangan'] ?? 'Absen Manual', $existing['id']]);
            } else {
                // Insert
                $stmt = $pdo->prepare("INSERT INTO attendance (timestamp, username, nama, status, keterangan, jarak, photo) VALUES (?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $timestamp,
                    $payload['username'],
                    $payload['nama'],
                    $payload['status'],
                    $payload['keterangan'] ?? 'Absen Manual',
                    '-',
                    ''
                ]);
            }
            jsonResponse(true, "Absen manual berhasil disimpan");
            break;

        case 'manualAttendanceMassal':
            if (!$payload) jsonResponse(false, "Payload kosong");
            $date = $payload['date'];
            $time = $payload['time'];
            $status = $payload['status'];
            $keterangan = $payload['keterangan'] ?? 'Absen Manual';
            $timestamp = $date . 'T' . $time . ':00';
            $forceEdit = !empty($payload['forceEdit']);
            
            // Ambil semua pegawai aktif (termasuk admin agar admin juga ikut absen massal)
            $stmt = $pdo->query("SELECT * FROM users WHERE status != 'Blokir' AND status != 'Nonaktif'");
            $users = $stmt->fetchAll();
            
            $conflictCount = 0;
            
            if (!$forceEdit) {
                foreach ($users as $user) {
                    $stmt = $pdo->prepare("SELECT id FROM attendance WHERE username = ? AND status = ? AND timestamp LIKE ?");
                    $stmt->execute([$user['username'], $status, $date . '%']);
                    if ($stmt->fetch()) {
                        $conflictCount++;
                    }
                }
                
                if ($conflictCount > 0) {
                    echo json_encode(['success' => false, 'requireConfirmation' => true, 'message' => "Ada $conflictCount pegawai yang sudah absen $status. Timpa jam mereka?"]);
                    exit;
                }
            }
            
            // Eksekusi
            foreach ($users as $user) {
                $stmt = $pdo->prepare("SELECT id FROM attendance WHERE username = ? AND status = ? AND timestamp LIKE ?");
                $stmt->execute([$user['username'], $status, $date . '%']);
                $existing = $stmt->fetch();
                
                if ($existing) {
                    $stmt = $pdo->prepare("UPDATE attendance SET timestamp = ?, keterangan = ? WHERE id = ?");
                    $stmt->execute([$timestamp, $keterangan, $existing['id']]);
                } else {
                    $stmt = $pdo->prepare("INSERT INTO attendance (timestamp, username, nama, status, keterangan, jarak, photo) VALUES (?, ?, ?, ?, ?, ?, ?)");
                    $stmt->execute([
                        $timestamp,
                        $user['username'],
                        $user['nama'],
                        $status,
                        $keterangan,
                        '-',
                        ''
                    ]);
                }
            }
            jsonResponse(true, "Absen massal berhasil disimpan");
            break;

        // ==========================================
        // 4. MANAJEMEN USER (CRUD)
        // ==========================================
        case 'addUser':
            $stmt = $pdo->prepare("INSERT INTO users (nama, nip, pangkat, jabatan, status, username, password, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $payload['nama'], $payload['nip'] ?? '-', $payload['pangkat'] ?? '-',
                $payload['jabatan'] ?? '-', $payload['status'] ?? 'Aktif',
                $payload['username'], $payload['password'], $payload['role'] ?? 'peserta'
            ]);
            jsonResponse(true, "Pengguna berhasil ditambahkan");
            break;
            
        case 'updateUser':
            $stmt = $pdo->prepare("UPDATE users SET nama=?, nip=?, pangkat=?, jabatan=?, status=?, password=?, role=?, pesan_blokir=? WHERE username=?");
            $stmt->execute([
                $payload['nama'], $payload['nip'], $payload['pangkat'],
                $payload['jabatan'], $payload['status'], $payload['password'],
                $payload['role'], $payload['pesan_blokir'] ?? '',
                $payload['username']
            ]);
            jsonResponse(true, "Data pengguna berhasil diperbarui");
            break;
            
        case 'deleteUser':
            $stmt = $pdo->prepare("DELETE FROM users WHERE username=?");
            $stmt->execute([$payload['username']]);
            jsonResponse(true, "Pengguna berhasil dihapus");
            break;

        case 'importUsersMassal':
            $users = $payload['users'] ?? [];
            if (empty($users)) {
                jsonResponse(false, "Data pegawai kosong");
            }
            
            $successCount = 0;
            $failCount = 0;
            
            foreach ($users as $u) {
                // Check if user exists
                $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
                $stmt->execute([$u['username']]);
                $existing = $stmt->fetch();
                
                try {
                    if ($existing) {
                        $stmtUpdate = $pdo->prepare("UPDATE users SET nama=?, nip=?, pangkat=?, jabatan=?, status=?, password=?, role=?, pesan_blokir=? WHERE username=?");
                        $stmtUpdate->execute([
                            $u['nama'], $u['nip'], $u['pangkat'],
                            $u['jabatan'], $u['status'], $u['password'],
                            $u['role'], $u['pesanBlokir'] ?? '', $u['username']
                        ]);
                    } else {
                        $stmtInsert = $pdo->prepare("INSERT INTO users (nama, nip, pangkat, jabatan, status, username, password, role, pesan_blokir) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
                        $stmtInsert->execute([
                            $u['nama'], $u['nip'] ?? '-', $u['pangkat'] ?? '-',
                            $u['jabatan'] ?? '-', $u['status'] ?? 'Aktif', $u['username'],
                            $u['password'], $u['role'] ?? 'peserta', $u['pesanBlokir'] ?? ''
                        ]);
                    }
                    $successCount++;
                } catch(Exception $e) {
                    $failCount++;
                }
            }
            
            jsonResponse(true, "Impor selesai. Berhasil: $successCount, Gagal: $failCount");
            break;

        // ==========================================
        // 5. MANAJEMEN IZIN (PERMITS)
        // ==========================================
        case 'submitPermit':
            $filePath = saveBase64File($payload['fileData'] ?? '', 'izin_' . $payload['username'], 'permits');
            $stmt = $pdo->prepare("INSERT INTO permits (username, nama, tipe, tanggal_mulai, tanggal_selesai, alasan, status_persetujuan, file_data, file_name, tanggal_pengajuan) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $payload['username'], $payload['nama'], $payload['tipe'],
                $payload['tanggalMulai'], $payload['tanggalSelesai'], $payload['alasan'],
                'Menunggu Persetujuan', $filePath, $payload['fileName'] ?? '',
                date('Y-m-d H:i:s')
            ]);
            jsonResponse(true, "Pengajuan izin berhasil dikirim");
            break;
            
        case 'updatePermitStatus':
            $stmt = $pdo->prepare("UPDATE permits SET status_persetujuan=? WHERE id=?");
            $stmt->execute([$payload['status'], $payload['id']]);
            jsonResponse(true, "Status izin diperbarui");
            break;

        case 'deletePermit':
            $stmt = $pdo->prepare("DELETE FROM permits WHERE id=?");
            $stmt->execute([$payload['id']]);
            jsonResponse(true, "Data izin berhasil dihapus");
            break;

        // ==========================================
        // 6. MANAJEMEN TUGAS LUAR
        // ==========================================
        case 'addTugasLuar':
            $stmt = $pdo->prepare("INSERT INTO tugas_luar (nama_tugas, lat, lng, radius, tanggal_mulai, tanggal_selesai, pegawai) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $payload['namaTugas'], $payload['lat'], $payload['lng'],
                $payload['radius'], $payload['tanggalMulai'], $payload['tanggalSelesai'],
                implode(',', $payload['pegawai'] ?? [])
            ]);
            jsonResponse(true, "Tugas luar berhasil ditambahkan");
            break;
            
        case 'deleteTugasLuar':
            $stmt = $pdo->prepare("DELETE FROM tugas_luar WHERE id=?");
            $stmt->execute([$payload['id']]);
            jsonResponse(true, "Tugas luar dihapus");
            break;

        // ==========================================
        // 7. SETTINGS & PROFIL
        // ==========================================
        case 'updateSettings':
            $stmt = $pdo->prepare("INSERT INTO settings (key_name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value=?");
            foreach ($payload['settings'] as $key => $value) {
                // Untuk string, biarkan. Untuk object/array, json_encode
                $valStr = is_string($value) ? $value : json_encode($value);
                $stmt->execute([$key, $valStr, $valStr]);
            }
            jsonResponse(true, "Pengaturan berhasil disimpan");
            break;
            
        case 'updateMyProfile':
            // Khusus update profil mandiri
            $photoPath = saveBase64File($payload['photo'] ?? '', 'profil_' . $payload['username'], 'profiles');
            
            // Ambil data user lama jika tidak ada foto baru
            if (!$photoPath && isset($payload['photo']) && strpos($payload['photo'], 'uploads') !== false) {
                $photoPath = $payload['photo']; // Tetap gunakan path lama
            }
            
            $sql = "UPDATE users SET password=? ";
            $params = [$payload['password']];
            
            if ($photoPath) {
                $sql .= ", foto=? ";
                $params[] = $photoPath;
            }
            
            $sql .= " WHERE username=?";
            $params[] = $payload['username'];
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            
            jsonResponse(true, "Profil berhasil diupdate");
            break;

        // ==========================================
        // Default / Test Connection
        // ==========================================
        default:
            jsonResponse(true, "API PHP Enterprise Siap Melayani (Action not found: $action)!");
            break;
    }
} catch (Exception $e) {
    jsonResponse(false, "Terjadi kesalahan server: " . $e->getMessage());
}
?>
