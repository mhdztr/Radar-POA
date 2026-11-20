# ARCHITECTURE.md — Arsitektur Teknis: Radar POA
**Rekapitulasi Data Strategis POA (Pusat Agregasi Data Strategis)**  
*Direktorat Pengendalian Operasi Armada (Dit. POA) · Ditjen PSDKP · KKP RI*

---

## 1. Topologi Sistem & Ekosistem Terfederasi
- **Runtime:** Google Apps Script (HTML Service + V8 JavaScript Engine)
- **Database Utama (Pusat):** Google Spreadsheet `RadarPOA_Pusat_DB` (`PUSAT_SS_ID`)
- **Database Master & Log:** Google Spreadsheet `RadarPOA_Master_DB` (`MASTER_SS_ID`, `LOG_SS_ID`)
- **Database Data Mart:** Google Spreadsheet `RadarPOA_Looker_Mart` (`LOOKER_MART_SS_ID`)
- **File Storage:** Google Drive Folder `POA_Evidence_Pusat`
- **Satelit Ingestion (Federated Cross-Spreadsheet Read-Only):**
  - **SIKAP (Aktif):** `RadarPOA_SIKAP_DB` (`SIKAP_SS_ID` / `TU_SS_ID`) — Anggaran SP2D/Akrual, Paket Pengadaan, Inventaris BMN, Direktori Pegawai POA & Disparitas TU-Nakhoda.
  - **Nakhoda (Aktif):** `RadarPOA_Nakhoda_DB` (`NAKHODA_SS_ID` / `AWAK_SS_ID`) — Komposisi AKN 4 Kategori, Direktori 396+ Awak, Sertifikasi STCW-F, Papan Sijil Safe Manning, Kegiatan Pembinaan.
  - **Satelit Berikutnya (Konektor Siap):** `RadarPOA_Sistik_DB` (`SISTIK_SS_ID`), `RadarPOA_Siaga_DB` (`SIAGA_SS_ID`), dan Subsistem Operasi/Intelijen/Pemantauan (`OPERASI_SS_ID`).

---

## 2. Struktur Modul & Layering Kode

```
Radar-POA/
├── Code.js                              # Entry point doGet() & html_include()
├── appsscript.json                      # Manifest V8 runtime & OAuth scopes
├── utils/
│   ├── Constants.js                     # Mapping SS_NAME, SHEET_*, PROP_KEY, ROLE, WPP_NRI
│   ├── DateUtil.js                      # Konversi tanggal <-> Periode (YYYY-MM-WW) & filter range
│   └── Lock.js                          # Concurrency guard withLock() (LockService)
├── data/
│   └── SheetAccess.js                   # RBAC assertScope(), SHA-256 hashPassword(), federated readSatelliteRows(), applyFormalSheetFormatting()
├── services/
│   ├── AggregatorService.js             # Engine federasi lintas spreadsheet (SIKAP, Nakhoda, Pusat) & CacheService 15 menit
│   ├── DashboardService.js              # Kalkulasi Dasbor Strategis SiMata, Peta Taktis 34 Kapal, Scoring Kapal Terbaik TW I-IV, & Profil Kapal
│   ├── KegiatanDirektoratService.js     # CRUD eksklusif Kegiatan Direktorat (SUPERADMIN, DIREKTUR, KADIV)
│   ├── LookerMartService.js             # Batch ETL sinkronisasi tabel flat bersih ke RadarPOA_Looker_Mart
│   ├── RiwayatService.js                # Feed riwayat transaksi terfederasi (Pusat + SIKAP + Nakhoda)
│   ├── EvidenceService.js               # Multi-file upload lampiran ke Google Drive POA_Evidence_Pusat
│   ├── MasterDataService.js             # Pengelolaan Master 34 Kapal Besar, WPPNRI, Kawasan Konservasi, & Opsi
│   ├── AuthService.js                   # Autentikasi sesi, registrasi 2-tahap OTP email, & antrean persetujuan
│   ├── AdminService.js                  # Manajemen akun, konfigurasi koneksi satelit, & Audit Log viewer
│   └── NotifikasiService.js             # Pusat notifikasi in-app & pengingat mingguan otomatis
├── html/
│   ├── Index.html                       # Shell SPA Dark-Ink Rail & Split Auth 52/48 dengan Logo Resmi Ditjen PSDKP
│   ├── Style.html                       # Ground-up CSS Design System (Archival Maritime Briefing, Sharp 6px/4px/3px, 3-Tier 40/32/26px)
│   ├── Script_Charts.html               # Engine visualisasi Chart.js / SVG linear context (tanpa gauge/3D)
│   ├── Script_Main.html                 # SPA Controller, router hash, peta Leaflet WPP 34 Kapal, & modal handler
│   └── views/
│       ├── Kegiatan.html                # Modul input & feed kronologis Kegiatan Direktorat
│       ├── KapalTerbaik.html            # Podium & leaderboard evaluasi 34 Kapal Pengawas Besar (TW I-IV)
│       ├── Riwayat.html                 # Tampilan riwayat transaksi lintas satelit
│       ├── MasterData.html              # Panel master kapal, WPP, kawasan konservasi, & opsi
│       ├── Notifikasi.html              # Pusat notifikasi pengguna
│       └── Admin.html                   # Panel Superadmin (persetujuan, pengguna, satelit, audit log)
├── lint_ui.js                           # Linter otomatis 10-gerbang penjamin mutu desain & arsitektur
└── tests/                               # Suite pengujian otomatis mandiri (node --test)
```

---

## 3. Konvensi Fungsi Layanan Publik (RPC Interface)
- `radar_getExecutiveDashboard(token, filter)` / `dashboard_getOverview(token, filter)`: Mengembalikan payload lengkap 4 Top KPI SiMata, Kalimat Temuan, status 6 satelit, Peta Taktis 34 Kapal, Kurva Fiskal SIKAP, Postur AKN Nakhoda, dan Grid Ringkasan Divisi.
- `radar_triggerSyncNow(token, filter)`: Meng-invalidate cache 15 menit, menarik data segar dari seluruh spreadsheet satelit, mencatat `SYNC_MANUAL` ke `Audit_Log`, dan mengembalikan payload terbaru.
- `radar_getSatelliteStatus(token)`: Mengembalikan status konektivitas real-time seluruh spreadsheet satelit.
- `dashboard_getTacticalFleet(token)` & `dashboard_getScoringKapalTerbaik(token, filter)`: Mengembalikan disposisi geospasial 34 kapal besar dan peringkat kinerja triwulanan.
- `dashboard_profilKapal(token, params)`: Menggabungkan identitas master kapal dengan kru Sijil aktif dari **Nakhoda** dan aset BMN kapal dari **SIKAP**.
- `kegiatanDirektorat_getKPI(token, filter)`, `kegiatanDirektorat_getHistory(token, filter)`, `kegiatanDirektorat_submit(token, params)`, `kegiatanDirektorat_revisi(token, params)`, `kegiatanDirektorat_anulir(token, params)`: Siklus hidup penuh pencatatan Kegiatan Direktorat.
- `looker_syncMart(token)` & `looker_scheduledSyncMart()`: Eksekusi batch ETL menulis tabel flat bersih `Mart_Ikhtisar_Nasional` ke `RadarPOA_Looker_Mart`.
- `admin_getSatelliteConfig(token)` & `admin_saveSatelliteConfig(token, params)`: Konfigurasi ID spreadsheet satelit oleh Superadmin.

---

## 4. Mekanisme Ingestion & Cache In-Memory (15 Menit)
1. Saat dashboard diakses, `AggregatorService.agg_collectAll(filter, false)` memeriksa `CacheService.getScriptCache()` dengan kunci berversi (`RADAR_AGG_V{ver}_{txVer}_{filterKey}`).
2. **Cache Hit ($< 15\text{ menit}$):** Mengembalikan payload agregasi dari RAM dalam waktu $< 100\text{ ms}$.
3. **Cache Miss atau Klik "Sinkronkan Data" (`radar_triggerSyncNow`):**
   - Membuka spreadsheet satelit yang terkonfigurasi (`RadarPOA_SIKAP_DB`, `RadarPOA_Nakhoda_DB`, `RadarPOA_Pusat_DB`) melalui `_openSsCached(ssId)`.
   - Menyaring baris `Status == 'ACTIVE'` secara batch di memori server.
   - Menghitung seluruh metrik nasional, menyimpan hasil ke `CacheService` (TTL `900` detik), dan mengirimkannya ke frontend.
