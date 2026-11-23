# ARCHITECTURE.md — Arsitektur Teknis: Radar POA
**Rekapitulasi Data Strategis POA (Pusat Agregasi Data Strategis)**  
*Direktorat Pengendalian Operasi Armada (Dit. POA) · Ditjen PSDKP · KKP RI*

---

## 1. Topologi Sistem & Ekosistem Terfederasi
- **Runtime:** Google Apps Script (HTML Service + V8 JavaScript Engine)
- **Database Utama (Pusat & Auto-Seed):** Google Spreadsheet `RadarPOA_Pusat_DB` (`PUSAT_SS_ID`; otomatis dibuat & disinkronkan ke `MASTER_SS_ID` / `LOG_SS_ID` oleh `ensurePusatSpreadsheet()` bila properti belum terkonfigurasi)
- **Database Master & Log Opsional Terpisah:** Google Spreadsheet `RadarPOA_Master_DB` (`MASTER_SS_ID`, `LOG_SS_ID`)
- **Database Data Mart:** Google Spreadsheet `RadarPOA_Looker_Mart` (`LOOKER_MART_SS_ID`)
- **File Storage:** Google Drive Folder `POA_Evidence_Pusat`
- **Satelit Ingestion (Federated Cross-Spreadsheet Read-Only):**
  - **SIKAP (Aktif):** `RadarPOA_SIKAP_DB` (`SIKAP_SS_ID` / `TU_SS_ID`) — Anggaran SP2D/Akrual, Paket Pengadaan, Inventaris BMN, Direktori Pegawai POA & Disparitas SIKAP-Nakhoda.
  - **Nakhoda (Aktif):** `RadarPOA_Nakhoda_DB` (`NAKHODA_SS_ID` / `AWAK_SS_ID`) — Komposisi AKN 4 Kategori, Direktori 396+ Awak, Sertifikasi STCW-F, Papan Sijil Safe Manning, Kegiatan Pembinaan.
  - **Satelit Berikutnya (Konektor Siap):** `RadarPOA_Sistik_DB` (`SISTIK_SS_ID`), `RadarPOA_Siaga_DB` (`SIAGA_SS_ID`), dan Subsistem Operasi/Intelijen/Pemantauan (`OPERASI_SS_ID`).

---

## 2. Struktur Modul & Layering Kode

```
Radar-POA/
├── Code.js                              # Entry point doGet(), html_include(), & setup_seedSuperadmin()
├── appsscript.json                      # Manifest V8 runtime & OAuth scopes
├── utils/
│   ├── Constants.js                     # SS_NAME, SHEET_*, PROP_KEY, ROLE, WPP_NRI, safe getSpreadsheetIds()
│   ├── DateUtil.js                      # Konversi tanggal <-> Periode (YYYY-MM-WW) & filter range
│   └── Lock.js                          # Concurrency guard withLock() (LockService)
├── data/
│   └── SheetAccess.js                   # RBAC assertScope(), SHA-256 hashPassword(), ensurePusatSpreadsheet(), _autoCreateMasterSheet(), _ensureSuperadminSeeded(), readSatelliteRows(), applyFormalSheetFormatting()
├── services/
│   ├── AggregatorService.js             # Engine federasi lintas spreadsheet (SIKAP, Nakhoda, Pusat) & CacheService 15 menit
│   ├── DashboardService.js              # Kalkulasi Dasbor Strategis, klasifikasi Kelas I–V 34 Kapal, executiveGrid, Scoring Kapal Terbaik (podium non-Galangan), & Profil Kapal
│   ├── KegiatanDirektoratService.js     # CRUD eksklusif Kegiatan Direktorat (SUPERADMIN, DIREKTUR, KADIV)
│   ├── LookerMartService.js             # Batch ETL sinkronisasi tabel flat bersih ke RadarPOA_Looker_Mart (Fase 6)
│   ├── RiwayatService.js                # Feed riwayat transaksi terfederasi (Pusat + SIKAP + Nakhoda)
│   ├── EvidenceService.js               # Multi-file upload lampiran ke Google Drive POA_Evidence_Pusat
│   ├── MasterDataService.js             # Pengelolaan Master 34 Kapal Besar, WPPNRI, Kawasan Konservasi, & Opsi
│   ├── AuthService.js                   # Login multi-identifier (Email/NIP/Alias), brute-force lockout 5x/15m, registrasi 2-tahap OTP email, & approval
│   ├── AdminService.js                  # Manajemen akun, konfigurasi koneksi satelit, & Audit Log viewer
│   └── NotifikasiService.js             # Pusat notifikasi in-app & pengingat mingguan otomatis
├── html/
│   ├── AuthPhoto.html                   # Partial foto personel resmi Ditjen PSDKP (base64 inline untuk Split Auth 50/50)
│   ├── Index.html                       # Shell SPA v2.0: 50/50 Split Auth, Top Institutional Bar (56px), & Floating Bottom Maritime Dock (#0E1722) dengan Logo PSDKP
│   ├── Style.html                       # Design System v2.0 CSS (Public Sans 6 skala >= 12px, budget warna <= 16, kontrol 3-tier 40/32/26px, Leaflet override)
│   ├── Script_Charts.html               # Engine visualisasi Chart.js (_RADAR_CHARTS) kurva garis ganda bersih & konteks terukur (0 gauge/3D)
│   ├── Script_Main.html                 # SPA Controller, router hash, dock + mobile sheet, peta Leaflet 34 kapal berikon SVG Kelas I–V, & renderer seluruh halaman
│   └── views/
│       ├── Kegiatan.html                # Daftar Kegiatan Direktorat, pencarian/status filter, & Calendar Picker Anti-Ketik Manual
│       ├── KapalTerbaik.html            # Podium Top 3 (non-Galangan) & leaderboard 34 Kapal Pengawas berklasifikasi Kelas I–V
│       ├── Riwayat.html                 # Riwayat Transaksi Terfederasi lintas satelit
│       ├── MasterData.html              # Panel master kapal (berkolom Kelas I–V), WPP, kawasan konservasi, & opsi
│       ├── Notifikasi.html              # Pusat notifikasi pengguna
│       └── Admin.html                   # Panel Admin (persetujuan, pengguna, audit log, pengingat mingguan, konektor satelit)
├── lint_ui.js                           # Linter otomatis 10-gerbang penjamin mutu desain & arsitektur (Fase 7)
└── tests/
    ├── visual_audit.js                  # Harness Playwright Chromium (12 skenario 1440px/1024px/390px + DOM assertions)
    └── screenshots/                     # Artefak screenshot verifikasi visual (dikecualikan dari push GAS via .claspignore)
```

---

## 3. Konvensi Fungsi Layanan Publik (RPC & Setup Interface)
- `setup_seedSuperadmin(resetPassword)`: Menjamin spreadsheet pusat terinisialisasi dan 4 akun default (`SUPERADMIN`, `DIREKTUR`, `KADIV`, `STAF`) siap dipakai secara idempoten.
- `auth_login(params)`: Autentikasi via Email, NIP ternormalisasi, atau alias peran baku dengan proteksi *brute-force lockout* `5` percobaan (`900` detik via `CacheService`).
- `radar_getExecutiveDashboard(token, filter)` / `dashboard_getOverview(token, filter)`: Mengembalikan payload 4 Top KPI, Kalimat Temuan koma Indonesia, status 6 satelit, Peta Taktis 34 Kapal beserta metadata `kelasKapal` (`KELAS_I`–`KELAS_V`), `kelasRomawi`, `kelasLabel`, `panjangMeter`, Analitik fiskal SIKAP + postur AKN Nakhoda, dan array `executiveGrid` untuk **Tabel Monitoring Eksekutif Lintas Satelit**.
- `radar_triggerSyncNow(token, filter)`: Meng-invalidate cache 15 menit, menarik data segar dari seluruh spreadsheet satelit, mencatat `SYNC_MANUAL` ke `Audit_Log`, dan mengembalikan payload terbaru (dipicu eksplisit oleh tombol di dalam `#sync-popover`).
- `dashboard_getTacticalFleet(token)` & `dashboard_getScoringKapalTerbaik(token, filter)`: Mengembalikan disposisi geospasial 34 kapal berkelas `I–V` dan peringkat kinerja triwulanan (mengecualikan kapal berstatus `GALANGAN` dari podium Top 3).
- `dashboard_profilKapal(token, params)`: Menggabungkan identitas master kapal (`Master_Kapal` / fallback `FLEET_34_TACTICAL_SEED` dengan kelas & panjang kapal) beserta kru Sijil aktif dari **Nakhoda** dan aset BMN kapal dari **SIKAP**.
- `kegiatanDirektorat_getKPI`, `kegiatanDirektorat_getHistory`, `kegiatanDirektorat_submit`, `kegiatanDirektorat_revisi`, `kegiatanDirektorat_anulir`: Siklus hidup lengkap pencatatan Kegiatan Direktorat.
- `looker_syncMart(token)` & `looker_scheduledSyncMart()` *(Fase 6)*: Eksekusi batch ETL menulis tabel flat bersih `Mart_Ikhtisar_Nasional` ke `RadarPOA_Looker_Mart`.
- `admin_getSatelliteConfig(token)` & `admin_saveSatelliteConfig(token, params)` *(Fase 7)*: Konfigurasi ID spreadsheet satelit oleh Superadmin.

---

## 4. Mekanisme Ingestion & Cache In-Memory (15 Menit)
1. Saat dasbor diakses, `AggregatorService.agg_collectAll(filter, false)` memeriksa `CacheService.getScriptCache()` dengan kunci berversi (`RADAR_AGG_V{ver}_{txVer}_{filterKey}`).
2. **Cache Hit (`< 15` menit):** Mengembalikan payload agregasi dari RAM secara instan.
3. **Cache Miss atau Pemicu Eksplisit (`radar_triggerSyncNow`):**
   - Membuka spreadsheet satelit yang terkonfigurasi (`RadarPOA_SIKAP_DB`, `RadarPOA_Nakhoda_DB`, `RadarPOA_Pusat_DB`) melalui `_openSsCached(ssId)`.
   - Menyaring baris `Status == 'ACTIVE'` secara batch di memori server.
   - Menghitung seluruh metrik nasional, `executiveGrid`, dan metrik temuan; menyimpan hasil ke `CacheService` (TTL `900` detik); lalu mengirimkannya ke frontend.
