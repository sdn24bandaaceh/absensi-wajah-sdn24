<?php
// db.php - Konfigurasi Database Hostinger

// Ganti nilai-nilai di bawah ini dengan detail database Hostinger Anda!
$host = 'localhost'; // Biasanya localhost di Hostinger
$dbname = 'u696975859_absensi_db'; // Nama database Anda
$user = 'u696975859_absensi_user'; // Username database Anda
$password = 'Absensi231-'; // Password database Anda

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
        'message' => 'Koneksi database gagal. Silakan periksa konfigurasi db.php Anda.'
        // 'error' => $e->getMessage() // Jangan tampilkan pesan error asli di production demi keamanan
    ]);
    exit;
}
?>
