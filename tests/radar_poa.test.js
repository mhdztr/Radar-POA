/**
 * tests/radar_poa.test.js
 * Fase 7 Comprehensive Unit & Integration Test Suite (Node VM Sandbox):
 *   - AuthService: auto-seed 4 akun default, multi-identifier login (Email / NIP / Alias),
 *     brute-force lockout 5x, auth_getSessionInfo, auth_logout
 *   - AggregatorService: federasi SIKAP + Nakhoda + Pusat, CacheService 15 menit, radar_triggerSyncNow
 *   - DashboardService: dashboard_getOverview (4 KPI + executiveGrid + 34 kapal KELAS_I–IV),
 *     dashboard_getScoringKapalTerbaik (podium exclude GALANGAN), dashboard_profilKapal
 *   - RiwayatService: timeline lintas satelit & RBAC per divisi / STAF
 *   - AdminService: admin_getSatelliteConfig & admin_saveSatelliteConfig (SUPERADMIN-only, URL/ID parsing, cache invalidation)
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

function createFullRadarSandbox() {
  const propsStore = new Map();
  const cacheStore = new Map();
  const spreadsheets = new Map();
  const triggers = [];
  const logs = [];
  let seq = 1;

  function makeRange(sheetData, row, col, numRows = 1, numCols = 1) {
    return {
      getValues() {
        const out = [];
        for (let r = 0; r < numRows; r++) {
          const srcRow = sheetData[row - 1 + r] || [];
          const rowOut = [];
          for (let c = 0; c < numCols; c++) {
            const val = srcRow[col - 1 + c];
            rowOut.push(val === undefined ? '' : val);
          }
          out.push(rowOut);
        }
        return out;
      },
      setValues(values) {
        for (let r = 0; r < values.length; r++) {
          const ri = row - 1 + r;
          while (sheetData.length <= ri) sheetData.push([]);
          for (let c = 0; c < values[r].length; c++) {
            sheetData[ri][col - 1 + c] = values[r][c];
          }
        }
        return this;
      },
      setValue(val) {
        const ri = row - 1;
        while (sheetData.length <= ri) sheetData.push([]);
        sheetData[ri][col - 1] = val;
        return this;
      },
      setFontWeight() { return this; },
      setBackground() { return this; },
      setFontColor() { return this; },
      setVerticalAlignment() { return this; },
      setNumberFormat() { return this; }
    };
  }

  function makeSheet(name) {
    const data = [];
    return {
      getName() { return name; },
      getLastRow() { return data.length; },
      getLastColumn() { return data[0] ? data[0].length : 0; },
      getDataRange() {
        const rows = Math.max(data.length, 1);
        const cols = Math.max(data[0] ? data[0].length : 1, 1);
        return makeRange(data, 1, 1, rows, cols);
      },
      getRange(r, c, nr = 1, nc = 1) {
        return makeRange(data, r, c, nr, nc);
      },
      appendRow(arr) { data.push(arr.slice()); },
      setFrozenRows() { return this; },
      setRowHeight() { return this; },
      autoResizeColumn() { return this; },
      insertColumnAfter(col) {
        for (let r = 0; r < data.length; r++) data[r].splice(col, 0, '');
      },
      _raw: data
    };
  }

  function makeSpreadsheet(id, name) {
    const sheets = [makeSheet('Sheet1')];
    return {
      getId() { return id; },
      getName() { return name; },
      getSheets() { return sheets.slice(); },
      getSheetByName(n) { return sheets.find((s) => s.getName() === n) || null; },
      insertSheet(n) {
        const s = makeSheet(n);
        sheets.push(s);
        return s;
      },
      deleteSheet(s) {
        const idx = sheets.indexOf(s);
        if (idx !== -1) sheets.splice(idx, 1);
      }
    };
  }

  const sandbox = {
    console, Date, Math, JSON, Array, Object, String, Number, Boolean, RegExp, Error,
    SpreadsheetApp: {
      create(name) {
        const id = '1RADARPOA_DEMO_SS_ID_' + String(seq++).padStart(4, '0');
        const ss = makeSpreadsheet(id, name);
        spreadsheets.set(id, ss);
        return ss;
      },
      openById(id) {
        const ss = spreadsheets.get(id);
        if (!ss) throw new Error('Spreadsheet not found: ' + id);
        return ss;
      },
      flush() {}
    },
    DriveApp: {
      getFilesByName(name) {
        const hits = [];
        for (const ss of spreadsheets.values()) {
          if (ss.getName() === name) {
            hits.push({ getId: () => ss.getId(), getName: () => ss.getName() });
          }
        }
        let i = 0;
        return {
          hasNext() { return i < hits.length; },
          next() { return hits[i++]; }
        };
      }
    },
    ScriptApp: {
      WeekDay: { FRIDAY: 'FRIDAY' },
      getProjectTriggers() { return triggers.slice(); },
      deleteTrigger(t) {
        const idx = triggers.findIndex((x) => x.getUniqueId() === t.getUniqueId());
        if (idx !== -1) triggers.splice(idx, 1);
      },
      newTrigger(handlerName) {
        return {
          timeBased() {
            const cfg = { handlerName };
            const builder = {
              everyDays() { return builder; },
              atHour() { return builder; },
              onWeekDay() { return builder; },
              everyWeeks() { return builder; },
              create() {
                const trgId = 'TRG-' + (seq++);
                const trg = { getUniqueId: () => trgId, getHandlerFunction: () => cfg.handlerName };
                triggers.push(trg);
                return trg;
              }
            };
            return builder;
          }
        };
      }
    },
    PropertiesService: {
      getScriptProperties() {
        return {
          getProperty(k) { return propsStore.has(k) ? propsStore.get(k) : null; },
          setProperty(k, v) { propsStore.set(k, String(v)); },
          deleteProperty(k) { propsStore.delete(k); },
          getProperties() { return Object.fromEntries(propsStore.entries()); }
        };
      }
    },
    CacheService: {
      getScriptCache() {
        return {
          get(k) { return cacheStore.has(k) ? cacheStore.get(k) : null; },
          put(k, v) { cacheStore.set(k, String(v)); },
          remove(k) { cacheStore.delete(k); }
        };
      }
    },
    LockService: {
      getScriptLock() { return { waitLock() {}, releaseLock() {} }; }
    },
    Utilities: {
      DigestAlgorithm: { SHA_256: 'SHA_256' },
      Charset: { UTF_8: 'UTF_8' },
      getUuid() { return crypto.randomUUID(); },
      computeDigest(_alg, input) {
        const buf = crypto.createHash('sha256').update(String(input), 'utf8').digest();
        return Array.from(buf, (b) => (b > 127 ? b - 256 : b));
      },
      formatDate(d) {
        const dt = d instanceof Date ? d : new Date(d);
        const m = dt.getMonth() + 1;
        const day = dt.getDate();
        return dt.getFullYear() + '-' + (m < 10 ? '0' + m : m) + '-' + (day < 10 ? '0' + day : day);
      }
    },
    Logger: { log(msg) { logs.push(String(msg)); } },
    MailApp: { sendEmail() {} },
    _inspect: { propsStore, cacheStore, spreadsheets, triggers, logs }
  };

  vm.createContext(sandbox);
  const files = [
    'utils/Constants.js',
    'utils/DateUtil.js',
    'utils/Lock.js',
    'data/SheetAccess.js',
    'services/AuthService.js',
    'services/AggregatorService.js',
    'services/DashboardService.js',
    'services/EvidenceService.js',
    'services/KegiatanDirektoratService.js',
    'services/LookerMartService.js',
    'services/RiwayatService.js',
    'services/AdminService.js',
    'Code.js'
  ];
  for (const rel of files) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), sandbox, { filename: rel });
  }
  return sandbox;
}

function seedSatellites(sb) {
  const props = sb.PropertiesService.getScriptProperties();

  const sikap = sb.SpreadsheetApp.create('RadarPOA_SIKAP_DB');
  props.setProperty('SIKAP_SS_ID', sikap.getId());
  const tu = sikap.insertSheet('TX_TataUsaha');
  tu.getRange(1, 1, 1, 12).setValues([[
    'RowID', 'DivisiID', 'Periode', 'SubmittedBy', 'Timestamp', 'Status',
    'PaguReguler', 'PaguABT', 'RealisasiSP2D_Reguler_Minggu', 'RealisasiSP2D_ABT_Minggu',
    'RealisasiSP2D_Minggu', 'RealisasiAkrual_Minggu'
  ]]);
  tu.appendRow([
    'TU-2026-01', 'DIV-TU', '2026-06-W02', 'USR-STAF-02', '2026-06-14T09:00:00Z', 'ACTIVE',
    800000000, 200000000, 500000000, 150000000, 650000000, 700000000
  ]);

  const nakhoda = sb.SpreadsheetApp.create('RadarPOA_Nakhoda_DB');
  props.setProperty('NAKHODA_SS_ID', nakhoda.getId());
  const akn = nakhoda.insertSheet('TX_Pengawakan_AKN');
  akn.getRange(1, 1, 1, 7).setValues([[
    'RowID', 'DivisiID', 'Periode', 'SubmittedBy', 'Timestamp', 'Status', 'Scope', 'Kategori', 'Jumlah'
  ]]);
  // Fix column count match
  akn._raw[0] = ['RowID', 'DivisiID', 'Periode', 'SubmittedBy', 'Timestamp', 'Status', 'Scope', 'Kategori', 'Jumlah'];
  akn.appendRow(['AKN-1', 'DIV-AWAK', '2026-06-W02', 'USR-KADIV-01', '2026-06-13T10:00:00Z', 'ACTIVE', 'KESELURUHAN', 'PNS', 248]);
  akn.appendRow(['AKN-2', 'DIV-AWAK', '2026-06-W02', 'USR-KADIV-01', '2026-06-13T10:00:00Z', 'ACTIVE', 'POA', 'PNS', 196]);
  akn.appendRow(['AKN-3', 'DIV-AWAK', '2026-06-W02', 'USR-KADIV-01', '2026-06-13T10:00:00Z', 'ACTIVE', 'KESELURUHAN', 'PJLP', 68]);
  akn.appendRow(['AKN-4', 'DIV-AWAK', '2026-06-W02', 'USR-KADIV-01', '2026-06-13T10:00:00Z', 'ACTIVE', 'POA', 'PJLP', 48]);

  return { sikapId: sikap.getId(), nakhodaId: nakhoda.getId() };
}

test('AuthService: auto-seed, Email/NIP/Alias login, session info, logout, and 5x lockout', () => {
  const sb = createFullRadarSandbox();
  const seed = sb.setup_seedSuperadmin();
  assert.equal(seed.success, true);
  assert.equal(seed.totalUsers, 4);

  // Login via normalized NIP with spaces & hyphens
  const nipLogin = sb.auth_login({ identifier: '19750410 200003 1001', password: 'DirekturPOA2026!' });
  assert.equal(nipLogin.success, true);
  assert.equal(nipLogin.data.user.role, 'DIREKTUR');

  // Session restore + logout
  const infoRes = sb.auth_getSessionInfo(nipLogin.data.token);
  assert.equal(infoRes.success, true);
  assert.equal(infoRes.data.email, 'direktur.poa@kkp.go.id');
  assert.equal(sb.auth_logout(nipLogin.data.token).success, true);
  assert.equal(sb.auth_getSessionInfo(nipLogin.data.token).success, false);

  // Alias login
  const aliasLogin = sb.auth_login({ identifier: 'kadiv', password: 'KadivPOA2026!' });
  assert.equal(aliasLogin.success, true);
  assert.equal(aliasLogin.data.user.role, 'KADIV');

  // Brute-force 5x wrong attempts locks account
  for (let i = 0; i < 5; i++) {
    const bad = sb.auth_login({ identifier: 'staf.poa@kkp.go.id', password: 'WrongPassword!' });
    assert.equal(bad.success, false);
  }
  const locked = sb.auth_login({ identifier: 'staf.poa@kkp.go.id', password: 'StafPOA2026!' });
  assert.equal(locked.success, false);
  assert.match(locked.error, /dikunci sementara/i);
});

test('AggregatorService & DashboardService: 15m cache, radar_triggerSyncNow, 34 fleet classes, & podium non-Galangan', () => {
  const sb = createFullRadarSandbox();
  sb.setup_seedSuperadmin();
  seedSatellites(sb);

  const dirTok = sb.auth_login({ identifier: 'direktur.poa@kkp.go.id', password: 'DirekturPOA2026!' }).data.token;
  const f = { mode: 'range', dateFrom: '2026-06-01', dateTo: '2026-12-31' };

  // First call caches result; second call returns fromCache: true
  const first = sb.agg_collectAll(f, false);
  assert.equal(first.meta.fromCache, false);
  assert.equal(first.satellites.SIKAP.connected, true);
  assert.equal(first.satellites.NAKHODA.connected, true);
  assert.equal(first.sikap.anggaran.sp2dPct, 65);

  const second = sb.agg_collectAll(f, false);
  assert.equal(second.meta.fromCache, true);

  // Manual sync invalidates cache & records SYNC_MANUAL audit entry
  const syncRes = sb.radar_triggerSyncNow(dirTok, f);
  assert.equal(syncRes.success, true);
  assert.equal(syncRes.data.meta.fromCache, false);

  // Dashboard Overview checks
  const ov = sb.dashboard_getOverview(dirTok, f);
  assert.equal(ov.success, true);
  assert.equal(ov.data.headline.length, 4);
  assert.ok(Array.isArray(Array.from(ov.data.executiveGrid)));
  assert.ok(ov.data.executiveGrid.length >= 6);
  assert.equal(ov.data.wppMap.fleet.length, 34);
  assert.ok(Array.from(ov.data.wppMap.fleet).every((ship) => /^KELAS_(I|II|III|IV|V)$/.test(ship.kelasKapal)));

  const tf = sb.dashboard_getTacticalFleet(dirTok);
  assert.equal(tf.success, true);
  assert.equal(tf.data.fleet.length, 34);

  // Kapal Terbaik excludes GALANGAN from Top 3 podium
  const kt = sb.dashboard_getScoringKapalTerbaik(dirTok, f);
  assert.equal(kt.success, true);
  assert.equal(kt.data.top3.length, 3);
  assert.ok(Array.from(kt.data.top3).every((s) => s.status !== 'GALANGAN'));
  assert.equal(kt.data.leaderboard.length, 34);

  // Profil Kapal combines vessel metadata
  const pk = sb.dashboard_profilKapal(dirTok, { kapalId: 'KP-ORCA-01' });
  assert.equal(pk.success, true);
  assert.equal(pk.data.kapal.kelasKapal, 'KELAS_I');
});

test('RiwayatService: federated timeline & RBAC scope (DIREKTUR vs STAF)', () => {
  const sb = createFullRadarSandbox();
  sb.setup_seedSuperadmin();
  seedSatellites(sb);

  const dirTok = sb.auth_login({ identifier: 'direktur.poa@kkp.go.id', password: 'DirekturPOA2026!' }).data.token;
  const stafTok = sb.auth_login({ identifier: 'staf.poa@kkp.go.id', password: 'StafPOA2026!' }).data.token;

  sb.kegiatanDirektorat_submit(dirTok, {
    judul: 'Rakor Lintas Unit', tanggal: '2026-06-14', deskripsi: 'Agenda pusat.'
  });

  const f = { mode: 'range', dateFrom: '2026-06-01', dateTo: '2026-12-31' };
  const riwDir = sb.riwayat_getAll(dirTok, f);
  assert.equal(riwDir.success, true);
  const sheetsDir = new Set(Array.from(riwDir.data, (r) => r.sheet));
  assert.ok(sheetsDir.has('TX_KegiatanDirektorat'));
  assert.ok(sheetsDir.has('TX_TataUsaha'));
  assert.ok(sheetsDir.has('TX_Pengawakan_AKN'));

  // STAF DIV-OPS must NOT see TX_KegiatanDirektorat nor DIV-TU/DIV-AWAK rows
  const riwStaf = sb.riwayat_getAll(stafTok, f);
  assert.equal(riwStaf.success, true);
  assert.equal(riwStaf.data.length, 0);
});

test('AdminService Satellite Config: SUPERADMIN CRUD, URL ID parsing, cache bump, & RBAC rejection', () => {
  const sb = createFullRadarSandbox();
  sb.setup_seedSuperadmin();
  const { sikapId } = seedSatellites(sb);

  const saTok = sb.auth_login({ identifier: 'superadmin@radarpoa.go.id', password: 'SuperAdmin2026!' }).data.token;
  const dirTok = sb.auth_login({ identifier: 'direktur.poa@kkp.go.id', password: 'DirekturPOA2026!' }).data.token;

  // Non-SUPERADMIN rejected
  assert.match(sb.admin_getSatelliteConfig(dirTok).error, /FORBIDDEN/);
  assert.match(sb.admin_saveSatelliteConfig(dirTok, { SISTIK_SS_ID: sikapId }).error, /FORBIDDEN/);

  // Create target spreadsheet to test full URL extraction
  const sistikSs = sb.SpreadsheetApp.create('RadarPOA_Sistik_DB');
  const fullUrl = 'https://docs.google.com/spreadsheets/d/' + sistikSs.getId() + '/edit#gid=0';

  const saveRes = sb.admin_saveSatelliteConfig(saTok, { SISTIK_SS_ID: fullUrl });
  assert.equal(saveRes.success, true, saveRes.error);
  assert.equal(saveRes.data.changed, true);
  assert.equal(sb.PropertiesService.getScriptProperties().getProperty('SISTIK_SS_ID'), sistikSs.getId());

  const cfgRes = sb.admin_getSatelliteConfig(saTok);
  assert.equal(cfgRes.success, true);
  const sistikItem = Array.from(cfgRes.data.items).find((x) => x.key === 'SISTIK_SS_ID');
  assert.equal(sistikItem.connected, true);
  assert.equal(sistikItem.spreadsheetName, 'RadarPOA_Sistik_DB');

  // Invalid ID rejected cleanly
  const badRes = sb.admin_saveSatelliteConfig(saTok, { SIAGA_SS_ID: 'abc' });
  assert.equal(badRes.success, false);

  // Clearing property works cleanly
  const clearRes = sb.admin_saveSatelliteConfig(saTok, { SISTIK_SS_ID: '' });
  assert.equal(clearRes.success, true);
  assert.equal(sb.PropertiesService.getScriptProperties().getProperty('SISTIK_SS_ID'), null);
});

test('AggregatorService & DashboardService: monthly split Reguler/ABT, Drive auto-discovery, & Terputus status badges', () => {
  const sb = createFullRadarSandbox();
  sb.setup_seedSuperadmin();
  const dirTok = sb.auth_login({ identifier: 'direktur.poa@kkp.go.id', password: 'DirekturPOA2026!' }).data.token;

  // 1. Disconnected state: Tata Usaha, BMN & Pengadaan, Pengawakan MUST show Terputus (warn), never Terkendali/Sinkron
  const discOv = sb.dashboard_getOverview(dirTok, { mode: 'monthly', month: 6, year: 2026 });
  assert.equal(discOv.success, true);
  assert.equal(discOv.data.sikap.connected, false);
  assert.equal(discOv.data.nakhoda.connected, false);
  const gridMap = Object.fromEntries(Array.from(discOv.data.executiveGrid, (g) => [g.unit, g]));
  assert.equal(gridMap['Tata Usaha'].statusTeks, 'Terputus');
  assert.equal(gridMap['BMN & Pengadaan'].statusTeks, 'Terputus');
  assert.equal(gridMap['BMN & Pengadaan'].statusTone, 'warn');
  assert.equal(gridMap['Pengawakan'].statusTeks, 'Terputus');
  assert.equal(gridMap['Pengawakan'].statusTone, 'warn');

  // 2. Drive auto-discovery when RadarPOA_SIKAP_DB exists without SIKAP_SS_ID property + split Reguler/ABT monthly sum
  const sikapSs = sb.SpreadsheetApp.create('RadarPOA_SIKAP_DB');
  const tu = sikapSs.insertSheet('TX_TataUsaha');
  tu.getRange(1, 1, 1, 11).setValues([[
    'RowID', 'DivisiID', 'Periode', 'SubmittedBy', 'Timestamp', 'Status',
    'PaguReguler', 'PaguABT', 'RealisasiSP2D_Reguler_Minggu', 'RealisasiSP2D_ABT_Minggu', 'RealisasiAkrual_Reguler_Minggu'
  ]]);
  tu.appendRow([
    'TU-AUTO-01', 'DIV-TU', '2026-06-W02', 'USR-STAF-02', '2026-06-14T10:00:00Z', 'ACTIVE',
    500000000, 100000000, 300000000, 60000000, 390000000
  ]);

  // Clear negative miss cache so resolveSatelliteSpreadsheetId discovers RadarPOA_SIKAP_DB
  sb.CacheService.getScriptCache().remove('SAT_AUTO_MISS_SIKAP_SS_ID');
  const resolvedId = sb.resolveSatelliteSpreadsheetId(['SIKAP_SS_ID', 'TU_SS_ID']);
  assert.equal(resolvedId, sikapSs.getId());
  assert.equal(sb.PropertiesService.getScriptProperties().getProperty('SIKAP_SS_ID'), sikapSs.getId());

  const aggRes = sb.agg_collectAll({ mode: 'monthly', month: 6, year: 2026 }, true);
  assert.equal(aggRes.sikap.connected, true);
  assert.equal(aggRes.sikap.anggaran.sp2dMonthly[5], 360000000);   // June index 5 = Reguler + ABT
  assert.equal(aggRes.sikap.anggaran.akrualMonthly[5], 390000000); // June index 5
});
