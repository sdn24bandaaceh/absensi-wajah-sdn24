<?php
// db.php - Konfigurasi Database Hostinger

// Deteksi subdomain saat ini
$http_host = $_SERVER['HTTP_HOST'] ?? 'absensikula.online';
$subdomain = explode('.', $http_host)[0];

// Ganti nilai-nilai di bawah ini dengan detail Hostinger Anda!
$host = 'localhost'; // Biasanya localhost di Hostinger
$user = 'u696975859_absensi_user'; // User MASTER database Anda (beri akses ke semua db sekolah)
$password = 'Absensi231-'; // Password user master Anda

// Logika Pemilihan Database (Multi-Tenant)
// Default database (untuk absensikula.online atau sdn24)
$dbname = 'u696975859_absensi_db'; 

// Jika diakses dari subdomain (misal: sdn1bna.absensikula.online)
if ($subdomain !== 'absensikula' && $subdomain !== 'www' && $subdomain !== 'localhost' && $subdomain !== '127') {
    // Format nama database di hostinger biasanya uPREFIX_namasubdomain
    // Contoh: u696975859_sdn1bna
    $dbname = 'u696975859_' . $subdomain;
}

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $password);
    
    // Set PDO agar memunculkan Exception jika terjadi error
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Set default fetch mode ke associative array
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    
} catch (PDOException $e) {
    // Jika koneksi gagal, hentikan eksekusi dan kirimkan error
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => "Koneksi database gagal untuk sekolah ini ($dbname). Pastikan database sudah dibuat dan User Master diizinkan."
    ]);
    exit;
}
?>
