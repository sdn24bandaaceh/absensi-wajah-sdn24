const fs = require('fs');
const path = require('path');

const dir = __dirname;
const htmlFiles = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const manajemenLinks = [
  { href: 'pegawai.html', icon: 'bi-people-fill', text: 'Data Pegawai' },
  { href: 'kelola-izin.html', icon: 'bi-envelope-check-fill', text: 'Kelola Izin' },
  { href: 'absen-manual.html', icon: 'bi-person-check-fill', text: 'Absen Manual' },
  { href: 'absen-massal.html', icon: 'bi-people-fill', text: 'Absen Massal' },
  { href: 'rekapitulasi.html', icon: 'bi-table', text: 'Rekapitulasi' },
  { href: 'laporan.html', icon: 'bi-file-earmark-bar-graph-fill', text: 'Laporan' }
];

htmlFiles.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Skip files without a sidebar
  if (!content.includes('MANAJEMEN')) return;

  // Generate new MANAJEMEN section
  let newManajemen = '<li class="nav-item mt-3 mb-1 px-4 text-muted small fw-bold">MANAJEMEN</li>\n';
  
  manajemenLinks.forEach(link => {
    const activeClass = file === link.href ? ' active' : '';
    newManajemen += `        <li class="nav-item">\n`;
    newManajemen += `          <a class="nav-link${activeClass}" href="${link.href}"><i class="bi ${link.icon}"></i> ${link.text}</a>\n`;
    newManajemen += `        </li>\n`;
  });

  // Replace everything between MANAJEMEN and PENGATURAN
  const regex = /<li class="nav-item mt-3 mb-1 px-4 text-muted small fw-bold">MANAJEMEN<\/li>[\s\S]*?(?=<li class="nav-item mt-3 mb-1 px-4 text-muted small fw-bold">PENGATURAN<\/li>)/;
  
  if (regex.test(content)) {
    content = content.replace(regex, newManajemen + '        \n        ');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated sidebar in ${file}`);
  }
});

console.log('Sidebar updates complete!');
