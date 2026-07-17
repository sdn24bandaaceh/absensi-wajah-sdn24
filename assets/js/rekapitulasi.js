$(document).ready(function() {
  const table = $('#tableRekap').DataTable({
    language: {
      url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/id.json',
    },
    scrollX: true,
    ordering: false
  });

  loadRekapitulasi();

  document.querySelector('form.row').addEventListener('submit', (e) => {
    e.preventDefault();
    loadRekapitulasi();
  });
  
  // Attach event listener to filter button
  const filterBtn = document.querySelector('form.row button');
  if (filterBtn) {
    filterBtn.addEventListener('click', (e) => {
      e.preventDefault();
      loadRekapitulasi();
    });
  }

  function loadRekapitulasi() {
    // Get filter values
    const selects = document.querySelectorAll('form.row select');
    const month = selects[0] ? selects[0].value : '07';
    const year = selects[1] ? selects[1].value : '2026';
    const typeFilter = selects[2] ? selects[2].value : 'Semua';
    
    // Set filter button to loading
    if (filterBtn) {
      filterBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Loading...';
      filterBtn.disabled = true;
    }
    
    App.fetchAPI('getDatabase', {}, 'GET').then(res => {
      if(filterBtn) {
        filterBtn.innerHTML = '<i class="bi bi-search me-2"></i>Filter';
        filterBtn.disabled = false;
      }
      
      if(res && res.success) {
        table.clear();
        const data = res.data;
        let index = 1;
        
        data.users.forEach(u => {
          // Filter by role/type
          if (typeFilter !== 'Semua' && u.status !== typeFilter) return;
          
          let hadirLengkap = 0;
          let sakit = 0;
          let cutiTahunan = 0;
          
          // Calculate attendance for this user in this month
          data.attendance.forEach(a => {
            if (a.username === u.username || a.username === u.nip) {
              const dateStr = a.timestamp ? String(a.timestamp).split(',')[0].split('T')[0] : '';
              if (dateStr.startsWith(`${year}-${month}`)) {
                hadirLengkap++;
              }
            }
          });
          
          // Calculate permits
          data.permits.forEach(p => {
             if ((p.username === u.username || p.username === u.nip) && p.status === 'Disetujui') {
               const dateStr = p.tanggalMulai ? String(p.tanggalMulai).split('T')[0] : '';
               if (dateStr.startsWith(`${year}-${month}`)) {
                 const tipe = p.tipe ? String(p.tipe).toLowerCase() : '';
                 if(tipe.includes('sakit')) sakit++;
                 else cutiTahunan++;
               }
             }
          });
          
          let totalKerja = 22; // Asumsi
          let tKet = Math.max(0, totalKerja - hadirLengkap - sakit - cutiTahunan);
          let percentage = ((hadirLengkap / totalKerja) * 100).toFixed(1);
          
          table.row.add([
            index++,
            `<div class="text-start fw-bold">${u.nama}</div><small class="text-muted">${u.nip || '-'}</small>`,
            totalKerja,
            hadirLengkap, // LGKP
            0, // H-MSK
            0, // H-PLG
            0, 0, 0, // Jam, Menit, Kali (Keterlambatan)
            tKet, // T.KET
            0, 0, // DD, DL
            cutiTahunan, // THN
            0, // BSR
            sakit, // SKT
            0, 0, // CAP, LHR
            `<span class="${percentage >= 80 ? 'text-success' : 'text-danger'} fw-bold">${percentage}%</span>`
          ]);
        });
        
        table.draw();
      } else {
        App.showToast('Gagal memuat rekapitulasi', 'error');
      }
    }).catch(err => {
      if(filterBtn) {
        filterBtn.innerHTML = '<i class="bi bi-search me-2"></i>Filter';
        filterBtn.disabled = false;
      }
      App.showToast('Koneksi bermasalah', 'error');
    });
  }
});
