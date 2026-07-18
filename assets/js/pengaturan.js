document.addEventListener('DOMContentLoaded', () => {
  loadPengaturan();

  // Handle Profil Sekolah Submit
  document.getElementById('formProfilSekolah').addEventListener('submit', (e) => {
    e.preventDefault();
    const btnSubmit = e.target.querySelector('button[type="submit"]');
    const originalText = btnSubmit.innerHTML;
    btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';
    btnSubmit.disabled = true;

    const profileData = {
      nama: document.getElementById('profilNama').value,
      alamat: document.getElementById('profilAlamat').value,
      kepsek: document.getElementById('profilKepsek').value
    };

    const payload = {
      action: 'updateSettings',
      settings: {
        SCHOOL_PROFILE: JSON.stringify(profileData)
      }
    };

    App.fetchAPI('updateSettings', payload, 'POST').then(res => {
      btnSubmit.innerHTML = originalText;
      btnSubmit.disabled = false;
      if (res && res.success) {
        App.showToast('Profil sekolah diperbarui', 'success');
      } else {
        App.showToast('Gagal menyimpan profil', 'error');
      }
    }).catch(err => {
      btnSubmit.innerHTML = originalText;
      btnSubmit.disabled = false;
      App.showToast('Koneksi bermasalah', 'error');
    });
  });

  // Handle App Config Submit
  document.getElementById('formAppConfig').addEventListener('submit', (e) => {
    e.preventDefault();
    const btnSubmit = e.target.querySelector('button[type="submit"]');
    const originalText = btnSubmit.innerHTML;
    btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';
    btnSubmit.disabled = true;

    const configData = {
      liveness: document.getElementById('livenessSwitch').checked,
      multiDevice: document.getElementById('multiDeviceSwitch').checked,
      threshold: parseFloat(document.getElementById('aiThreshold').value)
    };

    const payload = {
      action: 'updateSettings',
      settings: {
        APP_CONFIG: JSON.stringify(configData)
      }
    };

    App.fetchAPI('updateSettings', payload, 'POST').then(res => {
      btnSubmit.innerHTML = originalText;
      btnSubmit.disabled = false;
      if (res && res.success) {
        App.showToast('Pengaturan aplikasi diperbarui', 'success');
      } else {
        App.showToast('Gagal menyimpan pengaturan', 'error');
      }
    }).catch(err => {
      btnSubmit.innerHTML = originalText;
      btnSubmit.disabled = false;
      App.showToast('Koneksi bermasalah', 'error');
    });
  });

  function loadPengaturan() {
    App.fetchAPI('getDatabase', {}, 'GET').then(res => {
      if (res && res.success && res.data.settings) {
        // Load Profile
        if (res.data.settings.SCHOOL_PROFILE) {
          try {
            const profile = JSON.parse(res.data.settings.SCHOOL_PROFILE);
            document.getElementById('profilNama').value = profile.nama || '';
            document.getElementById('profilAlamat').value = profile.alamat || '';
            document.getElementById('profilKepsek').value = profile.kepsek || '';
          } catch(e) {}
        }

        // Load Config
        if (res.data.settings.APP_CONFIG) {
          try {
            const config = JSON.parse(res.data.settings.APP_CONFIG);
            document.getElementById('livenessSwitch').checked = config.liveness === true;
            document.getElementById('multiDeviceSwitch').checked = config.multiDevice === true;
            document.getElementById('aiThreshold').value = config.threshold || 0.7;
          } catch(e) {}
        }
      }
    });
  }
});
