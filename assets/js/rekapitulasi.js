$(document).ready(function() {
let table = $('#tableRekap').DataTable({
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
  
  const filterBtn = document.querySelector('form.row button');
  if (filterBtn) {
    filterBtn.addEventListener('click', (e) => {
      e.preventDefault();
      loadRekapitulasi();
    });
  }

  function loadRekapitulasi() {
    const selects = document.querySelectorAll('form.row select');
    const month = selects[0] ? selects[0].value : '07';
    const year = selects[1] ? selects[1].value : '2026';
    const typeFilter = selects[2] ? selects[2].value : 'Semua';
    
    if (filterBtn) {
      filterBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Loading...';
      filterBtn.disabled = true;
    }
    
    App.fetchAPI('getDatabase', {}, 'GET').then(res => {
      if(filterBtn) {
        filterBtn.innerHTML = '<i class="bi bi-search me-2"></i>Filter';
        filterBtn.disabled = false;
      }
      
      if(res && res.success && res.data) {
        // Destroy existing DataTables instance to rebuild it
        if ($.fn.DataTable.isDataTable('#tableRekap')) {
          $('#tableRekap').DataTable().destroy();
        }
        
        const data = res.data;
        let index = 1;
        let tbodyHtml = '';
        
        if (data.users && data.users.length > 0) {
          data.users.forEach(u => {
            try {
              if (u.role === 'Admin' || u.status === 'Admin') return;
              if (typeFilter !== 'Semua' && u.status !== typeFilter) return;
            
              let hadirLengkap = 0;
              let sakit = 0;
              let cutiTahunan = 0;
              
              if (data.attendance && data.attendance.length > 0) {
                data.attendance.forEach(a => {
                  if (a.username === u.username || a.username === u.nip) {
                    const dateStr = a.timestamp ? String(a.timestamp).split(',')[0].split('T')[0] : '';
                    if (dateStr.startsWith(`${year}-${month}`)) {
                      hadirLengkap++;
                    }
                  }
                });
              }
              
              if (data.permits && data.permits.length > 0) {
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
              }
              
              let totalKerja = 22; 
              let tKet = Math.max(0, totalKerja - hadirLengkap - sakit - cutiTahunan);
              let percentage = ((hadirLengkap / totalKerja) * 100).toFixed(1);
              let badgeColor = percentage >= 80 ? 'text-success' : 'text-danger';
              
              tbodyHtml += `
                <tr>
                  <td>${index++}</td>
                  <td><div class="text-start fw-bold">${u.nama || '-'}</div><small class="text-muted">${u.nip || '-'}</small></td>
                  <td>${totalKerja}</td>
                  <td>${hadirLengkap}</td>
                  <td>0</td>
                  <td>0</td>
                  <td>0</td>
                  <td>0</td>
                  <td>0</td>
                  <td>${tKet}</td>
                  <td>0</td>
                  <td>0</td>
                  <td>${cutiTahunan}</td>
                  <td>0</td>
                  <td>${sakit}</td>
                  <td>0</td>
                  <td>0</td>
                  <td><span class="${badgeColor} fw-bold">${percentage}%</span></td>
                </tr>
              `;
            } catch (e) {
              console.error("Error processing user:", u, e);
              tbodyHtml += `<tr><td>${index++}</td><td class="text-danger fw-bold">ERROR</td><td colspan="16">${e.message}</td></tr>`;
            }
          });
        }
        
        // Inject HTML
        $('#tableRekap tbody').html(tbodyHtml);
        
        // Re-initialize DataTable
        table = $('#tableRekap').DataTable({
          language: { url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/id.json' },
          scrollX: true,
          ordering: false
        });
        
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
