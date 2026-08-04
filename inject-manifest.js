const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let html = fs.readFileSync(filePath, 'utf-8');
  
  if (!html.includes('manifest.json')) {
    html = html.replace('</head>', '  <!-- PWA Manifest -->\n  <link rel="manifest" href="manifest.json">\n</head>');
    fs.writeFileSync(filePath, html, 'utf-8');
    console.log('Injected manifest to ' + file);
  }
});
console.log('Done injecting manifest to master HTML files.');
