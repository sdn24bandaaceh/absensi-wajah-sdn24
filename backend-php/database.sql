-- Skema Database MySQL untuk Sistem Absensi Wajah Enterprise
-- Jalankan skrip ini di phpMyAdmin Hostinger Anda.

CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `foto` varchar(255) DEFAULT '',
  `nama` varchar(150) NOT NULL,
  `nip` varchar(50) DEFAULT '-',
  `pangkat` varchar(100) DEFAULT '-',
  `jabatan` varchar(100) DEFAULT '-',
  `status` varchar(50) DEFAULT 'Aktif',
  `username` varchar(50) NOT NULL,
  `password` varchar(100) NOT NULL,
  `role` varchar(20) DEFAULT 'peserta',
  `pesan_blokir` text,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data Default Superadmin dan Admin
INSERT IGNORE INTO `users` (`foto`, `nama`, `nip`, `pangkat`, `jabatan`, `status`, `username`, `password`, `role`) VALUES
('https://placehold.co/100x100/dc2626/white?text=Super', 'Super Administrator', '-', '-', 'Pemilik Sistem', 'Aktif', 'superadmin', 'super2026', 'superadmin'),
('https://placehold.co/100x100/3b82f6/white?text=Admin', 'Administrator', '-', '-', 'Admin Sistem', 'Aktif', 'admin', 'admin2026', 'admin');

CREATE TABLE IF NOT EXISTS `attendance` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `timestamp` varchar(50) NOT NULL,
  `username` varchar(50) NOT NULL,
  `nama` varchar(150) NOT NULL,
  `status` varchar(20) NOT NULL,
  `keterangan` varchar(100) DEFAULT '',
  `jarak` varchar(50) DEFAULT '',
  `photo` text,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `username_idx` (`username`),
  KEY `date_idx` (`timestamp`(10))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `permits` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `nama` varchar(150) NOT NULL,
  `tipe` varchar(50) NOT NULL,
  `tanggal_mulai` varchar(20) NOT NULL,
  `tanggal_selesai` varchar(20) NOT NULL,
  `alasan` text,
  `status_persetujuan` varchar(50) DEFAULT 'Menunggu Persetujuan',
  `file_data` text,
  `file_name` varchar(255) DEFAULT '',
  `tanggal_pengajuan` varchar(50),
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `username_idx` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `settings` (
  `key_name` varchar(50) NOT NULL,
  `value` longtext NOT NULL,
  PRIMARY KEY (`key_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Pengaturan Default
INSERT IGNORE INTO `settings` (`key_name`, `value`) VALUES
('SCHOOL_LAT', '5.5414'),
('SCHOOL_LNG', '95.3146'),
('MAX_RADIUS_METERS', '100'),
('WEEKLY_SCHEDULE', '{"0":{"entryStart":"00:00","entryEnd":"00:00","exitStart":"00:00","exitEnd":"00:00"},"1":{"entryStart":"07:00","entryEnd":"08:00","exitStart":"14:00","exitEnd":"15:00"},"2":{"entryStart":"07:00","entryEnd":"08:00","exitStart":"14:00","exitEnd":"15:00"},"3":{"entryStart":"07:00","entryEnd":"08:00","exitStart":"14:00","exitEnd":"15:00"},"4":{"entryStart":"07:00","entryEnd":"08:00","exitStart":"14:00","exitEnd":"15:00"},"5":{"entryStart":"07:00","entryEnd":"07:45","exitStart":"11:30","exitEnd":"12:30"},"6":{"entryStart":"07:30","entryEnd":"08:30","exitStart":"13:00","exitEnd":"14:00"}}'),
('HOLIDAYS', '[{"date":"2026-01-01","name":"Tahun Baru Masehi","type":"Nasional"},{"date":"2026-08-17","name":"Hari Kemerdekaan RI","type":"Nasional"}]'),
('SCHOOL_PROFILE', '{"nama":"SD Negeri 24 Banda Aceh","alamat":"Jl. Contoh Alamat No. 123","tingkat":"SD","status":"Negeri","logo":"","kepsek":"Hidayat, S.Pd., M.Pd.","nipKepsek":"-","kopSurat":""}'),
('APP_CONFIG', '{"liveness":true,"multiDevice":false,"threshold":0.7}'),
('ANNOUNCEMENTS', '[{"id":1,"title":"Selamat Datang","content":"Sistem Absensi Enterprise telah aktif.","type":"success","date":"2026-08-19T00:00:00.000Z"}]');

CREATE TABLE IF NOT EXISTS `tugas_luar` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama_tugas` varchar(150) NOT NULL,
  `lat` varchar(50) NOT NULL,
  `lng` varchar(50) NOT NULL,
  `radius` int(11) DEFAULT 100,
  `tanggal_mulai` varchar(20) NOT NULL,
  `tanggal_selesai` varchar(20) NOT NULL,
  `pegawai` text,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
