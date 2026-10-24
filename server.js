// Optional static server for the production build (`npm run build && npm start`).
// Multiplayer rooms are peer-to-peer (see src/utils/room.js), so no game backend is needed —
// the same build runs on GitHub Pages.
const express = require('express');
const os = require('os');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;
const distPath = path.join(__dirname, 'dist');

function getLocalIpAddress() {
  for (const iface of Object.values(os.networkInterfaces())) {
    for (const alias of iface || []) {
      if (alias.family === 'IPv4' && !alias.internal) return alias.address;
    }
  }
  return 'localhost';
}

if (!fs.existsSync(distPath)) {
  console.error('No dist/ folder found. Run `npm run build` first.');
  process.exit(1);
}

// The build uses base '/MonkeyRacer/' to match GitHub Pages
app.use('/MonkeyRacer', express.static(distPath));
app.get('/', (req, res) => res.redirect('/MonkeyRacer/'));
app.use('/MonkeyRacer', (req, res) => res.sendFile(path.join(distPath, 'index.html')));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 MonkeyRacer running at http://localhost:${PORT}/MonkeyRacer/`);
  console.log(`📱 On your network: http://${getLocalIpAddress()}:${PORT}/MonkeyRacer/`);
});
