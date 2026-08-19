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
            
            // Ambil absensi (dibatasi 30 hari terakhir agar sangat ringan!)
            // Ini keuntungan MySQL, kita bisa memfilter data dengan mudah.
            $stmt = $pdo->query("SELECT * FROM attendance WHERE created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY) ORDER BY timestamp DESC");
            $attendance = $stmt->fetchAll();
            
            // Ambil izin
            $stmt = $pdo->query("SELECT * FROM permits ORDER BY id DESC");
            $permits = $stmt->fetchAll();
            
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
                // Hapus password dari respons demi keamanan
                unset($user['password']);
                jsonResponse(true, "Login berhasil", $user);
            } else {
                jsonResponse(false, "Username atau password salah");
            }
            break;

        // ==========================================
        // 3. SUBMIT ATTENDANCE (ABSENSI)
        // ==========================================
        case 'submitAttendance':
            if (!$payload) jsonResponse(false, "Payload kosong");
            
            // Proses foto base64 menjadi file
            $photoPath = saveBase64File($payload['photo'] ?? '', 'absen_' . $payload['username'], 'absensi');
            
            // Simpan ke database
            $stmt = $pdo->prepare("INSERT INTO attendance (timestamp, username, nama, status, keterangan, jarak, photo) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $payload['timestamp'],
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
            $stmt = $pdo->prepare("INSERT INTO attendance (timestamp, username, nama, status, keterangan, jarak, photo) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $payload['timestamp'],
                $payload['username'],
                $payload['nama'],
                $payload['status'],
                $payload['keterangan'] ?? 'Absen Manual',
                '-',
                ''
            ]);
            jsonResponse(true, "Absen manual berhasil disimpan");
            break;

        case 'manualAttendanceMassal':
            if (isset($payload['data']) && is_array($payload['data'])) {
                $stmt = $pdo->prepare("INSERT INTO attendance (timestamp, username, nama, status, keterangan, jarak, photo) VALUES (?, ?, ?, ?, ?, ?, ?)");
                foreach ($payload['data'] as $item) {
                    $stmt->execute([
                        $item['timestamp'],
                        $item['username'],
                        $item['nama'],
                        $item['status'],
                        $item['keterangan'] ?? 'Absen Manual',
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
