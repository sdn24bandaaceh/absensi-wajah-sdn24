document.addEventListener('DOMContentLoaded', () => {
  // Check auth
  if (localStorage.getItem('isLoggedIn') !== 'true') {
    window.location.href = 'login.html';
    return;
  }

  const userRole = localStorage.getItem('userRole') || 'pegawai';

  // Apply role-based UI
  if (userRole === 'pegawai') {
    hideAdminMenus();
    restrictAdminPages();
  }

  // Update display name
  const userName = localStorage.getItem('userName') || 'Admin';
  const displayNameEl = document.getElementById('displayName');
  if (displayNameEl) {
    displayNameEl.textContent = userName.charAt(0).toUpperCase() + userName.slice(1);
  }
  
  // Update role badge
  const displayRoleEl = document.querySelector('.user-profile small.text-muted');
  if (displayRoleEl) {
    displayRoleEl.textContent = userRole === 'admin' ? 'Administrator' : 'Pegawai';
  }

  initSidebar();
  initClock();
  
  // Load data for dashboard
  if (document.getElementById('statusChart')) {
    loadDashboardData();
  } else {
    animateCounters();
  }
});

function loadDashboardData() {
  App.fetchAPI('getDatabase', {}, 'GET').then(res => {
    if(res && res.success) {
      const data = res.data;
      
      const totalPegawai = data.users.length;
      let pns = 0, pppk = 0, honorer = 0;
      data.users.forEach(u => {
        if(u.status === 'PNS') pns++;
        else if(u.status === 'PPPK') pppk++;
        else honorer++;
      });
      
      const today = new Date().toISOString().slice(0, 10);
      let hadir = 0;
      let terlambat = 0;
      
      data.attendance.forEach(a => {
        if (a.timestamp && a.timestamp.includes(today)) {
          hadir++;
          if(a.keterangan && a.keterangan.toLowerCase().includes('terlambat')) terlambat++;
        }
      });
      
      const belumHadir = Math.max(0, totalPegawai - hadir);
      
      // Update Counters
      const counters = document.querySelectorAll('.counter');
      if (counters.length >= 4) {
        counters[0].setAttribute('data-target', totalPegawai);
        counters[1].setAttribute('data-target', hadir);
        counters[2].setAttribute('data-target', terlambat);
        counters[3].setAttribute('data-target', belumHadir);
      }
      
      initCharts(pns, pppk, honorer);
      animateCounters();
    } else {
      initCharts(60, 40, 50); // fallback
      animateCounters();
    }
  }).catch(err => {
    initCharts(60, 40, 50); // fallback
    animateCounters();
  });
}

function hideAdminMenus() {
  const sidebarNav = document.querySelector('.sidebar .nav');
  if (!sidebarNav) return;
  
  let shouldHide = false;
  const items = sidebarNav.querySelectorAll('.nav-item');
  
  items.forEach(item => {
    // If we hit MANAJEMEN or PENGATURAN headers, start hiding
    if (item.textContent.includes('MANAJEMEN') || item.textContent.includes('PENGATURAN')) {
      shouldHide = true;
      item.style.display = 'none';
      return;
    }
    
    // Always show logout
    if (item.textContent.includes('Logout')) {
      shouldHide = false; 
      return;
    }
    
    if (shouldHide) {
      item.style.display = 'none';
    }
  });
}

function restrictAdminPages() {
  const currentPath = window.location.pathname;
  const adminPages = [
    'pegawai.html', 'rekapitulasi.html', 'laporan.html', 
    'geofencing.html', 'jam-kerja.html', 'hari-libur.html', 
    'pengguna.html', 'pengaturan.html'
  ];
  
  if (adminPages.some(page => currentPath.endsWith(page))) {
    App.showToast('Anda tidak memiliki akses ke halaman ini', 'error');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1000);
  }
}

function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.getElementById('mainContent');
  const toggleBtn = document.getElementById('sidebarToggle');

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('show');
      mainContent.classList.toggle('sidebar-open');
    });
  }

  // Close sidebar on mobile when clicking outside
  document.addEventListener('click', (e) => {
    if (window.innerWidth < 992) {
      if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target) && sidebar.classList.contains('show')) {
        sidebar.classList.remove('show');
        mainContent.classList.remove('sidebar-open');
      }
    }
  });
}

function initClock() {
  const clockEl = document.getElementById('digitalClock');
  if (!clockEl) return;

  const updateClock = () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateString = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    clockEl.innerHTML = `${dateString} <span class="ms-2 badge bg-primary">${timeString}</span>`;
  };

  updateClock();
  setInterval(updateClock, 1000);
}

function animateCounters() {
  const counters = document.querySelectorAll('.counter');
  const speed = 200;

  counters.forEach(counter => {
    const updateCount = () => {
      const target = +counter.getAttribute('data-target');
      const count = +counter.innerText;
      const inc = target / speed;

      if (count < target) {
        counter.innerText = Math.ceil(count + inc);
        setTimeout(updateCount, 1);
      } else {
        counter.innerText = target;
      }
    };
    updateCount();
  });
}

function initCharts(pns = 60, pppk = 40, honorer = 50) {
  // Chart.js global config for dark mode support
  const isDark = document.body.classList.contains('dark-mode');
  const textColor = isDark ? '#F8FAFC' : '#334155';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  
  Chart.defaults.color = textColor;
  
  // Weekly Chart
  const weeklyCtx = document.getElementById('weeklyChart');
  if (weeklyCtx) {
    new Chart(weeklyCtx, {
      type: 'line',
      data: {
        labels: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
        datasets: [{
          label: 'Hadir',
          data: [120, 125, 122, 128, 115],
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true
        }, {
          label: 'Terlambat',
          data: [15, 12, 10, 18, 5],
          borderColor: '#F97316',
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' }
        },
        scales: {
          x: { grid: { color: gridColor } },
          y: { grid: { color: gridColor } }
        }
      }
    });
  }

  // Status Chart
  const statusCtx = document.getElementById('statusChart');
  if (statusCtx) {
    new Chart(statusCtx, {
      type: 'doughnut',
      data: {
        labels: ['PNS', 'PPPK', 'Kontrak/Honor'],
        datasets: [{
          data: [pns, pppk, honorer],
          backgroundColor: ['#0EA5E9', '#F59E0B', '#EF4444'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }
}
