/**
 * tests/kegiatan_e2e.test.js
 * Fase 5 E2E Test Suite (Node VM Sandbox):
 *   - RBAC ketat (SUPERADMIN, DIREKTUR, KADIV lintas divisi boleh; STAF & unauthenticated ditolak)
 *   - Siklus penuh Kegiatan Direktorat: Submit -> Multi-Evidence Drive -> Revisi (SUPERSEDED + carry-over) -> Anulir (VOID + VoidReason + Notif)
 *   - Idempoten evidence_carry & validasi batas ukuran file/video Drive
 *   - Serialisasi GAS tanpa Date mentah & resolusi PUSAT -> Direktorat POA + parity filter bulanan/rentang
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

function createGasSandbox() {
  const propsStore = new Map();
  const cacheStore = new Map();
  const spreadsheets = new Map();
  const driveFiles = new Map();
  const rootFolders = new Map();
  const sentEmails = [];
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
      setFontColor() { return this; }
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
      appendRow(arr) {
        data.push(arr.slice());
      },
      setFrozenRows() { return this; },
      insertColumnAfter(col) {
        for (let r = 0; r < data.length; r++) {
          data[r].splice(col, 0, '');
        }
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

  function makeDriveFile({ id, name, mimeType, size, folder }) {
    const fileObj = {
      _id: id,
      _name: name,
      _mimeType: mimeType,
      _size: size,
      _folder: folder || null,
      getId() { return this._id; },
      getName() { return this._name; },
      getMimeType() { return this._mimeType; },
      getSize() { return this._size; },
      makeCopy(newName, targetFolder) {
        const copyId = 'DRV-COPY-' + (seq++);
        const copy = makeDriveFile({
          id: copyId,
          name: newName || this._name,
          mimeType: this._mimeType,
          size: this._size,
          folder: targetFolder
        });
        driveFiles.set(copyId, copy);
        if (targetFolder) targetFolder._files.push(copy);
        return copy;
      }
    };
    return fileObj;
  }

  function makeFolderIterator(items) {
    let idx = 0;
    return {
      hasNext() { return idx < items.length; },
      next() { return items[idx++]; }
    };
  }

  function makeFolder(name, parent = null) {
    const folder = {
      _name: name,
      _parent: parent,
      _children: new Map(),
      _files: [],
      getName() { return this._name; },
      getFoldersByName(n) {
        const hit = this._children.get(n);
        return makeFolderIterator(hit ? [hit] : []);
      },
      createFolder(n) {
        const sub = makeFolder(n, this);
        this._children.set(n, sub);
        return sub;
      },
      createFile(blob) {
        const id = 'DRV-FILE-' + (seq++);
        const bytes = blob.getBytes ? blob.getBytes() : Buffer.from('');
        const file = makeDriveFile({
          id,
          name: blob.getName ? blob.getName() : 'file.bin',
          mimeType: blob.getContentType ? blob.getContentType() : 'application/octet-stream',
          size: bytes.length,
          folder: this
        });
        this._files.push(file);
        driveFiles.set(id, file);
        return file;
      },
      getPathParts() {
        const parts = [];
        let cur = this;
        while (cur) {
          parts.unshift(cur._name);
          cur = cur._parent;
        }
        return parts;
      }
    };
    return folder;
  }

  const sandbox = {
    console,
    Date,
    Math,
    JSON,
    Array,
    Object,
    String,
    Number,
    Boolean,
    RegExp,
    Error,
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
    DriveApp: {
      getFoldersByName(name) {
        const f = rootFolders.get(name);
        return makeFolderIterator(f ? [f] : []);
      },
      createFolder(name) {
        const f = makeFolder(name, null);
        rootFolders.set(name, f);
        return f;
      },
      getFileById(id) {
        const f = driveFiles.get(id);
        if (!f) throw new Error('Drive file not found: ' + id);
        return f;
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
      getScriptLock() {
        return { waitLock() {}, releaseLock() {} };
      }
    },
    Utilities: {
      DigestAlgorithm: { SHA_256: 'SHA_256' },
      Charset: { UTF_8: 'UTF_8' },
      getUuid() { return crypto.randomUUID(); },
      computeDigest(_alg, input) {
        const buf = crypto.createHash('sha256').update(String(input), 'utf8').digest();
        return Array.from(buf, (b) => (b > 127 ? b - 256 : b));
      },
      base64Decode(b64) {
        return Buffer.from(String(b64 || ''), 'base64');
      },
      newBlob(bytes, mimeType, fileName) {
        const buf = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes || []);
        return {
          getBytes() { return buf; },
          getContentType() { return mimeType; },
          getName() { return fileName; }
        };
      }
    },
    Logger: {
      log(msg) { logs.push(String(msg)); }
    },
    MailApp: {
      sendEmail(to, subject, body) {
        sentEmails.push({ to, subject, body });
      }
    },
    _seedExternalDriveFile(id, name, mimeType, size) {
      const f = makeDriveFile({ id, name, mimeType, size, folder: null });
      driveFiles.set(id, f);
      return f;
    },
    _inspect: { propsStore, cacheStore, spreadsheets, driveFiles, rootFolders, sentEmails, logs }
  };

  vm.createContext(sandbox);
  const files = [
    'utils/Constants.js',
    'utils/DateUtil.js',
    'utils/Lock.js',
    'data/SheetAccess.js',
    'services/AuthService.js',
    'services/EvidenceService.js',
    'services/KegiatanDirektoratService.js',
    'services/RiwayatService.js',
    'Code.js'
  ];
  for (const rel of files) {
    const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    vm.runInContext(code, sandbox, { filename: rel });
  }
  return sandbox;
}

function loginAs(sb, ident, password) {
  const res = sb.auth_login({ identifier: ident, password });
  assert.equal(res.success, true, `Login ${ident} gagal: ${res.error}`);
  return res.data.token;
}

test('Fase 5 E2E: RBAC matrix & unauthenticated access on Kegiatan Direktorat + Evidence', () => {
  const sb = createGasSandbox();
  const seed = sb.setup_seedSuperadmin();
  assert.equal(seed.success, true);

  // Seed second Kadiv from DIV-TU to verify cross-division KADIV permissions
  const usersSheet = sb.openMasterSheet(sb.SHEET_MASTER.USERS);
  sb.appendRowData(usersSheet, {
    UserID: 'USR-KADIV-TU-002',
    Nama: 'Kepala Subbagian Tata Usaha',
    Email: 'kadiv.tu@kkp.go.id',
    NIP: '198207142008011005',
    PasswordHash: sb.hashPassword('KadivTU2026!'),
    DivisiID: 'DIV-TU',
    Role: sb.ROLE.KADIV,
    Status: sb.USER_STATUS.APPROVED,
    ApprovedBy: 'USR-SUPERADMIN-001',
    RegisteredAt: new Date(),
    ApprovedAt: new Date()
  });

  const tokSA = loginAs(sb, 'superadmin@radarpoa.go.id', 'SuperAdmin2026!');
  const tokDir = loginAs(sb, 'direktur.poa@kkp.go.id', 'DirekturPOA2026!');
  const tokKadivOps = loginAs(sb, 'kadiv.poa@kkp.go.id', 'KadivPOA2026!');
  const tokKadivTu = loginAs(sb, 'kadiv.tu@kkp.go.id', 'KadivTU2026!');
  const tokStaf = loginAs(sb, 'staf.poa@kkp.go.id', 'StafPOA2026!');

  // Unauthenticated blocked
  const noTokRes = sb.kegiatanDirektorat_getKPI('', { mode: 'monthly', month: 6, year: 2026 });
  assert.equal(noTokRes.success, false);
  assert.match(noTokRes.error, /UNAUTHORIZED/);

  // Submit by KADIV (DIV-OPS) succeeds so we have a row in DIV-OPS
  const createdByKadiv = sb.kegiatanDirektorat_submit(tokKadivOps, {
    judul: 'Rakor Kesiapan Patroli WPP 711',
    tanggal: '2026-06-10',
    deskripsi: 'Koordinasi sektor patroli barat.',
    pihakHadir: 'Timja Operasi'
  });
  assert.equal(createdByKadiv.success, true);
  const kgdRowId = createdByKadiv.data.rowIds[0];

  // STAF (even in matching DIV-OPS) MUST be rejected across Kegiatan & TX_KegiatanDirektorat Evidence
  const sampleB64 = Buffer.from('PDF-TEST').toString('base64');
  for (const fnCall of [
    () => sb.kegiatanDirektorat_getKPI(tokStaf, { mode: 'monthly', month: 6, year: 2026 }),
    () => sb.kegiatanDirektorat_getHistory(tokStaf, { mode: 'monthly', month: 6, year: 2026 }),
    () => sb.kegiatanDirektorat_submit(tokStaf, { judul: 'X', tanggal: '2026-06-10', deskripsi: 'Y' }),
    () => sb.kegiatanDirektorat_revisi(tokStaf, { targetRowId: kgdRowId, alasanRevisi: 'R', judul: 'X', tanggal: '2026-06-10', deskripsi: 'Y' }),
    () => sb.kegiatanDirektorat_anulir(tokStaf, { targetRowId: kgdRowId, alasan: 'Batal' }),
    () => sb.evidence_upload(tokStaf, { refSheet: 'TX_KegiatanDirektorat', refRowId: kgdRowId, fileName: 'a.pdf', mimeType: 'application/pdf', dataBase64: sampleB64 }),
    () => sb.evidence_list(tokStaf, 'TX_KegiatanDirektorat', kgdRowId),
    () => sb.evidence_carry(tokStaf, { refSheet: 'TX_KegiatanDirektorat', fromRowId: kgdRowId, toRowId: kgdRowId })
  ]) {
    const r = fnCall();
    assert.equal(r.success, false);
    assert.match(r.error, /FORBIDDEN/);
  }

  // Cross-division KADIV (DIV-TU) can read, upload evidence, and revise a DIV-OPS Kegiatan row
  const crossList = sb.kegiatanDirektorat_getHistory(tokKadivTu, { mode: 'monthly', month: 6, year: 2026 });
  assert.equal(crossList.success, true);
  assert.equal(crossList.data.length, 1);

  const crossEv = sb.evidence_upload(tokKadivTu, {
    refSheet: 'TX_KegiatanDirektorat',
    refRowId: kgdRowId,
    fileName: 'notula-div-tu.pdf',
    mimeType: 'application/pdf',
    dataBase64: sampleB64
  });
  assert.equal(crossEv.success, true, `Cross-division Kadiv evidence_upload gagal: ${crossEv.error}`);

  // DIREKTUR & SUPERADMIN can inspect KPI & evidence list
  assert.equal(sb.kegiatanDirektorat_getKPI(tokDir, { mode: 'monthly', month: 6, year: 2026 }).data.kegiatanPeriode, 1);
  const saEvList = sb.evidence_list(tokSA, 'TX_KegiatanDirektorat', kgdRowId);
  assert.equal(saEvList.success, true);
  assert.equal(saEvList.data.length, 1);
});

test('Fase 5 E2E: Submit -> Multi-Evidence Drive -> Revisi (SUPERSEDED + idempotent carry) -> Anulir (VOID + Notif)', () => {
  const sb = createGasSandbox();
  sb.setup_seedSuperadmin();

  const usersSheet = sb.openMasterSheet(sb.SHEET_MASTER.USERS);
  sb.appendRowData(usersSheet, {
    UserID: 'USR-KADIV-TU-002',
    Nama: 'Kepala Subbagian Tata Usaha',
    Email: 'kadiv.tu@kkp.go.id',
    NIP: '198207142008011005',
    PasswordHash: sb.hashPassword('KadivTU2026!'),
    DivisiID: 'DIV-TU',
    Role: sb.ROLE.KADIV,
    Status: sb.USER_STATUS.APPROVED,
    ApprovedBy: 'USR-SUPERADMIN-001',
    RegisteredAt: new Date(),
    ApprovedAt: new Date()
  });

  const tokSA = loginAs(sb, 'superadmin@radarpoa.go.id', 'SuperAdmin2026!');
  const tokDir = loginAs(sb, 'direktur.poa@kkp.go.id', 'DirekturPOA2026!');
  const tokKadivOps = loginAs(sb, 'kadiv.poa@kkp.go.id', 'KadivPOA2026!');
  const tokKadivTu = loginAs(sb, 'kadiv.tu@kkp.go.id', 'KadivTU2026!');

  // 1. SUPERADMIN submits Kegiatan Direktorat (DivisiID defaults to PUSAT)
  const submitRes = sb.kegiatanDirektorat_submit(tokSA, {
    judul: 'Pre-Award Meeting Pengadaan ABT 2026',
    tanggal: '2026-06-14',
    deskripsi: 'Arahan Direktur POA terkait target percepatan kontrak.',
    pihakHadir: 'Direktur POA, Timja TU, Timja Logistik'
  });
  assert.equal(submitRes.success, true);
  const row1Id = submitRes.data.rowIds[0];
  assert.match(row1Id, /^KGD-[A-Z0-9]{10}$/);

  const txSheet = sb.openTransaksiSheet(sb.SHEET_TX.KEGIATAN_DIREKTORAT);
  const row1Stored = sb.findRowByField(txSheet, 'RowID', row1Id).obj;
  assert.equal(row1Stored.DivisiID, 'PUSAT');
  assert.equal(row1Stored.Periode, '2026-06-W02');
  assert.equal(row1Stored.Status, 'ACTIVE');

  // 2. Upload 2 direct files + 1 Drive link copy + check size limits
  const ev1 = sb.evidence_upload(tokSA, {
    refSheet: 'TX_KegiatanDirektorat',
    refRowId: row1Id,
    fileName: 'notula-rapat.pdf',
    mimeType: 'application/pdf',
    dataBase64: Buffer.from('%PDF-1.4 fake content').toString('base64')
  });
  assert.equal(ev1.success, true);

  const ev2 = sb.evidence_upload(tokSA, {
    refSheet: 'TX_KegiatanDirektorat',
    refRowId: row1Id,
    fileName: 'dokumentasi.jpg',
    mimeType: 'image/jpeg',
    dataBase64: Buffer.from('JPEGDATA12345').toString('base64')
  });
  assert.equal(ev2.success, true);

  sb._seedExternalDriveFile('EXTFILE1234567890ABCD', 'Paparan-ABT-2026.pdf', 'application/pdf', 250000);
  const ev3 = sb.evidence_uploadFromLink(tokSA, {
    refSheet: 'TX_KegiatanDirektorat',
    refRowId: row1Id,
    url: 'https://drive.google.com/file/d/EXTFILE1234567890ABCD/view?usp=sharing',
    fileName: 'Paparan-ABT-2026.pdf'
  });
  assert.equal(ev3.success, true);

  // Verify Drive folder hierarchy: POA_Evidence_Pusat / Direktorat POA / 2026-06 / Kegiatan-Pre-Award-Meeting-Pengadaan-ABT-2026
  const uploadedFile1 = sb._inspect.driveFiles.get(ev1.data.driveFileId);
  assert.deepEqual(Array.from(uploadedFile1._folder.getPathParts()), [
    'POA_Evidence_Pusat',
    'Direktorat POA',
    '2026-06',
    'Kegiatan-Pre-Award-Meeting-Pengadaan-ABT-2026'
  ]);

  // Size limit guards: >15MB file & >50MB video rejected; <=50MB video link allowed
  const oversizedFileB64 = 'A'.repeat(21 * 1024 * 1024); // ~15.75MB decoded
  const overFileRes = sb.evidence_upload(tokSA, {
    refSheet: 'TX_KegiatanDirektorat',
    refRowId: row1Id,
    fileName: 'terlalu-besar.pdf',
    mimeType: 'application/pdf',
    dataBase64: oversizedFileB64
  });
  assert.equal(overFileRes.success, false);
  assert.match(overFileRes.error, /15MB/);

  sb._seedExternalDriveFile('VIDOVER55MB1234567890', 'rekaman-panjang.mp4', 'video/mp4', 55 * 1024 * 1024);
  const overVidRes = sb.evidence_uploadFromLink(tokSA, {
    refSheet: 'TX_KegiatanDirektorat',
    refRowId: row1Id,
    url: 'https://drive.google.com/file/d/VIDOVER55MB1234567890/view'
  });
  assert.equal(overVidRes.success, false);
  assert.match(overVidRes.error, /50MB/);

  const evListBeforeRevisi = sb.evidence_list(tokSA, 'TX_KegiatanDirektorat', row1Id);
  assert.equal(evListBeforeRevisi.success, true);
  assert.equal(evListBeforeRevisi.data.length, 3);
  assert.deepEqual(
    Array.from(evListBeforeRevisi.data, (x) => x.sourceMode),
    ['UPLOAD', 'UPLOAD', 'DRIVE_LINK_COPY']
  );

  // 3. Revisi by KADIV (DIV-OPS): old row -> SUPERSEDED, new row -> ACTIVE, 3 attachments carried atomically
  const revRes = sb.kegiatanDirektorat_revisi(tokKadivOps, {
    targetRowId: row1Id,
    alasanRevisi: 'Penambahan peserta rapat dan jadwal tindak lanjut kontrak.',
    judul: 'Pre-Award Meeting Pengadaan ABT 2026 (Revisi)',
    tanggal: '2026-06-15',
    deskripsi: 'Arahan Direktur POA termasuk jadwal penandatanganan kontrak WPP timur.',
    pihakHadir: 'Direktur POA, Timja TU, Timja Logistik, PPK'
  });
  assert.equal(revRes.success, true);
  assert.equal(revRes.data.carriedEvidence, 3);
  const row2Id = revRes.data.rowId;

  const row1AfterRevisi = sb.findRowByField(txSheet, 'RowID', row1Id).obj;
  const row2Stored = sb.findRowByField(txSheet, 'RowID', row2Id).obj;
  assert.equal(row1AfterRevisi.Status, 'SUPERSEDED');
  assert.equal(row1AfterRevisi.VoidReason, 'Penambahan peserta rapat dan jadwal tindak lanjut kontrak.');
  assert.equal(row1AfterRevisi.VoidedBy, 'USR-KADIV-POA-001');
  assert.equal(row2Stored.Status, 'ACTIVE');
  assert.equal(row2Stored.SupersedesRowID, row1Id);
  assert.equal(row2Stored.DivisiID, 'DIV-OPS');

  const evListAfterCarry = sb.evidence_list(tokKadivOps, 'TX_KegiatanDirektorat', row2Id);
  assert.equal(evListAfterCarry.success, true);
  assert.equal(evListAfterCarry.data.length, 3);
  assert.deepEqual(
    Array.from(evListAfterCarry.data, (x) => x.driveFileId),
    Array.from(evListBeforeRevisi.data, (x) => x.driveFileId)
  );

  // Calling evidence_carry again must be idempotent (copied: 0)
  const carryAgain = sb.evidence_carry(tokKadivTu, {
    refSheet: 'TX_KegiatanDirektorat',
    fromRowId: row1Id,
    toRowId: row2Id
  });
  assert.equal(carryAgain.success, true);
  assert.equal(carryAgain.data.copied, 0);

  // Cross-division KADIV (DIV-TU) uploads a 4th attachment onto row2
  const ev4 = sb.evidence_upload(tokKadivTu, {
    refSheet: 'TX_KegiatanDirektorat',
    refRowId: row2Id,
    fileName: 'adendum-tu.pdf',
    mimeType: 'application/pdf',
    dataBase64: Buffer.from('ADENDUM').toString('base64')
  });
  assert.equal(ev4.success, true);
  assert.equal(sb.evidence_list(tokDir, 'TX_KegiatanDirektorat', row2Id).data.length, 4);

  // History serialization check: zero Date instances, PUSAT resolved cleanly, KPI counts only 1 ACTIVE row
  const histMid = sb.kegiatanDirektorat_getHistory(tokDir, { mode: 'monthly', month: 6, year: 2026 });
  assert.equal(histMid.success, true);
  assert.equal(histMid.data.length, 2);
  for (const h of histMid.data) {
    assert.equal(h.Tanggal instanceof Date, false);
    assert.equal(h.Timestamp instanceof Date, false);
    assert.equal(h.VoidedAt instanceof Date, false);
    assert.match(h.Tanggal, /^\d{4}-\d{2}-\d{2}$/);
  }
  const oldInHist = histMid.data.find((h) => h.RowID === row1Id);
  assert.equal(oldInHist.divisiNama, 'Direktorat POA');

  const kpiMid = sb.kegiatanDirektorat_getKPI(tokDir, { mode: 'monthly', month: 6, year: 2026 });
  assert.equal(kpiMid.data.kegiatanPeriode, 1);
  assert.equal(kpiMid.data.kegiatanYtd, 1);

  // 4. Anulir by DIREKTUR -> VOID + VoidReason + Audit_Log + Notification to KADIV OPS
  const anulirRes = sb.kegiatanDirektorat_anulir(tokDir, {
    targetRowId: row2Id,
    alasan: 'Agenda digabung ke Rakor Nasional Semester II.'
  });
  assert.equal(anulirRes.success, true);

  const row2Voided = sb.findRowByField(txSheet, 'RowID', row2Id).obj;
  assert.equal(row2Voided.Status, 'VOID');
  assert.equal(row2Voided.VoidReason, 'Agenda digabung ke Rakor Nasional Semester II.');
  assert.equal(row2Voided.VoidedBy, 'USR-DIREKTUR-001');

  const notifRows = sb.sheetToObjects(sb.openLogSheet(sb.SHEET_LOG.NOTIFICATIONS));
  const voidNotif = notifRows.find((n) => n.Jenis === 'DATA_VOIDED' && n.UserID === 'USR-KADIV-POA-001');
  assert.ok(voidNotif, 'Notifikasi DATA_VOIDED harus dikirim ke pengunggah revisi');
  assert.match(voidNotif.Pesan, /Rakor Nasional Semester II/);

  const auditRows = sb.sheetToObjects(sb.openLogSheet(sb.SHEET_LOG.AUDIT_LOG));
  assert.ok(auditRows.some((a) => a.Aksi === 'CREATE' && a.RowIDTarget === row1Id));
  assert.ok(auditRows.some((a) => a.Aksi === 'UPDATE' && a.RowIDTarget === row2Id));
  assert.ok(auditRows.some((a) => a.Aksi === 'VOID' && a.RowIDTarget === row2Id));

  // KPI drops back to 0 active items
  assert.equal(sb.kegiatanDirektorat_getKPI(tokDir, { mode: 'monthly', month: 6, year: 2026 }).data.kegiatanPeriode, 0);

  // Modifying SUPERSEDED or VOID rows MUST fail cleanly
  assert.equal(
    sb.kegiatanDirektorat_revisi(tokDir, {
      targetRowId: row1Id,
      alasanRevisi: 'Coba lagi',
      judul: 'X',
      tanggal: '2026-06-15',
      deskripsi: 'Y'
    }).success,
    false
  );
  assert.equal(
    sb.kegiatanDirektorat_anulir(tokDir, { targetRowId: row2Id, alasan: 'Double void' }).success,
    false
  );
});

test('Fase 5 E2E: Filter range & monthly boundary parity for YYYY-MM-DD local dates', () => {
  const sb = createGasSandbox();
  sb.setup_seedSuperadmin();
  const tokSA = loginAs(sb, 'superadmin@radarpoa.go.id', 'SuperAdmin2026!');

  const rStart = sb.kegiatanDirektorat_submit(tokSA, {
    judul: 'Pembukaan Bulan Juni',
    tanggal: '2026-06-01',
    deskripsi: 'Kegiatan hari pertama bulan.'
  });
  const rEnd = sb.kegiatanDirektorat_submit(tokSA, {
    judul: 'Penutupan Bulan Juni',
    tanggal: '2026-06-30',
    deskripsi: 'Kegiatan hari terakhir bulan.'
  });
  assert.equal(rStart.success, true);
  assert.equal(rEnd.success, true);

  const monthlyKpi = sb.kegiatanDirektorat_getKPI(tokSA, { mode: 'monthly', month: 6, year: 2026 });
  const rangeKpi = sb.kegiatanDirektorat_getKPI(tokSA, { mode: 'range', dateFrom: '2026-06-01', dateTo: '2026-06-30' });
  assert.equal(monthlyKpi.data.kegiatanPeriode, 2);
  assert.equal(rangeKpi.data.kegiatanPeriode, 2);

  const rangeHist = sb.kegiatanDirektorat_getHistory(tokSA, { mode: 'range', dateFrom: '2026-06-01', dateTo: '2026-06-30' });
  assert.equal(rangeHist.success, true);
  assert.equal(rangeHist.data.length, 2);
  assert.deepEqual(Array.from(rangeHist.data, (r) => r.Tanggal), ['2026-06-30', '2026-06-01']);
});
