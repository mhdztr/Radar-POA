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

var _EXEC_SS_CACHE = {};

function _openSsCached(ssId) {
  if (!ssId) return null;
  if (_EXEC_SS_CACHE[ssId]) return _EXEC_SS_CACHE[ssId];
  var ss = SpreadsheetApp.openById(ssId);
  if (ss) _EXEC_SS_CACHE[ssId] = ss;
  return ss;
}

function openMasterSheet(sheetName) {
  var ids = getSpreadsheetIds();
  var ss = _openSsCached(ids.masterId);
  if (!ss) return null;
  return ss.getSheetByName(sheetName);
}

function openTransaksiSheet(sheetName) {
  var ids = getSpreadsheetIds();
  var ss = _openSsCached(ids.pusatId);
  if (!ss) return null;
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = _autoCreatePusatSheet(ss, sheetName);
  }
  return sheet;
}

function openLogSheet(sheetName) {
  var ids = getSpreadsheetIds();
  var ss = _openSsCached(ids.logId);
  if (!ss) return null;
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = _autoCreateLogSheet(ss, sheetName);
  }
  return sheet;
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
  created.getRange(1, 1, 1, headers.length)
    .setValues([headers])
    .setFontWeight('bold')
    .setBackground('#0F172A')
    .setFontColor('#FFFFFF');
  created.setFrozenRows(1);
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
  created.getRange(1, 1, 1, headers.length)
    .setValues([headers])
    .setFontWeight('bold')
    .setBackground('#0F172A')
    .setFontColor('#FFFFFF');
  created.setFrozenRows(1);
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
  var ss = _openSsCached(getSpreadsheetIds().masterId);
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
