/**
 * utils/Constants.js
 * Radar POA (Rekapitulasi Data Strategis POA) — Pusat Agregasi & Executive Cockpit
 * Direktorat Pemantauan dan Operasi Armada (Dit. POA), Ditjen PSDKP - KKP RI
 */

// ===========================================================================
// NAMA SPREADSHEET
// ===========================================================================
var SS_NAME = {
  MASTER:      'RadarPOA_Master_DB',
  PUSAT:       'RadarPOA_Pusat_DB',
  LOOKER_MART: 'RadarPOA_Looker_Mart',
  SIKAP:       'RadarPOA_SIKAP_DB',
  NAKHODA:     'RadarPOA_Nakhoda_DB',
  SISTIK:      'RadarPOA_Sistik_DB',
  SIAGA:       'RadarPOA_Siaga_DB'
};

// ===========================================================================
// NAMA SHEET — PUSAT (RadarPOA_Pusat_DB)
// ===========================================================================
var SHEET_PUSAT = {
  KEGIATAN_DIREKTORAT: 'TX_KegiatanDirektorat',
  EVIDENCE:            'TX_Evidence'
};

var SHEET_TX = SHEET_PUSAT;

// ===========================================================================
// NAMA SHEET — SATELIT SIKAP (RadarPOA_SIKAP_DB) & NAKHODA (RadarPOA_Nakhoda_DB)
// ===========================================================================
var SHEET_SIKAP = {
  TATA_USAHA:        'TX_TataUsaha',
  PAKET_PROGRES:     'TX_Paket_Progres',
  PEGAWAI:           'TX_TU_Pegawai',
  PEGAWAI_MASTER:    'Master_Pegawai_POA',
  STANDAR_PELATIHAN: 'Master_Standar_Pelatihan',
  PELATIHAN_PEGAWAI: 'TX_TU_Pelatihan_Pegawai',
  BMN_ASET:          'TX_BMN_Aset',
  BMN_PENGHAPUSAN:   'TX_BMN_Penghapusan',
  MASTER_PAKET:      'Master_Paket'
};

var SHEET_NAKHODA = {
  PENGAWAKAN_AKN:           'TX_Pengawakan_AKN',
  PENGAWAKAN_KEGIATAN:      'TX_Pengawakan_Kegiatan',
  KEGIATAN_PESERTA:         'TX_Kegiatan_Peserta',
  PELATIHAN_AWAK:           'TX_Pelatihan_Awak',
  PENUGASAN_KAPAL:          'TX_Penugasan_Kapal',
  KONFIRMASI_MINGGUAN:      'TX_Konfirmasi_Mingguan',
  MASTER_AWAK:              'Master_Awak',
  MASTER_STANDAR_PELATIHAN: 'Master_Standar_Pelatihan',
  MASTER_SAFE_MANNING:      'Master_SafeManning'
};

// ===========================================================================
// NAMA SHEET — MASTER & LOG
// ===========================================================================
var SHEET_MASTER = {
  KAPAL:              'Kapal',
  KAWASAN_KONSERVASI: 'Kawasan_Konservasi',
  WPP:                'WPP',
  DIVISI:             'Divisi',
  USERS:              'Users',
  OPSI:               'Opsi'
};

var SHEET_LOG = {
  APPROVAL_QUEUE: 'Approval_Queue',
  AUDIT_LOG:      'Audit_Log',
  NOTIFICATIONS:  'Notifications'
};

var SHEET_MART = {
  IKHTISAR_NASIONAL: 'Mart_Ikhtisar_Nasional'
};

// ===========================================================================
// KOLOM STANDAR & ENUM
// ===========================================================================
var STD_COLS = [
  'RowID', 'DivisiID', 'Periode', 'SubmittedBy', 'Timestamp',
  'Status', 'SupersedesRowID', 'VoidReason', 'VoidedBy', 'VoidedAt'
];

var ROLE = {
  SUPERADMIN: 'SUPERADMIN',
  DIREKTUR:   'DIREKTUR',
  KADIV:      'KADIV',
  STAF:       'STAF'
};

var USER_STATUS = {
  PENDING:  'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  NONAKTIF: 'NONAKTIF'
};

var ROW_STATUS = {
  ACTIVE:     'ACTIVE',
  SUPERSEDED: 'SUPERSEDED',
  VOID:       'VOID'
};

var DIVISI_ID = {
  PUSAT:  'PUSAT',
  TU:     'DIV-TU',
  OPS:    'DIV-OPS',
  INTEL:  'DIV-INTEL',
  PANTAU: 'DIV-PANTAU',
  RAWAT:  'DIV-RAWAT',
  LOG:    'DIV-LOG',
  AWAK:   'DIV-AWAK'
};

var AKN_KATEGORI_LIST = ['PNS', 'P3K', 'P3K_PARUH_WAKTU', 'PJLP'];

var OPSI_KODE = {
  AMUNISI:            'AMUNISI',
  BBM:                'BBM',
  KOM_PERSONIL:       'KOM_PERSONIL',
  AWAK_KATEGORI:      'AWAK_KATEGORI',
  AWAK_SCOPE:         'AWAK_SCOPE',
  RAWAT_LOKASI:       'RAWAT_LOKASI',
  RAWAT_TAHAP:        'RAWAT_TAHAP',
  RAWAT_KATEGORI:     'RAWAT_KATEGORI',
  OPS_RIKSA_KATEGORI: 'OPS_RIKSA_KATEGORI',
  OPS_HARI_KATEGORI:  'OPS_HARI_KATEGORI',
  KAPAL_JENIS:        'KAPAL_JENIS'
};

var OPSI_GROUP_LABEL = {
  AMUNISI:            'Jenis Amunisi',
  BBM:                'Jenis BBM',
  KOM_PERSONIL:       'Komponen Personil',
  AWAK_KATEGORI:      'Kategori Pengawakan',
  AWAK_SCOPE:         'Scope Pengawakan',
  RAWAT_LOKASI:       'Lokasi Docking',
  RAWAT_TAHAP:        'Tahap Docking',
  RAWAT_KATEGORI:     'Kategori Pekerjaan',
  OPS_RIKSA_KATEGORI: 'Kategori Riksa',
  OPS_HARI_KATEGORI:  'Kategori Hari Operasi',
  KAPAL_JENIS:        'Jenis Kapal'
};

// ===========================================================================
// EVIDENCE — Drive Folder Pusat & Batas Ukuran
// ===========================================================================
var EVIDENCE_ROOT_FOLDER = 'POA_Evidence_Pusat';
var EVIDENCE_LIMIT_BYTES = {
  FILE:  15 * 1024 * 1024,
  VIDEO: 50 * 1024 * 1024
};

// ===========================================================================
// WPP NRI — Referensi Geospasial WPP 571 - 718
// ===========================================================================
var WPP_NRI = [
  { WPPCode: '571', NamaWilayah: 'WPP 571' },
  { WPPCode: '572', NamaWilayah: 'WPP 572' },
  { WPPCode: '573', NamaWilayah: 'WPP 573' },
  { WPPCode: '711', NamaWilayah: 'WPP 711' },
  { WPPCode: '712', NamaWilayah: 'WPP 712' },
  { WPPCode: '713', NamaWilayah: 'WPP 713' },
  { WPPCode: '714', NamaWilayah: 'WPP 714' },
  { WPPCode: '715', NamaWilayah: 'WPP 715' },
  { WPPCode: '716', NamaWilayah: 'WPP 716' },
  { WPPCode: '717', NamaWilayah: 'WPP 717' },
  { WPPCode: '718', NamaWilayah: 'WPP 718' }
];

// ===========================================================================
// PROPERTI KEY — PropertiesService
// ===========================================================================
var PROP_KEY = {
  MASTER_SS_ID:        'MASTER_SS_ID',
  PUSAT_SS_ID:         'PUSAT_SS_ID',
  LOG_SS_ID:           'LOG_SS_ID',
  LOOKER_MART_SS_ID:   'LOOKER_MART_SS_ID',
  SIKAP_SS_ID:         'SIKAP_SS_ID',
  TU_SS_ID:            'TU_SS_ID',
  NAKHODA_SS_ID:       'NAKHODA_SS_ID',
  AWAK_SS_ID:          'AWAK_SS_ID',
  SISTIK_SS_ID:        'SISTIK_SS_ID',
  SIAGA_SS_ID:         'SIAGA_SS_ID',
  OPERASI_SS_ID:       'OPERASI_SS_ID',
  INTEL_SS_ID:         'INTEL_SS_ID',
  PANTAU_SS_ID:        'PANTAU_SS_ID',
  SETUP_COMPLETED:     'SETUP_COMPLETED',
  CARTO_API_KEY:       'CARTO_API_KEY',
  REMINDER_TRIGGER_ID: 'REMINDER_TRIGGER_ID'
};

function getCartoApiKey() {
  return PropertiesService.getScriptProperties().getProperty(PROP_KEY.CARTO_API_KEY) || '';
}

function utils_getCartoKey() {
  return getCartoApiKey();
}

function getSpreadsheetIds() {
  var props = PropertiesService.getScriptProperties();
  var masterId = props.getProperty(PROP_KEY.MASTER_SS_ID);
  var pusatId  = props.getProperty(PROP_KEY.PUSAT_SS_ID);
  var logId    = props.getProperty(PROP_KEY.LOG_SS_ID);
  var resolvedMaster = masterId || pusatId;
  var resolvedPusat  = pusatId || masterId;

  if (!resolvedMaster && !resolvedPusat) {
    throw new Error('[Radar-POA] Spreadsheet ID belum tersimpan. Konfigurasikan MASTER_SS_ID / PUSAT_SS_ID di Script Properties.');
  }

  return {
    masterId:     resolvedMaster,
    pusatId:      resolvedPusat,
    transaksiId:  resolvedPusat,
    logId:        logId || resolvedMaster,
    lookerMartId: props.getProperty(PROP_KEY.LOOKER_MART_SS_ID) || null,
    sikapId:      props.getProperty(PROP_KEY.SIKAP_SS_ID) || props.getProperty(PROP_KEY.TU_SS_ID) || null,
    nakhodaId:    props.getProperty(PROP_KEY.NAKHODA_SS_ID) || props.getProperty(PROP_KEY.AWAK_SS_ID) || null,
    sistikId:     props.getProperty(PROP_KEY.SISTIK_SS_ID) || null,
    siagaId:      props.getProperty(PROP_KEY.SIAGA_SS_ID) || null,
    operasiId:    props.getProperty(PROP_KEY.OPERASI_SS_ID) || null
  };
}
