document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      
      // Basic mock validation
      if (username && password) {
        // Simulate loading state
        const btn = loginForm.querySelector('button');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
        btn.disabled = true;
        
        // Call API
        App.fetchAPI('login', { username, password }, 'GET').then(response => {
          if (response && response.success) {
            App.showToast('Login berhasil! Mengalihkan...', 'success');
            
            const user = response.user;
            let role = 'pegawai';
            const uname = user.username.toLowerCase();
            if (uname === 'admin' || uname === 'kepsek' || uname === 'operator' || user.role === 'Admin') {
              role = 'admin';
            }
            
            // Save session
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userRole', role);
            localStorage.setItem('userName', user.nama || username);
            localStorage.setItem('userId', user.username);
            
            setTimeout(() => {
              window.location.href = 'dashboard.html';
            }, 1000);
          } else {
            App.showToast(response.message || 'Username atau password salah', 'error');
            btn.innerHTML = originalText;
            btn.disabled = false;
          }
        }).catch(err => {
          App.showToast('Koneksi gagal', 'error');
          btn.innerHTML = originalText;
          btn.disabled = false;
        });
      } else {
        App.showToast('Username dan password harus diisi', 'error');
      }
    });
  }
});

// Logout function
function logout() {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userName');
  window.location.href = 'login.html';
}
