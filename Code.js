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
