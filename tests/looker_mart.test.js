/**
 * tests/looker_mart.test.js
 * Fase 6 Integration Test Suite (Node VM Sandbox):
 *   - Pipeline ETL `looker_syncMart()` & `looker_scheduledSyncMart()` -> `RadarPOA_Looker_Mart` (`Mart_Ikhtisar_Nasional`)
 *   - Paritas 100% terhadap `agg_collectAll()`, bersih dari baris SUPERSEDED & VOID
 *   - Idempoten upsert berdasarkan `Periode`
 *   - `applyFormalSheetFormatting()` pada 5 sheet inti (#0E1722 header 34px, frozen 1, zebra banding 26px, format `@`/`#,##0`/`0.00`/`yyyy-mm-dd`)
 *   - RBAC (`SUPERADMIN`, `DIREKTUR` vs `KADIV`, `STAF`) & siklus trigger terjadwal
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

function createLookerGasSandbox() {
  const propsStore = new Map();
  const cacheStore = new Map();
  const spreadsheets = new Map();
  const triggers = [];
  const logs = [];
  let seq = 1;

  function makeRange(sheetData, styleMeta, row, col, numRows = 1, numCols = 1) {
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
      setFontWeight(v) {
        styleMeta.cellStyles.push({ row, col, numRows, numCols, fontWeight: v });
        if (row === 1) styleMeta.headerFontWeight = v;
        return this;
      },
      setBackground(v) {
        for (let r = row; r < row + numRows; r++) styleMeta.rowBackgrounds.set(r, v);
        if (row === 1) styleMeta.headerBg = v;
        return this;
      },
      setFontColor(v) {
        if (row === 1) styleMeta.headerFontColor = v;
        return this;
      },
      setVerticalAlignment(v) {
        if (row === 1) styleMeta.headerVAlign = v;
        else styleMeta.dataVAlign = v;
        return this;
      },
      setNumberFormat(v) {
        for (let c = col; c < col + numCols; c++) styleMeta.colFormats.set(c, v);
        return this;
      }
    };
  }

  function makeSheet(name) {
    const data = [];
    const styleMeta = {
      headerBg: null,
      headerFontColor: null,
      headerFontWeight: null,
      headerVAlign: null,
      dataVAlign: null,
      frozenRows: 0,
      rowHeights: new Map(),
      rowBackgrounds: new Map(),
      colFormats: new Map(),
      autoResizedCols: new Set(),
      cellStyles: []
    };
    return {
      getName() { return name; },
      getLastRow() { return data.length; },
      getLastColumn() { return data[0] ? data[0].length : 0; },
      getDataRange() {
        const rows = Math.max(data.length, 1);
        const cols = Math.max(data[0] ? data[0].length : 1, 1);
        return makeRange(data, styleMeta, 1, 1, rows, cols);
      },
      getRange(r, c, nr = 1, nc = 1) {
        return makeRange(data, styleMeta, r, c, nr, nc);
      },
      appendRow(arr) { data.push(arr.slice()); },
      setFrozenRows(n) { styleMeta.frozenRows = n; return this; },
      setRowHeight(r, h) { styleMeta.rowHeights.set(r, h); return this; },
      autoResizeColumn(c) { styleMeta.autoResizedCols.add(c); return this; },
      insertColumnAfter(col) {
        for (let r = 0; r < data.length; r++) data[r].splice(col, 0, '');
      },
      _raw: data,
      _style: styleMeta
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
        const id = 'SS-' + (seq++);
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
            const cfg = { handlerName, days: 1, hour: 0 };
            const builder = {
              everyDays(d) { cfg.days = d; return builder; },
              atHour(h) { cfg.hour = h; return builder; },
              onWeekDay() { return builder; },
              everyWeeks() { return builder; },
              create() {
                const trgId = 'TRG-' + (seq++);
                const trg = {
                  getUniqueId: () => trgId,
                  getHandlerFunction: () => cfg.handlerName,
                  _cfg: cfg
                };
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
    'Code.js'
  ];
  for (const rel of files) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), sandbox, { filename: rel });
  }
  return sandbox;
}

function seedSikapSatellite(sb) {
  const ss = sb.SpreadsheetApp.create('RadarPOA_SIKAP_DB');
  sb.PropertiesService.getScriptProperties().setProperty('SIKAP_SS_ID', ss.getId());

  const tu = ss.insertSheet('TX_TataUsaha');
  tu.getRange(1, 1, 1, 12).setValues([[
    'RowID', 'DivisiID', 'Periode', 'SubmittedBy', 'Timestamp', 'Status',
    'PaguReguler', 'PaguABT',
    'RealisasiSP2D_Reguler_Minggu', 'RealisasiSP2D_ABT_Minggu',
    'RealisasiSP2D_Minggu', 'RealisasiAkrual_Minggu'
  ]]);
  tu.appendRow([
    'TU-1', 'DIV-TU', '2026-06-W02', 'USR-STAF-01', '2026-06-14T10:00:00Z', 'ACTIVE',
    1000000000, 200000000, 600000000, 120000000, 720000000, 750000000
  ]);
  // Baris SUPERSEDED & VOID harus diabaikan agg_collectAll & Looker Mart
  tu.appendRow([
    'TU-OLD', 'DIV-TU', '2026-06-W01', 'USR-STAF-01', '2026-06-05T10:00:00Z', 'SUPERSEDED',
    999999999, 999999999, 500000000, 500000000, 1000000000, 1000000000
  ]);
  tu.appendRow([
    'TU-VOID', 'DIV-TU', '2026-06-W01', 'USR-STAF-01', '2026-06-06T10:00:00Z', 'VOID',
    999999999, 999999999, 300000000, 300000000, 600000000, 600000000
  ]);

  const bmn = ss.insertSheet('TX_BMN_Aset');
  bmn.getRange(1, 1, 1, 6).setValues([['RowID', 'Status', 'NilaiPerolehan', 'NilaiBuku', 'Kondisi', 'StatusAset']]);
  bmn.appendRow(['BMN-1', 'ACTIVE', 500000000, 300000000, 'BAIK', 'AKTIF']);
  bmn.appendRow(['BMN-2', 'ACTIVE', 100000000, 50000000, 'RUSAK_BERAT', 'AKTIF']);
  bmn.appendRow(['BMN-3', 'ACTIVE', 120000000, 60000000, 'RUSAK_BERAT', 'DALAM_PENGHAPUSAN']);
  bmn.appendRow(['BMN-4', 'VOID', 90000000, 40000000, 'RUSAK_BERAT', 'AKTIF']);
  return tu;
}

function login(sb, email, password) {
  const res = sb.auth_login({ identifier: email, password });
  assert.equal(res.success, true, res.error);
  return res.data.token;
}

test('Fase 6: looker_syncMart ETL parity with agg_collectAll, free of SUPERSEDED/VOID, and upsert idempotent', () => {
  const sb = createLookerGasSandbox();
  sb.setup_seedSuperadmin();
  seedSikapSatellite(sb);

  const tokSA = login(sb, 'superadmin@radarpoa.go.id', 'SuperAdmin2026!');

  // Buat 2 kegiatan ACTIVE + 1 SUPERSEDED + 1 VOID
  const k1 = sb.kegiatanDirektorat_submit(tokSA, { judul: 'Agenda Aktif 1', tanggal: '2026-06-02', deskripsi: 'Deskripsi 1' });
  const k2 = sb.kegiatanDirektorat_submit(tokSA, { judul: 'Agenda Revisi Awal', tanggal: '2026-06-09', deskripsi: 'Deskripsi 2' });
  const k3 = sb.kegiatanDirektorat_submit(tokSA, { judul: 'Agenda Batal', tanggal: '2026-06-12', deskripsi: 'Deskripsi 3' });
  sb.kegiatanDirektorat_revisi(tokSA, {
    targetRowId: k2.data.rowIds[0], alasanRevisi: 'Update tanggal',
    judul: 'Agenda Aktif 2', tanggal: '2026-06-10', deskripsi: 'Deskripsi revisi'
  });
  sb.kegiatanDirektorat_anulir(tokSA, { targetRowId: k3.data.rowIds[0], alasan: 'Dibatalkan' });
  assert.equal(k1.success, true);

  const filterJune = { mode: 'monthly', month: 6, year: 2026 };
  const aggExpected = sb.agg_collectAll(filterJune, true);
  const resSync = sb.looker_syncMart(tokSA, filterJune);

  assert.equal(resSync.success, true, resSync.error);
  assert.equal(resSync.data.action, 'INSERTED');
  assert.equal(resSync.data.totalRows, 1);
  assert.equal(resSync.data.bulanTahun, '2026-06');

  const martId = sb.PropertiesService.getScriptProperties().getProperty('LOOKER_MART_SS_ID');
  assert.ok(martId, 'LOOKER_MART_SS_ID harus tersimpan otomatis');
  const martSheet = sb.SpreadsheetApp.openById(martId).getSheetByName('Mart_Ikhtisar_Nasional');
  assert.ok(martSheet);

  // Validasi 10 header eksak DATA_SCHEMA.md §2
  assert.deepEqual(Array.from(martSheet._raw[0]), [
    'Periode', 'BulanTahun', 'TotalPagu_Reguler', 'TotalPagu_ABT',
    'TotalRealisasi_SP2D_Reguler', 'TotalRealisasi_SP2D_ABT',
    'PctSerapan_Nasional', 'Armada_Siap_Pct',
    'TotalKegiatanDirektorat', 'Aset_RusakBerat_Unit'
  ]);

  // Validasi angka 100% cocok agg_collectAll dan bebas SUPERSEDED/VOID
  const row = resSync.data.row;
  assert.equal(row.TotalPagu_Reguler, aggExpected.sikap.anggaran.paguReguler);
  assert.equal(row.TotalPagu_ABT, aggExpected.sikap.anggaran.paguABT);
  assert.equal(row.TotalRealisasi_SP2D_Reguler, aggExpected.sikap.anggaran.realisasiSP2D_Reguler);
  assert.equal(row.TotalRealisasi_SP2D_ABT, aggExpected.sikap.anggaran.realisasiSP2D_ABT);
  assert.equal(row.PctSerapan_Nasional, 60); // 720M / 1200M = 60%
  assert.equal(row.Armada_Siap_Pct, 94.12);   // 32 / 34 = 94.12%
  assert.equal(row.TotalKegiatanDirektorat, 2); // Hanya 2 ACTIVE, bukan 4
  assert.equal(row.Aset_RusakBerat_Unit, 2);    // Hanya 2 ACTIVE RUSAK_BERAT, VOID tidak dihitung

  // Idempotent upsert: panggil ulang periode sama -> UPDATED, baris tetap 1
  const resAgain = sb.looker_syncMart(tokSA, filterJune);
  assert.equal(resAgain.success, true);
  assert.equal(resAgain.data.action, 'UPDATED');
  assert.equal(resAgain.data.totalRows, 1);

  // Periode berbeda -> INSERTED baris kedua
  const resJuly = sb.looker_syncMart(tokSA, { mode: 'monthly', month: 7, year: 2026 });
  assert.equal(resJuly.success, true);
  assert.equal(resJuly.data.action, 'INSERTED');
  assert.equal(resJuly.data.totalRows, 2);
});

test('Fase 6: applyFormalSheetFormatting formats headers, zebra rows, row heights, & column formats across 5 core sheets', () => {
  const sb = createLookerGasSandbox();
  sb.setup_seedSuperadmin();
  const tokSA = login(sb, 'superadmin@radarpoa.go.id', 'SuperAdmin2026!');

  sb.kegiatanDirektorat_submit(tokSA, {
    judul: 'Rakor Format Sheet Formal', tanggal: '2026-06-14', deskripsi: 'Cek styling 5 sheet.'
  });
  const syncRes = sb.looker_syncMart(tokSA, { mode: 'monthly', month: 6, year: 2026 });
  assert.equal(syncRes.success, true);

  const formattedNames = Array.from(sb.formatFormalSheets());
  assert.deepEqual(formattedNames, [
    'TX_KegiatanDirektorat',
    'Audit_Log',
    'Users',
    'Kapal',
    'Mart_Ikhtisar_Nasional'
  ]);

  const checkSheetFormal = (sheet) => {
    assert.equal(sheet._style.headerBg, '#0E1722');
    assert.equal(sheet._style.headerFontColor, '#FFFFFF');
    assert.equal(sheet._style.headerFontWeight, 'bold');
    assert.equal(sheet._style.frozenRows, 1);
    assert.equal(sheet._style.rowHeights.get(1), 34);
    if (sheet.getLastRow() >= 2) {
      assert.equal(sheet._style.rowHeights.get(2), 26);
      assert.equal(sheet._style.rowBackgrounds.get(2), '#FFFFFF');
    }
    if (sheet.getLastRow() >= 3) {
      assert.equal(sheet._style.rowBackgrounds.get(3), '#F4F7F9');
    }
  };

  const martId = sb.PropertiesService.getScriptProperties().getProperty('LOOKER_MART_SS_ID');
  const martSheet = sb.SpreadsheetApp.openById(martId).getSheetByName('Mart_Ikhtisar_Nasional');
  const kgdSheet = sb.openTransaksiSheet('TX_KegiatanDirektorat');
  const usersSheet = sb.openMasterSheet('Users');
  const auditSheet = sb.openLogSheet('Audit_Log');
  const kapalSheet = sb.openMasterSheet('Kapal');

  [martSheet, kgdSheet, usersSheet, auditSheet, kapalSheet].forEach(checkSheetFormal);

  // Verifikasi format kolom spesifik
  assert.equal(martSheet._style.colFormats.get(1), '@');      // Periode
  assert.equal(martSheet._style.colFormats.get(2), '@');      // BulanTahun
  assert.equal(martSheet._style.colFormats.get(3), '#,##0');  // TotalPagu_Reguler
  assert.equal(martSheet._style.colFormats.get(7), '0.00');   // PctSerapan_Nasional
  assert.equal(martSheet._style.colFormats.get(10), '#,##0'); // Aset_RusakBerat_Unit

  const nipIdx = usersSheet._raw[0].indexOf('NIP') + 1;
  assert.equal(usersSheet._style.colFormats.get(nipIdx), '@');

  const tglIdx = kgdSheet._raw[0].indexOf('Tanggal') + 1;
  assert.equal(kgdSheet._style.colFormats.get(tglIdx), 'yyyy-mm-dd');
});

test('Fase 6: RBAC & scheduled trigger lifecycle (looker_setTriggerAktif + looker_scheduledSyncMart)', () => {
  const sb = createLookerGasSandbox();
  sb.setup_seedSuperadmin();

  const tokSA = login(sb, 'superadmin@radarpoa.go.id', 'SuperAdmin2026!');
  const tokDir = login(sb, 'direktur.poa@kkp.go.id', 'DirekturPOA2026!');
  const tokKadiv = login(sb, 'kadiv.poa@kkp.go.id', 'KadivPOA2026!');
  const tokStaf = login(sb, 'staf.poa@kkp.go.id', 'StafPOA2026!');

  // KADIV & STAF ditolak untuk syncMart
  assert.match(sb.looker_syncMart(tokKadiv).error, /FORBIDDEN/);
  assert.match(sb.looker_syncMart(tokStaf).error, /FORBIDDEN/);
  // DIREKTUR boleh syncMart, tetapi ditolak mengelola trigger sistem
  assert.equal(sb.looker_syncMart(tokDir).success, true);
  assert.match(sb.looker_setTriggerAktif(tokDir, true).error, /FORBIDDEN/);

  // SUPERADMIN install trigger -> idempoten walau dipanggil 2x
  const on1 = sb.looker_setTriggerAktif(tokSA, true);
  assert.equal(on1.success, true);
  assert.equal(on1.data.aktif, true);
  assert.equal(sb._inspect.triggers.length, 1);

  const on2 = sb.looker_setTriggerAktif(tokSA, true);
  assert.equal(on2.success, true);
  assert.equal(sb._inspect.triggers.length, 1);

  // Trigger terjadwal berjalan tanpa token
  const schedRes = sb.looker_scheduledSyncMart();
  assert.equal(schedRes.success, true);
  assert.ok(schedRes.data.spreadsheetId);

  // Matikan trigger -> bersihkan dari ScriptApp & ScriptProperties
  const offRes = sb.looker_setTriggerAktif(tokSA, false);
  assert.equal(offRes.success, true);
  assert.equal(offRes.data.aktif, false);
  assert.equal(sb._inspect.triggers.length, 0);
  assert.equal(sb.PropertiesService.getScriptProperties().getProperty('LOOKER_TRIGGER_ID'), null);
});
