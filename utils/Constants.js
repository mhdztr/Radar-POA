/**
 * Radar-POA (Central Aggregator & Executive Cockpit) — Radar POA
 */
var SS_NAME = { MASTER: 'RadarPOA_Master_DB', PUSAT: 'RadarPOA_Pusat_DB', LOOKER_MART: 'RadarPOA_Looker_Mart' };
var SHEET_PUSAT = { KEGIATAN_DIREKTORAT: 'TX_KegiatanDirektorat' };
var SHEET_MASTER = { KAPAL: 'Kapal', DIVISI: 'Divisi', USERS: 'Users', OPSI: 'Opsi', WPP: 'WPP' };
var SHEET_LOG = { APPROVAL_QUEUE: 'Approval_Queue', AUDIT_LOG: 'Audit_Log', NOTIFICATIONS: 'Notifications' };
var STD_COLS = ['RowID', 'DivisiID', 'Periode', 'SubmittedBy', 'Timestamp', 'Status', 'SupersedesRowID', 'VoidReason', 'VoidedBy', 'VoidedAt'];
var ROLE = { SUPERADMIN: 'SUPERADMIN', DIREKTUR: 'DIREKTUR', KADIV: 'KADIV', STAF: 'STAF' };
var USER_STATUS = { PENDING: 'PENDING', APPROVED: 'APPROVED', REJECTED: 'REJECTED', NONAKTIF: 'NONAKTIF' };
var ROW_STATUS = { ACTIVE: 'ACTIVE', SUPERSEDED: 'SUPERSEDED', VOID: 'VOID' };
var DIVISI_ID = { TU: 'DIV-TU', OPS: 'DIV-OPS', INTEL: 'DIV-INTEL', PANTAU: 'DIV-PANTAU', RAWAT: 'DIV-RAWAT', LOG: 'DIV-LOG', AWAK: 'DIV-AWAK' };
var OPSI_KODE = { AMUNISI: 'AMUNISI', BBM: 'BBM', KOM_PERSONIL: 'KOM_PERSONIL', AWAK_KATEGORI: 'AWAK_KATEGORI', AWAK_SCOPE: 'AWAK_SCOPE', RAWAT_LOKASI: 'RAWAT_LOKASI', RAWAT_TAHAP: 'RAWAT_TAHAP', RAWAT_KATEGORI: 'RAWAT_KATEGORI', OPS_RIKSA_KATEGORI: 'OPS_RIKSA_KATEGORI', OPS_HARI_KATEGORI: 'OPS_HARI_KATEGORI', KAPAL_JENIS: 'KAPAL_JENIS' };
var PROP_KEY = { MASTER_SS_ID: 'MASTER_SS_ID', PUSAT_SS_ID: 'PUSAT_SS_ID', LOOKER_MART_SS_ID: 'LOOKER_MART_SS_ID', SETUP_COMPLETED: 'SETUP_COMPLETED', CARTO_API_KEY: 'CARTO_API_KEY' };
function getCartoApiKey() { return PropertiesService.getScriptProperties().getProperty(PROP_KEY.CARTO_API_KEY) || ''; }
function utils_getCartoKey() { return getCartoApiKey(); }
function getSpreadsheetIds() {
  var props = PropertiesService.getScriptProperties();
  var masterId = props.getProperty(PROP_KEY.MASTER_SS_ID);
  var pusatId = props.getProperty(PROP_KEY.PUSAT_SS_ID);
  if (!masterId) throw new Error('[Radar-POA] Spreadsheet ID belum tersimpan.');
  return { masterId: masterId, transaksiId: pusatId || null, logId: null, tuId: null };
}
