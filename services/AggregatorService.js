/**
 * services/AggregatorService.js
 * Engine Konsolidasi Lintas Spreadsheet (Federated Ingestion) & In-Memory Cache.
 *
 * Sumber data aktif:
 *   1. SIKAP   (RadarPOA_SIKAP_DB   via SIKAP_SS_ID / TU_SS_ID)
 *   2. NAKHODA (RadarPOA_Nakhoda_DB via NAKHODA_SS_ID / AWAK_SS_ID)
 *   3. PUSAT   (RadarPOA_Pusat_DB   — TX_KegiatanDirektorat)
 *
 * Sumber data masa depan (degradasi aman jika belum dikonfigurasi):
 *   4. SISTIK  (SISTIK_SS_ID)
 *   5. SIAGA   (SIAGA_SS_ID)
 *   6. OPERASI / INTELIJEN / PEMANTAUAN (OPERASI_SS_ID / INTEL_SS_ID / PANTAU_SS_ID)
 *
 * Cache: CacheService.getScriptCache() TTL 900 detik (15 menit), dapat di-invalidate
 * paksa melalui radar_triggerSyncNow(token).
 */

var _AGG_CACHE_TTL_SEC = 900; // 15 menit (ARCHITECTURE.md §4)
var _AGG_VER_KEY       = 'RADAR_AGG_VERSION';

// ===========================================================================
// CACHE VERSIONING & SYNC ENDPOINTS
// ===========================================================================

function _aggGetVersion() {
  try {
    return String(CacheService.getScriptCache().get(_AGG_VER_KEY) || '0');
  } catch (e) {
    return '0';
  }
}

function _aggBumpVersion() {
  try {
    var cache = CacheService.getScriptCache();
    var next = (Number(cache.get(_AGG_VER_KEY)) || 0) + 1;
    cache.put(_AGG_VER_KEY, String(next), 21600);
    return String(next);
  } catch (e) {
    return String(Date.now());
  }
}

/**
 * Trigger sinkronisasi manual — invalidate cache 15 menit & tarik ulang data segar
 * dari seluruh spreadsheet satelit (Nakhoda, SIKAP, Pusat, dst.).
 *
 * @param {string} token
 * @param {Object} [filter]
 */
function radar_triggerSyncNow(token, filter) {
  try {
    var session = _requireSession(token);
    assertScope(session, [ROLE.SUPERADMIN, ROLE.DIREKTUR, ROLE.KADIV], null);

    _aggBumpVersion();
    try { bumpTxVersion('SYNC_MANUAL'); } catch (ignore) {}

    var payload = agg_collectAll(filter, true);
    logAudit(session.userId, 'SYNC_MANUAL', 'ALL_SATELLITES', 'AGGREGATOR',
      'Sinkronisasi paksa lintas spreadsheet selesai (' + payload.meta.syncedAt + ').');

    return { success: true, data: payload };
  } catch (e) {
    Logger.log('[radar_triggerSyncNow] ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Status konektivitas satelit (SIKAP, NAKHODA, SISTIK, SIAGA, OPERASI, PUSAT).
 * @param {string} token
 */
function radar_getSatelliteStatus(token) {
  try {
    var session = _requireSession(token);
    if (session.status !== USER_STATUS.APPROVED) {
      throw new Error('UNAUTHORIZED: Akun belum aktif.');
    }
    var payload = agg_collectAll(null, false);
    return { success: true, data: payload.satellites };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ===========================================================================
// MAIN AGGREGATOR ENGINE
// ===========================================================================

/**
 * Kumpulkan dan hitung seluruh metrik dari SIKAP, NAKHODA, dan PUSAT.
 * Memakai CacheService 15 menit kecuali forceRefresh = true.
 *
 * @param {Object} [filter]
 * @param {boolean} [forceRefresh]
 * @returns {Object}
 */
function agg_collectAll(filter, forceRefresh) {
  var f = filter || {
    mode: 'monthly',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  };
  var range = filterToDateRange(f);
  var filterKey = (f.mode === 'range')
    ? ('range_' + (f.dateFrom || '') + '_' + (f.dateTo || ''))
    : ('monthly_' + (f.year || '') + '_' + (f.month || ''));

  var cache = CacheService.getScriptCache();
  var cacheKey = 'RADAR_AGG_V' + _aggGetVersion() + '_' + _dashTxVer() + '_' + filterKey;

  if (!forceRefresh) {
    var cached = cache.get(cacheKey);
    if (cached) {
      try {
        var parsed = JSON.parse(cached);
        if (parsed) {
          parsed.meta.fromCache = true;
          return parsed;
        }
      } catch (eParse) {}
    }
  }

  var year = (f.mode === 'range' && f.dateTo)
    ? new Date(f.dateTo).getFullYear()
    : (Number(f.year) || new Date().getFullYear());
  var ytdStart = new Date(year, 0, 1);
  var ytdRange = { startDate: ytdStart, endDate: range.endDate };
  var weekRange = periodeToDateRange(getCurrentPeriode());
  var months = utils_getTrendMonths(f);

  // ── 1. INGEST SIKAP (RadarPOA_SIKAP_DB) ─────────────────────────────────
  var sikap = _aggIngestSikap(range, ytdRange, weekRange, months);

  // ── 2. INGEST NAKHODA (RadarPOA_Nakhoda_DB) ─────────────────────────────
  var nakhoda = _aggIngestNakhoda(range, ytdRange, weekRange);

  // ── 3. INGEST PUSAT (RadarPOA_Pusat_DB — Kegiatan Direktorat) ───────────
  var pusat = _aggIngestPusat(range, ytdRange);

  // ── 4. STATUS SATELIT LAIN (Belum Terhubung / Opsional) ─────────────────
  var sistikId  = resolveSatelliteSpreadsheetId([PROP_KEY.SISTIK_SS_ID]);
  var siagaId   = resolveSatelliteSpreadsheetId([PROP_KEY.SIAGA_SS_ID]);
  var operasiId = resolveSatelliteSpreadsheetId([PROP_KEY.OPERASI_SS_ID]);

  var result = {
    meta: {
      syncedAt: new Date().toISOString(),
      fromCache: false,
      cacheTtlSec: _AGG_CACHE_TTL_SEC,
      periodeAktif: getCurrentPeriode(),
      year: year
    },
    satellites: {
      PUSAT:   { label: 'Pusat (Dit. POA)', connected: true,  ssId: getSpreadsheetIds().pusatId },
      SIKAP:   { label: 'SIKAP (TU)',       connected: sikap.connected,   error: sikap.error },
      NAKHODA: { label: 'Nakhoda (Awak)',   connected: nakhoda.connected, error: nakhoda.error },
      SISTIK:  { label: 'Sistik (Logistik)',connected: !!sistikId,  error: sistikId ? null : 'Belum terhubung' },
      SIAGA:   { label: 'Siaga (Harwat)',   connected: !!siagaId,   error: siagaId ? null : 'Belum terhubung' },
      OPERASI: { label: 'Operasi & Pantau', connected: !!operasiId, error: operasiId ? null : 'Belum terhubung' }
    },
    sikap:   sikap,
    nakhoda: nakhoda,
    pusat:   pusat
  };

  try {
    cache.put(cacheKey, JSON.stringify(result), _AGG_CACHE_TTL_SEC);
  } catch (eCache) {
    Logger.log('[agg_collectAll] Cache put skipped: ' + eCache.message);
  }

  return result;
}

function _dashTxVer() {
  try {
    return String(CacheService.getScriptCache().get('DASH_TX_VERSION') || '0');
  } catch (e) {
    return '0';
  }
}

// ===========================================================================
// INGESTOR 1: SIKAP (RadarPOA_SIKAP_DB)
// ===========================================================================

function _aggIngestSikap(range, ytdRange, weekRange, months) {
  var keys = [PROP_KEY.SIKAP_SS_ID, PROP_KEY.TU_SS_ID];
  var tuRes = readSatelliteRows(keys, SHEET_SIKAP.TATA_USAHA, true);
  if (!tuRes.connected && !tuRes.ssId) {
    return {
      connected: false,
      error: tuRes.error,
      anggaran: _aggEmptyAnggaran(months),
      paket: { totalPaket: 0, totalNilaiKontrak: 0, totalRealisasiKeu: 0, avgProgresFisik: 0 },
      bmn: { totalUnit: 0, totalNilaiPerolehan: 0, totalNilaiBuku: 0, kondisi: { BAIK: 0, RUSAK_RINGAN: 0, RUSAK_BERAT: 0 }, dalamPenghapusan: 0 },
      kepegawaian: { totalPegawaiPOA: 0, disparitasNakhoda: 0, headcountTU: {} },
      melaporMingguIni: false
    };
  }

  var tuRows = tuRes.rows || [];
  var latestTu = _aggLatestByTimestamp(tuRows);
  var paguReguler = latestTu ? _aggNum(latestTu['PaguReguler']) : 0;
  var paguABT     = latestTu ? _aggNum(latestTu['PaguABT'])     : 0;
  var paguTotal   = paguReguler + paguABT;

  var sp2dReg = 0, sp2dAbt = 0, akruReg = 0, akruAbt = 0;
  var melaporMingguIni = false;

  tuRows.forEach(function (r) {
    var ts = new Date(r['Timestamp']);
    if (!isNaN(ts.getTime()) && ts >= ytdRange.startDate && ts <= ytdRange.endDate) {
      var sReg = _aggNum(r['RealisasiSP2D_Reguler_Minggu']);
      var sAbt = _aggNum(r['RealisasiSP2D_ABT_Minggu']);
      var aReg = _aggNum(r['RealisasiAkrual_Reguler_Minggu']);
      var aAbt = _aggNum(r['RealisasiAkrual_ABT_Minggu']);
      var lSp2d = _aggNum(r['RealisasiSP2D_Minggu']);
      var lAkru = _aggNum(r['RealisasiAkrual_Minggu']);

      if (sReg > 0 || sAbt > 0) {
        sp2dReg += sReg;
        sp2dAbt += sAbt;
      } else {
        sp2dReg += lSp2d;
      }

      if (aReg > 0 || aAbt > 0) {
        akruReg += aReg;
        akruAbt += aAbt;
      } else {
        akruReg += lAkru;
      }
    }
    if (weekRange && _aggRowInWeek(r, weekRange)) melaporMingguIni = true;
  });

  var realSP2D = sp2dReg + sp2dAbt;
  var realAkrual = akruReg + akruAbt;
  var sp2dPct = paguTotal > 0 ? _aggRound(realSP2D / paguTotal * 100, 2) : 0;
  var akrualPct = paguTotal > 0 ? _aggRound(realAkrual / paguTotal * 100, 2) : 0;

  var sp2dMonthly = months.map(function (m) {
    return tuRows.reduce(function (acc, r) {
      var mk = _aggMonthKey(r['Timestamp']) || (String(r['Periode'] || '').length >= 7 ? String(r['Periode']).substring(0, 7) : '');
      if (mk !== m) return acc;
      var val = (_aggNum(r['RealisasiSP2D_Reguler_Minggu']) + _aggNum(r['RealisasiSP2D_ABT_Minggu'])) || _aggNum(r['RealisasiSP2D_Minggu']);
      return acc + val;
    }, 0);
  });
  var akrualMonthly = months.map(function (m) {
    return tuRows.reduce(function (acc, r) {
      var mk = _aggMonthKey(r['Timestamp']) || (String(r['Periode'] || '').length >= 7 ? String(r['Periode']).substring(0, 7) : '');
      if (mk !== m) return acc;
      var val = (_aggNum(r['RealisasiAkrual_Reguler_Minggu']) + _aggNum(r['RealisasiAkrual_ABT_Minggu'])) || _aggNum(r['RealisasiAkrual_Minggu']);
      return acc + val;
    }, 0);
  });

  // ── Paket Pengadaan ──
  var pktRes = readSatelliteRows(keys, SHEET_SIKAP.PAKET_PROGRES, true);
  var pktRows = pktRes.rows || [];
  var totalNilaiKontrak = 0, totalRealisasiKeu = 0, sumFisik = 0;
  pktRows.forEach(function (r) {
    totalNilaiKontrak += _aggNum(r['NilaiKontrak']);
    totalRealisasiKeu += _aggNum(r['RealisasiKeuangan']);
    sumFisik += _aggNum(r['ProgresFisikPct']);
  });
  var avgProgresFisik = pktRows.length > 0 ? _aggRound(sumFisik / pktRows.length, 1) : 0;

  // ── BMN Aset ──
  var bmnRes = readSatelliteRows(keys, SHEET_SIKAP.BMN_ASET, true);
  var bmnRows = bmnRes.rows || [];
  var totalNilaiPerolehan = 0, totalNilaiBuku = 0, dalamPenghapusan = 0;
  var kondisi = { BAIK: 0, RUSAK_RINGAN: 0, RUSAK_BERAT: 0 };
  bmnRows.forEach(function (r) {
    totalNilaiPerolehan += _aggNum(r['NilaiPerolehan']);
    totalNilaiBuku += _aggNum(r['NilaiBuku']);
    var k = String(r['Kondisi'] || 'BAIK').toUpperCase();
    if (kondisi[k] !== undefined) kondisi[k]++;
    if (String(r['StatusAset'] || '').toUpperCase() === 'DALAM_PENGHAPUSAN') {
      dalamPenghapusan++;
    }
  });

  // ── Kepegawaian TU & Direktori POA ──
  var pegMasterRes = readSatelliteRows(keys, SHEET_SIKAP.PEGAWAI_MASTER, false);
  var pegMasterRows = pegMasterRes.rows || [];
  var totalPegawaiPOA = 0, disparitasNakhoda = 0;
  pegMasterRows.forEach(function (r) {
    var st = String(r['StatusAktif'] || 'AKTIF').toUpperCase();
    if (st === 'AKTIF') totalPegawaiPOA++;
    if (String(r['StatusKelengkapanTU'] || '').toUpperCase() === 'DISPARITAS_NAKHODA') {
      disparitasNakhoda++;
    }
  });

  var tuPegRes = readSatelliteRows(keys, SHEET_SIKAP.PEGAWAI, true);
  var headcountTU = {};
  var latestPegTs = {};
  (tuPegRes.rows || []).forEach(function (r) {
    var kat = String(r['Kategori'] || '').trim();
    if (!kat) return;
    var t = new Date(r['Timestamp']).getTime() || 0;
    if (latestPegTs[kat] === undefined || t >= latestPegTs[kat]) {
      latestPegTs[kat] = t;
      headcountTU[kat] = _aggNum(r['Jumlah']);
    }
  });

  return {
    connected: true,
    error: tuRes.error,
    melaporMingguIni: melaporMingguIni,
    anggaran: {
      paguReguler: paguReguler,
      paguABT: paguABT,
      paguTotal: paguTotal,
      realisasiSP2D_Reguler: sp2dReg,
      realisasiSP2D_ABT: sp2dAbt,
      realisasiSP2D: realSP2D,
      realisasiAkrual_Reguler: akruReg,
      realisasiAkrual_ABT: akruAbt,
      realisasiAkrual: realAkrual,
      sisaSP2D: paguTotal - realSP2D,
      sisaAkrual: paguTotal - realAkrual,
      sp2dPct: sp2dPct,
      akrualPct: akrualPct,
      sp2dMonthly: sp2dMonthly,
      akrualMonthly: akrualMonthly
    },
    paket: {
      totalPaket: pktRows.length,
      totalNilaiKontrak: totalNilaiKontrak,
      totalRealisasiKeu: totalRealisasiKeu,
      avgProgresFisik: avgProgresFisik
    },
    bmn: {
      totalUnit: bmnRows.length,
      totalNilaiPerolehan: totalNilaiPerolehan,
      totalNilaiBuku: totalNilaiBuku,
      kondisi: kondisi,
      dalamPenghapusan: dalamPenghapusan
    },
    kepegawaian: {
      totalPegawaiPOA: totalPegawaiPOA,
      disparitasNakhoda: disparitasNakhoda,
      headcountTU: headcountTU
    }
  };
}

function _aggEmptyAnggaran(months) {
  var zeros = (months || []).map(function () { return 0; });
  return {
    paguReguler: 0, paguABT: 0, paguTotal: 0,
    realisasiSP2D_Reguler: 0, realisasiSP2D_ABT: 0, realisasiSP2D: 0,
    realisasiAkrual_Reguler: 0, realisasiAkrual_ABT: 0, realisasiAkrual: 0,
    sisaSP2D: 0, sisaAkrual: 0, sp2dPct: 0, akrualPct: 0,
    sp2dMonthly: zeros, akrualMonthly: zeros
  };
}

// ===========================================================================
// INGESTOR 2: NAKHODA (RadarPOA_Nakhoda_DB)
// ===========================================================================

function _aggIngestNakhoda(range, ytdRange, weekRange) {
  var keys = [PROP_KEY.NAKHODA_SS_ID, PROP_KEY.AWAK_SS_ID];
  var aknRes = readSatelliteRows(keys, SHEET_NAKHODA.PENGAWAKAN_AKN, true);
  if (!aknRes.connected && !aknRes.ssId) {
    return {
      connected: false,
      error: aknRes.error,
      melaporMingguIni: false,
      akn: { keseluruhan: 0, poa: 0, byKategori: {} },
      direktori: { totalAktif: 0, dek: 0, mesin: 0, penunjang: 0, pusatPoa: 0, diperbantukanUpt: 0 },
      kompetensi: { totalSertifikat: 0, berlaku: 0, segeraHabis: 0, kedaluwarsa: 0 },
      sijil: { totalKapalEvaluasi: 0, laikAwak: 0, kurangAwak: 0, totalAwakOnBoard: 0 },
      kegiatan: { ytd: 0, periode: 0 }
    };
  }

  var aknRows = aknRes.rows || [];
  var melaporMingguIni = false;

  // Resolusi snapshot terbaru per Scope & 4 Kategori baku (carry-forward)
  var latestPerScopeKat = {};
  aknRows.forEach(function (r) {
    if (weekRange && _aggRowInWeek(r, weekRange)) melaporMingguIni = true;
    var scopeRaw = String(r['Scope'] || '').trim().toUpperCase();
    var scope = (scopeRaw === 'KESELURUHAN' || scopeRaw === 'AKN_KESELURUHAN') ? 'AKN_KESELURUHAN'
      : ((scopeRaw === 'POA' || scopeRaw === 'AKN_POA') ? 'AKN_POA' : scopeRaw);
    var kat = _aggNormAknKategori(r['Kategori']);
    if (!scope || !kat) return;

    var ts = new Date(r['Timestamp']).getTime() || 0;
    if (ts > range.endDate.getTime()) return;
    var k = scope + '|' + kat;
    if (!latestPerScopeKat[k] || ts >= latestPerScopeKat[k].ts) {
      latestPerScopeKat[k] = { ts: ts, val: _aggNum(r['Jumlah']), periode: String(r['Periode'] || '') };
    }
  });

  // Fallback jika tidak ada data <= range.endDate, pakai snapshot paling akhir yang tersedia
  if (Object.keys(latestPerScopeKat).length === 0 && aknRows.length > 0) {
    aknRows.forEach(function (r) {
      var scopeRaw = String(r['Scope'] || '').trim().toUpperCase();
      var scope = (scopeRaw === 'KESELURUHAN' || scopeRaw === 'AKN_KESELURUHAN') ? 'AKN_KESELURUHAN'
        : ((scopeRaw === 'POA' || scopeRaw === 'AKN_POA') ? 'AKN_POA' : scopeRaw);
      var kat = _aggNormAknKategori(r['Kategori']);
      if (!scope || !kat) return;
      var ts = new Date(r['Timestamp']).getTime() || 0;
      var k = scope + '|' + kat;
      if (!latestPerScopeKat[k] || ts >= latestPerScopeKat[k].ts) {
        latestPerScopeKat[k] = { ts: ts, val: _aggNum(r['Jumlah']), periode: String(r['Periode'] || '') };
      }
    });
  }

  var totKes = 0, totPoa = 0;
  var byKategori = {};
  AKN_KATEGORI_LIST.forEach(function (kat) {
    var kVal = (latestPerScopeKat['AKN_KESELURUHAN|' + kat] || {}).val || 0;
    var pVal = (latestPerScopeKat['AKN_POA|' + kat] || {}).val || 0;
    totKes += kVal;
    totPoa += pVal;
    byKategori[kat] = { keseluruhan: kVal, poa: pVal };
  });

  // ── Master_Awak ──
  var dirRes = readSatelliteRows(keys, SHEET_NAKHODA.MASTER_AWAK, false);
  var dirRows = dirRes.rows || [];
  var dirStats = { totalAktif: 0, dek: 0, mesin: 0, penunjang: 0, pusatPoa: 0, diperbantukanUpt: 0 };
  dirRows.forEach(function (a) {
    if (String(a['StatusAktif'] || 'AKTIF').toUpperCase() !== 'AKTIF') return;
    dirStats.totalAktif++;
    var rumpun = String(a['Rumpun'] || '').toUpperCase();
    if (rumpun === 'DEK') dirStats.dek++;
    else if (rumpun === 'MESIN') dirStats.mesin++;
    else dirStats.penunjang++;

    var pen = String(a['StatusPenempatan'] || '').toUpperCase();
    if (pen === 'DIPERBANTUKAN_UPT') dirStats.diperbantukanUpt++;
    else dirStats.pusatPoa++;
  });

  // ── TX_Pelatihan_Awak (Status Sertifikat) ──
  var srtRes = readSatelliteRows(keys, SHEET_NAKHODA.PELATIHAN_AWAK, true);
  var srtRows = srtRes.rows || [];
  var nowMs = Date.now();
  var warnMs = nowMs + 90 * 86400000;
  var berlaku = 0, segeraHabis = 0, kedaluwarsa = 0;
  srtRows.forEach(function (s) {
    var expStr = String(s['BerlakuSampai'] || '').trim();
    if (!expStr) {
      berlaku++;
      return;
    }
    var exp = new Date(expStr).getTime();
    if (isNaN(exp)) {
      berlaku++;
    } else if (exp < nowMs) {
      kedaluwarsa++;
    } else if (exp <= warnMs) {
      segeraHabis++;
      berlaku++;
    } else {
      berlaku++;
    }
  });

  // ── TX_Penugasan_Kapal & Master_SafeManning ──
  var tgsRes = readSatelliteRows(keys, SHEET_NAKHODA.PENUGASAN_KAPAL, true);
  var manRes = readSatelliteRows(keys, SHEET_NAKHODA.MASTER_SAFE_MANNING, false);
  var todayStr = Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd');

  var activeByKapal = {};
  var totalAwakOnBoard = 0;
  (tgsRes.rows || []).forEach(function (t) {
    var tglTurun = String(t['TanggalTurun'] || '').trim();
    if (tglTurun && tglTurun < todayStr) return;
    var kId = String(t['KapalID'] || '').trim();
    if (!kId) return;
    if (!activeByKapal[kId]) activeByKapal[kId] = {};
    var pos = String(t['PosSijil'] || '').trim().toUpperCase();
    activeByKapal[kId][pos] = (activeByKapal[kId][pos] || 0) + 1;
    totalAwakOnBoard++;
  });

  var minPerKelas = {};
  (manRes.rows || []).forEach(function (m) {
    var kls = String(m['KelasKapal'] || '').trim().toUpperCase();
    if (!kls) return;
    if (!minPerKelas[kls]) minPerKelas[kls] = {};
    minPerKelas[kls][String(m['PosSijil'] || '').trim().toUpperCase()] = _aggNum(m['Minimum']);
  });

  var kapalRows = [];
  try {
    kapalRows = sheetToObjects(openMasterSheet(SHEET_MASTER.KAPAL));
  } catch (eK) {}

  var laikAwak = 0, kurangAwak = 0;
  kapalRows.forEach(function (k) {
    if (!k['StatusAktif'] && String(k['StatusAktif']).toUpperCase() !== 'TRUE') return;
    var kId = String(k['KapalID'] || '').trim();
    var kls = String(k['KelasKapal'] || 'KELAS_II').trim().toUpperCase();
    var std = minPerKelas[kls];
    if (!std) return;
    var cur = activeByKapal[kId] || {};
    var ok = Object.keys(std).every(function (pos) {
      return (cur[pos] || 0) >= std[pos];
    });
    if (ok) laikAwak++;
    else kurangAwak++;
  });

  // ── TX_Pengawakan_Kegiatan ──
  var kegRes = readSatelliteRows(keys, SHEET_NAKHODA.PENGAWAKAN_KEGIATAN, true);
  var kegRows = kegRes.rows || [];
  var kegYtd = 0, kegPeriode = 0;
  kegRows.forEach(function (r) {
    var ts = new Date(r['TanggalMulai'] || r['Timestamp']);
    if (isNaN(ts.getTime())) return;
    if (ts >= ytdRange.startDate && ts <= ytdRange.endDate) kegYtd++;
    if (ts >= range.startDate && ts <= range.endDate) kegPeriode++;
    if (weekRange && _aggRowInWeek(r, weekRange)) melaporMingguIni = true;
  });

  return {
    connected: true,
    error: aknRes.error,
    melaporMingguIni: melaporMingguIni,
    akn: {
      keseluruhan: totKes,
      poa: totPoa,
      byKategori: byKategori
    },
    direktori: dirStats,
    kompetensi: {
      totalSertifikat: srtRows.length,
      berlaku: berlaku,
      segeraHabis: segeraHabis,
      kedaluwarsa: kedaluwarsa
    },
    sijil: {
      totalKapalEvaluasi: laikAwak + kurangAwak,
      laikAwak: laikAwak,
      kurangAwak: kurangAwak,
      totalAwakOnBoard: totalAwakOnBoard
    },
    kegiatan: {
      ytd: kegYtd,
      periode: kegPeriode
    }
  };
}

function _aggNormAknKategori(raw) {
  var k = String(raw || '').trim().toUpperCase();
  if (k === 'PPPK_FUNGSIONAL' || k === 'PPPK_PELAKSANA') return 'P3K';
  if (k === 'PPPK_PARUH_WAKTU') return 'P3K_PARUH_WAKTU';
  return k;
}

// ===========================================================================
// INGESTOR 3: PUSAT (RadarPOA_Pusat_DB — TX_KegiatanDirektorat)
// ===========================================================================

function _aggIngestPusat(range, ytdRange) {
  var rows = [];
  try {
    rows = sheetToObjects(openTransaksiSheet(SHEET_PUSAT.KEGIATAN_DIREKTORAT))
      .filter(function (r) { return String(r['Status'] || '') === ROW_STATUS.ACTIVE; });
  } catch (e) {
    Logger.log('[_aggIngestPusat] ' + e.message);
  }

  var ytd = 0, periode = 0;
  var latest = null;
  rows.forEach(function (r) {
    var t = r['Tanggal']
      ? (typeof _parseLocalDate === 'function' ? _parseLocalDate(r['Tanggal'], false) : new Date(r['Tanggal']))
      : new Date(r['Timestamp']);
    if (t && !isNaN(t.getTime())) {
      if (t >= ytdRange.startDate && t <= ytdRange.endDate) ytd++;
      if (t >= range.startDate && t <= range.endDate) periode++;
    }
    if (!latest || new Date(r['Timestamp']) > new Date(latest['Timestamp'])) latest = r;
  });

  return {
    kegiatanYtd: ytd,
    kegiatanPeriode: periode,
    terakhirDicatat: latest ? latest['Timestamp'] : null,
    latestJudul: latest ? String(latest['JudulKegiatan'] || '') : ''
  };
}

// ===========================================================================
// HELPERS
// ===========================================================================

function _aggNum(v) {
  var n = Number(v);
  return isNaN(n) ? 0 : n;
}

function _aggRound(n, dec) {
  var f = Math.pow(10, dec || 0);
  return Math.round(n * f) / f;
}

function _aggLatestByTimestamp(rows) {
  var best = null;
  rows.forEach(function (r) {
    if (!best || new Date(r['Timestamp']) > new Date(best['Timestamp'])) best = r;
  });
  return best;
}

function _aggMonthKey(ts) {
  var t = new Date(ts);
  if (isNaN(t.getTime())) return '';
  return t.getFullYear() + '-' + (t.getMonth() < 9 ? '0' + (t.getMonth() + 1) : (t.getMonth() + 1));
}

function _aggRowInWeek(r, weekRange) {
  var pr = periodeToDateRange(String(r['Periode'] || ''));
  if (pr) return pr.startDate <= weekRange.endDate && pr.endDate >= weekRange.startDate;
  var ts = new Date(r['Timestamp']);
  if (isNaN(ts.getTime())) return false;
  return ts >= weekRange.startDate && ts <= weekRange.endDate;
}

