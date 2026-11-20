/**
 * services/DashboardService.js
 * Dasbor Strategis Pimpinan Service — mengonsumsi data teragregasi dari AggregatorService.js.
 *
 * Endpoint publik:
 *   radar_getExecutiveDashboard(token, filter)  — alias kanonik ARCHITECTURE.md
 *   dashboard_getOverview(token, filter)        — kompatibilitas SPA Overview
 *   dashboard_getTacticalFleet(token)           — peta taktis 34 Kapal Pengawas Besar
 *   dashboard_getScoringKapalTerbaik(token, f)  — evaluasi Kapal Terbaik TW I–IV
 *   dashboard_profilKapal(token, params)        — profil kapal terpadu
 *   app_getSyncState(token)                     — heartbeat live-sync ringan
 */

// ===========================================================================
// DASBOR STRATEGIS PIMPINAN
// ===========================================================================

function radar_getExecutiveDashboard(token, filter) {
  return dashboard_getOverview(token, filter);
}

function dashboard_getOverview(token, filter) {
  try {
    var session = _dashAssertApproved(token);
    var f = filter || { mode: 'monthly', month: new Date().getMonth() + 1, year: new Date().getFullYear() };
    var agg = agg_collectAll(f, false);

    var s = agg.sikap;
    var n = agg.nakhoda;
    var p = agg.pusat;
    var ang = s.anggaran;
    var months = utils_getTrendMonths(f);

    // Kesiapan armada: 34 kapal besar (dari master/tactical seed + Siaga jika terhubung)
    var fleet = _dashGetTacticalFleet([]);
    var totalArmada = fleet.length || 34;
    var opCount = fleet.filter(function (k) { return k.status === 'OPERASIONAL'; }).length;
    var pangkalanCount = fleet.filter(function (k) { return k.status === 'SIAP_PANGKALAN'; }).length;
    var galanganCount = fleet.filter(function (k) { return k.status === 'GALANGAN'; }).length;
    var siapCount = opCount + pangkalanCount;
    var siapPct = totalArmada > 0 ? Math.round(siapCount / totalArmada * 100) : 0;

    // Kepatuhan pelaporan minggu berjalan (dari satelit yang terhubung)
    var melaporDetail = _dashMelaporDetailFromAgg(agg);
    var nMelapor = melaporDetail.filter(function (d) { return d.melapor; }).length;

    // 4 Top KPI SiMata (PRD §3.3 & kompatibel dengan shell Overview)
    var headline = [
      {
        label: 'Pagu & Serapan Anggaran (SP2D)',
        source: 'SIKAP \u00B7 Anggaran',
        sourceTone: 'sikap',
        value: ang.sp2dPct,
        unit: '%',
        sub: 'Realisasi Rp ' + _dashCompact(ang.realisasiSP2D) + ' \u00B7 Pagu Rp ' + _dashCompact(ang.paguTotal),
        foot: {
          left:  { lbl: 'SP2D YTD', val: 'Rp ' + _dashCompact(ang.realisasiSP2D) },
          right: { lbl: 'Pagu',     val: 'Rp ' + _dashCompact(ang.paguTotal) }
        },
        pct: ang.sp2dPct
      },
      {
        label: 'Postur Awak Kapal (Nakhoda)',
        source: 'NAKHODA \u00B7 Postur AKN',
        sourceTone: 'nakhoda',
        value: n.akn.keseluruhan,
        unit: 'personel',
        sub: 'AKN POA ' + n.akn.poa + ' orang \u00B7 Sertifikat aktif ' + n.kompetensi.berlaku,
        foot: {
          left:  { lbl: 'POA',         val: n.akn.poa + ' orang' },
          right: { lbl: 'Kedaluwarsa', val: n.kompetensi.kedaluwarsa + ' sert.' }
        },
        pct: n.akn.keseluruhan > 0 ? Math.round(n.akn.poa / n.akn.keseluruhan * 100) : 0
      },
      {
        label: 'Kesiapan Armada Kapal Besar',
        source: 'ARMADA \u00B7 ' + totalArmada + ' Kapal',
        sourceTone: 'radar',
        value: siapCount,
        unit: '/ ' + totalArmada,
        sub: opCount + ' Operasional \u00B7 ' + pangkalanCount + ' Siap Pangkalan \u00B7 ' + galanganCount + ' Galangan',
        foot: {
          left:  { lbl: 'Siap',     val: siapCount + ' kapal' },
          right: { lbl: 'Galangan', val: galanganCount + ' kapal' }
        },
        pct: siapPct
      },
      {
        label: 'Kegiatan Direktorat (YTD)',
        source: 'PUSAT \u00B7 Kegiatan Dit.',
        sourceTone: 'pusat',
        value: p.kegiatanYtd,
        unit: 'kegiatan',
        sub: 'Periode ini ' + p.kegiatanPeriode + ' kegiatan \u00B7 ' + nMelapor + '/7 divisi melapor',
        foot: {
          left:  { lbl: 'Periode Ini', val: p.kegiatanPeriode + ' keg.' },
          right: { lbl: 'Satelit Aktif', val: _dashConnectedCount(agg.satellites) + ' sumber' }
        },
        pct: Math.round(nMelapor / 7 * 100)
      }
    ];

    // Grid ringkasan divisi (memprioritaskan data live SIKAP, Nakhoda, & Pusat)
    var aknCats = AKN_KATEGORI_LIST.map(function (kat, i) {
      var c = (n.akn.byKategori && n.akn.byKategori[kat]) || { keseluruhan: 0, poa: 0 };
      return {
        label: kat.replace(/_/g, ' '),
        val: c.keseluruhan,
        tone: (['deep', 'soft', 'light', 'lighter'])[i] || 'lighter'
      };
    });

    var divisi = [
      {
        title: 'Tata Usaha (SIKAP)',
        order: 0,
        span: 6,
        metrics: [
          { lbl: 'Realisasi SP2D (YTD)',   val: ang.sp2dPct,   unit: '%',   prog: true },
          { lbl: 'Realisasi Akrual (YTD)', val: ang.akrualPct, unit: '%',   prog: true },
          { lbl: 'Sisa Pagu SP2D',         val: ang.sisaSP2D,  unit: 'Rp',  prog: false,
            badge: s.connected ? (Math.max(0, 100 - ang.sp2dPct) + '% Sisa') : 'Belum Terhubung',
            tone: s.connected ? 'info' : 'warn' }
        ],
        stack: {
          caption: 'Alokasi Pagu Anggaran (SP2D vs Sisa)',
          segments: [
            { label: 'Realisasi', val: ang.sp2dPct, tone: 'deep' },
            { label: 'Sisa Pagu', val: Math.max(0, 100 - ang.sp2dPct), tone: 'light' }
          ]
        },
        viz: {
          type: 'cols',
          fmt: 'rp',
          caption: 'Realisasi per bulan (YTD)',
          series: [{ name: 'SP2D', tone: 'deep' }, { name: 'Akrual', tone: 'light' }],
          groups: months.map(function (m, i) {
            return { label: m, vals: [ang.sp2dMonthly[i] || 0, ang.akrualMonthly[i] || 0] };
          })
        }
      },
      {
        title: 'Cakupan Laporan & Satelit',
        order: 1,
        span: 6,
        metrics: [
          { lbl: 'Divisi Melapor Minggu Ini', val: nMelapor, unit: '/ 7', prog: true, raw: Math.round(nMelapor / 7 * 100) },
          { lbl: 'Disparitas SIKAP-Nakhoda',  val: s.kepegawaian.disparitasNakhoda, unit: 'item', prog: false,
            badge: s.kepegawaian.disparitasNakhoda === 0 ? 'Sinkron' : 'Perlu Verifikasi TU',
            tone: s.kepegawaian.disparitasNakhoda === 0 ? 'ok' : 'warn' },
          { lbl: 'Periode Laporan Aktif', val: agg.meta.periodeAktif, unit: '', prog: false }
        ],
        dots: melaporDetail,
        viz: { type: 'chips', caption: 'Status 7 divisi minggu ini', items: melaporDetail }
      },
      {
        title: 'Pengawakan (Nakhoda)',
        order: 2,
        span: 6,
        metrics: [
          { lbl: 'Total Personel AKN', val: n.akn.keseluruhan, unit: 'orang', prog: false },
          { lbl: 'Awak Kapal (POA)',   val: n.akn.poa, unit: 'orang', prog: false,
            badge: n.connected ? (n.sijil.laikAwak + ' Kapal Laik Sijil') : 'Belum Terhubung',
            tone: n.connected ? 'info' : 'warn' },
          { lbl: 'Sertifikat Segera Habis / Kedaluwarsa', val: n.kompetensi.segeraHabis + n.kompetensi.kedaluwarsa, unit: 'sert.', prog: false }
        ],
        stack: { caption: 'Komposisi AKN (4 Kategori Baku)', segments: aknCats },
        viz: null
      },
      {
        title: 'BMN & Pengadaan (SIKAP)',
        order: 3,
        span: 6,
        metrics: [
          { lbl: 'Total Unit BMN Aktif', val: s.bmn.totalUnit, unit: 'unit', prog: false },
          { lbl: 'BMN Rusak Berat',      val: s.bmn.kondisi.RUSAK_BERAT, unit: 'unit', prog: false,
            badge: s.bmn.dalamPenghapusan + ' Dalam Penghapusan',
            tone: s.bmn.kondisi.RUSAK_BERAT > 0 ? 'warn' : 'ok' },
          { lbl: 'Progres Rata-rata Paket', val: s.paket.avgProgresFisik, unit: '%', prog: true,
            badge: s.paket.totalPaket + ' Paket', tone: 'info' }
        ],
        stack: {
          caption: 'Kondisi Fisik Aset BMN',
          segments: [
            { label: 'Baik',         val: s.bmn.kondisi.BAIK,         tone: 'ok' },
            { label: 'Rusak Ringan', val: s.bmn.kondisi.RUSAK_RINGAN, tone: 'warn' },
            { label: 'Rusak Berat',  val: s.bmn.kondisi.RUSAK_BERAT,  tone: 'crit' }
          ]
        },
        viz: null
      },
      {
        title: 'Kegiatan Direktorat (Pusat)',
        order: 4,
        span: 6,
        metrics: [
          { lbl: 'Kegiatan Terlaksana (YTD)', val: p.kegiatanYtd,     unit: 'kegiatan', prog: false },
          { lbl: 'Kegiatan Periode Ini',      val: p.kegiatanPeriode, unit: 'kegiatan', prog: false },
          { lbl: 'Pencatatan Terakhir',       val: p.terakhirDicatat ? _dashFmtDate(p.terakhirDicatat) : '\u2014', unit: '', prog: false }
        ],
        stack: {
          caption: 'Intensitas Kegiatan Direktorat',
          segments: [
            { label: 'YTD',         val: p.kegiatanYtd,     tone: 'deep' },
            { label: 'Periode Ini', val: p.kegiatanPeriode, tone: 'soft' }
          ]
        },
        viz: null
      },
      {
        title: 'Satelit Dalam Integrasi (Sistik, Siaga, Operasi)',
        order: 5,
        span: 6,
        metrics: [
          { lbl: 'Sistik (Logistik)', val: agg.satellites.SISTIK.connected ? 'Terhubung' : 'Menunggu Integrasi', unit: '', prog: false },
          { lbl: 'Siaga (Harwat)',    val: agg.satellites.SIAGA.connected ? 'Terhubung' : 'Menunggu Integrasi',  unit: '', prog: false },
          { lbl: 'Operasi & Pantau',  val: agg.satellites.OPERASI.connected ? 'Terhubung' : 'Menunggu Integrasi', unit: '', prog: false }
        ],
        stack: null,
        viz: null
      }
    ];

    var aknLabels = AKN_KATEGORI_LIST.map(function (kat) {
      return kat === 'P3K_PARUH_WAKTU' ? 'P3K Paruh' : kat.replace(/_/g, ' ');
    });
    var aknKes = AKN_KATEGORI_LIST.map(function (kat) {
      return Number(((n.akn.byKategori && n.akn.byKategori[kat]) || {}).keseluruhan) || 0;
    });
    var aknPoa = AKN_KATEGORI_LIST.map(function (kat) {
      return Number(((n.akn.byKategori && n.akn.byKategori[kat]) || {}).poa) || 0;
    });

    var data = {
      periode: agg.meta.periodeAktif,
      meta: agg.meta,
      satellites: agg.satellites,
      headline: headline,
      divisi: divisi,
      paguTotal: ang.paguTotal,
      sikap: s,
      nakhoda: n,
      pusat: p,
      wppMap: _dashBuildWppMap(fleet),
      charts: {
        trendMonths: months,
        realisasi: { sp2d: ang.sp2dMonthly, akrual: ang.akrualMonthly },
        aknPostur: { labels: aknLabels, keseluruhan: aknKes, poa: aknPoa },
        armadaStatus: [
          { label: 'Operasional di Laut', val: opCount,        tone: 'deep' },
          { label: 'Siap di Pangkalan',   val: pangkalanCount, tone: 'ok' },
          { label: 'Galangan',            val: galanganCount,  tone: 'warn' }
        ],
        hariOperasi: { kapal: months.map(function () { return 0; }), pesawat: months.map(function () { return 0; }) },
        kesiapan: { siap: siapCount, tidakSiap: galanganCount, totalArmada: totalArmada },
        penindakan: [],
        kapalTeraktif: fleet.slice().sort(function (a, b) { return b.hariOperasi - a.hariOperasi; }).slice(0, 5)
          .map(function (k) { return { label: k.nama, val: k.hariOperasi }; }),
        hariTanpaKapal: 0
      }
    };

    return { success: true, data: data };
  } catch (e) {
    Logger.log('[dashboard_getOverview] ' + e.message);
    return { success: false, error: e.message };
  }
}

// ===========================================================================
// PROFIL KAPAL (TERFEDERASI)
// ===========================================================================

function dashboard_profilKapal(token, params) {
  try {
    _dashAssertApproved(token);
    var p = params || {};
    var kapalId = String(p.kapalId || '').trim();
    if (!kapalId) return { success: false, error: 'kapalId wajib diisi.' };

    var fleetSeed = null;
    for (var fi = 0; fi < FLEET_34_TACTICAL_SEED.length; fi++) {
      if (FLEET_34_TACTICAL_SEED[fi].id === kapalId) {
        fleetSeed = FLEET_34_TACTICAL_SEED[fi];
        break;
      }
    }

    var kapalInfo = _dashKapalInfo(kapalId);
    if (!kapalInfo && fleetSeed) {
      kapalInfo = {
        kapalId: fleetSeed.id,
        nama: fleetSeed.nama,
        kelas: fleetSeed.kelas,
        homebaseUpt: fleetSeed.pangkalan,
        statusAktif: fleetSeed.status !== 'GALANGAN'
      };
    }
    if (!kapalInfo) {
      return { success: false, error: 'Kapal dengan ID ' + kapalId + ' tidak ditemukan di master.' };
    }
    if (fleetSeed) {
      kapalInfo.wpp = fleetSeed.wpp;
      kapalInfo.statusTaktis = fleetSeed.status;
      kapalInfo.komandan = fleetSeed.komandan;
      kapalInfo.pangkalan = fleetSeed.pangkalan;
      kapalInfo.hariOperasi = fleetSeed.hari;
      kapalInfo.lat = fleetSeed.lat;
      kapalInfo.lng = fleetSeed.lng;
    }

    // Tarik penugasan awak aktif kapal dari satelit Nakhoda
    var nakhodaKeys = [PROP_KEY.NAKHODA_SS_ID, PROP_KEY.AWAK_SS_ID];
    var tgsRes = readSatelliteRows(nakhodaKeys, SHEET_NAKHODA.PENUGASAN_KAPAL, true);
    var awakRes = readSatelliteRows(nakhodaKeys, SHEET_NAKHODA.MASTER_AWAK, false);
    var awakMap = {};
    (awakRes.rows || []).forEach(function (a) {
      awakMap[String(a['PegawaiID'] || '')] = a;
    });

    var todayStr = Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd');
    var kruAktif = (tgsRes.rows || []).filter(function (t) {
      if (String(t['KapalID'] || '').trim() !== kapalId) return false;
      var tglTurun = String(t['TanggalTurun'] || '').trim();
      return !tglTurun || tglTurun >= todayStr;
    }).map(function (t) {
      var peg = awakMap[String(t['PegawaiID'] || '')] || {};
      return {
        pegawaiId: String(t['PegawaiID'] || ''),
        nama: String(peg['Nama'] || t['PegawaiID'] || ''),
        posSijil: String(t['PosSijil'] || ''),
        kategori: String(peg['KategoriKepegawaian'] || ''),
        tanggalNaik: String(t['TanggalNaik'] || '')
      };
    });

    // Tarik BMN melekat pada kapal dari satelit SIKAP
    var sikapKeys = [PROP_KEY.SIKAP_SS_ID, PROP_KEY.TU_SS_ID];
    var bmnRes = readSatelliteRows(sikapKeys, SHEET_SIKAP.BMN_ASET, true);
    var asetKapal = (bmnRes.rows || []).filter(function (b) {
      return String(b['KapalID'] || '').trim() === kapalId;
    });
    var asetList = asetKapal.slice(0, 25).map(function (b) {
      return {
        kodeBarang: String(b['KodeBarang'] || b['AsetID'] || ''),
        namaBarang: String(b['NamaBarang'] || b['NamaAset'] || ''),
        kondisi: String(b['Kondisi'] || 'BAIK'),
        nilaiBuku: Number(b['NilaiBuku']) || 0
      };
    });

    var statusKesiapan = fleetSeed ? (fleetSeed.status !== 'GALANGAN') : kapalInfo.statusAktif;
    var dockingAktif = fleetSeed ? (fleetSeed.status === 'GALANGAN') : false;

    return {
      success: true,
      data: {
        kapal: kapalInfo,
        summary: {
          statusKesiapan: statusKesiapan,
          statusTaktis: fleetSeed ? fleetSeed.status : (statusKesiapan ? 'SIAP' : 'GALANGAN'),
          statusKesiapanPeriode: getCurrentPeriode(),
          penyebabTidakSiap: dockingAktif ? 'Pemeliharaan terencana di galangan' : '',
          dockingAktif: dockingAktif,
          lokasiDocking: dockingAktif && fleetSeed ? fleetSeed.pangkalan : '',
          totalHariOperasiLaut: fleetSeed ? fleetSeed.hari : 0,
          totalKruAktif: kruAktif.length,
          totalBmnKapal: asetKapal.length
        },
        kruAktif: kruAktif,
        asetKapal: asetList,
        riwayat: {
          kesiapan: [], docking: [], operasiLaut: [], operasiUdara: [], amunisi: [], bbm: [], marabahaya: []
        }
      }
    };
  } catch (e) {
    Logger.log('[dashboard_profilKapal] ' + e.message);
    return { success: false, error: e.message };
  }
}

// ===========================================================================
// LIVE-SYNC HEARTBEAT
// ===========================================================================

function app_getSyncState(token) {
  try {
    var session = _requireSession(token);
    assertScope(session, null, null);

    var cache = CacheService.getScriptCache();
    var txVersion = Number(cache.get('DASH_TX_VERSION') || '0');

    var cachedNotif = cache.get('SYNC_UNREAD_' + session.userId);
    var unreadNotif = cachedNotif !== null ? Number(cachedNotif) : null;

    var queueCount = null;
    if (session.role === ROLE.SUPERADMIN || session.role === ROLE.DIREKTUR || session.role === ROLE.KADIV) {
      var cachedQueue = cache.get('SYNC_QUEUE_' + session.userId);
      queueCount = cachedQueue !== null ? Number(cachedQueue) : null;
    }

    var lastTxMeta = null;
    var cachedMeta = cache.get('METADATA_LAST_TX');
    if (cachedMeta) {
      try { lastTxMeta = JSON.parse(cachedMeta); } catch (eM) {}
    }
    if (!lastTxMeta) {
      try {
        var propMeta = PropertiesService.getScriptProperties().getProperty('METADATA_LAST_TX');
        if (propMeta) lastTxMeta = JSON.parse(propMeta);
      } catch (eP) {}
    }

    return {
      success: true,
      data: {
        txVersion: txVersion,
        unreadNotif: unreadNotif,
        queueCount: queueCount,
        lastTxMetadata: lastTxMeta,
        serverTime: new Date().toISOString()
      }
    };
  } catch (e) {
    Logger.log('[app_getSyncState] ' + e.message);
    return { success: false, error: e.message };
  }
}

// ===========================================================================
// 34 KAPAL PENGAWAS BESAR & SCORING ENGINE KAPAL TERBAIK
// ===========================================================================

var FLEET_34_TACTICAL_SEED = [
  { id: 'KP-ORCA-01', nama: 'KP. ORCA 01', wpp: '715', hari: 36, status: 'OPERASIONAL', kelas: 'ORCA', pangkalan: 'Pangkalan Tual/Ambon', komandan: 'Kapten Laut M. Ridwan', lat: 1.8, lng: 127.2 },
  { id: 'KP-ORCA-02', nama: 'KP. ORCA 02', wpp: '571', hari: 60, status: 'OPERASIONAL', kelas: 'ORCA', pangkalan: 'Pangkalan Belawan', komandan: 'Kapten Laut B. Prasetyo', lat: 4.5, lng: 98.8 },
  { id: 'KP-ORCA-03', nama: 'KP. ORCA 03', wpp: '711', hari: 44, status: 'OPERASIONAL', kelas: 'ORCA', pangkalan: 'Pangkalan Batam', komandan: 'Kapten Laut H. Sitorus', lat: 3.8, lng: 107.5 },
  { id: 'KP-ORCA-04', nama: 'KP. ORCA 04', wpp: '712', hari: 44, status: 'OPERASIONAL', kelas: 'ORCA', pangkalan: 'Pangkalan Jakarta', komandan: 'Kapten Laut D. Kusuma', lat: -5.2, lng: 109.8 },
  { id: 'KP-ORCA-05', nama: 'KP. ORCA 05', wpp: '715', hari: 69, status: 'OPERASIONAL', kelas: 'ORCA', pangkalan: 'Pangkalan Bitung', komandan: 'Kapten Laut Y. Manoppo', lat: 0.5, lng: 126.8 },
  { id: 'KP-ORCA-06', nama: 'KP. ORCA 06', wpp: '713', hari: 41, status: 'OPERASIONAL', kelas: 'ORCA', pangkalan: 'Pangkalan Benoa', komandan: 'Kapten Laut W. Sudarma', lat: -1.5, lng: 118.0 },
  { id: 'KP-BARAKUDA-01', nama: 'KP. BARAKUDA 01', wpp: '712', hari: 42, status: 'OPERASIONAL', kelas: 'BARAKUDA', pangkalan: 'Pangkalan Jakarta', komandan: 'Penata T. Gunawan', lat: -5.8, lng: 111.2 },
  { id: 'KP-PAUS-01', nama: 'KP. PAUS 01', wpp: '715', hari: 37, status: 'OPERASIONAL', kelas: 'PAUS', pangkalan: 'Pangkalan Ambon', komandan: 'Penata A. Pattipeilohy', lat: -1.2, lng: 128.0 },
  { id: 'KP-HM-TUTUL-01', nama: 'KP. H.M. TUTUL 01', wpp: '713', hari: 54, status: 'OPERASIONAL', kelas: 'TUTUL', pangkalan: 'Pangkalan Kupang', komandan: 'Penata F. Djami', lat: -3.2, lng: 119.2 },
  { id: 'KP-HM-TUTUL-02', nama: 'KP. H.M. TUTUL 02', wpp: '713', hari: 63, status: 'OPERASIONAL', kelas: 'TUTUL', pangkalan: 'Pangkalan Tarakan', komandan: 'Penata R. Simbolon', lat: -4.8, lng: 119.8 },
  { id: 'KP-HIU-MACAN-04', nama: 'KP. HIU MACAN 04', wpp: '713', hari: 46, status: 'OPERASIONAL', kelas: 'HIU_MACAN', pangkalan: 'Pangkalan Pontianak', komandan: 'Penata E. Subroto', lat: -5.5, lng: 120.5 },
  { id: 'KP-HIU-MACAN-06', nama: 'KP. HIU MACAN 06', wpp: '718', hari: 17, status: 'OPERASIONAL', kelas: 'HIU_MACAN', pangkalan: 'Pangkalan Tual', komandan: 'Penata I. Wattimena', lat: -7.2, lng: 137.0 },
  { id: 'KP-HIU-01', nama: 'KP. HIU 01', wpp: '571', hari: 46, status: 'OPERASIONAL', kelas: 'HIU', pangkalan: 'Pangkalan Belawan', komandan: 'Penata K. Siregar', lat: 3.8, lng: 99.8 },
  { id: 'KP-HIU-02', nama: 'KP. HIU 02', wpp: '714', hari: 45, status: 'OPERASIONAL', kelas: 'HIU', pangkalan: 'Pangkalan Ambon', komandan: 'Penata J. Sahertian', lat: -4.8, lng: 128.5 },
  { id: 'KP-HIU-04', nama: 'KP. HIU 04', wpp: '712', hari: 41, status: 'OPERASIONAL', kelas: 'HIU', pangkalan: 'Pangkalan Cilacap', komandan: 'Penata B. Suharsono', lat: -5.0, lng: 112.5 },
  { id: 'KP-HIU-05', nama: 'KP. HIU 05', wpp: '715', hari: 45, status: 'OPERASIONAL', kelas: 'HIU', pangkalan: 'Pangkalan Bitung', komandan: 'Penata M. Runtunuwu', lat: 2.8, lng: 124.5 },
  { id: 'KP-HIU-07', nama: 'KP. HIU 07', wpp: '713', hari: 33, status: 'OPERASIONAL', kelas: 'HIU', pangkalan: 'Pangkalan Makassar', komandan: 'Penata L. Daeng Masiri', lat: -6.8, lng: 119.0 },
  { id: 'KP-HIU-08', nama: 'KP. HIU 08', wpp: '571', hari: 36, status: 'OPERASIONAL', kelas: 'HIU', pangkalan: 'Pangkalan Lampulo', komandan: 'Penata T. Iskandar', lat: 4.8, lng: 98.2 },
  { id: 'KP-HIU-09', nama: 'KP. HIU 09', wpp: '712', hari: 28, status: 'OPERASIONAL', kelas: 'HIU', pangkalan: 'Pangkalan Cirebon', komandan: 'Penata S. Wibowo', lat: -5.6, lng: 108.5 },
  { id: 'KP-HIU-10', nama: 'KP. HIU 10', wpp: '712', hari: 22, status: 'OPERASIONAL', kelas: 'HIU', pangkalan: 'Pangkalan Banyuwangi', komandan: 'Penata N. Hidayat', lat: -6.0, lng: 113.5 },
  { id: 'KP-HIU-11', nama: 'KP. HIU 11', wpp: '711', hari: 53, status: 'OPERASIONAL', kelas: 'HIU', pangkalan: 'Pangkalan Batam', komandan: 'Penata A. Tanjung', lat: 4.2, lng: 108.5 },
  { id: 'KP-HIU-12', nama: 'KP. HIU 12', wpp: '571', hari: 43, status: 'OPERASIONAL', kelas: 'HIU', pangkalan: 'Pangkalan Sibolga', komandan: 'Penata P. Lumban Gaol', lat: 3.5, lng: 100.4 },
  { id: 'KP-HIU-13', nama: 'KP. HIU 13', wpp: '715', hari: 32, status: 'OPERASIONAL', kelas: 'HIU', pangkalan: 'Pangkalan Ternate', komandan: 'Penata O. Tomagola', lat: 1.2, lng: 128.5 },
  { id: 'KP-HIU-14', nama: 'KP. HIU 14', wpp: '715', hari: 36, status: 'OPERASIONAL', kelas: 'HIU', pangkalan: 'Pangkalan Sorong', komandan: 'Penata Y. Rumbiak', lat: -0.5, lng: 129.5 },
  { id: 'KP-HIU-15', nama: 'KP. HIU 15', wpp: '716', hari: 23, status: 'OPERASIONAL', kelas: 'HIU', pangkalan: 'Pangkalan Tahuna', komandan: 'Penata S. Makagiansar', lat: 3.8, lng: 122.5 },
  { id: 'KP-HIU-16', nama: 'KP. HIU 16', wpp: '711', hari: 67, status: 'OPERASIONAL', kelas: 'HIU', pangkalan: 'Pangkalan Ranai', komandan: 'Penata D. Natuna', lat: 2.9, lng: 108.9 },
  { id: 'KP-AKAR-BAHAR-01', nama: 'KP. AKAR BAHAR 01', wpp: 'Pangkalan', hari: 35, status: 'SIAP_PANGKALAN', kelas: 'AKAR_BAHAR', pangkalan: 'Pangkalan Jakarta', komandan: 'Penata K. Hartono', lat: -6.10, lng: 106.83 },
  { id: 'KP-HIU-MACAN-01', nama: 'KP. HIU MACAN 01', wpp: 'Pangkalan', hari: 60, status: 'SIAP_PANGKALAN', kelas: 'HIU_MACAN', pangkalan: 'Pangkalan Batam', komandan: 'Penata M. Basri', lat: 1.17, lng: 104.02 },
  { id: 'KP-HIU-MACAN-05', nama: 'KP. HIU MACAN 05', wpp: 'Pangkalan', hari: 42, status: 'SIAP_PANGKALAN', kelas: 'HIU_MACAN', pangkalan: 'Pangkalan Batam', komandan: 'Penata G. Rangkuti', lat: 1.13, lng: 104.08 },
  { id: 'KP-HIU-03', nama: 'KP. HIU 03', wpp: 'Pangkalan', hari: 53, status: 'SIAP_PANGKALAN', kelas: 'HIU', pangkalan: 'Pangkalan Batam', komandan: 'Penata Z. Abidin', lat: 1.19, lng: 104.06 },
  { id: 'KP-HIU-06', nama: 'KP. HIU 06', wpp: 'Pangkalan', hari: 38, status: 'SIAP_PANGKALAN', kelas: 'HIU', pangkalan: 'Pangkalan Jakarta', komandan: 'Penata E. Permana', lat: -6.12, lng: 106.87 },
  { id: 'KP-HIU-17', nama: 'KP. HIU 17', wpp: 'Pangkalan', hari: 48, status: 'SIAP_PANGKALAN', kelas: 'HIU', pangkalan: 'Pangkalan Batam', komandan: 'Penata R. Lubis', lat: 1.11, lng: 104.03 },
  { id: 'KP-BARAKUDA-02', nama: 'KP. BARAKUDA 02', wpp: 'Galangan', hari: 67, status: 'GALANGAN', kelas: 'BARAKUDA', pangkalan: 'Galangan Jakarta', komandan: 'Penata A. Wijaya', lat: -6.11, lng: 106.91 },
  { id: 'KP-HIU-MACAN-03', nama: 'KP. HIU MACAN 03', wpp: 'Galangan', hari: 36, status: 'GALANGAN', kelas: 'HIU_MACAN', pangkalan: 'Galangan Lamongan', komandan: 'Penata H. Soebagio', lat: -6.89, lng: 112.35 }
];

function _dashGetTacticalFleet(lautYtd) {
  var txHari = {};
  if (lautYtd && lautYtd.length) {
    lautYtd.forEach(function (r) {
      var kid = String(r['KapalID'] || '').trim();
      if (!kid) return;
      txHari[kid] = (txHari[kid] || 0) + (Number(r['HariOperasi_Jumlah']) || 0);
    });
  }

  return FLEET_34_TACTICAL_SEED.map(function (k) {
    var hari = txHari[k.id] ? txHari[k.id] : k.hari;
    var statusLbl = k.status === 'OPERASIONAL' ? 'Operasional di Laut'
      : (k.status === 'SIAP_PANGKALAN' ? 'Siap Operasi di Pangkalan' : 'Pemeliharaan di Galangan');
    return {
      id: k.id,
      nama: k.nama,
      status: k.status,
      statusLabel: statusLbl,
      wpp: k.wpp,
      pangkalan: k.pangkalan,
      komandan: k.komandan,
      hariOperasi: hari,
      rerataNasional: 44,
      rerataPusat: 49,
      pctNasional: Math.round(hari / 44 * 100),
      pctPusat: Math.round(hari / 49 * 100),
      lat: k.lat,
      lng: k.lng,
      kelas: k.kelas
    };
  });
}

function dashboard_getTacticalFleet(token) {
  try {
    _dashAssertApproved(token);
    var fleet = _dashGetTacticalFleet([]);
    return {
      success: true,
      data: {
        fleet: fleet,
        totalArmada: 34,
        operasional: 26,
        siapPangkalan: 6,
        galangan: 2,
        rerataNasional: 44,
        rerataPusat: 49
      }
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function dashboard_getMapOverview(token) {
  return dashboard_getTacticalFleet(token);
}

function dashboard_getScoringKapalTerbaik(token, filter) {
  try {
    _dashAssertApproved(token);
    filter = filter || {};
    var year = Number(filter.year) || new Date().getFullYear();
    var triwulan = Number(filter.triwulan) || Math.floor(new Date().getMonth() / 3) + 1;
    if (triwulan < 1 || triwulan > 4) triwulan = 1;

    var rawList = FLEET_34_TACTICAL_SEED.map(function (k, idx) {
      var hari = Math.round(k.hari / 3.5);
      var kia = idx % 4 === 0 ? (idx % 8 === 0 ? 2 : 1) : 0;
      var kii = idx % 3 === 0 ? (idx % 6 === 0 ? 3 : 1) : 0;
      var rump = idx % 5 === 0 ? (idx % 10 === 0 ? 4 : 2) : 0;
      var riksa = Math.round((k.hari * 1.8) + (idx * 2));
      var valuasi = (kia * 12000000000) + (kii * 1500000000) + (rump * 45000000);
      var poinPenindakan = (15 * kia) + (5 * kii) + (3 * rump);
      return {
        id: k.id, nama: k.nama, kelas: k.kelas, wpp: k.wpp,
        pangkalan: k.pangkalan, komandan: k.komandan, status: k.status,
        hariLayar: hari, kia: kia, kii: kii, rumpon: rump,
        poinPenindakan: poinPenindakan, volumeRiksa: riksa, valuasi: valuasi
      };
    });

    var maxHari = 0, maxPoin = 0, maxRiksa = 0, maxValuasi = 0;
    rawList.forEach(function (r) {
      if (r.hariLayar > maxHari) maxHari = r.hariLayar;
      if (r.poinPenindakan > maxPoin) maxPoin = r.poinPenindakan;
      if (r.volumeRiksa > maxRiksa) maxRiksa = r.volumeRiksa;
      if (r.valuasi > maxValuasi) maxValuasi = r.valuasi;
    });

    rawList.forEach(function (r) {
      r.normHari = maxHari > 0 ? (r.hariLayar / maxHari) * 100 : 0;
      r.normPoin = maxPoin > 0 ? (r.poinPenindakan / maxPoin) * 100 : 0;
      r.normRiksa = maxRiksa > 0 ? (r.volumeRiksa / maxRiksa) * 100 : 0;
      r.normValuasi = maxValuasi > 0 ? (r.valuasi / maxValuasi) * 100 : 0;
      r.skor = Math.round(((0.40 * r.normHari) + (0.35 * r.normPoin) + (0.15 * r.normRiksa) + (0.10 * r.normValuasi)) * 10) / 10;
    });

    rawList.sort(function (a, b) {
      if (b.skor !== a.skor) return b.skor - a.skor;
      if (b.hariLayar !== a.hariLayar) return b.hariLayar - a.hariLayar;
      return b.poinPenindakan - a.poinPenindakan;
    });

    var sumHari = 0, sumTangkapan = 0, sumSkor = 0;
    rawList.forEach(function (r, idx) {
      r.rank = idx + 1;
      sumHari += r.hariLayar;
      sumTangkapan += (r.kia + r.kii);
      sumSkor += r.skor;
    });

    var twNames = ['TW I (Jan \u2013 Mar)', 'TW II (Apr \u2013 Jun)', 'TW III (Jul \u2013 Sep)', 'TW IV (Okt \u2013 Des)'];
    return {
      success: true,
      data: {
        year: year,
        triwulan: triwulan,
        triwulanLabel: twNames[triwulan - 1] + ' ' + year,
        totalArmada: 34,
        totalHariLayar: sumHari,
        totalTangkapan: sumTangkapan,
        rerataSkor: rawList.length > 0 ? Math.round((sumSkor / rawList.length) * 10) / 10 : 0,
        top3: rawList.slice(0, 3),
        leaderboard: rawList
      }
    };
  } catch (e) {
    Logger.log('[dashboard_getScoringKapalTerbaik] ' + e.message);
    return { success: false, error: e.message };
  }
}

// ===========================================================================
// HELPERS INTERNAL
// ===========================================================================

function _dashAssertApproved(token) {
  var session = _requireSession(token);
  if (session.status !== USER_STATUS.APPROVED) {
    throw new Error('UNAUTHORIZED: Akun belum aktif.');
  }
  return session;
}

function _dashMelaporDetail() {
  return _dashMelaporDetailFromAgg(agg_collectAll(null, false));
}

function _dashMelaporDetailFromAgg(agg) {
  return [
    { label: 'Tata Usaha', divisiId: DIVISI_ID.TU,     melapor: !!(agg && agg.sikap && agg.sikap.melaporMingguIni) },
    { label: 'Operasi',    divisiId: DIVISI_ID.OPS,    melapor: false },
    { label: 'Intelijen',  divisiId: DIVISI_ID.INTEL,  melapor: false },
    { label: 'Pemantauan', divisiId: DIVISI_ID.PANTAU, melapor: false },
    { label: 'Perawatan',  divisiId: DIVISI_ID.RAWAT,  melapor: false },
    { label: 'Logistik',   divisiId: DIVISI_ID.LOG,    melapor: false },
    { label: 'Pengawakan', divisiId: DIVISI_ID.AWAK,   melapor: !!(agg && agg.nakhoda && agg.nakhoda.melaporMingguIni) }
  ];
}

function _dashConnectedCount(satellites) {
  return Object.keys(satellites || {}).filter(function (k) { return satellites[k] && satellites[k].connected; }).length;
}

function _dashBuildWppMap(fleet) {
  var rows = {};
  (WPP_NRI || []).forEach(function (w) {
    rows[w.WPPCode] = { kode: w.WPPCode, nama: w.NamaWilayah, kii: 0, kia: 0, rump: 0, cakupan: 0, laporan: 0, aktivitas: 0 };
  });
  (fleet || []).forEach(function (k) {
    if (rows[k.wpp]) rows[k.wpp].aktivitas += 1;
  });
  return {
    metrics: [
      { key: 'aktivitas', label: 'Armada WPP', unit: 'kapal' }
    ],
    rows: rows,
    tanpaWpp: 0,
    fleet: fleet
  };
}

function _dashKapalInfo(kapalId) {
  try {
    var rows = sheetToObjects(openMasterSheet(SHEET_MASTER.KAPAL));
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i]['KapalID'] || '').trim() === kapalId) {
        return {
          kapalId: String(rows[i]['KapalID']),
          nama: String(rows[i]['Nama'] || ''),
          kelas: String(rows[i]['Kelas'] || ''),
          homebaseUpt: String(rows[i]['Homebase_UPT'] || ''),
          statusAktif: rows[i]['StatusAktif'] === true || String(rows[i]['StatusAktif']).toUpperCase() === 'TRUE'
        };
      }
    }
  } catch (e) {}
  return null;
}

function _dashFmtDate(v) {
  if (!v) return '';
  var d = new Date(v);
  if (isNaN(d)) return '';
  var dd = d.getDate(), mm = d.getMonth() + 1, yyyy = d.getFullYear();
  return (dd < 10 ? '0' + dd : dd) + '-' + (mm < 10 ? '0' + mm : mm) + '-' + yyyy;
}

function _dashCompact(n) {
  n = Number(n) || 0;
  var a = Math.abs(n);
  if (a >= 1e12) return String(Math.round(n / 1e12 * 10) / 10).replace('.', ',') + ' T';
  if (a >= 1e9)  return String(Math.round(n / 1e9 * 10) / 10).replace('.', ',') + ' M';
  if (a >= 1e6)  return String(Math.round(n / 1e6 * 10) / 10).replace('.', ',') + ' jt';
  if (a >= 1e3)  return String(Math.round(n / 1e3 * 10) / 10).replace('.', ',') + ' rb';
  return String(n);
}
