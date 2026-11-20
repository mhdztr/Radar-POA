/**
 * tests/visual_audit.js
 * Playwright headless Chromium visual & layout audit harness for Radar POA.
 * Excluded from GAS push via .claspignore (tests/**).
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const vm = require('vm');
const { chromium } = require('/home/pinefeast/node_modules/playwright');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = '/home/pinefeast/.gemini/antigravity/brain/158eb089-069b-468c-89b1-e87731c2c7df/scratch/screenshots';

function buildCompiledHtml() {
  let html = fs.readFileSync(path.join(ROOT, 'html/Index.html'), 'utf8');
  html = html.replace(/<\?!=?\s*html_include\(['"]([^'"]+)['"]\);\s*\?>/g, (_, target) => {
    const filePath = path.join(ROOT, target + '.html');
    return fs.readFileSync(filePath, 'utf8');
  });
  return html;
}

function buildBackendFixture() {
  const ctx = {
    console,
    Date,
    Math,
    Number,
    String,
    Object,
    Array,
    JSON,
    Logger: { log: () => {} },
    Utilities: {
      formatDate: () => '2026-06-15'
    },
    CacheService: {
      getScriptCache: () => ({
        get: (k) => (k === 'DASH_TX_VERSION' ? '14' : null),
        put: () => {}
      })
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: () => null
      })
    },
    _requireSession: (token) => {
      if (token !== 'DEMO_DIR_TOKEN') throw new Error('UNAUTHORIZED');
      return {
        userId: 'USR-DIR-01',
        nama: 'Ir. Haryo Prakoso, M.Si.',
        email: 'direktur.poa@kkp.go.id',
        role: 'DIREKTUR',
        status: 'APPROVED',
        divisiId: null
      };
    },
    assertScope: () => {},
    getCurrentPeriode: () => '2026-W24',
    utils_getTrendMonths: () => ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'],
    openMasterSheet: () => ({}),
    sheetToObjects: () => [
      { KapalID: 'KP-ORCA-01', Nama: 'KP. ORCA 01', Kelas: 'ORCA (60m)', Homebase_UPT: 'Pangkalan Ambon', StatusAktif: true },
      { KapalID: 'KP-ORCA-05', Nama: 'KP. ORCA 05', Kelas: 'ORCA (60m)', Homebase_UPT: 'Pangkalan Bitung', StatusAktif: true }
    ],
    readSatelliteRows: (keys, sheetName) => {
      if (sheetName === 'TX_Penugasan_Kapal') {
        return {
          connected: true,
          rows: [
            { KapalID: 'KP-ORCA-01', PegawaiID: 'AWK-001', PosSijil: 'Nakhoda', TanggalNaik: '2026-01-10', TanggalTurun: '' },
            { KapalID: 'KP-ORCA-01', PegawaiID: 'AWK-002', PosSijil: 'KKM / Chief Engineer', TanggalNaik: '2026-01-10', TanggalTurun: '' },
            { KapalID: 'KP-ORCA-01', PegawaiID: 'AWK-003', PosSijil: 'Mualim I', TanggalNaik: '2026-02-01', TanggalTurun: '' },
            { KapalID: 'KP-ORCA-01', PegawaiID: 'AWK-004', PosSijil: 'Masinis II', TanggalNaik: '2026-02-05', TanggalTurun: '' },
            { KapalID: 'KP-ORCA-01', PegawaiID: 'AWK-005', PosSijil: 'Juru Mudi', TanggalNaik: '2026-03-01', TanggalTurun: '' }
          ]
        };
      }
      if (sheetName === 'Master_Awak') {
        return {
          connected: true,
          rows: [
            { PegawaiID: 'AWK-001', Nama: 'Capt. M. Ridwan, S.St.Pi.', KategoriKepegawaian: 'PNS' },
            { PegawaiID: 'AWK-002', Nama: 'Hendra Wijaya, A.Md.', KategoriKepegawaian: 'PNS' },
            { PegawaiID: 'AWK-003', Nama: 'Budi Santoso, S.Pi.', KategoriKepegawaian: 'P3K' },
            { PegawaiID: 'AWK-004', Nama: 'Rahmat Hidayat', KategoriKepegawaian: 'P3K' },
            { PegawaiID: 'AWK-005', Nama: 'Dedi Kurniawan', KategoriKepegawaian: 'PJLP' }
          ]
        };
      }
      if (sheetName === 'TX_BMN_Aset') {
        return {
          connected: true,
          rows: [
            { KapalID: 'KP-ORCA-01', KodeBarang: '3.09.01.01.002-11', NamaBarang: 'Radar Navigasi X-Band Furuno', Kondisi: 'BAIK', NilaiBuku: 840000000 },
            { KapalID: 'KP-ORCA-01', KodeBarang: '3.09.01.04.008-04', NamaBarang: 'Rigid Inflatable Boat (RIB) Patroli', Kondisi: 'BAIK', NilaiBuku: 425000000 },
            { KapalID: 'KP-ORCA-01', KodeBarang: '3.06.03.11.003-09', NamaBarang: 'Perangkat Komunikasi Satelit VSAT', Kondisi: 'RUSAK_RINGAN', NilaiBuku: 190000000 }
          ]
        };
      }
      return { connected: false, rows: [] };
    },
    agg_collectAll: () => ({
      meta: {
        syncedAt: new Date().toISOString(),
        fromCache: false,
        cacheTtlSec: 900,
        periodeAktif: '2026-W24',
        year: 2026
      },
      satellites: {
        PUSAT:   { label: 'Pusat (Dit. POA)',  connected: true },
        SIKAP:   { label: 'SIKAP (TU)',        connected: true },
        NAKHODA: { label: 'Nakhoda (Awak)',    connected: true },
        SISTIK:  { label: 'Sistik (Logistik)', connected: false, error: 'Menunggu integrasi' },
        SIAGA:   { label: 'Siaga (Harwat)',    connected: false, error: 'Menunggu integrasi' },
        OPERASI: { label: 'Operasi & Pantau',  connected: false, error: 'Menunggu integrasi' }
      },
      sikap: {
        connected: true,
        melaporMingguIni: true,
        anggaran: {
          paguTotal: 128400000000,
          paguReguler: 108400000000,
          paguABT: 20000000000,
          realisasiSP2D: 83200000000,
          realisasiAkrual: 89600000000,
          sp2dPct: 64.8,
          akrualPct: 69.8,
          sisaSP2D: 45200000000,
          sp2dMonthly:   [8200000000, 12400000000, 14900000000, 15100000000, 16200000000, 16400000000],
          akrualMonthly: [9100000000, 13600000000, 15800000000, 16400000000, 17100000000, 17600000000]
        },
        paket: { totalPaket: 42, totalNilaiKontrak: 64500000000, totalRealisasiKeu: 41800000000, avgProgresFisik: 71.4 },
        bmn: {
          totalUnit: 1248,
          totalNilaiPerolehan: 1420000000000,
          totalNilaiBuku: 985000000000,
          kondisi: { BAIK: 1126, RUSAK_RINGAN: 94, RUSAK_BERAT: 28 },
          dalamPenghapusan: 12
        },
        kepegawaian: { totalPegawaiPOA: 514, disparitasNakhoda: 2 }
      },
      nakhoda: {
        connected: true,
        melaporMingguIni: true,
        akn: {
          keseluruhan: 512,
          poa: 396,
          byKategori: {
            PNS:             { keseluruhan: 248, poa: 196 },
            P3K:             { keseluruhan: 132, poa: 104 },
            P3K_PARUH_WAKTU: { keseluruhan: 64,  poa: 48 },
            PJLP:            { keseluruhan: 68,  poa: 48 }
          }
        },
        kompetensi: { totalSertifikat: 432, berlaku: 388, segeraHabis: 28, kedaluwarsa: 16 },
        sijil: { totalKapalEvaluasi: 34, laikAwak: 31, kurangAwak: 3, totalAwakOnBoard: 374 }
      },
      pusat: {
        kegiatanYtd: 19,
        kegiatanPeriode: 4,
        terakhirDicatat: '2026-06-14T14:20:00+07:00'
      }
    })
  };

  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'utils/Constants.js'), 'utf8'), ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'services/DashboardService.js'), 'utf8'), ctx);

  const token = 'DEMO_DIR_TOKEN';
  return {
    overview: ctx.dashboard_getOverview(token, { mode: 'monthly', month: 6, year: 2026 }),
    kapalTerbaik: ctx.dashboard_getScoringKapalTerbaik(token, { year: 2026, triwulan: 2 }),
    profilOrca01: ctx.dashboard_profilKapal(token, { kapalId: 'KP-ORCA-01' }),
    profilOrca05: ctx.dashboard_profilKapal(token, { kapalId: 'KP-ORCA-05' }),
    syncNow: { success: true, data: ctx.agg_collectAll(null, true) }
  };
}

function buildMockInitScript(fixtures) {
  return `
    (function () {
      const F = ${JSON.stringify(fixtures)};
      const DEMO_USER = {
        userId: 'USR-DIR-01',
        nama: 'Ir. Haryo Prakoso, M.Si.',
        email: 'direktur.poa@kkp.go.id',
        role: 'DIREKTUR',
        status: 'APPROVED',
        divisiId: null
      };
      const DIVISI_LIST = [
        { divisiId: 'DIV-TU',     namaDashboard: 'Tata Usaha (SIKAP)',   namaResmi: 'Subbagian Tata Usaha' },
        { divisiId: 'DIV-AWAK',   namaDashboard: 'Pengawakan (Nakhoda)', namaResmi: 'Timja Pengawakan & Personel' },
        { divisiId: 'DIV-LOG',    namaDashboard: 'Logistik (Sistik)',    namaResmi: 'Timja Logistik & Sarpras' },
        { divisiId: 'DIV-RAWAT',  namaDashboard: 'Pemeliharaan (Siaga)', namaResmi: 'Timja Pemeliharaan Kapal' }
      ];
      const runObj = {};
      function cloneWith(base, patch) {
        const next = Object.create(base);
        Object.assign(next, patch);
        return next;
      }
      function respond(runner, payload) {
        const ok = runner._ok;
        const err = runner._err;
        setTimeout(() => {
          if (payload && payload.success === false && typeof err === 'function' && !ok) {
            err(new Error(payload.error || 'Error'));
          } else if (typeof ok === 'function') {
            ok(payload);
          }
        }, 20);
      }
      Object.assign(runObj, {
        _ok: null,
        _err: null,
        withSuccessHandler(fn) { return cloneWith(this, { _ok: fn }); },
        withFailureHandler(fn) { return cloneWith(this, { _err: fn }); },
        auth_getDivisiList() { respond(this, { success: true, data: DIVISI_LIST }); },
        auth_getSessionInfo(token) {
          if (token === 'DEMO_DIR_TOKEN') respond(this, { success: true, data: DEMO_USER });
          else respond(this, { success: false, error: 'No session' });
        },
        auth_login() { respond(this, { success: true, data: { token: 'DEMO_DIR_TOKEN', user: DEMO_USER } }); },
        auth_logout() { respond(this, { success: true }); },
        app_getSyncState() {
          respond(this, {
            success: true,
            data: {
              txVersion: 14,
              unreadNotif: 3,
              queueCount: 2,
              lastTxMetadata: { timestamp: new Date().toISOString(), sheet: 'Federasi Satelit' },
              serverTime: new Date().toISOString()
            }
          });
        },
        auth_getPendingApprovals() {
          respond(this, {
            success: true,
            data: [
              { queueId: 'Q-01', nama: 'Capt. Ahmad Fauzi', email: 'ahmad.fauzi@kkp.go.id', namaDivisi: 'Pengawakan', roleDilamar: 'STAF', registeredAt: '2026-06-14T10:00:00Z' },
              { queueId: 'Q-02', nama: 'Rina Kusuma, S.Kom.', email: 'rina.kusuma@kkp.go.id', namaDivisi: 'Tata Usaha', roleDilamar: 'STAF', registeredAt: '2026-06-15T08:15:00Z' }
            ]
          });
        },
        notifikasi_getRingkasan() { respond(this, { success: true, data: { unreadCount: 3, divisiBelumMelapor: null } }); },
        dashboard_getOverview() { respond(this, F.overview); },
        radar_triggerSyncNow() { respond(this, F.syncNow); },
        dashboard_getScoringKapalTerbaik() { respond(this, F.kapalTerbaik); },
        dashboard_profilKapal(token, params) {
          const id = params && params.kapalId;
          if (id === 'KP-ORCA-05') respond(this, F.profilOrca05);
          else respond(this, F.profilOrca01);
        },
        master_getWppList() { respond(this, { success: true, data: [] }); },
        master_getKapalList() { respond(this, { success: true, data: [] }); },
        utils_getCartoKey() { respond(this, ''); },
        riwayat_getAll() { respond(this, { success: true, data: { rows: [] } }); },
        kegiatan_getList() { respond(this, { success: true, data: { rows: [] } }); },
        notifikasi_getList() { respond(this, { success: true, data: { rows: [] } }); },
        admin_getUsers() { respond(this, { success: true, data: [] }); }
      });
      window.google = { script: { run: runObj } };
    })();
  `;
}

async function inspectPage(page, name) {
  await page.waitForTimeout(600);
  const report = await page.evaluate(() => {
    const docW = document.documentElement.scrollWidth;
    const winW = window.innerWidth;
    const audit = typeof window._uiAudit === 'function' ? window._uiAudit() : null;
    const imgs = Array.from(document.querySelectorAll('img')).filter((i) => i.offsetParent !== null);
    const brokenImgs = imgs.filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.alt || i.src.slice(0, 40));
    const finding = document.getElementById('page-finding');
    return {
      overflowX: docW - winW,
      docW,
      winW,
      brokenImgs,
      findingVisible: finding ? !finding.classList.contains('n-hidden') : false,
      findingText: finding ? finding.textContent : '',
      uiAudit: audit ? { pass: audit.pass, checked: audit.containersChecked, violations: audit.violations } : null
    };
  });
  console.log(`[AUDIT] ${name}:`, JSON.stringify(report));
  return report;
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const html = buildCompiledHtml();
  const fixtures = buildBackendFixture();
  const initScript = buildMockInitScript(fixtures);

  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const url = `http://127.0.0.1:${port}/`;

  const browser = await chromium.launch({ headless: true });
  const consoleErrors = [];
  const pageErrors = [];

  try {
    // ── 1. Desktop Auth Login ──
    const ctxDesktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    await ctxDesktop.addInitScript(initScript);
    const page = await ctxDesktop.newPage();
    page.on('console', (m) => {
      if (m.type() === 'error') {
        consoleErrors.push(m.text());
        console.log('[PAGE CONSOLE ERR]:', m.text());
      }
    });
    page.on('pageerror', (e) => {
      pageErrors.push(e.message);
      console.log('[PAGE RUNTIME ERR]:', e.message);
    });

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForSelector('#v-login:not(.n-hidden)', { timeout: 10000 });
    await page.waitForTimeout(400);
    await inspectPage(page, 'login-desktop');
    await page.screenshot({ path: path.join(OUT_DIR, '01-login-desktop.png') });

    // ── 2. Mobile Auth Login ──
    const ctxMobile = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    await ctxMobile.addInitScript(initScript);
    const mPage = await ctxMobile.newPage();
    await mPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await mPage.waitForSelector('#v-login:not(.n-hidden)', { timeout: 10000 });
    await mPage.waitForTimeout(400);
    await inspectPage(mPage, 'login-mobile');
    await mPage.screenshot({ path: path.join(OUT_DIR, '02-login-mobile.png') });

    // ── 3. Authenticated Desktop Overview (real login submit) ──
    await page.fill('#login-email', 'direktur.poa@kkp.go.id');
    await page.fill('#login-password', 'RadarPOA2026!');
    await page.click('#btn-login');
    await page.waitForSelector('#app-wrapper:not(.n-hidden)', { timeout: 10000 });
    await page.waitForSelector('#ov-div-grid .div-card:not(.loading)', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1800);
    await inspectPage(page, 'overview-desktop');
    await page.screenshot({ path: path.join(OUT_DIR, '03-overview-viewport.png') });
    await page.screenshot({ path: path.join(OUT_DIR, '03-overview-full.png'), fullPage: true });

    // ── 4. Authenticated Mobile Overview ──
    await mPage.fill('#login-email', 'direktur.poa@kkp.go.id');
    await mPage.fill('#login-password', 'RadarPOA2026!');
    await mPage.click('#btn-login');
    await mPage.waitForSelector('#app-wrapper:not(.n-hidden)', { timeout: 10000 });
    await mPage.waitForTimeout(1500);
    await inspectPage(mPage, 'overview-mobile');
    await mPage.screenshot({ path: path.join(OUT_DIR, '04-overview-mobile.png'), fullPage: true });

    // ── 5. Kapal Terbaik ──
    await page.evaluate(() => _routeTo('kapal-terbaik'));
    await page.waitForSelector('#kt-table-body tr .n-badge', { timeout: 10000 });
    await inspectPage(page, 'kapal-terbaik-desktop');
    await page.screenshot({ path: path.join(OUT_DIR, '05-kapal-terbaik-desktop.png'), fullPage: true });

    // ── 6. Profil Kapal ──
    await page.evaluate(() => _openProfilKapal('KP-ORCA-01'));
    await page.waitForSelector('#pk-tables .n-table', { timeout: 10000 });
    await inspectPage(page, 'profil-kapal-desktop');
    await page.screenshot({ path: path.join(OUT_DIR, '06-profil-kapal-desktop.png'), fullPage: true });

    console.log('[CONSOLE ERRORS]:', consoleErrors.length, consoleErrors);
    console.log('[PAGE ERRORS]:', pageErrors.length, pageErrors);
  } finally {
    await browser.close();
    server.close();
  }
})();
