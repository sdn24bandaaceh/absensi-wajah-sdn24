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
          
          let fotoUrl = u.foto || `https://ui-avatars.com/api/?name=${u.nama}&background=random`;
          
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
            `<span class="badge bg-primary">${u.status || 'PNS'}</span>`,
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
        </div>
      `,
      imageUrl: user.foto || `https://ui-avatars.com/api/?name=${user.nama}&background=random`,
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
    document.getElementById('p_password').value = user.password;
    document.getElementById('p_role').value = user.role;
    
    $('#modalPegawai').modal('show');
  }
}

function openAddModal() {
  document.getElementById('formPegawai').reset();
  document.getElementById('isEdit').value = 'false';
  document.getElementById('p_username').readOnly = false;
  $('#modalPegawai').modal('show');
}
