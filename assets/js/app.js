const App = {
  // PENTING: Ganti URL ini dengan URL eksekusi Web App dari Google Apps Script Anda!
  // Contoh: 'https://script.google.com/macros/s/AKfycb.../exec'
  API_URL: 'https://script.google.com/macros/s/AKfycbyTz21eXrnbxJNF58xXCqHMy5Nqe_2sd73UvTdGdy-1OOeWINTr0NL0RYHGN-3R44m9dw/exec',

  init() {
    this.initDarkMode();
    this.initTooltips();
    this.initAOS();
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
