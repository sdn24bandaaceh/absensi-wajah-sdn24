<?php
// cleanup_database.php
// Skrip untuk mengekstrak foto Base64 menjadi file fisik agar database tidak berat
header("Content-Type: text/plain; charset=UTF-8");
require_once 'db.php';

echo "Memulai proses pembersihan database...\n";

function saveBase64File($base64String, $prefix, $folder) {
    if (!$base64String || strpos($base64String, 'data:') === false) return "";
    
    $uploadDir = __DIR__ . '/uploads/' . $folder . '/';
    if (!file_exists($uploadDir)) mkdir($uploadDir, 0777, true);
    
    $parts = explode(',', $base64String);
    if (count($parts) < 2) return "";
    
    $data = base64_decode($parts[1]);
    $ext = '.jpg';
    
    $fileName = $prefix . '_' . uniqid() . $ext;
    $filePath = $uploadDir . $fileName;
    
    if (file_put_contents($filePath, $data)) {
        return 'uploads/' . $folder . '/' . $fileName;
    }
    return "";
}

// 1. Bersihkan tabel attendance
$stmt = $pdo->query("SELECT id, username, photo FROM attendance WHERE photo LIKE 'data:%'");
$rows = $stmt->fetchAll();

$fixedCount = 0;
foreach ($rows as $row) {
    $path = saveBase64File($row['photo'], 'absen_' . $row['username'], 'absensi');
    if ($path) {
        $update = $pdo->prepare("UPDATE attendance SET photo = ? WHERE id = ?");
        $update->execute([$path, $row['id']]);
        $fixedCount++;
        echo "Fixed attendance ID {$row['id']}\n";
    }
}
echo "Total absensi diperbaiki: $fixedCount\n\n";

// 2. Bersihkan tabel users
$stmt = $pdo->query("SELECT id, username, foto FROM users WHERE foto LIKE 'data:%'");
$rows = $stmt->fetchAll();

$userFixed = 0;
foreach ($rows as $row) {
    $path = saveBase64File($row['foto'], 'profil_' . $row['username'], 'profiles');
    if ($path) {
        $update = $pdo->prepare("UPDATE users SET foto = ? WHERE id = ?");
        $update->execute([$path, $row['id']]);
        $userFixed++;
        echo "Fixed profil ID {$row['id']}\n";
    }
}
echo "Total profil diperbaiki: $userFixed\n\n";

echo "PEMBERSIHAN SELESAI! APLIKASI SEKARANG SUPER CEPAT!";
?>
