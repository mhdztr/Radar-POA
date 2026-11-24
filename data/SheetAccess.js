/**
 * data/SheetAccess.js
 * Layer akses data generik, RBAC, hashing, dan pembacaan federasi lintas spreadsheet satelit.
 *
 * ATURAN:
 * - Service layer TIDAK memanggil SpreadsheetApp secara langsung — semua melalui fungsi di sini.
 * - assertScope() WAJIB dipanggil di awal setiap service function sensitif.
 * - hashPassword() adalah satu-satunya implementasi hashing di seluruh proyek.
 */

// ===========================================================================
// RBAC
// ===========================================================================

function assertScope(session, allowedRoles, requiredDivisiId) {
  if (!session || !session.userId) {
    throw new Error('UNAUTHORIZED: Sesi tidak valid atau sudah berakhir. Silakan login ulang.');
  }
  if (session.status !== USER_STATUS.APPROVED) {
    throw new Error('FORBIDDEN: Akun belum disetujui atau sudah tidak aktif.');
  }
  if (allowedRoles && allowedRoles.length > 0) {
    if (allowedRoles.indexOf(session.role) === -1) {
      throw new Error('FORBIDDEN: Role ' + session.role + ' tidak memiliki akses ke operasi ini.');
    }
  }
  if (requiredDivisiId) {
    if (session.role !== ROLE.SUPERADMIN && session.role !== ROLE.DIREKTUR) {
      if (session.divisiId !== requiredDivisiId) {
        throw new Error(
          'FORBIDDEN: Akses terbatas ke divisi ' + requiredDivisiId +
          '. Akun Anda terdaftar di divisi ' + session.divisiId + '.'
        );
      }
    }
  }
}

// ===========================================================================
// HASHING — Implementasi kanonik SHA-256
// ===========================================================================

function hashPassword(plaintext) {
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    plaintext,
    Utilities.Charset.UTF_8
  );
  return bytes.map(function (b) {
    var hex = (b < 0 ? b + 256 : b).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

// ===========================================================================
// SHEET OPENERS — PUSAT, MASTER, LOG, & FEDERASI SATELIT
// ===========================================================================

var _EXEC_SS_CACHE  = {};
var _EXEC_PUSAT_ID  = null;
var _SA_CHECKED_EXEC = false;

function _openSsCached(ssId) {
  if (!ssId) return null;
  if (_EXEC_SS_CACHE[ssId]) return _EXEC_SS_CACHE[ssId];
  var ss = SpreadsheetApp.openById(ssId);
  if (ss) _EXEC_SS_CACHE[ssId] = ss;
  return ss;
}

/**
 * Memastikan spreadsheet pusat Radar POA sudah ada dan tersimpan di Script Properties.
 * Idempoten & self-healing: bila MASTER_SS_ID / PUSAT_SS_ID belum ada atau gagal dibuka,
 * otomatis membuat spreadsheet `RadarPOA_Pusat_DB` beserta sheet master/pusat/log standar.
 *
 * @returns {string} ID spreadsheet pusat/master
 */
function ensurePusatSpreadsheet() {
  if (_EXEC_PUSAT_ID && _EXEC_SS_CACHE[_EXEC_PUSAT_ID]) return _EXEC_PUSAT_ID;

  var props = PropertiesService.getScriptProperties();
  var candidateId = props.getProperty(PROP_KEY.PUSAT_SS_ID) || props.getProperty(PROP_KEY.MASTER_SS_ID);
  if (candidateId) {
    try {
      var existingSs = _openSsCached(candidateId);
      if (existingSs) {
        _EXEC_PUSAT_ID = candidateId;
        if (!props.getProperty(PROP_KEY.PUSAT_SS_ID))  props.setProperty(PROP_KEY.PUSAT_SS_ID, candidateId);
        if (!props.getProperty(PROP_KEY.MASTER_SS_ID)) props.setProperty(PROP_KEY.MASTER_SS_ID, candidateId);
        if (!props.getProperty(PROP_KEY.LOG_SS_ID))    props.setProperty(PROP_KEY.LOG_SS_ID, candidateId);
        return candidateId;
      }
    } catch (eOpen) {
      Logger.log('[ensurePusatSpreadsheet] Spreadsheet ID tersimpan tidak valid (' + candidateId + '): ' + eOpen.message);
    }
  }

  var ss = SpreadsheetApp.create(SS_NAME.PUSAT);
  var newId = ss.getId();
  _EXEC_SS_CACHE[newId] = ss;
  _EXEC_PUSAT_ID = newId;

  props.setProperty(PROP_KEY.PUSAT_SS_ID, newId);
  if (!props.getProperty(PROP_KEY.MASTER_SS_ID)) props.setProperty(PROP_KEY.MASTER_SS_ID, newId);
  if (!props.getProperty(PROP_KEY.LOG_SS_ID))    props.setProperty(PROP_KEY.LOG_SS_ID, newId);

  var usersSheet = _autoCreateMasterSheet(ss, SHEET_MASTER.USERS);
  _autoCreateMasterSheet(ss, SHEET_MASTER.DIVISI);
  _autoCreateMasterSheet(ss, SHEET_MASTER.KAPAL);
  _autoCreateMasterSheet(ss, SHEET_MASTER.KAWASAN_KONSERVASI);
  _autoCreateMasterSheet(ss, SHEET_MASTER.WPP);
  _autoCreateMasterSheet(ss, SHEET_MASTER.OPSI);
  _autoCreatePusatSheet(ss, SHEET_PUSAT.KEGIATAN_DIREKTORAT);
  _autoCreatePusatSheet(ss, SHEET_PUSAT.EVIDENCE);
  _autoCreateLogSheet(ss, SHEET_LOG.AUDIT_LOG);
  _autoCreateLogSheet(ss, SHEET_LOG.APPROVAL_QUEUE);
  _autoCreateLogSheet(ss, SHEET_LOG.NOTIFICATIONS);

  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getName() === 'Sheet1' && sheets.length > 1) {
      try { ss.deleteSheet(sheets[i]); } catch (eDel) {}
      break;
    }
  }

  _ensureSuperadminSeeded(usersSheet);
  Logger.log('[ensurePusatSpreadsheet] Spreadsheet ' + SS_NAME.PUSAT + ' dibuat otomatis dengan ID: ' + newId);
  return newId;
}

function openMasterSheet(sheetName) {
  var ids = getSpreadsheetIds();
  var ss = null;
  if (ids.masterId) {
    try {
      ss = _openSsCached(ids.masterId);
    } catch (e) {
      Logger.log('[openMasterSheet] masterId ' + ids.masterId + ' gagal dibuka: ' + e.message);
    }
  }
  if (!ss) {
    ss = _openSsCached(ensurePusatSpreadsheet());
  }
  if (!ss) return null;
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = _autoCreateMasterSheet(ss, sheetName);
  }
  if (sheetName === SHEET_MASTER.USERS) {
    _ensureSuperadminSeeded(sheet);
  }
  return sheet;
}

function openTransaksiSheet(sheetName) {
  var ids = getSpreadsheetIds();
  var ss = null;
  if (ids.pusatId) {
    try {
      ss = _openSsCached(ids.pusatId);
    } catch (e) {
      Logger.log('[openTransaksiSheet] pusatId ' + ids.pusatId + ' gagal dibuka: ' + e.message);
    }
  }
  if (!ss) {
    ss = _openSsCached(ensurePusatSpreadsheet());
  }
  if (!ss) return null;
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = _autoCreatePusatSheet(ss, sheetName);
  }
  return sheet;
}

function openLogSheet(sheetName) {
  var ids = getSpreadsheetIds();
  var ss = null;
  if (ids.logId) {
    try {
      ss = _openSsCached(ids.logId);
    } catch (e) {
      Logger.log('[openLogSheet] logId ' + ids.logId + ' gagal dibuka: ' + e.message);
    }
  }
  if (!ss) {
    ss = _openSsCached(ensurePusatSpreadsheet());
  }
  if (!ss) return null;
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = _autoCreateLogSheet(ss, sheetName);
  }
  return sheet;
}

function _autoCreateMasterSheet(ss, sheetName) {
  var existing = ss.getSheetByName(sheetName);
  if (existing) return existing;

  var headers = [];
  var seedRows = [];

  if (sheetName === SHEET_MASTER.USERS) {
    headers = [
      'UserID', 'Nama', 'Email', 'NIP', 'PasswordHash',
      'DivisiID', 'Role', 'Status', 'ApprovedBy', 'RegisteredAt', 'ApprovedAt'
    ];
  } else if (sheetName === SHEET_MASTER.DIVISI) {
    headers = ['DivisiID', 'NamaResmi', 'NamaDashboard', 'Kode'];
    seedRows = [
      ['DIV-TU',     'Subbagian Tata Usaha',                  'Tata Usaha (SIKAP)',                 'TU'],
      ['DIV-AWAK',   'Tim Kerja Pengawakan Kapal Pengawas',     'Pengawakan (Nakhoda)',               'AWAK'],
      ['DIV-LOG',    'Tim Kerja Logistik Armada',               'Logistik (Sistik)',                  'LOG'],
      ['DIV-RAWAT',  'Tim Kerja Pemeliharaan dan Perawatan',    'Pemeliharaan & Perawatan (Siaga)',   'RAWAT'],
      ['DIV-OPS',    'Tim Kerja Operasi Armada',                'Operasi Armada',                     'OPS'],
      ['DIV-INTEL',  'Tim Kerja Intelijen Pengawasan',          'Intelijen',                          'INTEL'],
      ['DIV-PANTAU', 'Tim Kerja Pemantauan Armada',             'Pemantauan',                         'PANTAU']
    ];
  } else if (sheetName === SHEET_MASTER.KAPAL) {
    headers = [
      'KapalID', 'Nama', 'Kelas', 'Homebase_UPT', 'StatusAktif',
      'JenisKapal', 'KelasKapal', 'PanjangMeter', 'WPPDefault', 'PangkalanHomebase'
    ];
  } else if (sheetName === SHEET_MASTER.KAWASAN_KONSERVASI) {
    headers = ['KawasanID', 'Nama', 'Provinsi', 'Latitude', 'Longitude'];
  } else if (sheetName === SHEET_MASTER.WPP) {
    headers = ['WPPCode', 'NamaWilayah'];
    if (typeof WPP_NRI !== 'undefined' && Array.isArray(WPP_NRI)) {
      seedRows = WPP_NRI.map(function (w) { return [w.WPPCode, w.NamaWilayah]; });
    }
  } else if (sheetName === SHEET_MASTER.OPSI) {
    headers = ['Kode', 'Urutan', 'Label', 'LabelTampil', 'Aktif', 'DibuatOleh', 'DibuatAt'];
  } else {
    headers = ['ID', 'Nama', 'Keterangan'];
  }

  var created = ss.insertSheet(sheetName);
  created.getRange(1, 1, 1, headers.length).setValues([headers]);

  if (seedRows.length > 0) {
    created.getRange(2, 1, seedRows.length, seedRows[0].length).setValues(seedRows);
  }
  applyFormalSheetFormatting(created);
  return created;
}

/**
 * Memastikan akun default (Superadmin, Direktur, Kadiv, Staf) ter-seed idempoten.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} usersSheet
 * @param {boolean} [forceResetDefault=false]
 */
function _ensureSuperadminSeeded(usersSheet, forceResetDefault) {
  try {
    if (!usersSheet) return;
    if (!forceResetDefault && _SA_CHECKED_EXEC) return;
    _SA_CHECKED_EXEC = true;

    var cache = (typeof CacheService !== 'undefined') ? CacheService.getScriptCache() : null;
    if (!forceResetDefault && cache && cache.get('radarpoa_sa_ok_v1') === '1') return;

    var expectedHeaders = [
      'UserID', 'Nama', 'Email', 'NIP', 'PasswordHash',
      'DivisiID', 'Role', 'Status', 'ApprovedBy', 'RegisteredAt', 'ApprovedAt'
    ];
    if (usersSheet.getLastRow() === 0) {
      usersSheet.getRange(1, 1, 1, expectedHeaders.length)
        .setValues([expectedHeaders])
        .setFontWeight('bold')
        .setBackground('#0E1722')
        .setFontColor('#FFFFFF');
      usersSheet.setFrozenRows(1);
    }

    var data = usersSheet.getDataRange().getValues();
    var headers = data[0] || expectedHeaders;
    if (headers.indexOf('NIP') === -1) {
      var nipCol = headers.length + 1;
      usersSheet.getRange(1, nipCol).setValue('NIP').setFontWeight('bold');
      data = usersSheet.getDataRange().getValues();
      headers = data[0];
    }

    var emailIdx  = headers.indexOf('Email');
    var roleIdx   = headers.indexOf('Role');
    var statusIdx = headers.indexOf('Status');
    var pwdIdx    = headers.indexOf('PasswordHash');

    var existingEmails = {};
    var superadminRowIdx = -1;
    for (var r = 1; r < data.length; r++) {
      var rowEmail = emailIdx !== -1 ? String(data[r][emailIdx] || '').trim().toLowerCase() : '';
      var rowRole  = roleIdx  !== -1 ? String(data[r][roleIdx]  || '').trim().toUpperCase() : '';
      if (rowEmail) existingEmails[rowEmail] = r + 1;
      if (superadminRowIdx === -1 && (rowRole === ROLE.SUPERADMIN || rowEmail === 'superadmin@radarpoa.go.id')) {
        superadminRowIdx = r + 1;
      }
    }

    if (superadminRowIdx > 0) {
      var currStatus = statusIdx !== -1 ? String(data[superadminRowIdx - 1][statusIdx] || '').trim().toUpperCase() : '';
      var currPwd    = pwdIdx    !== -1 ? String(data[superadminRowIdx - 1][pwdIdx] || '').trim() : '';
      if (currStatus !== USER_STATUS.APPROVED && statusIdx !== -1) {
        usersSheet.getRange(superadminRowIdx, statusIdx + 1).setValue(USER_STATUS.APPROVED);
      }
      if ((!currPwd || forceResetDefault) && pwdIdx !== -1) {
        usersSheet.getRange(superadminRowIdx, pwdIdx + 1).setValue(hashPassword('SuperAdmin2026!'));
      }
    }

    var now = new Date();
    var defaults = [
      {
        'UserID': 'USR-SUPERADMIN-001',
        'Nama': 'Super Administrator Radar POA',
        'Email': 'superadmin@radarpoa.go.id',
        'NIP': '198501012010011001',
        'PasswordHash': hashPassword('SuperAdmin2026!'),
        'DivisiID': '',
        'Role': ROLE.SUPERADMIN,
        'Status': USER_STATUS.APPROVED,
        'ApprovedBy': 'SYSTEM',
        'RegisteredAt': now,
        'ApprovedAt': now
      },
      {
        'UserID': 'USR-DIREKTUR-001',
        'Nama': 'Direktur Pengendalian Operasi Armada',
        'Email': 'direktur.poa@kkp.go.id',
        'NIP': '197504102000031001',
        'PasswordHash': hashPassword('DirekturPOA2026!'),
        'DivisiID': '',
        'Role': ROLE.DIREKTUR,
        'Status': USER_STATUS.APPROVED,
        'ApprovedBy': 'USR-SUPERADMIN-001',
        'RegisteredAt': now,
        'ApprovedAt': now
      },
      {
        'UserID': 'USR-KADIV-POA-001',
        'Nama': 'Kepala Divisi Operasi Armada',
        'Email': 'kadiv.poa@kkp.go.id',
        'NIP': '198005122005011002',
        'PasswordHash': hashPassword('KadivPOA2026!'),
        'DivisiID': 'DIV-OPS',
        'Role': ROLE.KADIV,
        'Status': USER_STATUS.APPROVED,
        'ApprovedBy': 'USR-SUPERADMIN-001',
        'RegisteredAt': now,
        'ApprovedAt': now
      },
      {
        'UserID': 'USR-STAF-POA-001',
        'Nama': 'Staf Pelaksana POA',
        'Email': 'staf.poa@kkp.go.id',
        'NIP': '199203152018021003',
        'PasswordHash': hashPassword('StafPOA2026!'),
        'DivisiID': 'DIV-OPS',
        'Role': ROLE.STAF,
        'Status': USER_STATUS.APPROVED,
        'ApprovedBy': 'USR-KADIV-POA-001',
        'RegisteredAt': now,
        'ApprovedAt': now
      }
    ];

    var addedCount = 0;
    defaults.forEach(function (acc) {
      if (acc['Role'] === ROLE.SUPERADMIN && superadminRowIdx > 0) return;
      if (existingEmails[acc['Email']]) return;
      var row = headers.map(function (h) {
        return acc[h] !== undefined && acc[h] !== null ? acc[h] : '';
      });
      usersSheet.appendRow(row);
      existingEmails[acc['Email']] = usersSheet.getLastRow();
      addedCount++;
    });

    if (addedCount > 0) {
      SpreadsheetApp.flush();
      Logger.log('[_ensureSuperadminSeeded] ' + addedCount + ' akun default berhasil di-seed.');
    }
    if (cache) { try { cache.put('radarpoa_sa_ok_v1', '1', 3600); } catch (eCache) {} }
  } catch (err) {
    Logger.log('[_ensureSuperadminSeeded] Error: ' + err.message);
  }
}

function _autoCreatePusatSheet(ss, sheetName) {
  var headers = null;
  if (sheetName === SHEET_PUSAT.KEGIATAN_DIREKTORAT) {
    headers = STD_COLS.concat(['JudulKegiatan', 'Tanggal', 'Deskripsi', 'PihakHadir', 'EvidenceUrl']);
  } else if (sheetName === SHEET_PUSAT.EVIDENCE) {
    headers = ['EvidenceID', 'RefSheet', 'RefRowID', 'DriveFileID', 'FileName', 'FileType', 'SourceMode', 'UploadedBy', 'UploadedAt'];
  }
  if (!headers) return null;
  var created = ss.insertSheet(sheetName);
  created.getRange(1, 1, 1, headers.length).setValues([headers]);
  applyFormalSheetFormatting(created);
  return created;
}

function _autoCreateLogSheet(ss, sheetName) {
  var headers = null;
  if (sheetName === SHEET_LOG.AUDIT_LOG) {
    headers = ['LogID', 'UserID', 'Aksi', 'SheetTarget', 'RowIDTarget', 'Alasan', 'Timestamp'];
  } else if (sheetName === SHEET_LOG.APPROVAL_QUEUE) {
    headers = ['QueueID', 'UserID', 'RoleDilamar', 'DivisiID', 'RoutedTo', 'Status', 'DecidedBy', 'DecidedAt', 'AlasanReject'];
  } else if (sheetName === SHEET_LOG.NOTIFICATIONS) {
    headers = ['NotifID', 'UserID', 'Jenis', 'Pesan', 'IsRead', 'CreatedAt'];
  }
  if (!headers) return null;
  var created = ss.insertSheet(sheetName);
  created.getRange(1, 1, 1, headers.length).setValues([headers]);
  applyFormalSheetFormatting(created);
  return created;
}

/**
 * Resolusi ID Spreadsheet Satelit dari Script Properties (dengan prioritas key).
 * @param {string|string[]} propKeys
 * @returns {string|null}
 */
function resolveSatelliteSpreadsheetId(propKeys) {
  var keys = Array.isArray(propKeys) ? propKeys : [propKeys];
  var props = PropertiesService.getScriptProperties();
  for (var i = 0; i < keys.length; i++) {
    var val = String(props.getProperty(keys[i]) || '').trim();
    if (val) return val;
  }
  return null;
}

/**
 * Baca satu sheet dari spreadsheet satelit secara aman (federated read-only).
 * Tidak melempar error jika satelit belum terhubung; mengembalikan status terstruktur.
 *
 * @param {string|string[]} propKeys - Key ScriptProperties satelit
 * @param {string} sheetName         - Nama sheet target
 * @param {boolean} [activeOnly]     - Jika true, hanya ambil baris Status === 'ACTIVE'
 * @returns {{connected:boolean, ssId:string|null, rows:Object[], error:string|null}}
 */
function readSatelliteRows(propKeys, sheetName, activeOnly) {
  var ssId = resolveSatelliteSpreadsheetId(propKeys);
  if (!ssId) {
    return { connected: false, ssId: null, rows: [], error: 'Property belum dikonfigurasi' };
  }
  try {
    var ss = _openSsCached(ssId);
    if (!ss) {
      return { connected: false, ssId: ssId, rows: [], error: 'Spreadsheet tidak dapat dibuka' };
    }
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      return { connected: true, ssId: ssId, rows: [], error: 'Sheet "' + sheetName + '" tidak ditemukan' };
    }
    var rows = sheetToObjects(sheet);
    if (activeOnly) {
      rows = rows.filter(function (r) {
        return String(r['Status'] || '').toUpperCase() === ROW_STATUS.ACTIVE;
      });
    }
    return { connected: true, ssId: ssId, rows: rows, error: null };
  } catch (e) {
    Logger.log('[readSatelliteRows] ' + sheetName + ' (' + ssId + '): ' + e.message);
    return { connected: false, ssId: ssId, rows: [], error: e.message };
  }
}

// ===========================================================================
// SELF-HEAL KOLOM MASTER
// ===========================================================================

function ensureMasterColumn(sheetName, colName) {
  var sheet = openMasterSheet(sheetName);
  if (!sheet) return;
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) return;
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  if (headers.indexOf(colName) !== -1) return;
  var newCol = lastCol + 1;
  var cell = sheet.getRange(1, newCol);
  cell.setValue(colName).setFontWeight('bold').setBackground('#E8EAF6');
}

function ensureUsersNipColumn() {
  ensureMasterColumn(SHEET_MASTER.USERS, 'NIP');
}

function ensureKapalJenisColumn() {
  ensureMasterColumn(SHEET_MASTER.KAPAL, 'JenisKapal');
}

function ensureKapalKelasColumn() {
  ensureMasterColumn(SHEET_MASTER.KAPAL, 'KelasKapal');
  ensureMasterColumn(SHEET_MASTER.KAPAL, 'PanjangMeter');
  ensureMasterColumn(SHEET_MASTER.KAPAL, 'WPPDefault');
  ensureMasterColumn(SHEET_MASTER.KAPAL, 'PangkalanHomebase');
}

function ensureOpsiSheet() {
  var existing = openMasterSheet(SHEET_MASTER.OPSI);
  if (existing) { ensureOpsiColumns(existing); return existing; }
  var ss = _openSsCached(getSpreadsheetIds().masterId || ensurePusatSpreadsheet());
  var sheet = ss.insertSheet(SHEET_MASTER.OPSI);
  sheet.getRange(1, 1, 1, 7)
    .setValues([['Kode', 'Urutan', 'Label', 'LabelTampil', 'Aktif', 'DibuatOleh', 'DibuatAt']])
    .setFontWeight('bold')
    .setBackground('#E8EAF6');
  sheet.setFrozenRows(1);
  return sheet;
}

function ensureOpsiColumns(sheet) {
  if (!sheet) return;
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) return;
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  if (headers.indexOf('LabelTampil') !== -1) return;

  var labelCol = headers.indexOf('Label') + 1;
  if (labelCol < 1) labelCol = lastCol;
  sheet.insertColumnAfter(labelCol);
  var newCol = labelCol + 1;

  sheet.getRange(1, newCol).setValue('LabelTampil').setFontWeight('bold').setBackground('#E8EAF6');
  var lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    sheet.getRange(2, newCol, lastRow - 1, 1)
      .setValues(sheet.getRange(2, labelCol, lastRow - 1, 1).getValues());
  }
}

function readOpsiRows() {
  return sheetToObjects(ensureOpsiSheet());
}

// ===========================================================================
// ROW READING & WRITING
// ===========================================================================

function sheetToObjects(sheet) {
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0];
  return data.slice(1).map(function (row) {
    var obj = {};
    headers.forEach(function (h, i) { obj[h] = row[i]; });
    return obj;
  });
}

function findRowByField(sheet, colName, value) {
  if (!sheet) return null;
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return null;
  var headers = data[0];
  var colIdx = headers.indexOf(colName);
  if (colIdx === -1) return null;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][colIdx]) === String(value)) {
      var obj = {};
      headers.forEach(function (h, j) { obj[h] = data[i][j]; });
      return { obj: obj, rowIndex: i + 1 };
    }
  }
  return null;
}

function findRowById(sheet, rowId) {
  return findRowByField(sheet, 'RowID', rowId);
}

function bumpTxVersion(sheetName) {
  try {
    var cache = CacheService.getScriptCache();
    var n = Number(cache.get('DASH_TX_VERSION')) || 0;
    cache.put('DASH_TX_VERSION', String(n + 1), 21600);

    var meta = {
      timestamp: new Date().toISOString(),
      sheet: sheetName || 'Transaksi'
    };
    cache.put('METADATA_LAST_TX', JSON.stringify(meta), 21600);
    try {
      PropertiesService.getScriptProperties().setProperty('METADATA_LAST_TX', JSON.stringify(meta));
    } catch (eProp) {}
  } catch (ignore) {}
}

function appendRowData(sheet, dataObj) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var row = headers.map(function (h) {
    var val = dataObj[h];
    return (val === undefined || val === null) ? '' : val;
  });
  sheet.appendRow(row);
  bumpTxVersion(sheet.getName ? sheet.getName() : 'Transaksi');
  SpreadsheetApp.flush();
}

function updateRowCells(sheet, rowIndex, updates) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  Object.keys(updates).forEach(function (colName) {
    var colIndex = headers.indexOf(colName) + 1;
    if (colIndex > 0) {
      sheet.getRange(rowIndex, colIndex).setValue(updates[colName]);
    }
  });
  bumpTxVersion(sheet.getName ? sheet.getName() : 'Transaksi');
  SpreadsheetApp.flush();
}

// ===========================================================================
// OPSI (daftar pilihan dinamis)
// ===========================================================================

function getOpsiList(kode) {
  var key = 'OPSI_LIST_' + String(kode || '');
  var cache = CacheService.getScriptCache();
  var cached = cache.get(key);
  if (cached) {
    try { return JSON.parse(cached); } catch (e) {}
  }

  var orderMap = {};
  try {
    readOpsiRows().forEach(function (r) {
      if (String(r['Kode']) !== String(kode)) return;
      var label = String(r['Label'] || '').trim();
      if (!label) return;
      if (String(r['Aktif']).toLowerCase() === 'false') return;
      orderMap[label] = Number(r['Urutan']) || 0;
    });
  } catch (e) {
    Logger.log('[getOpsiList] ' + e.message);
  }

  var labels = Object.keys(orderMap).sort(function (a, b) {
    return (orderMap[a] || 0) - (orderMap[b] || 0) || a.localeCompare(b);
  });
  try { cache.put(key, JSON.stringify(labels), 600); } catch (e) {}
  return labels;
}

function getOpsiLabelMap(kode) {
  var key = 'OPSI_MAP_' + String(kode || '');
  var cache = CacheService.getScriptCache();
  var cached = cache.get(key);
  if (cached) {
    try { return JSON.parse(cached); } catch (e) {}
  }

  var map = {};
  try {
    readOpsiRows().forEach(function (r) {
      if (String(r['Kode']) !== String(kode)) return;
      var label = String(r['Label'] || '').trim();
      if (!label) return;
      map[label] = String(r['LabelTampil'] || '').trim() || label;
    });
  } catch (e) {
    Logger.log('[getOpsiLabelMap] ' + e.message);
  }
  try { cache.put(key, JSON.stringify(map), 600); } catch (e) {}
  return map;
}

function getOpsiLabel(kode, token) {
  var t = String(token || '').trim().toUpperCase();
  if (!t) return '';
  return getOpsiLabelMap(kode)[t] || t;
}

function getOpsiItems(kode) {
  var map = getOpsiLabelMap(kode);
  return getOpsiList(kode).map(function (token) {
    return { value: token, label: map[token] || token };
  });
}

function getOpsiDetail(kode) {
  var out = [];
  var seen = {};
  try {
    readOpsiRows().forEach(function (r) {
      if (String(r['Kode']) !== String(kode)) return;
      var label = String(r['Label'] || '').trim();
      if (!label || seen[label]) return;
      seen[label] = true;
      var tampil = String(r['LabelTampil'] || '').trim();
      out.push({
        label: label,
        labelTampil: tampil || label,
        aktif: String(r['Aktif']).toLowerCase() !== 'false',
        urutan: Number(r['Urutan']) || 0
      });
    });
  } catch (e) {
    Logger.log('[getOpsiDetail] ' + e.message);
  }
  out.sort(function (a, b) { return a.urutan - b.urutan || a.label.localeCompare(b.label); });
  return out;
}

function clearOpsiCache() {
  var cache = CacheService.getScriptCache();
  Object.keys(OPSI_KODE).forEach(function (k) {
    var kode = OPSI_KODE[k];
    cache.remove('OPSI_LIST_' + kode);
    cache.remove('OPSI_MAP_' + kode);
  });
}

function logAudit(userId, aksi, sheetTarget, rowIdTarget, alasanOrDetail) {
  try {
    var sheet = openLogSheet(SHEET_LOG.AUDIT_LOG);
    if (!sheet) return;
    var alasanStr = (typeof alasanOrDetail === 'object' && alasanOrDetail !== null)
      ? JSON.stringify(alasanOrDetail)
      : String(alasanOrDetail || '');

    appendRowData(sheet, {
      'LogID':       'RADAR-AUD-' + Utilities.getUuid().replace(/-/g, '').substring(0, 10).toUpperCase(),
      'UserID':      userId,
      'Aksi':        aksi,
      'SheetTarget': sheetTarget,
      'RowIDTarget': rowIdTarget,
      'Alasan':      alasanStr,
      'Timestamp':   new Date()
    });
  } catch (e) {
    Logger.log('[logAudit] ' + e.message);
  }
}

// ===========================================================================
// STANDARISASI FORMAT FISIK GOOGLE SHEET (Fase 6)
// ===========================================================================

var _FORMAL_COL_FORMATS = {
  // Plain text ID & periode
  'NIP': '@', 'Periode': '@', 'BulanTahun': '@', 'RowID': '@', 'UserID': '@',
  'LogID': '@', 'KapalID': '@', 'DivisiID': '@', 'WPPCode': '@', 'WPPDefault': '@',
  'EvidenceID': '@', 'QueueID': '@', 'NotifID': '@',
  // Tanggal & timestamp
  'Tanggal': 'yyyy-mm-dd',
  'Timestamp': 'yyyy-mm-dd hh:mm:ss', 'VoidedAt': 'yyyy-mm-dd hh:mm:ss',
  'RegisteredAt': 'yyyy-mm-dd hh:mm:ss', 'ApprovedAt': 'yyyy-mm-dd hh:mm:ss',
  'UploadedAt': 'yyyy-mm-dd hh:mm:ss', 'CreatedAt': 'yyyy-mm-dd hh:mm:ss',
  'DecidedAt': 'yyyy-mm-dd hh:mm:ss',
  // Numerik bilangan bulat & mata uang
  'TotalPagu_Reguler': '#,##0', 'TotalPagu_ABT': '#,##0',
  'TotalRealisasi_SP2D_Reguler': '#,##0', 'TotalRealisasi_SP2D_ABT': '#,##0',
  'TotalKegiatanDirektorat': '#,##0', 'Aset_RusakBerat_Unit': '#,##0', 'PanjangMeter': '#,##0',
  // Persentase desimal
  'PctSerapan_Nasional': '0.00', 'Armada_Siap_Pct': '0.00'
};

/**
 * Terapkan format formal instansional ke sebuah Google Sheet:
 * header gelap (#0E1722, teks putih bold, tinggi 34px, freeze row 1),
 * baris data 26px zebra striping (#FFFFFF / #F4F7F9), vertical-align middle,
 * format angka/teks/tanggal sesuai kolom, dan auto-resize kolom.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @returns {GoogleAppsScript.Spreadsheet.Sheet|null}
 */
function applyFormalSheetFormatting(sheet) {
  if (!sheet) return null;
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 1 || lastCol < 1) return sheet;

  var headerRange = sheet.getRange(1, 1, 1, lastCol);
  if (typeof headerRange.setFontWeight === 'function') headerRange.setFontWeight('bold');
  if (typeof headerRange.setBackground === 'function') headerRange.setBackground('#0E1722');
  if (typeof headerRange.setFontColor === 'function') headerRange.setFontColor('#FFFFFF');
  if (typeof headerRange.setVerticalAlignment === 'function') headerRange.setVerticalAlignment('middle');
  if (typeof sheet.setRowHeight === 'function') sheet.setRowHeight(1, 34);
  if (typeof sheet.setFrozenRows === 'function') sheet.setFrozenRows(1);

  if (lastRow >= 2) {
    var dataRowsCount = lastRow - 1;
    var allDataRange = sheet.getRange(2, 1, dataRowsCount, lastCol);
    if (typeof allDataRange.setVerticalAlignment === 'function') {
      allDataRange.setVerticalAlignment('middle');
    }

    for (var r = 2; r <= lastRow; r++) {
      if (typeof sheet.setRowHeight === 'function') sheet.setRowHeight(r, 26);
      var rowRange = sheet.getRange(r, 1, 1, lastCol);
      if (typeof rowRange.setBackground === 'function') {
        rowRange.setBackground((r % 2 === 0) ? '#FFFFFF' : '#F4F7F9');
      }
    }

    var headers = headerRange.getValues()[0] || [];
    for (var c = 0; c < headers.length; c++) {
      var fmt = _FORMAL_COL_FORMATS[String(headers[c] || '').trim()];
      if (!fmt) continue;
      var colRange = sheet.getRange(2, c + 1, dataRowsCount, 1);
      if (typeof colRange.setNumberFormat === 'function') {
        colRange.setNumberFormat(fmt);
      }
    }
  }

  if (typeof sheet.autoResizeColumn === 'function') {
    for (var colIdx = 1; colIdx <= lastCol; colIdx++) {
      try { sheet.autoResizeColumn(colIdx); } catch (eResize) {}
    }
  }
  return sheet;
}

/**
 * Terapkan applyFormalSheetFormatting() ke seluruh sheet utama Radar POA.
 * @returns {string[]} daftar nama sheet yang diformat
 */
function formatFormalSheets() {
  var formatted = [];
  var targets = [
    openTransaksiSheet(SHEET_PUSAT.KEGIATAN_DIREKTORAT),
    openLogSheet(SHEET_LOG.AUDIT_LOG),
    openMasterSheet(SHEET_MASTER.USERS),
    openMasterSheet(SHEET_MASTER.KAPAL)
  ];

  var ids = getSpreadsheetIds();
  if (ids.lookerMartId) {
    try {
      var martSs = _openSsCached(ids.lookerMartId);
      if (martSs) targets.push(martSs.getSheetByName(SHEET_MART.IKHTISAR_NASIONAL));
    } catch (eMart) {}
  }

  targets.forEach(function (sh) {
    if (!sh) return;
    applyFormalSheetFormatting(sh);
    if (typeof sh.getName === 'function') formatted.push(sh.getName());
  });
  return formatted;
}
