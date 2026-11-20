/**
 * services/RiwayatService.js
 * Feed kronologis terpadu Radar POA:
 *   - Lokal (RadarPOA_Pusat_DB): TX_KegiatanDirektorat
 *   - Federasi SIKAP (RadarPOA_SIKAP_DB): TX_TataUsaha, TX_Paket_Progres, TX_TU_Pegawai
 *   - Federasi Nakhoda (RadarPOA_Nakhoda_DB): TX_Pengawakan_AKN, TX_Pengawakan_Kegiatan
 * Mencakup status ACTIVE, SUPERSEDED, dan VOID dalam rentang filter.
 */

function _riwSources() {
  return [
    { kind: 'PUSAT',   sheet: SHEET_PUSAT.KEGIATAN_DIREKTORAT,  label: 'Kegiatan Direktorat',               ringkas: _riwRingkasKgd,    detail: _riwDetailKgd },
    { kind: 'SIKAP',   sheet: SHEET_SIKAP.TATA_USAHA,           label: 'SIKAP \u2014 Tata Usaha',           ringkas: _riwRingkasTU,     detail: _riwDetailTU },
    { kind: 'SIKAP',   sheet: SHEET_SIKAP.PAKET_PROGRES,        label: 'SIKAP \u2014 Paket Pengadaan',      ringkas: _riwRingkasPaket,  detail: _riwDetailPaket },
    { kind: 'SIKAP',   sheet: SHEET_SIKAP.PEGAWAI,              label: 'SIKAP \u2014 Kepegawaian TU',       ringkas: _riwRingkasTuPeg,  detail: _riwDetailTuPeg },
    { kind: 'NAKHODA', sheet: SHEET_NAKHODA.PENGAWAKAN_AKN,     label: 'Nakhoda \u2014 Komposisi AKN',      ringkas: _riwRingkasAwkAkn, detail: _riwDetailAwkAkn },
    { kind: 'NAKHODA', sheet: SHEET_NAKHODA.PENGAWAKAN_KEGIATAN,label: 'Nakhoda \u2014 Kegiatan Personel',  ringkas: _riwRingkasAwkKeg, detail: _riwDetailAwkKeg }
  ];
}

function _riwLookups() {
  var user = {}, divisi = {};
  try {
    sheetToObjects(openMasterSheet(SHEET_MASTER.USERS)).forEach(function (r) {
      user[String(r['UserID'])] = String(r['Nama'] || '');
    });
  } catch (e) {}
  try {
    sheetToObjects(openMasterSheet(SHEET_MASTER.DIVISI)).forEach(function (r) {
      divisi[String(r['DivisiID'])] = String(r['NamaDashboard'] || r['NamaResmi'] || '');
    });
  } catch (e) {}
  return { user: user, divisi: divisi };
}

function _riwNum(v) {
  var n = Number(v);
  return isNaN(n) ? 0 : n;
}

function _riwRupiah(v) {
  return 'Rp ' + Math.round(_riwNum(v)).toLocaleString('id-ID');
}

function _riwTgl(v) {
  if (!v) return '';
  var d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function _riwRingkasKgd(r) {
  return (r['JudulKegiatan'] || '\u2014') + ' \u00B7 ' + _riwTgl(r['Tanggal']);
}
function _riwDetailKgd(r) {
  return [
    ['Judul', r['JudulKegiatan'] || '\u2014'],
    ['Tanggal', _riwTgl(r['Tanggal'])],
    ['Deskripsi', r['Deskripsi'] || '\u2014'],
    ['Pihak Hadir', r['PihakHadir'] || '\u2014']
  ];
}

function _riwRingkasTU(r) {
  return 'SP2D ' + _riwRupiah(r['RealisasiSP2D_Minggu']) + ' \u00B7 Akrual ' + _riwRupiah(r['RealisasiAkrual_Minggu']);
}
function _riwDetailTU(r) {
  return [
    ['Pagu Reguler', _riwRupiah(r['PaguReguler'])],
    ['Pagu ABT', _riwRupiah(r['PaguABT'])],
    ['Realisasi SP2D (minggu ini)', _riwRupiah(r['RealisasiSP2D_Minggu'])],
    ['Realisasi Akrual (minggu ini)', _riwRupiah(r['RealisasiAkrual_Minggu'])],
    ['Catatan Revisi Pagu', r['CatatanRevisiPagu'] || '\u2014']
  ];
}

function _riwRingkasPaket(r) {
  return (r['PaketID'] || '\u2014') + ' \u00B7 ' + (r['TahapPekerjaan'] || '\u2014') + ' (' + _riwNum(r['ProgresFisikPct']) + '%)';
}
function _riwDetailPaket(r) {
  return [
    ['PaketID', r['PaketID'] || '\u2014'],
    ['Tahap', r['TahapPekerjaan'] || '\u2014'],
    ['Nilai Kontrak', _riwRupiah(r['NilaiKontrak'])],
    ['Progres Fisik', _riwNum(r['ProgresFisikPct']) + '%'],
    ['Realisasi Keuangan', _riwRupiah(r['RealisasiKeuangan'])]
  ];
}

function _riwRingkasTuPeg(r) {
  return (r['Kategori'] || '\u2014') + ' \u00B7 ' + _riwNum(r['Jumlah']) + ' orang';
}
function _riwDetailTuPeg(r) {
  return [
    ['Kategori', r['Kategori'] || '\u2014'],
    ['Jumlah', _riwNum(r['Jumlah'])],
    ['Keterangan', r['Keterangan'] || '\u2014']
  ];
}

function _riwRingkasAwkAkn(r) {
  return (r['Scope'] || '\u2014') + ' / ' + (r['Kategori'] || '\u2014') + ' \u00B7 ' + _riwNum(r['Jumlah']);
}
function _riwDetailAwkAkn(r) {
  return [
    ['Scope', r['Scope'] || '\u2014'],
    ['Kategori', r['Kategori'] || '\u2014'],
    ['Jumlah', _riwNum(r['Jumlah'])],
    ['Keterangan', r['Keterangan'] || '\u2014']
  ];
}

function _riwRingkasAwkKeg(r) {
  return (r['JudulKegiatan'] || '\u2014') + ' \u00B7 ' + _riwTgl(r['TanggalMulai']);
}
function _riwDetailAwkKeg(r) {
  return [
    ['Judul', r['JudulKegiatan'] || '\u2014'],
    ['Tanggal Mulai', _riwTgl(r['TanggalMulai'])],
    ['Tanggal Selesai', _riwTgl(r['TanggalSelesai'])],
    ['Wilayah', r['Wilayah'] || '\u2014'],
    ['Jumlah Peserta', _riwNum(r['JumlahPeserta'])],
    ['Deskripsi', r['Deskripsi'] || '\u2014']
  ];
}

function riwayat_getAll(token, filter) {
  try {
    var session = _requireSession(token);
    assertScope(session, null, null);

    var allowAll = (session.role === ROLE.SUPERADMIN || session.role === ROLE.DIREKTUR);
    var isStaf = (session.role === ROLE.STAF);
    var range = filterToDateRange(filter || { mode: 'monthly', month: new Date().getMonth() + 1, year: new Date().getFullYear() });
    var L = _riwLookups();
    var sources = _riwSources();
    var out = [];

    sources.forEach(function (src) {
      var rows = [];
      if (src.kind === 'PUSAT') {
        try {
          rows = sheetToObjects(openTransaksiSheet(src.sheet));
        } catch (eP) { rows = []; }
      } else if (src.kind === 'SIKAP') {
        rows = readSatelliteRows([PROP_KEY.SIKAP_SS_ID, PROP_KEY.TU_SS_ID], src.sheet, false).rows || [];
      } else if (src.kind === 'NAKHODA') {
        rows = readSatelliteRows([PROP_KEY.NAKHODA_SS_ID, PROP_KEY.AWAK_SS_ID], src.sheet, false).rows || [];
      }

      rows.forEach(function (r) {
        if (!allowAll) {
          if (src.sheet === SHEET_PUSAT.KEGIATAN_DIREKTORAT) {
            if (isStaf) return;
          } else if (String(r['DivisiID'] || '') !== String(session.divisiId || '')) {
            return;
          }
        }

        var t = new Date(r['Timestamp']);
        if (isNaN(t.getTime()) || t < range.startDate || t > range.endDate) return;

        out.push({
          rowId: String(r['RowID'] || ''),
          sheet: src.sheet,
          sheetLabel: src.label,
          periode: String(r['Periode'] || ''),
          divisiId: String(r['DivisiID'] || ''),
          divisiNama: L.divisi[String(r['DivisiID'] || '')] || String(r['DivisiID'] || ''),
          submittedBy: String(r['SubmittedBy'] || ''),
          submittedByName: L.user[String(r['SubmittedBy'] || '')] || String(r['SubmittedBy'] || ''),
          timestamp: t.toISOString(),
          status: String(r['Status'] || ''),
          supersedesRowID: String(r['SupersedesRowID'] || ''),
          voidReason: String(r['VoidReason'] || ''),
          voidedBy: String(r['VoidedBy'] || ''),
          voidedByName: L.user[String(r['VoidedBy'] || '')] || String(r['VoidedBy'] || ''),
          voidedAt: (r['VoidedAt'] instanceof Date) ? r['VoidedAt'].toISOString() : String(r['VoidedAt'] || ''),
          ringkasan: src.ringkas(r),
          detail: src.detail(r)
        });
      });
    });

    out.sort(function (a, b) { return new Date(b.timestamp) - new Date(a.timestamp); });
    return { success: true, data: out };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
