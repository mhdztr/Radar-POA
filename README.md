# Radar POA (Rekapitulasi Data Strategis POA)
> **Pusat Agregasi Data Strategis — Direktorat Pengendalian Operasi Armada, Ditjen PSDKP - KKP RI**

- **Script ID (Google Apps Script):** `1qLwCu-2tmCuA8_ICOI8SpystzSP25rGyVftvEPKwFS65K-bnBareyFY4`
- **Repositori GitHub:** `https://github.com/mhdztr/Radar-POA.git`
- **Spreadsheet Basis Data:** `RadarPOA_Pusat_DB` *(inisialisasi otomatis via `ensurePusatSpreadsheet()` / `setup_seedSuperadmin()`)*
- **Spreadsheet Data Mart:** `RadarPOA_Looker_Mart`
- **Drive Folder Evidence:** `POA_Evidence_Pusat`
- **Peran Sistem:** Pusat agregasi eksekutif nasional yang mengonsolidasi data dari aplikasi satelit mandiri (**SIKAP**, **Sistik**, **Nakhoda**, **Siaga**) dan subsistem eksternal, serta menjadi portal input eksklusif bagi pelaporan **Kegiatan Direktorat**.

## Referensi Wajib
1. `PRD.md` — Kebutuhan fungsional, RBAC, klasifikasi 34 kapal, dan aturan bisnis.
2. `ARCHITECTURE.md` — Struktur aggregator engine, self-healing spreadsheet/auth, in-memory `CacheService`, dan cross-spreadsheet federation.
3. `DATA_SCHEMA.md` — Skema kolom tabel transaksi, master kapal Kelas I–V, divisi, dan autentikasi.
4. `DESIGN.md` — Kontrak sistem desain v2.0 (*Floating Bottom Maritime Dock*, *Top Institutional Bar 56px*, peta siluet kapal Kelas I–V, dan Playwright QA gates).
5. `PHASES.md` — Roadmap dan rencana pengembangan bertahap (termasuk `Fase R1`–`R4`).
6. `AGENTS.md` — Instruksi dan batasan kerja bagi coding agent.

## Pengujian & Setup Awal
- **Inisialisasi Akun & Spreadsheet GAS:** Jalankan `setup_seedSuperadmin()` dari editor Apps Script (atau `clasp run setup_seedSuperadmin`) maupun login langsung untuk memicu auto-seed 4 akun awal (`SUPERADMIN`, `DIREKTUR`, `KADIV`, `STAF`).
- **Audit Visual Playwright Lokal:** Jalankan `node tests/visual_audit.js` untuk mengaudit layout desktop (`1440×900`, `1024×768`) dan mobile (`390×844`) dengan hasil screenshot tersimpan di `tests/screenshots/` (dikecualikan dari push GAS lewat `.claspignore`).
