/**
 * Code.js — Entry point Google Apps Script (Radar POA)
 * Pusat Agregasi Data Strategis — Direktorat Pengendalian Operasi Armada, Ditjen PSDKP - KKP RI
 */

/**
 * Serve SPA frontend.
 *
 * @param {GoogleAppsScript.Events.DoGet} e
 * @returns {GoogleAppsScript.HTML.HtmlOutput}
 */
function doGet(e) {
  return HtmlService.createTemplateFromFile('html/Index')
    .evaluate()
    .setTitle('Radar POA — Direktorat POA, KKP RI')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Helper untuk include partial template HTML di Google Apps Script.
 * Contoh penggunaan di template: <?!= html_include('html/Script_Main'); ?>
 *
 * @param {string} filename - nama file tanpa ekstensi
 * @returns {string} konten HTML
 */
function html_include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Setup & verifikasi akun default (Superadmin, Direktur, Kadiv, Staf).
 * Dapat dipanggil langsung dari editor GAS atau via `clasp run setup_seedSuperadmin`.
 *
 * @param {boolean} [resetPassword=false] - Jika true, set ulang password default SUPERADMIN.
 * @returns {Object} ringkasan hasil seeding akun
 */
function setup_seedSuperadmin(resetPassword) {
  try {
    ensurePusatSpreadsheet();
    var usersSheet = openMasterSheet(SHEET_MASTER.USERS);
    _SA_CHECKED_EXEC = false;
    _ensureSuperadminSeeded(usersSheet, Boolean(resetPassword));
    var users = sheetToObjects(usersSheet);
    return {
      success: true,
      message: 'Akun default Radar POA (Superadmin, Direktur, Kadiv, Staf) berhasil diverifikasi.',
      spreadsheetId: getSpreadsheetIds().masterId,
      totalUsers: users.length,
      users: users.map(function (u) {
        return {
          userId:   u['UserID'],
          nama:     u['Nama'],
          email:    u['Email'],
          nip:      u['NIP'],
          role:     u['Role'],
          divisiId: u['DivisiID'],
          status:   u['Status']
        };
      })
    };
  } catch (err) {
    Logger.log('[setup_seedSuperadmin] Error: ' + err.message);
    return { success: false, error: err.message, stack: err.stack };
  }
}
