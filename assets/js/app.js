const App = {
  // PENTING: Ganti URL ini dengan URL eksekusi Web App dari Google Apps Script Anda!
  // Contoh: 'https://script.google.com/macros/s/AKfycb.../exec'
  API_URL: 'https://script.google.com/macros/s/AKfycbyTz21eXrnbxJNF58xXCqHMy5Nqe_2sd73UvTdGdy-1OOeWINTr0NL0RYHGN-3R44m9dw/exec',

  init() {
    this.initDarkMode();
    this.initTooltips();
    this.initAOS();
    this.applySchoolProfile();
  },

  getDirectImageUrl(url) {
    if (!url) return '';
    // Convert Google Drive view URL to direct image URL
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      // Menggunakan URL thumbnail yang lebih stabil untuk tag <img>
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w500`;
    }
    return url;
  },

  applySchoolProfile() {
    const profileStr = localStorage.getItem('schoolProfile');
    if (profileStr) {
      try {
        const profile = JSON.parse(profileStr);
        const logoUrl = this.getDirectImageUrl(profile.logo);
        
        // Update sidebar names
        const sidebarTitles = document.querySelectorAll('.sidebar-header h6');
        sidebarTitles.forEach(el => {
           if (profile.nama) el.textContent = profile.nama;
        });
        
        // Update login page name
        const loginSubtitle = document.querySelector('.login-card p');
        if (loginSubtitle && profile.nama) {
          loginSubtitle.textContent = profile.nama;
        }
        
        // Update logo in sidebar
        const sidebarIcons = document.querySelectorAll('.sidebar-header i.bi-shield-lock-fill');
        sidebarIcons.forEach(el => {
           if (logoUrl) {
             const img = document.createElement('img');
             img.src = logoUrl;
             img.style.width = '40px';
             img.style.height = '40px';
             img.style.objectFit = 'contain';
             img.className = 'me-2';
             el.parentNode.replaceChild(img, el);
           }
        });
        
        // Update existing img logo in sidebar
        const sidebarImgs = document.querySelectorAll('.sidebar-header img.me-2');
        sidebarImgs.forEach(el => {
           if (logoUrl) el.src = logoUrl;
        });
        
        // Update logo in login page
        const loginIcon = document.querySelector('.login-card .bi-shield-lock');
        if (loginIcon && logoUrl) {
           const img = document.createElement('img');
           img.src = logoUrl;
           img.style.width = '80px';
           img.style.height = '80px';
           img.style.objectFit = 'contain';
           img.className = 'mb-2';
           loginIcon.parentNode.replaceChild(img, loginIcon);
        }
        // Update existing img logo in login page
        const loginImg = document.querySelector('.login-card img.mb-2');
        if (loginImg && logoUrl) {
           loginImg.src = logoUrl;
        }
        
        // Update document title
        if (profile.nama) {
          document.title = document.title.replace('SDN 24 Banda Aceh', profile.nama).replace('SD Negeri 24 Banda Aceh', profile.nama);
        }
      } catch(e) {}
    }
  },

  async fetchAPI(action, payload = {}, method = 'POST') {
    try {
      if (method === 'GET') {
        const queryParams = new URLSearchParams({ action, ...payload, _t: Date.now() }).toString();
        const response = await fetch(`${this.API_URL}?${queryParams}`);
        return await response.json();
      } else {
        const response = await fetch(this.API_URL, {
          method: 'POST',
          body: JSON.stringify({ action, ...payload }),
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          }
        });
        return await response.json();
      }
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, message: 'Koneksi ke server gagal' };
    }
  },

  initDarkMode() {
    const toggleBtn = document.getElementById('darkModeToggle');
    if (!toggleBtn) return;

    // Check local storage or system preference
    const currentTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (currentTheme === 'dark' || (!currentTheme && prefersDark)) {
      document.body.classList.add('dark-mode');
      toggleBtn.innerHTML = '<i class="bi bi-sun-fill"></i>';
    }

    toggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      toggleBtn.innerHTML = isDark ? '<i class="bi bi-sun-fill"></i>' : '<i class="bi bi-moon-stars-fill"></i>';
    });
  },

  initTooltips() {
    if (typeof bootstrap !== 'undefined') {
      const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
      [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
    }
  },

  initAOS() {
    if (typeof AOS !== 'undefined') {
      AOS.init({
        duration: 800,
        once: true,
        offset: 50
      });
    }
  },

  showToast(message, type = 'success') {
    if (typeof Swal !== 'undefined') {
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.addEventListener('mouseenter', Swal.stopTimer)
          toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
      });

      Toast.fire({
        icon: type,
        title: message
      });
    } else {
      alert(message);
    }
  }
};

// Initialize App on DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
