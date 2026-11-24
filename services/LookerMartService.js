/**
 * services/LookerMartService.js
 * Pipeline ETL Data Mart Looker Studio (`RadarPOA_Looker_Mart` -> `Mart_Ikhtisar_Nasional`)
 * serta manajemen pemicu terjadwal otomatis.
 *
 * Sumber kebenaran skema: DATA_SCHEMA.md §2 (10 kolom flat bebas baris SUPERSEDED/VOID).
 *
 * Fungsi publik:
 *   looker_syncMart(token, filter)         — Sinkronisasi manual Data Mart (SUPERADMIN / DIREKTUR)
 *   looker_scheduledSyncMart()             — Entry point time trigger harian 06:00 WIB
 *   looker_getTriggerSettings(token)       — Cek status jadwal sinkronisasi Looker Mart
 *   looker_setTriggerAktif(token, aktif)   — Aktifkan / nonaktifkan trigger harian (SUPERADMIN)
 */

var _LOOKER_MART_HEADERS = [
  'Periode',
  'BulanTahun',
  'TotalPagu_Reguler',
  'TotalPagu_ABT',
  'TotalRealisasi_SP2D_Reguler',
  'TotalRealisasi_SP2D_ABT',
  'PctSerapan_Nasional',
  'Armada_Siap_Pct',
  'TotalKegiatanDirektorat',
  'Aset_RusakBerat_Unit'
];

// ===========================================================================
// PUBLIC ENDPOINTS
// ===========================================================================

/**
 * Eksekusi batch ETL Looker Data Mart dari AggregatorService ke `Mart_Ikhtisar_Nasional`.
 * Menggunakan withLock() agar upsert per Periode aman dari eksekusi bersamaan.
 *
 * @param {string} token
 * @param {Object} [filter]
 */
function looker_syncMart(token, filter) {
  try {
    var session = _requireSession(token);
    assertScope(session, [ROLE.SUPERADMIN, ROLE.DIREKTUR], null);

    var data = withLock(function () {
      return _lookerRunSync(filter, session.userId, 'MANUAL');
    });
    return { success: true, data: data };
  } catch (e) {
    Logger.log('[looker_syncMart] ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Entry point time-driven trigger harian (tanpa argumen & token).
 */
function looker_scheduledSyncMart() {
  try {
    var res = withLock(function () {
      return _lookerRunSync(null, 'SYSTEM', 'SCHEDULED_TRIGGER');
    });
    Logger.log('[looker_scheduledSyncMart] OK: ' + JSON.stringify({
      periode: res.periode,
      action: res.action,
      totalRows: res.totalRows
    }));
    return { success: true, data: res };
  } catch (e) {
    Logger.log('[looker_scheduledSyncMart] GAGAL: ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Ambil status trigger otomatis Data Mart Looker Studio.
 * @param {string} token
 */
function looker_getTriggerSettings(token) {
  try {
    var session = _requireSession(token);
    assertScope(session, [ROLE.SUPERADMIN, ROLE.DIREKTUR], null);
    return { success: true, data: _lookerTriggerState() };
  } catch (e) {
    Logger.log('[looker_getTriggerSettings] ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Aktifkan atau nonaktifkan trigger harian Looker Data Mart (hanya SUPERADMIN).
 * @param {string} token
 * @param {boolean} aktif
 */
function looker_setTriggerAktif(token, aktif) {
  try {
    return withLock(function () {
      var session = _requireSession(token);
      assertScope(session, [ROLE.SUPERADMIN], null);

      if (aktif === true) {
        _lookerInstallTrigger();
      } else if (aktif === false) {
        _lookerRemoveTrigger();
      } else {
        return { success: false, error: 'Nilai aktif tidak valid.' };
      }

      logAudit(
        session.userId,
        'UPDATE',
        SHEET_MART.IKHTISAR_NASIONAL,
        'SYSTEM_LOOKER_TRIGGER',
        'Sinkronisasi terjadwal Looker Studio Mart ' + (aktif ? 'diaktifkan' : 'dinonaktifkan') + ' oleh Superadmin.'
      );

      return { success: true, data: _lookerTriggerState() };
    });
  } catch (e) {
    Logger.log('[looker_setTriggerAktif] ' + e.message);
    return { success: false, error: e.message };
  }
}

// ===========================================================================
// CORE ETL & SPREADSHEET SELF-HEAL
// ===========================================================================

function _lookerEnsureSpreadsheet() {
  var props = PropertiesService.getScriptProperties();
  var ssId = props.getProperty(PROP_KEY.LOOKER_MART_SS_ID);
  var ss = null;

  if (ssId) {
    try {
      ss = _openSsCached(ssId);
    } catch (eOpen) {
      Logger.log('[_lookerEnsureSpreadsheet] LOOKER_MART_SS_ID gagal dibuka (' + ssId + '): ' + eOpen.message);
      ss = null;
    }
  }

  if (!ss) {
    ss = SpreadsheetApp.create(SS_NAME.LOOKER_MART);
    ssId = ss.getId();
    _EXEC_SS_CACHE[ssId] = ss;
    props.setProperty(PROP_KEY.LOOKER_MART_SS_ID, ssId);
  }

  var sheet = ss.getSheetByName(SHEET_MART.IKHTISAR_NASIONAL);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_MART.IKHTISAR_NASIONAL);
    sheet.getRange(1, 1, 1, _LOOKER_MART_HEADERS.length).setValues([_LOOKER_MART_HEADERS]);
    applyFormalSheetFormatting(sheet);

    var sheets = ss.getSheets();
    for (var i = 0; i < sheets.length; i++) {
      if (sheets[i].getName() === 'Sheet1' && sheets.length > 1) {
        try { ss.deleteSheet(sheets[i]); } catch (eDel) {}
        break;
      }
    }
  } else if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, _LOOKER_MART_HEADERS.length).setValues([_LOOKER_MART_HEADERS]);
    applyFormalSheetFormatting(sheet);
  }

  return { ss: ss, ssId: ssId, sheet: sheet };
}

function _lookerResolvePeriode(filter, agg) {
  var f = filter || {};
  if (f.mode === 'range' && f.dateTo) {
    var dEnd = (typeof _parseLocalDate === 'function') ? _parseLocalDate(f.dateTo, false) : new Date(f.dateTo);
    if (dEnd && !isNaN(dEnd.getTime())) {
      return dateToPeriode(dEnd);
    }
  }
  if (f.mode === 'monthly' && f.year && f.month) {
    var y = Number(f.year);
    var m = Number(f.month);
    var now = new Date();
    if (y === now.getFullYear() && m === (now.getMonth() + 1)) {
      return dateToPeriode(now);
    }
    return dateToPeriode(new Date(y, m, 0));
  }
  return (agg && agg.meta && agg.meta.periodeAktif) ? agg.meta.periodeAktif : getCurrentPeriode();
}

function _lookerComputeArmadaSiapPct() {
  if (typeof _dashGetTacticalFleet === 'function') {
    var fleet = _dashGetTacticalFleet([]);
    var total = fleet.length;
    if (total > 0) {
      var siap = fleet.filter(function (k) {
        return k.status === 'OPERASIONAL' || k.status === 'SIAP_PANGKALAN';
      }).length;
      return _aggRound((siap / total) * 100, 2);
    }
  }
  try {
    var kapalRows = sheetToObjects(openMasterSheet(SHEET_MASTER.KAPAL));
    if (kapalRows.length > 0) {
      var activeCount = kapalRows.filter(function (k) {
        return k['StatusAktif'] === true || String(k['StatusAktif'] || '').toUpperCase() === 'TRUE';
      }).length;
      return _aggRound((activeCount / kapalRows.length) * 100, 2);
    }
  } catch (eK) {}
  return 0;
}

function _lookerRunSync(filter, actorUserId, source) {
  var agg = agg_collectAll(filter, true);
  var periode = _lookerResolvePeriode(filter, agg);
  var bulanTahun = periode.length >= 7 ? periode.substring(0, 7) : '';

  var ang = (agg.sikap && agg.sikap.anggaran) ? agg.sikap.anggaran : {};
  var bmn = (agg.sikap && agg.sikap.bmn) ? agg.sikap.bmn : { kondisi: {} };
  var pusat = agg.pusat || {};

  var martRow = {
    Periode: periode,
    BulanTahun: bulanTahun,
    TotalPagu_Reguler: Number(ang.paguReguler || 0),
    TotalPagu_ABT: Number(ang.paguABT || 0),
    TotalRealisasi_SP2D_Reguler: Number(ang.realisasiSP2D_Reguler || 0),
    TotalRealisasi_SP2D_ABT: Number(ang.realisasiSP2D_ABT || 0),
    PctSerapan_Nasional: Number(ang.sp2dPct || 0),
    Armada_Siap_Pct: _lookerComputeArmadaSiapPct(),
    TotalKegiatanDirektorat: Number(pusat.kegiatanYtd || 0),
    Aset_RusakBerat_Unit: Number((bmn.kondisi && bmn.kondisi.RUSAK_BERAT) || 0)
  };

  var target = _lookerEnsureSpreadsheet();
  var existing = findRowByField(target.sheet, 'Periode', periode);
  var action;

  if (existing) {
    updateRowCells(target.sheet, existing.rowIndex, martRow);
    action = 'UPDATED';
  } else {
    appendRowData(target.sheet, martRow);
    action = 'INSERTED';
  }

  applyFormalSheetFormatting(target.sheet);

  var syncedAt = new Date().toISOString();
  PropertiesService.getScriptProperties().setProperty(PROP_KEY.LOOKER_MART_LAST_SYNC, syncedAt);

  logAudit(
    actorUserId || 'SYSTEM',
    source === 'MANUAL' ? 'SYNC_MANUAL' : 'UPDATE',
    SHEET_MART.IKHTISAR_NASIONAL,
    periode,
    'Sinkronisasi Looker Studio Mart (' + action + ', ' + source + ') untuk periode ' + periode + '.'
  );

  return {
    spreadsheetId: target.ssId,
    sheetName: SHEET_MART.IKHTISAR_NASIONAL,
    action: action,
    periode: periode,
    bulanTahun: bulanTahun,
    row: martRow,
    totalRows: Math.max(0, target.sheet.getLastRow() - 1),
    syncedAt: syncedAt
  };
}

// ===========================================================================
// SCHEDULED TRIGGER MANAGEMENT
// ===========================================================================

function _lookerTriggerState() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(PROP_KEY.LOOKER_TRIGGER_ID);
  var aktif = false;

  if (id && typeof ScriptApp !== 'undefined') {
    var triggers = ScriptApp.getProjectTriggers();
    for (var i = 0; i < triggers.length; i++) {
      if (triggers[i].getUniqueId() === id) {
        aktif = true;
        break;
      }
    }
    if (!aktif) props.deleteProperty(PROP_KEY.LOOKER_TRIGGER_ID);
  }

  return {
    aktif: aktif,
    jadwal: 'Setiap hari 06:00 WIB',
    lookerMartId: props.getProperty(PROP_KEY.LOOKER_MART_SS_ID) || null,
    lastSyncedAt: props.getProperty(PROP_KEY.LOOKER_MART_LAST_SYNC) || null
  };
}

function _lookerInstallTrigger() {
  _lookerRemoveTrigger();
  var trigger = ScriptApp.newTrigger('looker_scheduledSyncMart')
    .timeBased()
    .everyDays(1)
    .atHour(6)
    .create();
  PropertiesService.getScriptProperties().setProperty(PROP_KEY.LOOKER_TRIGGER_ID, trigger.getUniqueId());
}

function _lookerRemoveTrigger() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(PROP_KEY.LOOKER_TRIGGER_ID);
  try {
    if (typeof ScriptApp !== 'undefined') {
      var triggers = ScriptApp.getProjectTriggers();
      for (var i = 0; i < triggers.length; i++) {
        var isTarget = (id && triggers[i].getUniqueId() === id) ||
          (typeof triggers[i].getHandlerFunction === 'function' && triggers[i].getHandlerFunction() === 'looker_scheduledSyncMart');
        if (isTarget) ScriptApp.deleteTrigger(triggers[i]);
      }
    }
  } catch (e) {
    Logger.log('[_lookerRemoveTrigger] ' + e.message);
  }
  props.deleteProperty(PROP_KEY.LOOKER_TRIGGER_ID);
}
