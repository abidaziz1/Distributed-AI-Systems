// Print the minutes of each chapter on each path, and the number of scenes of each type.
// Run: node dev/stats.js .
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.woff2': 'font/woff2' };
(async () => {
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
    const f = path.join(root, p);
    if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.statusCode = 404; return res.end(); }
    res.setHeader('Content-Type', types[path.extname(f)] || 'application/octet-stream'); fs.createReadStream(f).pipe(res);
  });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const b = await chromium.launch();
  const page = await b.newPage();
  await page.goto('http://127.0.0.1:' + srv.address().port + '/index.html');
  await page.waitForTimeout(400);
  const out = await page.evaluate(() => {
    const A = LAB.app, tracks = LAB.config.tracks, res = {};
    tracks.forEach(t => { A.setTrack(t.id); res[t.id] = LAB.chapters.map(ch => [ch.n, ch.title, A.missionMinutes(ch.index)]); });
    const counts = {};
    LAB.chapters.forEach(ch => ch.scenes.forEach(s => { counts[s.type] = (counts[s.type] || 0) + 1; }));
    return { tracks: tracks.map(t => [t.id, t.name]), res, counts };
  });
  const ids = out.tracks.map(t => t[0]);
  console.log('| # | Chapter | ' + out.tracks.map(t => t[1]).join(' | ') + ' |\n| --- | --- | ' + ids.map(() => '---').join(' | ') + ' |');
  out.res[ids[0]].forEach((r, i) => console.log('| ' + (r[0] || 'start') + ' | ' + r[1] + ' | ' + ids.map(id => out.res[id][i][2] + ' min').join(' | ') + ' |'));
  console.log('\nTotal minutes: ' + ids.map(id => id + ' ' + out.res[id].reduce((s, r) => s + r[2], 0)).join(', '));
  console.log('Scenes by type: ' + JSON.stringify(out.counts));
  await b.close(); srv.close();
})();
