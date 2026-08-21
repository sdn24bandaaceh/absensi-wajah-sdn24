$(document).ready(function() {
  const table = $('#tablePegawai').DataTable({
    language: {
      url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/id.json',
    }
  });

  // Load Pegawai data from API
  loadPegawai();

  function loadPegawai() {
    App.fetchAPI('getDatabase', {}, 'GET').then(res => {
      if(res && res.success) {
        const users = res.data.users;
        window.usersData = users; // Simpan ke global untuk edit/view
        
        table.clear();
        users.forEach((u, index) => {
          let statusWajah = `<span class="badge bg-secondary"><i class="bi bi-x-circle me-1"></i> Belum</span>`;
          if (u.foto && u.foto.length > 10) {
             statusWajah = `<span class="badge bg-success"><i class="bi bi-check-circle me-1"></i> Terdaftar</span>`;
          }
          
          // Konversi link Google Drive viewer ke format raw image agar bisa ditampilkan
          let rawFoto = u.foto;
          if (rawFoto && rawFoto.includes('drive.google.com/')) {
            const match = rawFoto.match(/file\/d\/([a-zA-Z0-9_-]+)/) || rawFoto.match(/id=([a-zA-Z0-9_-]+)/);
            if (match) {
              // Gunakan endpoint thumbnail Drive untuk menghindari pemblokiran CORS/CORB
              rawFoto = `https://drive.google.com/thumbnail?id=${match[1]}&sz=w500`;
            }
          }
          
          let fotoUrl = (rawFoto && rawFoto.length > 10 && (String(rawFoto).startsWith('http') || String(rawFoto).startsWith('data:'))) ? rawFoto : `https://ui-avatars.com/api/?name=${u.nama}&background=random`;
          
          let roleBadge = `<span class="badge bg-primary">${u.status || 'PNS'}</span>`;
          if (u.pesanBlokir && u.pesanBlokir.trim() !== '') {
            roleBadge = `<span class="badge bg-danger"><i class="bi bi-shield-lock"></i> Diblokir</span>`;
          }
          
          let actionBtns = `
            <button class="btn btn-sm btn-info text-white" onclick="viewPegawai('${u.username}')"><i class="bi bi-eye"></i></button>
            <button class="btn btn-sm btn-warning text-white" onclick="editPegawai('${u.username}')"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-danger" onclick="deletePegawai('${u.username}')"><i class="bi bi-trash"></i></button>
          `;

          table.row.add([
            index + 1,
            `
              <div class="d-flex align-items-center gap-3">
                <img src="${fotoUrl}" class="rounded-circle" width="40" height="40" style="object-fit:cover;">
                <div>
                  <h6 class="mb-0 fw-bold">${u.nama}</h6>
                  <small class="text-muted">${u.jabatan || '-'}</small>
                </div>
              </div>
            `,
            u.nip || '-',
            roleBadge,
            u.jabatan || '-',
            statusWajah,
            actionBtns
          ]);
        });
        table.draw();
      }
    });
  }

  // Handle Add/Edit Form
  document.getElementById('formPegawai').addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    
    const isEdit = document.getElementById('isEdit').value === 'true';
    const action = isEdit ? 'updateUser' : 'addUser';
    
    const payload = {
       nama: document.getElementById('p_nama').value,
       nip: document.getElementById('p_nip').value,
       pangkat: document.getElementById('p_pangkat').value,
       jabatan: document.getElementById('p_jabatan').value,
       status: document.getElementById('p_status').value,
       username: document.getElementById('p_username').value,
       password: document.getElementById('p_password').value,
       role: document.getElementById('p_role').value,
       pesanBlokir: document.getElementById('p_pesan_blokir').value
    };
    
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Menyimpan...';
    btn.disabled = true;
    
    App.fetchAPI(action, payload, 'POST').then(res => {
      btn.innerHTML = originalText;
      btn.disabled = false;
      if (res && res.success) {
        App.showToast(res.message || 'Berhasil menyimpan data', 'success');
        $('#modalPegawai').modal('hide');
        e.target.reset();
        loadPegawai();
      } else {
        App.showToast(res.message || 'Gagal menyimpan', 'error');
      }
    }).catch(err => {
      btn.innerHTML = originalText;
      btn.disabled = false;
      App.showToast('Koneksi bermasalah', 'error');
    });
  });

});

function deletePegawai(username) {
  if (confirm(`Yakin ingin menghapus pegawai dengan username: ${username}?`)) {
    App.fetchAPI('deleteUser', { username }, 'POST').then(res => {
      if (res.success) {
        App.showToast('Berhasil menghapus', 'success');
        setTimeout(() => location.reload(), 1000); // Reload data
      } else {
        App.showToast(res.message || 'Gagal menghapus', 'error');
      }
    });
  }
}

function viewPegawai(username) {
  const user = window.usersData.find(u => u.username === username);
  if (user) {
      // Konversi link Google Drive viewer ke format raw image
      let rawModalFoto = user.foto;
      if (rawModalFoto && rawModalFoto.includes('drive.google.com/')) {
        const match = rawModalFoto.match(/file\/d\/([a-zA-Z0-9_-]+)/) || rawModalFoto.match(/id=([a-zA-Z0-9_-]+)/);
        if (match) {
          rawModalFoto = `https://drive.google.com/thumbnail?id=${match[1]}&sz=w500`;
        }
      }
      
      Swal.fire({
        title: 'Detail Pegawai',
        html: `
          <div class="text-start mt-3">
            <p><strong>Nama:</strong> ${user.nama}</p>
            <p><strong>NIP:</strong> ${user.nip || '-'}</p>
            <p><strong>Pangkat:</strong> ${user.pangkat || '-'}</p>
            <p><strong>Jabatan:</strong> ${user.jabatan || '-'}</p>
            <p><strong>Status:</strong> ${user.status}</p>
            <p><strong>Role:</strong> ${user.role}</p>
            ${user.pesanBlokir ? `<div class="alert alert-danger mt-2 p-2 small"><i class="bi bi-shield-lock-fill"></i> <strong>Diblokir:</strong> ${user.pesanBlokir}</div>` : ''}
          </div>
        `,
        imageUrl: (rawModalFoto && rawModalFoto.length > 10 && (String(rawModalFoto).startsWith('http') || String(rawModalFoto).startsWith('data:'))) ? rawModalFoto : `https://ui-avatars.com/api/?name=${user.nama}&background=random`,
      imageWidth: 100,
      imageHeight: 100,
      imageAlt: 'Foto ' + user.nama
    });
  }
}

function editPegawai(username) {
  const user = window.usersData.find(u => u.username === username);
  if (user) {
    document.getElementById('formPegawai').reset();
    document.getElementById('isEdit').value = 'true';
    
    document.getElementById('p_nama').value = user.nama;
    document.getElementById('p_nip').value = user.nip;
    document.getElementById('p_pangkat').value = user.pangkat;
    document.getElementById('p_jabatan').value = user.jabatan;
    document.getElementById('p_status').value = user.status;
    document.getElementById('p_username').value = user.username;
    document.getElementById('p_username').readOnly = true; // Tidak bisa ubah username saat edit
    document.getElementById('p_password').value = ''; // Kosongkan agar tidak membingungkan
    document.getElementById('p_password').required = false; // Tidak wajib diisi saat edit
    document.getElementById('p_role').value = user.role;
    document.getElementById('p_pesan_blokir').value = user.pesanBlokir || '';
    
    $('#modalPegawai').modal('show');
  }
}

function openAddModal() {
  document.getElementById('formPegawai').reset();
  document.getElementById('isEdit').value = 'false';
  document.getElementById('p_username').readOnly = false;
  document.getElementById('p_password').required = true;
  $('#modalPegawai').modal('show');
}

function exportDataPegawai() {
  if (!window.usersData || window.usersData.length === 0) {
    App.showToast('Tidak ada data pegawai untuk diekspor', 'warning');
    return;
  }
  
  if (typeof XLSX === 'undefined') {
    App.showToast('Library Excel belum termuat, silakan refresh', 'error');
    return;
  }
  
  // Format Data urut sesuai modal
  const data = window.usersData.map((u, index) => ({
    "No": index + 1,
    "Nama Lengkap": u.nama || '',
    "NIP": u.nip || '-',
    "Pangkat/Gol": u.pangkat || '-',
    "Jabatan": u.jabatan || '-',
    "Status Kepegawaian": u.status || 'Aktif',
    "Role Aplikasi": u.role || 'peserta',
    "Username": u.username || '',
    "Password": '', // Sengaja dikosongkan
    "Pesan Blokir (Opsional)": u.pesanBlokir || ''
  }));
  
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Styling Header menjadi Biru dan Rapi
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + "1"; // Baris pertama
    if (!worksheet[address]) continue;
    worksheet[address].s = {
      fill: { fgColor: { rgb: "1D4ED8" } }, // Biru Modern (Tailwind Blue-700)
      font: { color: { rgb: "FFFFFF" }, bold: true, sz: 12 },
      alignment: { horizontal: "center", vertical: "center" }
    };
  }
  
  // Mengatur lebar kolom agar rapi saat dibuka
  worksheet['!cols'] = [
    { wch: 5 },  // No
    { wch: 30 }, // Nama Lengkap
    { wch: 20 }, // NIP
    { wch: 15 }, // Pangkat/Gol
    { wch: 25 }, // Jabatan
    { wch: 20 }, // Status Kepegawaian
    { wch: 15 }, // Role Aplikasi
    { wch: 20 }, // Username
    { wch: 15 }, // Password
    { wch: 40 }  // Pesan Blokir
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data Pegawai");
  
  // Trigger Download
  XLSX.writeFile(workbook, `Data_Pegawai_${new Date().toISOString().split('T')[0]}.xlsx`);
}

function importDataPegawai(input) {
  const file = input.files[0];
  if (!file) return;
  
  if (typeof XLSX === 'undefined') {
    App.showToast('Library Excel belum termuat, silakan refresh', 'error');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, {type: 'array'});
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      
      const rows = XLSX.utils.sheet_to_json(firstSheet, {defval: ""});
      
      if (rows.length === 0) {
        App.showToast('File Excel kosong', 'error');
        input.value = '';
        return;
      }
      
      let parsedUsers = [];
      
      rows.forEach(row => {
        // Ambil property dinamis
        const getVal = (key) => {
          let foundKey = Object.keys(row).find(k => k.toLowerCase().includes(key.toLowerCase()));
          return foundKey ? String(row[foundKey]).trim() : '';
        };
        
        let username = getVal('username');
        if (!username) return; // Wajib
        
        let password = getVal('password');
        if (!password) password = '123456';
        
        parsedUsers.push({
          username: username,
          password: password,
          nama: getVal('nama') || '',
          nip: getVal('nip') || '-',
          jabatan: getVal('jabatan') || '-',
          pangkat: getVal('pangkat') || getVal('gol') || '-',
          status: getVal('status') || 'Aktif',
          role: getVal('role') || 'peserta',
          pesanBlokir: getVal('pesan') || ''
        });
      });
      
      if (parsedUsers.length === 0) {
         App.showToast('Tidak ada data valid yang bisa diimpor', 'error');
         input.value = '';
         return;
      }
      
      Swal.fire({
        title: 'Konfirmasi Impor Excel',
        text: `Ditemukan ${parsedUsers.length} data pegawai. Yakin ingin mengimpor data ini? (Username yang sama akan tertimpa)`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Ya, Proses Impor',
        cancelButtonText: 'Batal'
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire({
            title: 'Memproses...',
            html: 'Mohon tunggu sementara data Excel diimpor.',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
          });
          
          App.fetchAPI('importUsersMassal', { users: parsedUsers }, 'POST').then(res => {
             if (res && res.success) {
                Swal.fire('Berhasil', res.message, 'success').then(() => location.reload());
             } else {
                Swal.fire('Gagal', res.message || 'Terjadi kesalahan', 'error');
             }
          }).catch(err => {
             Swal.fire('Error', 'Koneksi ke server gagal', 'error');
          });
        }
        input.value = ''; // Reset input
      });
    } catch (err) {
       App.showToast('Gagal membaca file Excel', 'error');
       input.value = '';
    }
  };
  
  reader.readAsArrayBuffer(file);
}
