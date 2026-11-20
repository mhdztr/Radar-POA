# PHASES.md — Roadmap Pengembangan & Verifikasi QA: Radar POA
**Rekapitulasi Data Strategis POA (Pusat Agregasi & Executive Cockpit)**  
*Direktorat Pemantauan dan Operasi Armada (Dit. POA)*  
*Direktorat Jenderal Pengawasan Sumber Daya Kelautan dan Perikanan (Ditjen PSDKP)*  
*Kementerian Kelautan dan Perikanan Republik Indonesia (KKP RI)*

---

## 1. Ikhtisar Siklus Pengembangan (8 Fase Terukur)

Pengembangan **Radar POA** sebagai pusat agregasi strategis dan *executive cockpit* dilaksanakan melalui 8 fase terstruktur dari *ground-up*, dengan integrasi langsung ke aplikasi satelit yang telah beroperasi (**SIKAP** dan **Nakhoda**) serta kesiapan konektor untuk satelit berikutnya (**Sistik**, **Siaga**, **Operasi**):

```
ROADMAP PENGEMBANGAN RADAR POA v1.0
├── [Fase 0] Penyelarasan Dokumen Inti, Migrasi 51 Design Skills, & Kontrak DESIGN.md Ground-Up
├── [Fase 1] Sanitasi Monolitik Nautika, Setup Constants Satelit, & Federated Data Layer
├── [Fase 2] Aggregator Engine Lintas Spreadsheet (SIKAP & Nakhoda), Cache 15m, & Riwayat Federasi
├── [Fase 3] Ground-Up Design System (Style.html), Branding Logo PSDKP, & Open-Plane Executive Shell
├── [Fase 4] Executive Cockpit SiMata, Kalimat Temuan, Peta Taktis 34 Kapal, & Analitik SIKAP/Nakhoda
├── [Fase 5] Modul Eksklusif Kegiatan Direktorat, Calendar Picker Anti-Ketik, & Multi-Evidence Drive
├── [Fase 6] Pipeline Data Mart Looker Studio (LookerMartService), Sheet Formal, & Scheduled Trigger
└── [Fase 7] Admin Panel, Konektor Satelit, Linter Otomatis (lint_ui.js), & Final QA Audit
```

---

## 2. Rincian Eksekusi, Kebutuhan Teknis, & Kriteria Verifikasi per Fase

### Fase 0: Penyelarasan Dokumen Inti, Migrasi 51 Design Skills, & Kontrak `DESIGN.md` Ground-Up
- **Status:** **Selesai (`[x]`)**
- **Tujuan Utama:** Menetapkan sumber kebenaran tunggal (*Single Source of Truth*) bagi arsitektur agregator pusat, mengimpor seluruh *design & engineering skills* dari **Nakhoda** dan **SIKAP**, serta menyusun kontrak sistem desain `DESIGN.md` dari *ground-up* yang bebas *AI slop*.
- **Komponen yang Dikerjakan:**
  - Migrasi 51 entri skill dari `SIKAP/.agents/skills/` dan `Nakhoda/.agents/skills/` ke [`.agents/skills/`](file:///home/pinefeast/Projects/Radar-POA/.agents/skills) (`unslop`, `design-taste-frontend` v2.5.0, `colorize`, `apple-hig`, `apple-design`, `d3-visualization`, `animate`, `emilkowalski-motion`, `impeccable`, `ponytail*`, `ui-ux-pro-max`, dll.).
  - Pembaruan [`.claspignore`](file:///home/pinefeast/Projects/Radar-POA/.claspignore) agar direktori `.agents/`, `.agent/`, dan `tests/` tidak ter-push ke Google Apps Script.
  - Penyusunan [DESIGN.md](file:///home/pinefeast/Projects/Radar-POA/DESIGN.md) dari *ground-up*:
    - *5-Line Direction Contract* (Anjungan Komando Armada & Peta Hidrografi Maritim WPPNRI 571–718).
    - Identitas resmi **Logo Ditjen PSDKP** (base64 crest + SVG filter `#psdkp-crest-outline`) selaras dengan SIKAP dan Nakhoda.
    - Tangga warna netral OKLCH (*Hydrographic Mineral Ramp* `#F3F5F8` / `#FFFFFF` / `#0C1117`) & kode warna data satelit (*60% Hydrographic Cerulean `#0369A1`, 30% Jade SIKAP `#065F46` & Safety Orange Nakhoda `#D9480F`, 10% Semantik Status*).
    - Tipografi optik (`Geist` / `Plus Jakarta Sans` + `Geist Mono` dengan `tabular-nums` wajib) dan geometri kontrol 3-tier (`LG: 40px`, `MD: 32px`, `SM: 26px`).
- **Deliverables & Checklist:**
  - [x] 51 entri skill tersedia di `.agents/skills/` dan dikecualikan di `.claspignore`.
  - [x] `DESIGN.md`, `AGENTS.md`, `PRD.md`, `ARCHITECTURE.md`, `DATA_SCHEMA.md`, `PHASES.md`, dan `README.md` sinkron 100%.

---

### Fase 1: Sanitasi Monolitik Nautika, Setup Constants Satelit, & Federated Data Layer
- **Status:** **Selesai (`[x]`)**
- **Tujuan Utama:** Membersihkan seluruh file layanan dan antarmuka input operasional warisan monolitik Nautika yang melanggar prinsip *Radar POA Sebagai Aggregator*, serta menyiapkan layer pembacaan lintas spreadsheet yang aman dan *self-healing*.
- **Komponen yang Dikerjakan:**
  - Penghapusan 20 file warisan monolitik: 9 service operasional satelit (`BMNService.js`, `TataUsahaService.js`, `PengawakanService.js`, `LogistikService.js`, `PerawatanService.js`, `OperasiLautService.js`, `OperasiUdaraService.js`, `IntelijenService.js`, `PemantauanService.js`), `utils/DetailService.js`, `html/Auth.html`, serta 9 view HTML operasional satelit.
  - Pemangkasan >8.800 baris kode mati di [html/Script_Main.html](file:///home/pinefeast/Projects/Radar-POA/html/Script_Main.html) dan fungsi debug di [Code.js](file:///home/pinefeast/Projects/Radar-POA/Code.js).
  - Pembaruan [utils/Constants.js](file:///home/pinefeast/Projects/Radar-POA/utils/Constants.js) dengan `PROP_KEY` satelit (`SIKAP_SS_ID`/`TU_SS_ID`, `NAKHODA_SS_ID`/`AWAK_SS_ID`, `SISTIK_SS_ID`, `SIAGA_SS_ID`, `OPERASI_SS_ID`, `LOOKER_MART_SS_ID`), `SHEET_SIKAP`, `SHEET_NAKHODA`, `SHEET_PUSAT`, `WPP_NRI`, dan `EVIDENCE_ROOT_FOLDER = 'POA_Evidence_Pusat'`.
  - Pembaruan [data/SheetAccess.js](file:///home/pinefeast/Projects/Radar-POA/data/SheetAccess.js) dengan cache instance spreadsheet per-eksekusi (`_openSsCached`), auto-create sheet pusat (`TX_KegiatanDirektorat`, `TX_Evidence`) dan log (`Audit_Log`, `Approval_Queue`, `Notifications`), serta pembaca satelit aman `resolveSatelliteSpreadsheetId()` dan `readSatelliteRows()`.
- **Deliverables & Checklist:**
  - [x] 0 file/fungsi form input operasional teknis harian satelit di repositori Radar POA.
  - [x] `Code.js`, `utils/Constants.js`, dan `data/SheetAccess.js` lolos kompilasi `node -c` dan bebas referensi mati (`ZERO_DANGLING_REFS`).

---

### Fase 2: Aggregator Engine Lintas Spreadsheet (`SIKAP` & `Nakhoda`), Cache 15m, & Riwayat Federasi
- **Status:** **Selesai (`[x]`)**
- **Tujuan Utama:** Mengimplementasikan penarikan data *server-side* secara terfederasi dari basis data satelit yang sudah selesai (**SIKAP** dan **Nakhoda**) beserta basis data pusat (`RadarPOA_Pusat_DB`), dilengkapi in-memory caching 15 menit.
- **Komponen yang Dikerjakan:**
  - Pembangunan [services/AggregatorService.js](file:///home/pinefeast/Projects/Radar-POA/services/AggregatorService.js):
    - **Ingestor SIKAP (`RadarPOA_SIKAP_DB`):** Membaca `TX_TataUsaha` (Pagu Reguler & ABT, Realisasi SP2D & Akrual YTD, % Serapan, Sisa Pagu, tren bulanan), `TX_Paket_Progres` (total paket, nilai kontrak, realisasi keuangan, rata-rata progres fisik), `TX_BMN_Aset` (total unit, nilai perolehan, nilai buku, kondisi `BAIK`/`RUSAK_RINGAN`/`RUSAK_BERAT`, aset `DALAM_PENGHAPUSAN`), `TX_TU_Pegawai`, dan `Master_Pegawai_POA` (total pegawai aktif & jumlah `DISPARITAS_NAKHODA`).
    - **Ingestor Nakhoda (`RadarPOA_Nakhoda_DB`):** Membaca `TX_Pengawakan_AKN` (snapshot carry-forward 2 scope $\times$ 4 kategori baku `PNS`, `P3K`, `P3K_PARUH_WAKTU`, `PJLP` dengan normalisasi kategori legacy), `Master_Awak` (396+ awak aktif, rumpun `DEK`/`MESIN`/`PENUNJANG`, penempatan `PUSAT_POA`/`DIPERBANTUKAN_UPT`), `TX_Pelatihan_Awak` (status sertifikat `berlaku`, `segeraHabis <= 90 hari`, `kedaluwarsa`), `TX_Penugasan_Kapal` + `Master_SafeManning` (evaluasi kapal laik awak vs kurang awak), dan `TX_Pengawakan_Kegiatan`.
    - **Ingestor Pusat (`RadarPOA_Pusat_DB`):** Membaca `TX_KegiatanDirektorat` (kegiatan YTD, periode berjalan, entri terbaru).
    - **In-Memory Cache (`CacheService.getScriptCache()`, TTL 900 detik / 15 menit)** + endpoint `radar_triggerSyncNow(token, filter)` yang mem-bump versi cache dan mencatat aksi `SYNC_MANUAL` ke `Audit_Log`.
  - Pembaruan [services/DashboardService.js](file:///home/pinefeast/Projects/Radar-POA/services/DashboardService.js) dan [services/RiwayatService.js](file:///home/pinefeast/Projects/Radar-POA/services/RiwayatService.js) untuk menyajikan payload eksekutif dan riwayat transaksi lintas satelit (`PUSAT`, `SIKAP`, `NAKHODA`).
- **Deliverables & Checklist:**
  - [x] `agg_collectAll()`, `radar_getExecutiveDashboard()`, `radar_triggerSyncNow()`, dan `riwayat_getAll()` berfungsi dan teruji di Node VM dengan mock spreadsheet `SIKAP`, `NAKHODA`, dan `PUSAT`.

---

### Fase 3: Ground-Up Design System (`html/Style.html`), Branding Logo PSDKP, & Open-Plane Executive Shell
- **Status:** **Siap Dikerjakan (`[ ]`)**
- **Tujuan Utama:** Membangun `html/Style.html` baru dari *ground-up* sesuai kontrak [DESIGN.md](file:///home/pinefeast/Projects/Radar-POA/DESIGN.md) dan memperbarui shell [html/Index.html](file:///home/pinefeast/Projects/Radar-POA/html/Index.html) dengan identitas resmi **Logo Ditjen PSDKP** seperti pada SIKAP dan Nakhoda.
- **Komponen yang Harus Dikerjakan:**
  1. **Pembuatan `html/Style.html` dari Ground-Up:**
     - Deklarasi seluruh token CSS `:root` sesuai `DESIGN.md` §3–§8: *Hydrographic Mineral Ramp* (`--bg-ground: #F3F5F8`, `--bg-surface: #FFFFFF`, `--bg-raised: #EAEFF5`, `--bg-active: #E1E8F0`, `--ink-primary: #0C1117`, `--ink-secondary: #3B4654`, `--ink-muted: #5C6878`), aksen data (`--accent-radar: #0369A1`, `--sat-sikap: #065F46`, `--sat-nakhoda: #D9480F`), dan token status semantik (`--sem-pos`, `--sem-warn`, `--sem-crit`).
     - Tipografi optik (`Geist`, `Plus Jakarta Sans`, `Geist Mono`) dengan `tabular-nums` otomatis pada `.kpi-val`, `.tnum`, `td.num`, `.kt-table td`.
     - Sistem kontrol 3-tier ketat (`--ctl-h-lg: 40px`, `--ctl-h-md: 32px`, `--ctl-h-sm: 26px`) beserta class `.ctl-row`, `.ctl-lg`, `.ctl-md`, `.ctl-sm`, `.ctl-fill`, `.ctl-stack`, dan perluasan area sentuh `44px` di layar sentuh.
     - Arsitektur shell *Open-Plane* (`sidebar 248px`, `app-main` fluid dengan `max-width: 1520px`, equal edges `28px`, sticky header `backdrop-filter: blur(16px)`), kartu autentikasi 2-ruang (*Executive Brand Header + Form Body*), strip 4 KPI terpadu dengan pembagi garis `1px`, tabel eksekutif `44px`, modal dialog, drawer kanan, dan toaster kanan bawah.
     - Fisika gerak Emil Kowalski (`--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`, `--dur-press: 90ms`, `--dur-fast: 150ms`, `--dur-modal: 200ms`, `--dur-drawer: 240ms`), gating `@media (hover: hover) and (pointer: fine)`, serta `@media (prefers-reduced-motion: reduce)` dan `@media (prefers-reduced-transparency: reduce)`.
  2. **Integrasi Logo Resmi Ditjen PSDKP di `html/Index.html`:**
     - Menyertakan definisi SVG `<filter id="psdkp-crest-outline">` di awal `<body>` (identik dengan SIKAP).
     - Memasang **Logo Ditjen PSDKP** (base64 PNG resmi) pada:
       - **Layar Login, Register, & Pending (`#auth-wrapper`):** Header kartu autentikasi menampilkan Crest Ditjen PSDKP (`46x52`), akronim **Radar POA**, badge `Dit. POA`, sub-judul `Rekapitulasi Data Strategis & Executive Cockpit`, dan atribusi `Direktorat Pemantauan dan Operasi Armada · Ditjen PSDKP KKP RI`.
       - **Puncak Sidebar (`aside.sidebar`):** `.brand-box` dengan Crest Ditjen PSDKP (`34x39`), judul **Radar POA**, badge `Dit. POA`, dan deskripsi `Pusat Agregasi & Executive Cockpit`.
       - **Mobile Topbar (`<= 768px`):** Crest Ditjen PSDKP (`20x23`) + nama layar aktif + tombol toggle menu.
     - Mengaktifkan kembali `<?!= html_include('html/Style'); ?>` di `<head>` `html/Index.html` dan memuat font `Geist` + `Geist Mono` + `Plus Jakarta Sans`.
- **Kriteria Verifikasi:**
  - [ ] `html/Style.html` ter-include dengan benar di `html/Index.html` tanpa error template GAS.
  - [ ] Logo PSDKP tampil tajam dengan outline kontur putih halus di layar masuk, sidebar, dan mobile topbar.
  - [ ] Seluruh kontrol mematuhi tier `40px / 32px / 26px` (`_uiAudit()` melaporkan `0 violations`).

---

### Fase 4: Executive Cockpit SiMata, Kalimat Temuan, Peta Taktis 34 Kapal, & Analitik SIKAP/Nakhoda
- **Status:** **Siap Dikerjakan (`[ ]`)**
- **Tujuan Utama:** Menyempurnakan tampilan dan interaksi **Ikhtisar Eksekutif (`overview`)**, **Kapal Terbaik (`kapal-terbaik`)**, dan **Profil Kapal (`profil-kapal`)** sesuai standar visualisasi D3/Leaflet di `DESIGN.md` §6–§7.
- **Komponen yang Harus Dikerjakan:**
  1. **Header Layar & Kalimat Temuan Otomatis (`_renderPageHeader` & `_ovRenderData`):**
     - Menampilkan kalimat temuan satu baris berbasis data nyata di bawah `h1` pada setiap layar (dibangun dari payload `AggregatorService`: serapan SP2D %, kesiapan 34 kapal, kekuatan AKN POA, dan notifikasi disparitas TU-Nakhoda).
     - Tombol **Sinkronkan Data (`#sync-indicator`)** memanggil `radar_triggerSyncNow(APP.token, APP.filter)` saat diklik pimpinan untuk memaksa penarikan ulang dari spreadsheet SIKAP & Nakhoda, disertai popover status koneksi 6 satelit (`PUSAT`, `SIKAP`, `NAKHODA`, `SISTIK`, `SIAGA`, `OPERASI`).
  2. **Strip 4 Top KPI SiMata & Provenance Tags:**
     - Merender 4 KPI utama dalam satu kontainer bersekat garis `1px` dengan lencana sumber satelit (`SIKAP · Anggaran`, `NAKHODA · Postur AKN`, `ARMADA · 34 Kapal Besar`, `PUSAT · Kegiatan Dit.`), angka `tabular-nums`, trek bullet linear `4px`, dan baris pembanding bawah.
  3. **Peta Taktis WPPNRI 571–718 & 34 Kapal Pengawas Besar:**
     - Choropleth WPP satu-hue *Hydrographic Cerulean* (`#F1F5F9` s.d. `#0369A1`).
     - Filter chip status armada (`Semua 34`, `26 Operasional di Laut`, `6 Siap di Pangkalan`, `2 di Galangan`) dengan marker suar kode warna taktis (`#0369A1`, `#15803D`, `#B45309`) dan popup detail kapal + tombol `Lihat Profil Kapal`.
  4. **Visualisasi Kurva Fiskal SIKAP & Postur AKN Nakhoda (`html/Script_Charts.html` & `html/Script_Main.html`):**
     - Penyesuaian palet `_CHART_COLORS` di `html/Script_Charts.html` ke palet `DESIGN.md` (`#0369A1` Cerulean, `#065F46` Jade SIKAP, `#D9480F` Orange Nakhoda, `#15803D` Emerald, `#B45309` Amber, `#BE123C` Crimson) — menghapus seluruh warna legacy `#2B3674`.
     - Kartu divisi terfederasi dengan D3/SVG *linear bullet tracks*, *horizontal barList*, dan indikator disparitas SIKAP-Nakhoda.
  5. **Halaman Evaluasi Kapal Terbaik (`html/views/KapalTerbaik.html`) & Profil Kapal:**
     - Podium Top 3 Kapal Terbaik Triwulan (`TW I–IV`) dan tabel peringkat 34 kapal besar dengan kolom angka `tabular-nums` rata kanan.
     - Halaman Profil Kapal menampilkan daftar kru aktif yang ditarik langsung dari `TX_Penugasan_Kapal` & `Master_Awak` (Nakhoda) serta jumlah BMN kapal dari `TX_BMN_Aset` (SIKAP).
- **Kriteria Verifikasi:**
  - [ ] Tidak ada lagi warna legacy `#2B3674` di `Script_Charts.html` maupun `Script_Main.html`.
  - [ ] Klik indikator sinkronisasi memicu `radar_triggerSyncNow` dan memperbarui tampilan secara *live*.

---

### Fase 5: Modul Eksklusif Kegiatan Direktorat, Calendar Picker Anti-Ketik, & Multi-Evidence Drive
- **Status:** **Siap Dikerjakan (`[ ]`)**
- **Tujuan Utama:** Memastikan satu-satunya modul input di Radar POA (**Kegiatan Direktorat**) memiliki UX tingkat eksekutif, proteksi tanggal anti-ketik manual, serta pengelolaan lampiran bukti (`POA_Evidence_Pusat`) dan transparansi `SUPERSEDED`/`VOID` yang sempurna.
- **Komponen yang Harus Dikerjakan:**
  - Proteksi `<input type="date">` pada filter rentang tanggal header serta form tambah/revisi Kegiatan Direktorat (`#kgd-tanggal`, `#rv-kgd-tanggal`) dengan `onkeydown="return false"`, `onpaste="return false"`, dan auto-`showPicker()` saat diklik (konsisten dengan aturan anti-ketik manual di SIKAP & Nakhoda).
  - Peningkatan tampilan [html/views/Kegiatan.html](file:///home/pinefeast/Projects/Radar-POA/html/views/Kegiatan.html):
    - Strip 3 KPI ringkas (`Kegiatan Periode Ini`, `Kegiatan YTD`, `Pencatatan Terakhir`).
    - Filter pencarian judul/pihak hadir secara instan dan filter status (`Semua`, `Aktif`, `Ditimpa`, `Dianulir`).
    - Penampilan transparan entri `VOID` (beserta `VoidReason`) dan `SUPERSEDED` di feed kronologis.
    - Integrasi multi-evidence uploader ke folder Google Drive `POA_Evidence_Pusat`.
- **Kriteria Verifikasi:**
  - [ ] Input tanggal tidak dapat diketik manual dan selalu membuka kalender.
  - [ ] Siklus `Submit -> Revisi (SUPERSEDED + carry evidence) -> Anulir (VOID + VoidReason)` berjalan mulus dengan RBAC `SUPERADMIN`, `DIREKTUR`, dan `KADIV`.

---

### Fase 6: Pipeline Data Mart Looker Studio (`LookerMartService.js`), Sheet Formal, & Scheduled Trigger
- **Status:** **Siap Dikerjakan (`[ ]`)**
- **Tujuan Utama:** Mengimplementasikan pipeline ETL terjadwal menuju spreadsheet `RadarPOA_Looker_Mart` (`Mart_Ikhtisar_Nasional`) sesuai `PRD.md` §3.4, `ARCHITECTURE.md` §2–§3, dan `DATA_SCHEMA.md` §2, serta menerapkan pemformatan Google Sheet formal (`applyFormalSheetFormatting`).
- **Komponen yang Harus Dikerjakan:**
  1. **Pembuatan `services/LookerMartService.js`:**
     - Fungsi `looker_syncMart(token)` (untuk pemicu manual Superadmin/Direktur) dan `looker_scheduledSyncMart()` (untuk time-driven trigger berkala tanpa token).
     - Membuka atau membuat otomatis spreadsheet `RadarPOA_Looker_Mart` (menyimpan ID ke Script Property `LOOKER_MART_SS_ID`) beserta sheet `Mart_Ikhtisar_Nasional`.
     - Menulis/memperbarui baris flat bersih (100% bebas dari baris `SUPERSEDED` dan `VOID`) sesuai skema `DATA_SCHEMA.md` §2:
       `Periode`, `BulanTahun`, `TotalPagu_Reguler`, `TotalPagu_ABT`, `TotalRealisasi_SP2D_Reguler`, `TotalRealisasi_SP2D_ABT`, `PctSerapan_Nasional`, `Armada_Siap_Pct`, `TotalKegiatanDirektorat`, `Aset_RusakBerat_Unit`.
     - Fungsi `looker_setTriggerAktif(token, aktif)` untuk mengaktifkan/menonaktifkan trigger ETL otomatis harian/mingguan.
  2. **Standarisasi Format Fisik Google Sheet (`applyFormalSheetFormatting` di `data/SheetAccess.js`):**
     - Memformat sheet `TX_KegiatanDirektorat`, `Mart_Ikhtisar_Nasional`, `Audit_Log`, `Users`, dan `Kapal` secara formal (`#0F172A` header teks putih tebal `34px`, `setFrozenRows(1)`, baris data `26px` *zebra banding* `#FFFFFF`/`#F8FAFC`, format `@` plain text untuk `NIP`, tanggal ISO `yyyy-mm-dd`, dan format angka ribuan `#,##0`).
- **Kriteria Verifikasi:**
  - [ ] `looker_syncMart()` menghasilkan baris `Mart_Ikhtisar_Nasional` yang akurat sesuai hasil `agg_collectAll()`.
  - [ ] Seluruh kolom `Mart_Ikhtisar_Nasional` persis cocok dengan `DATA_SCHEMA.md` §2.

---

### Fase 7: Admin Panel, Konektor Satelit, Linter Otomatis (`lint_ui.js`), & Final QA Audit
- **Status:** **Siap Dikerjakan (`[ ]`)**
- **Tujuan Utama:** Menyediakan antarmuka konfigurasi ID Spreadsheet Satelit bagi Superadmin di Admin Panel, membangun engine audit mutu kode & desain `lint_ui.js` khusus Radar POA, serta menyiapkan unit test suite otomatis `tests/`.
- **Komponen yang Harus Dikerjakan:**
  1. **Tab Konfigurasi Satelit & Data Mart di Admin Panel (`services/AdminService.js` & `html/views/Admin.html`):**
     - Memungkinkan `SUPERADMIN` melihat status koneksi dan mengatur Script Properties ID Spreadsheet satelit (`SIKAP_SS_ID`, `NAKHODA_SS_ID`, `SISTIK_SS_ID`, `SIAGA_SS_ID`, `OPERASI_SS_ID`, `LOOKER_MART_SS_ID`) serta memicu `looker_syncMart` langsung dari UI tanpa harus membuka Script Editor GAS.
  2. **Engine Linter Otomatis `lint_ui.js` (10 Pemeriksaan Ketat):**
     - `1. Zero-Emoji Policy` di seluruh file `.html`, `.js`.
     - `2. 3-Tier Control Geometry` (`--ctl-h-lg: 40px`, `--ctl-h-md: 32px`, `--ctl-h-sm: 26px`) & larangan inline `style="height:..."`.
     - `3. Anti-Monolith Gate`: memastikan tidak ada file/form input operasional satelit (Tata Usaha, BMN, Pengawakan, Logistik, Perawatan, Operasi, Intelijen, Pemantauan) di Radar POA.
     - `4. Server-Side Aggregation Gate`: memastikan `AggregatorService.js`, `DashboardService.js`, `KegiatanDirektoratService.js`, dan `LookerMartService.js` ada dan lengkap.
     - `5. Negative Prompts Gate`: memastikan tidak ada circular gauge/speedometer, 3D chart, warna legacy `#2B3674`, atau `transition: all`.
     - `6. Official PSDKP Logo Crest Gate`: memastikan logo resmi Ditjen PSDKP dan filter `#psdkp-crest-outline` terpasang di `html/Index.html`.
     - `7. Tabular Numerics & Optical Typography Gate`: memastikan `tabular-nums` dan font `Geist` / `Plus Jakarta Sans` terdefinisi di `html/Style.html`.
     - `8. Accessibility & Reduced Motion Gate`: memastikan `@media (prefers-reduced-motion: reduce)` dan `@media (hover: hover)` terpasang.
     - `9. Calendar Picker Anti-Ketik Manual Gate`: memastikan `<input type="date">` terproteksi `onkeydown="return false"`.
     - `10. HTML Include & JS Syntax Integrity`: memastikan seluruh target `html_include` ada dan seluruh `<script>` bebas syntax error.
  3. **Automated Test Suite (`tests/radar_poa.test.js`):**
     - Pengujian `node --test` untuk `AggregatorService.js`, `DashboardService.js`, `KegiatanDirektoratService.js`, `LookerMartService.js`, dan `RiwayatService.js`.
- **Kriteria Verifikasi:**
  - [ ] `node lint_ui.js` lulus **10 / 10 PASS (0 errors)**.
  - [ ] `node --test tests/*.test.js` lulus **100% PASS**.
  - [ ] `node -c Code.js services/*.js utils/*.js data/*.js lint_ui.js` lulus **0 syntax errors**.

---

## 3. Matriks Pengujian & Verifikasi Kualitas (QA Test Suite)

| Kategori Pengujian | Parameter Verifikasi | Perintah / Prosedur Uji | Target Kelulusan |
|---|---|---|:---:|
| **Audit Linter UI & Arsitektur** | Zero-Emoji, 3-Tier Scale, Anti-Monolith, Logo PSDKP, Negative Prompts | `node lint_ui.js` | **10 / 10 PASS (100%)** |
| **Pemeriksaan Sintaksis JS** | Validasi kompilasi seluruh file `.js` backend, utils, data, dan linter | `node -c Code.js services/*.js utils/*.js data/*.js lint_ui.js` | **0 Syntax Errors** |
| **Unit & Integration Test** | Federasi SIKAP & Nakhoda, Cache 15m, Sync Now, Kegiatan Direktorat, Looker Mart | `node --test tests/*.test.js` | **100% Tests Pass** |
| **Audit Kohesi Kontrol Runtime** | Pemeriksaan kesamaan tinggi kontrol sebaris (`40px`, `32px`, `26px`) di DOM | `window._uiAudit()` | **0 Violations** |
