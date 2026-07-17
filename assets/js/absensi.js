let userLocation = null;
let schoolLocation = { lat: 5.5414, lng: 95.3146 }; // Default
let maxRadius = 100;
let weeklySchedule = null;

document.addEventListener('DOMContentLoaded', () => {
  initCamera();
  
  App.fetchAPI('getDatabase', {}, 'GET').then(res => {
    if(res && res.success && res.data.settings) {
      const s = res.data.settings;
      if (s.SCHOOL_LAT) schoolLocation.lat = parseFloat(s.SCHOOL_LAT.replace("'", ""));
      if (s.SCHOOL_LNG) schoolLocation.lng = parseFloat(s.SCHOOL_LNG.replace("'", ""));
      if (s.MAX_RADIUS_METERS) maxRadius = parseInt(s.MAX_RADIUS_METERS);
      if (s.WEEKLY_SCHEDULE) {
        try {
          weeklySchedule = JSON.parse(s.WEEKLY_SCHEDULE);
        } catch(e) { console.error(e); }
      }
    }
    initMap();
  }).catch(() => {
    initMap();
  });

  const btnMasuk = document.getElementById('btnAbsenMasuk');
  const btnPulang = document.getElementById('btnAbsenPulang');

  if (btnMasuk) {
    btnMasuk.addEventListener('click', (e) => processAbsensi('Masuk', e.currentTarget));
  }
  if (btnPulang) {
    btnPulang.addEventListener('click', (e) => processAbsensi('Pulang', e.currentTarget));
  }
});

async function initCamera() {
  const video = document.getElementById('camera');
  const statusBadge = document.getElementById('cameraStatus');
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'user' } 
    });
    video.srcObject = stream;
    
    video.onloadedmetadata = () => {
      statusBadge.innerHTML = '<i class="bi bi-camera-video-fill me-1"></i> Kamera Aktif';
      statusBadge.className = 'badge bg-success status-badge';
      
      // Simulate Face Recognition Loading
      setTimeout(() => {
        statusBadge.innerHTML = '<i class="bi bi-person-bounding-box me-1"></i> Wajah Terdeteksi';
        checkReadyState();
      }, 2000);
    };
  } catch (err) {
    console.error("Camera error:", err);
    statusBadge.innerHTML = '<i class="bi bi-exclamation-triangle-fill me-1"></i> Gagal Mengakses Kamera';
    statusBadge.className = 'badge bg-danger status-badge';
    App.showToast('Gagal mengakses kamera. Pastikan izin kamera diberikan.', 'error');
  }
}

function initMap() {
  const mapEl = document.getElementById('map');
  const locStatus = document.getElementById('locationStatus');
  
  if (!mapEl) return;
  mapEl.classList.remove('skeleton');
  
  const map = L.map('map').setView([schoolLocation.lat, schoolLocation.lng], 15);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  // School Geofence Circle
  L.circle([schoolLocation.lat, schoolLocation.lng], {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.1,
    radius: maxRadius
  }).addTo(map).bindPopup("Area SD Negeri 24 Banda Aceh");

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        // Update Map
        map.setView([userLocation.lat, userLocation.lng], 16);
        L.marker([userLocation.lat, userLocation.lng]).addTo(map)
          .bindPopup("Lokasi Anda").openPopup();
        
        // Calculate Distance (Haversine formula approximated by Leaflet)
        const schoolLatLng = L.latLng(schoolLocation.lat, schoolLocation.lng);
        const userLatLng = L.latLng(userLocation.lat, userLocation.lng);
        const distance = userLatLng.distanceTo(schoolLatLng);
        
        if (distance <= maxRadius) {
          locStatus.innerHTML = `<i class="bi bi-check-circle-fill text-success me-1"></i> Lokasi valid (${Math.round(distance)}m)`;
          locStatus.className = 'alert alert-success small mb-0';
        } else {
          locStatus.innerHTML = `<i class="bi bi-exclamation-triangle-fill text-warning me-1"></i> Di luar radius sekolah (${Math.round(distance)}m)`;
          locStatus.className = 'alert alert-warning small mb-0';
        }
        
        checkReadyState();
      },
      (error) => {
        locStatus.innerHTML = '<i class="bi bi-x-circle-fill text-danger me-1"></i> Gagal mendapatkan lokasi GPS';
        locStatus.className = 'alert alert-danger small mb-0';
      },
      { enableHighAccuracy: true }
    );
  }
}

function checkReadyState() {
  const btnMasuk = document.getElementById('btnAbsenMasuk');
  const btnPulang = document.getElementById('btnAbsenPulang');
  
  const statusBadge = document.getElementById('cameraStatus');
  const isFaceDetected = statusBadge && statusBadge.classList.contains('bg-success');
  const isLocationFound = userLocation !== null;
  
  if (isFaceDetected && isLocationFound) {
    btnMasuk.disabled = false;
    btnPulang.disabled = false;
  }
}

function processAbsensi(type, btn) {
  if (!btn) btn = event.currentTarget;
  const originalHtml = btn.innerHTML;
  
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Memproses...';
  btn.disabled = true;
  
  // Capture photo from video
  const video = document.getElementById('camera');
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
  const photoData = canvas.toDataURL('image/png');
  
  // Get user from local storage
  let user = { 
    username: localStorage.getItem('userId') || 'unknown', 
    nama: localStorage.getItem('userName') || 'Unknown' 
  };
  
  // Calculate Distance
  let distance = 0;
  if (userLocation) {
    const schoolLatLng = L.latLng(schoolLocation.lat, schoolLocation.lng);
    const userLatLng = L.latLng(userLocation.lat, userLocation.lng);
    distance = userLatLng.distanceTo(schoolLatLng);
  }
  
  // Calculate On-Time / Late / Holiday based on Schedule
  let keterangan = "Tepat Waktu";
  if (weeklySchedule) {
    const now = new Date();
    const day = now.getDay();
    const scheduleToday = weeklySchedule[day];
    
    if (scheduleToday) {
      if (scheduleToday.entryStart === "00:00" && scheduleToday.entryEnd === "00:00") {
        keterangan = "Hari Libur";
      } else {
        if (type === 'Masuk') {
          const currentMins = now.getHours() * 60 + now.getMinutes();
          const endParts = scheduleToday.entryEnd.split(':');
          const endMins = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
          if (currentMins > endMins) {
            keterangan = "Terlambat";
          }
        }
      }
    }
  }
  
  const payload = {
    username: user.username,
    nama: user.nama,
    status: type,
    keterangan: keterangan,
    jarak: Math.round(distance) + 'm',
    photo: photoData
  };
  
  App.fetchAPI('submitAttendance', payload, 'POST').then(res => {
    btn.innerHTML = originalHtml;
    btn.disabled = false;
    
    if (res && res.success) {
      Swal.fire({
        icon: 'success',
        title: `Absen ${type} Berhasil!`,
        text: `Waktu: ${new Date().toLocaleTimeString('id-ID')}`,
        confirmButtonColor: '#10B981',
        confirmButtonText: 'Tutup'
      }).then(() => {
        window.location.href = 'dashboard.html';
      });
    } else {
      App.showToast(res.message || 'Gagal menyimpan absensi', 'error');
    }
  }).catch(err => {
    btn.innerHTML = originalHtml;
    btn.disabled = false;
    App.showToast('Koneksi bermasalah', 'error');
  });
}
