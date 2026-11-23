# PHASES.md — Roadmap Pengembangan, Redesign UI, & Verifikasi QA: Radar POA
**Rekapitulasi Data Strategis POA (Pusat Agregasi & Dasbor Strategis Pimpinan)**  
*Direktorat Pengendalian Operasi Armada (Dit. POA)*  
*Direktorat Jenderal Pengawasan Sumber Daya Kelautan dan Perikanan (Ditjen PSDKP)*  
*Kementerian Kelautan dan Perikanan Republik Indonesia (KKP RI)*

---

## 1. Ikhtisar Siklus Pengembangan & Gelombang Redesign UI

Pengembangan **Radar POA** berjalan dalam fase fondasi (`Fase 0–4` selesai), diikuti gelombang **Redesign Total UI v2.0 (`Fase R0–R4`)** hasil audit **Playwright Chromium** & evaluasi `/unslop`, `/frontend-design`, `/design-taste-frontend`, `/apple-design`, `/critique`, serta penyelesaian fitur backend lanjutan (`Fase 5–7`):

```
ROADMAP PENGEMBANGAN RADAR POA v2.0
├── [Fase 0]  Selesai [x] — Dokumen Inti, Migrasi 51 Design Skills, & Kontrak DESIGN.md Awal
├── [Fase 1]  Selesai [x] — Sanitasi Monolitik Nautika, Constants Satelit, & Federated Data Layer
├── [Fase 2]  Selesai [x] — Aggregator Engine (SIKAP & Nakhoda), Cache 15m, & Self-Healing Auth Auto-Seed
├── [Fase 3]  Selesai [x] — Implementasi Shell Awal, Split Auth 50/50, & Logo Resmi PSDKP
├── [Fase 4]  Selesai [x] — Dasbor Strategis Awal, Kalimat Temuan, Peta 34 Kapal, & Playwright Visual Audit
│
├── [Fase R0] Selesai [x] — Penyelarasan Dokumentasi & Kontrak Redesign Ultra-Detail di Seluruh *.md
├── [Fase R1] Selesai [x] — Shell Baru (Top Bar 56px + Floating Bottom Maritime Dock), Toolbar 32px, Sync Popover, & Login 50/50
├── [Fase R2] [ ]         — Redesign Ikhtisar: Peta 68/32 Berikon Siluet Kapal Kelas I–V, Grafik Asimetris 65/35, & Tabel Eksekutif Lintas Satelit
├── [Fase R3] [ ]         — Redesign Kapal Terbaik (Non-Galangan Podium & Sync TW) & Profil Kapal (h1 Kapal + Enum Manusiawi)
├── [Fase R4] [ ]         — Standarisasi 5 Halaman Sekunder, Fix Error .map(), Jargon Clean-Up, Calendar Anti-Ketik, & 12-Screen Playwright Gate
│
├── [Fase 5]  [ ]         — Pengujian E2E Siklus Kegiatan Direktorat (Submit -> Revisi SUPERSEDED -> Anulir VOID) & Multi-Evidence Drive
├── [Fase 6]  [ ]         — Pipeline Data Mart Looker Studio (LookerMartService.js), applyFormalSheetFormatting(), & Scheduled Trigger
└── [Fase 7]  [ ]         — Admin Konektor Satelit, Linter Otomatis (lint_ui.js 10 Gates), & Automated Test Suite (tests/*.test.js)
```

---

## 2. Rincian Eksekusi, Kebutuhan Teknis, & Kriteria Verifikasi per Fase

### Fase 0 s.d. Fase 4 — Fondasi, Agregasi, Auth Auto-Seed, & Implementasi Awal (`[x]`)
- **Status:** **Selesai (`[x]`)**
- **Ringkasan Pencapaian:**
  - `Fase 0–1`: Migrasi 51 skill di `.agents/skills/`, sanitasi 20 file warisan monolitik Nautika, setup `PROP_KEY` satelit (`utils/Constants.js`), dan federated reader (`data/SheetAccess.js`).
  - `Fase 2 + Auth Upgrade`: `AggregatorService.js` (SIKAP, Nakhoda, Pusat, TTL 15 menit), `RiwayatService.js`, self-healing `ensurePusatSpreadsheet()` + `_ensureSuperadminSeeded()` + `setup_seedSuperadmin()` (`Code.js`), serta `auth_login()` multi-identifier (`Email` / `NIP` / alias + lockout 5x 15m).
  - `Fase 3–4`: Implementasi `Style.html`, `Script_Charts.html`, Split Auth 50/50 fotografis dengan logo PSDKP, kalimat temuan dinamis, `DashboardService.js`, dan harness Playwright `tests/visual_audit.js`.

---

### Fase R0: Penyelarasan Dokumentasi & Kontrak Redesign UI v2.0 (`*.md`)
- **Status:** **Selesai (`[x]`)**
- **Tujuan Utama:** Mengunci seluruh keputusan arsitektur, kritik DOM Playwright, spesifikasi ikon siluet kapal Kelas I–V, layout *Floating Bottom Dock*, standarisasi 5 halaman sekunder, dan metrik QA ke dalam seluruh dokumen markdown proyek sebelum pengkodean UI v2.0 dimulai.
- **Kriteria Verifikasi:**
  - [x] `DESIGN.md`, `PHASES.md`, `PRD.md`, `ARCHITECTURE.md`, `DATA_SCHEMA.md`, `AGENTS.md`, `README.md`, dan `CHANGELOG.md` sinkron 100% dengan rencana Fase R1–R4.
  - [x] `0` kemunculan kata terlarang, referensi font non-`Public Sans` pada gate Radar POA, maupun keterangan arsitektur navigasi rail/proporsi split lama yang usang.

---

### Fase R1: Shell Baru (Top Institutional Bar `56px` + Floating Bottom Maritime Dock), Toolbar `32px`, Sync Popover, & Login 50/50
- **Status:** **Selesai (`[x]`)**
- **Tujuan Utama:** Mengganti navigasi sidebar rail kiri dengan **Floating Bottom Maritime Dock (`#0E1722`)** + **Top Institutional Bar (`56px`)**, merampingkan sticky header agar tidak pecah di lebar `1024px`, menseragamkan kontrol `32px`, dan menyempurnakan layar autentikasi 50/50.
- **Komponen yang Harus Dikerjakan:**
  1. **Shell HTML & CSS Baru (`html/Index.html`, `html/Style.html`, `html/Script_Main.html`):**
     - Hapus `<aside class="sidebar">`, `#mobile-topbar`, dan `#sidebar-backdrop`.
     - Bangun `#app-topbar` (`56px` solid `#FFFFFF`, hairline `#D9E2EA`): crest PSDKP (`28×32px`) + lockup `RADAR POA · Rekapitulasi Data Strategis` (**tanpa pil `[Dit. POA]`**), `#sync-indicator` (`32px`), `#topbar-notif-btn` (`32px`), dan `#user-menu-btn` (`32px`) dengan dropdown menu akun.
     - Bangun `#app-dock` (*Floating Bottom Maritime Dock*):
       - Desktop (`> 768px`): terpusat di bawah (`bottom: 18px`), permukaan `#0E1722`, radius `14px`, highlight atas `inset 0 1px 0 rgba(255,255,255,0.08)`, item terfilter RBAC (`Ikhtisar`, `Kegiatan`, `Kapal Terbaik`, `Riwayat` | `Notifikasi`, `Master Data`, `Admin`) berindikator aktif `#1D2E42` + bar bawah `2px solid #C88A2E`.
       - Mobile (`<= 768px`): dock melebar penuh berisi 4 menu inti + tombol `Lainnya` yang membuka `#dock-more-sheet`.
     - Atur `.app-main` (`max-width: 1440px; margin: 0 auto; padding: 24px 28px 108px;` desktop; `16px 16px 96px` mobile).
  2. **Perampingan Header, Kontrol `32px`, & Popover Sync (`html/Script_Main.html`, `html/Style.html`):**
     - Pindahkan `#page-finding` keluar dari baris toolbar sticky ke bawah `h1` di area konten halaman agar header tetap 1 baris bersih di `1440px` maupun `1024px`.
     - Samakan tinggi semua kontrol dalam satu baris (`Bulanan | Rentang`, `select.filter-sel`, `input[type="date"]`, tombol aksi halaman) ke **`32px` tepat** (`brokenControlRows === 0`).
     - Klik `#sync-indicator` hanya membuka/menutup `#sync-popover`; tombol eksplisit **`Sinkronkan Data Satelit`** ditempatkan di dalam popover (menghapus pemicu sync tak sengaja & double-toast), serta menghapus titik di akhir pesan toast.
  3. **Polish Layar Autentikasi 50/50 (`html/Index.html`, `html/Style.html`):**
     - Sesuaikan `object-position` foto personel di desktop & mobile agar figur utama utuh tanpa wajah/dahi terpotong di tepi bingkai.
     - Ubah panel kanan ke `#FAFCFD` dengan tata flex vertikal berjangkar footer `Direktorat Jenderal PSDKP · Kementerian Kelautan dan Perikanan RI`, hapus `<hr>` kaku, perkuat border input (`#B5C4D1`), dan hapus ikon dekoratif dari tombol `Masuk`.
- **Kriteria Verifikasi:**
  - [x] Screenshot Playwright `login-desktop` (`1440×900`), `login-mobile` (`390×844`), `overview-1440`, `overview-1024`, `overview-mobile`, sync popover, dan mobile overflow sheet ter-render rapi dan diperiksa via `read_file`.
  - [x] `overflowX === 0` dan `brokenControlRows === 0` di seluruh viewport uji.

---

### Fase R2: Redesain Total `Ikhtisar` — Peta `68/32` Ikon Siluet Kapal Kelas I–V, Grafik Asimetris `65/35`, & Tabel Eksekutif Lintas Satelit
- **Status:** **Siap Dikerjakan (`[ ]`)**
- **Tujuan Utama:** Mengganti marker pil bertumpuk di peta dengan ikon siluet kapal berdasarkan Kelas I–V PSDKP, menekan kebisingan warna (`distinctBg <= 16`) dan bobot font, serta meringkas `Ikhtisar` dari `3.086px` menjadi **`<= 2.000px`** (`<= 2` layar penuh).
- **Komponen yang Harus Dikerjakan:**
  1. **Backend Klasifikasi Kelas I–V & `executiveGrid` (`services/DashboardService.js`):**
     - Tambahkan `kelasKapal` (`KELAS_I`..`KELAS_V`), `kelasRomawi` (`I`..`V`), `kelasLabel`, dan `panjangMeter` pada `FLEET_34_TACTICAL_SEED` (`6` Kelas I Orca `60m`, `10` Kelas II Paus/Barakuda/Tutul/Hiu Macan `36–42m`, `17` Kelas III Hiu `28–32m`, `1` Kelas IV Akar Bahar `22m`) serta merge dari `Master_Kapal`.
     - Terapkan offset sebar halus pada kapal yang berlabuh di pangkalan sama (Batam & Jakarta) agar ikon kapal tidak menumpuk.
     - Bangun array terstruktur `executiveGrid` pada `dashboard_getOverview` untuk menyajikan 1 tabel eksekutif konsolidasi lintas satelit.
     - Pastikan kalimat temuan `#page-finding` memakai desimal koma Indonesia (`64,8%`) tanpa tanda titik penutup.
  2. **Peta Taktis Ikon Siluet Kapal (`html/Script_Main.html`, `html/Style.html`):**
     - Implementasikan `_shipClassSvg(kelasKapal, fillHex, sizeMode)` menghasilkan 5 ukuran & bentuk siluet kapal berbeda untuk **Kelas I (`34×18px`)**, **Kelas II (`28×15px`)**, **Kelas III (`23×13px`)**, **Kelas IV (`19×11px`)**, dan **Kelas V (`16×10px`)**, berkode warna status (`#0B4F6C` Operasional, `#15803D` Pangkalan, `#B45309` Galangan) + halo stroke `#FFFFFF` `2px`.
     - Hapus pil label nama kapal permanen (`markerOverlaps === 0`); tampilkan nama kapal + kelas + WPP saat **hover tooltip** dan detail + tombol profil saat **klik popup**.
     - Sediakan filter Status Armada dan **filter/legenda Kelas I–V** inline bergambar mini siluet SVG masing-masing kelas.
     - Susun peta dalam **split asimetris `68%` (Peta Leaflet) + `32%` (Panel WPP & Disposisi Armada)**, paksa `.leaflet-container` mewarisi `Public Sans`, dan tangani pesan offline GeoJSON agar `clippedCount === 0`.
  3. **Strip 4 KPI Tenang, Analitik `65/35`, & Tabel Eksekutif (`html/Script_Charts.html`, `html/Script_Main.html`, `html/Style.html`):**
     - Peramping banner persetujuan (`44px`), hapus pil latar pastel & bar progres hias dari Strip 4 KPI (`border-top: 2px solid #0E1722`).
     - Susun Analitik `65%` (kurva garis ganda SIKAP jernih tanpa tumpang tindih area keruh & format sumbu Y konsisten) + `35%` (Postur AKN Nakhoda horizontal bar breakdown).
     - Ganti **6 kartu divisi 50/50 duplikatif** dengan **1 Tabel Monitoring Eksekutif Lintas Satelit** full-width (menampilkan `SIKAP`, `Nakhoda`, `Pusat`, `Sistik`, `Siaga`, `Operasi & Pantau` dalam 1 struktur rapat).
     - Kunci ukuran huruf min `12px` (`tinyTextCount === 0`) dan dominasi bobot `400/500`.
- **Kriteria Verifikasi:**
  - [ ] Pada Playwright `1440×900`, `markerOverlaps === 0`, `distinctBg <= 16`, `tinyTextCount === 0`, `clippedCount === 0`, dan tinggi total halaman `<= 2.100px`.
  - [ ] Seluruh ikon siluet Kelas I–V ter-render kontras dan dapat difilter per status maupun per kelas pada `read_file` screenshot.

---

### Fase R3: Redesain `Kapal Terbaik` & `Profil Kapal`
- **Status:** **Siap Dikerjakan (`[ ]`)**
- **Tujuan Utama:** Menuntaskan kontradiksi data Triwulan & kapal Galangan sebagai Juara 1, menyeragamkan angka desimal & kelas kapal, dan mengangkat identitas kapal di `Profil Kapal`.
- **Komponen yang Harus Dikerjakan:**
  1. **Scoring Backend (`services/DashboardService.js`):**
     - Kecualikan kapal berstatus `GALANGAN` dari kelayakan Podium Top 3 (`top3`), sertakan `kelasKapal`, `kelasRomawi`, `kelasLabel`, `panjangMeter`.
  2. **Tampilan `Kapal Terbaik` (`html/views/KapalTerbaik.html`, `html/Script_Main.html`, `html/Style.html`):**
     - Sinkronkan `#kt-filter-tw` & `#kt-filter-year` dengan nilai triwulan respons `dashboard_getScoringKapalTerbaik` agar cocok 100% dengan `#page-finding`.
     - Seragamkan angka skor menjadi 1 desimal koma Indonesia (`79,8`, `66,0`, `43,2`).
     - Sederhanakan podium: aksen `#C88A2E` *Maritime Brass* khusus **Juara 1**, tampilkan ikon siluet SVG Kelas I–V pada kartu podium dan baris tabel 34 kapal.
  3. **Tampilan `Profil Kapal` (`html/Script_Main.html`, `html/Style.html`):**
     - Jadikan nama kapal (`KP. ORCA 01`) sebagai `h1.page-title` (`26px`) disertai ikon siluet kelas & lencana kelas, plus breadcrumb kembali di atasnya.
     - Ganti 3 kartu putih identik dengan 1 strip spesifikasi broadsheet horizontal (`Status`, `WPP & Pangkalan`, `Hari Layar`, `Awak Nakhoda`, `Aset BMN SIKAP`).
     - Konversi seluruh enum teknis ke label bahasa Indonesia bersih (`Rusak Ringan`, `Operasional di Laut`, `P3K Paruh Waktu`).
- **Kriteria Verifikasi:**
  - [ ] Tidak ada kapal `GALANGAN` di podium Top 3; filter Triwulan sinkron dengan kalimat temuan; format angka koma Indonesia konsisten.
  - [ ] Screenshot `kapal-terbaik` dan `profil-kapal` desktop & mobile lolos inspeksi visual via `read_file`.

---

### Fase R4: Standarisasi 5 Halaman Sekunder + Calendar Picker Anti-Ketik + Full Playwright Suite
- **Status:** **Siap Dikerjakan (`[ ]`)**
- **Tujuan Utama:** Membereskan runtime error `(rows || []).map is not a function`, menyamakan komponen UI seluruh halaman sekunder, membuang jargon developer, menerapkan Calendar Picker Anti-Ketik Manual, dan memperluas `tests/visual_audit.js` ke seluruh 12 skenario layar.
- **Komponen yang Harus Dikerjakan:**
  1. **Perbaikan Error & Penyelarasan Komponen (`html/Script_Main.html`, `html/Style.html`):**
     - Amankan seluruh `.map()` di `_histRender`, `_riwLoad`, `_ntfReload`, `_mdLoad` terhadap nilai non-array dan pastikan `Notifikasi`, `Master Data`, serta `Riwayat` merender daftar dengan benar.
     - Standarkan 1 pola Strip Ringkasan Broadsheet, 1 pola tabel (`white-space: nowrap` pada `Periode` & `Tanggal`, format tunggal `14 Jun 2026`), 1 pola aksi baris (`Lihat`/`Revisi` subtle, `Anulir`/`Tolak` text-danger), dan 1 pola empty state informatif; pindahkan inline style ke `Style.html`.
  2. **Pembenahan 5 Halaman Sekunder:**
     - `html/views/Kegiatan.html`: Ganti `Feed Kegiatan Pendukung` → `Daftar Kegiatan Direktorat`; pasang pencarian instan judul/pihak hadir + tab status (`Semua`, `Aktif`, `Ditimpa`, `Dianulir`); resolve ID peng-anulir (`USR-DIR-01`) ke nama pejabat; terapkan proteksi **Calendar Picker Anti-Ketik Manual** (`onkeydown="return false"`, `onpaste="return false"`, auto-`showPicker()`) pada `#kgd-tanggal`, `#rv-kgd-tanggal`, dan filter rentang header.
     - `html/views/Notifikasi.html`: Hapus 2 kartu selebar setengah layar kosong; ganti dengan ringkasan ringkas header + tombol aksi `32px` + daftar berindikator belum dibaca.
     - `html/views/Admin.html`: Selaraskan tab garis bawah, tinggi kontrol tombol aksi, dan tampilan antrean/pengguna/audit/pengingat.
     - `html/views/MasterData.html`: Hapus `(PRD §6)`, ganti 3 pil inline menjadi strip ringkasan standar, dan tampilkan kolom Kelas Kapal (`I–V`) + ikon siluet.
     - `html/views/Riwayat.html`: Ganti `Seluruh Entri (& incl. SUPERSEDED & VOID)` → `Riwayat Transaksi Terfederasi`; ringkas 5 kotak menjadi 1 strip 4 metrik; ubah label status `Ditimpa` dari `"Berlaku saat ini"` → `Digantikan revisi`.
  3. **Upgrade Harness Playwright (`tests/visual_audit.js`):**
     - Lengkapi mock RPC seluruh halaman sekunder dan tangkap **12 skenario** (`login-desktop`, `login-mobile`, `overview-1440`, `overview-1024`, `overview-mobile`, `kapal-terbaik-desktop`, `profil-kapal-desktop`, `kegiatan-desktop`, `notifikasi-desktop`, `admin-desktop`, `master-data-desktop`, `riwayat-desktop`) ke `tests/screenshots/`.
     - Terapkan gate otomatis: `pageErrors === 0`, `overflowX === 0`, `markerOverlaps === 0`, `brokenControlRows === 0`, `tinyTextCount === 0`, `clippedCount === 0`, `distinctBg <= 16` (`Ikhtisar`), `docHeight <= 2100` (`Ikhtisar 1440px`), `impeccable detect --json === []`.
- **Kriteria Verifikasi:**
  - [ ] `node tests/visual_audit.js` keluar kode `0` dengan 0 kegagalan assertion pada 12 skenario dan `[PAGE ERRORS]: 0`.
  - [ ] Seluruh 12+ screenshot di `tests/screenshots/` dibuka & diverifikasi langsung lewat `read_file`.

---

### Fase 5: Verifikasi E2E Modul Kegiatan Direktorat & Multi-Evidence Google Drive
- **Status:** **Siap Dikerjakan (`[ ]`)** *(UX, pencarian, status filter, dan calendar picker anti-ketik telah digabungkan ke **Fase R4**)*
- **Tujuan Utama:** Memastikan siklus penuh `Submit -> Revisi (SUPERSEDED + carry evidence) -> Anulir (VOID + VoidReason)` dan integrasi upload multi-file Google Drive folder `POA_Evidence_Pusat` (`EvidenceService.js` + `KegiatanDirektoratService.js`) teruji tuntas secara server-side maupun end-to-end.
- **Kriteria Verifikasi:**
  - [ ] Input tanggal tidak dapat diketik manual dan selalu membuka kalender.
  - [ ] Siklus `Submit -> Revisi -> Anulir` beserta carry-over lampiran Drive berjalan dengan RBAC `SUPERADMIN`, `DIREKTUR`, dan `KADIV` di Node VM.

---

### Fase 6: Pipeline Data Mart Looker Studio (`LookerMartService.js`), Sheet Formal, & Scheduled Trigger
- **Status:** **Siap Dikerjakan (`[ ]`)**
- **Tujuan Utama:** Mengimplementasikan pipeline ETL terjadwal menuju spreadsheet `RadarPOA_Looker_Mart` (`Mart_Ikhtisar_Nasional`) sesuai `PRD.md` §3.4, `ARCHITECTURE.md` §2–§3, dan `DATA_SCHEMA.md` §2, serta menerapkan pemformatan Google Sheet formal (`applyFormalSheetFormatting`).
- **Komponen yang Harus Dikerjakan:**
  1. **Pembuatan `services/LookerMartService.js`:**
     - Fungsi `looker_syncMart(token)` dan `looker_scheduledSyncMart()`.
     - Membuka atau membuat otomatis spreadsheet `RadarPOA_Looker_Mart` (`LOOKER_MART_SS_ID`) + sheet `Mart_Ikhtisar_Nasional`.
     - Menulis baris flat bersih (bebas baris `SUPERSEDED` dan `VOID`): `Periode`, `BulanTahun`, `TotalPagu_Reguler`, `TotalPagu_ABT`, `TotalRealisasi_SP2D_Reguler`, `TotalRealisasi_SP2D_ABT`, `PctSerapan_Nasional`, `Armada_Siap_Pct`, `TotalKegiatanDirektorat`, `Aset_RusakBerat_Unit`.
     - Fungsi `looker_setTriggerAktif(token, aktif)`.
  2. **Standarisasi Format Fisik Google Sheet (`applyFormalSheetFormatting` di `data/SheetAccess.js`):**
     - Memformat `TX_KegiatanDirektorat`, `Mart_Ikhtisar_Nasional`, `Audit_Log`, `Users`, dan `Kapal` (`#0E1722` header teks putih `34px`, `setFrozenRows(1)`, baris data `26px` *zebra banding* `#FFFFFF`/`#F4F7F9`, format `@` untuk `NIP`, `yyyy-mm-dd`, dan `#,##0`).
- **Kriteria Verifikasi:**
  - [ ] `looker_syncMart()` menghasilkan baris `Mart_Ikhtisar_Nasional` yang akurat sesuai `agg_collectAll()` dan cocok 100% dengan `DATA_SCHEMA.md` §2.

---

### Fase 7: Admin Panel Konektor Satelit, Linter Otomatis (`lint_ui.js`), & Final QA Audit
- **Status:** **Siap Dikerjakan (`[ ]`)**
- **Tujuan Utama:** Menyediakan antarmuka konfigurasi ID Spreadsheet Satelit bagi Superadmin di Admin Panel, membangun engine audit mutu `lint_ui.js`, serta menyiapkan unit test suite otomatis `tests/`.
- **Komponen yang Harus Dikerjakan:**
  1. **Tab Konfigurasi Satelit & Data Mart di Admin Panel (`services/AdminService.js` & `html/views/Admin.html`):**
     - Memungkinkan `SUPERADMIN` melihat status koneksi dan mengatur Script Properties ID Spreadsheet satelit (`SIKAP_SS_ID`, `NAKHODA_SS_ID`, `SISTIK_SS_ID`, `SIAGA_SS_ID`, `OPERASI_SS_ID`, `LOOKER_MART_SS_ID`) serta memicu `looker_syncMart`.
  2. **Engine Linter Otomatis `lint_ui.js` (10 Pemeriksaan Ketat):**
     - `1. Zero-Emoji Policy` di seluruh file `.html`, `.js`.
     - `2. 3-Tier Control Geometry` (`--ctl-h-lg: 40px`, `--ctl-h-md: 32px`, `--ctl-h-sm: 26px`) & larangan inline `style="height:..."`.
     - `3. Anti-Monolith Gate`: 0 file/form input operasional teknis harian satelit di Radar POA.
     - `4. Server-Side Aggregation Gate`: memastikan `AggregatorService.js`, `DashboardService.js`, `KegiatanDirektoratService.js`, dan `LookerMartService.js` lengkap.
     - `5. Negative Prompts Gate`: memastikan 0 gauge, 0 3D chart, 0 `#2B3674`, 0 `transition: all`, 0 `text-transform: uppercase`, 0 jargon DB bocor ke UI.
     - `6. Official PSDKP Crest & Dock Shell Gate`: memastikan logo resmi Ditjen PSDKP, filter `#psdkp-crest-outline`, Top Bar `#app-topbar`, Floating Bottom Dock `#app-dock`, serta generator siluet kapal `_shipClassSvg` terpasang.
     - `7. Tabular Numerics & Optical Typography Gate`: memastikan `tabular-nums` dan font tunggal **`Public Sans`** (`>= 12px`) terdefinisi di `html/Style.html` (termasuk override `.leaflet-container`), tanpa font monospace/teknikal.
     - `8. Accessibility & Reduced Motion Gate`: memastikan `@media (prefers-reduced-motion: reduce)` dan `@media (hover: hover)` terpasang.
     - `9. Calendar Picker Anti-Ketik Manual Gate`: memastikan `<input type="date">` terproteksi `onkeydown="return false"`.
     - `10. HTML Include & JS Syntax Integrity`: memastikan seluruh target `html_include` ada dan seluruh `<script>` bebas syntax error.
  3. **Automated Test Suite (`tests/radar_poa.test.js`):**
     - Pengujian `node --test` untuk `AuthService.js`, `AggregatorService.js`, `DashboardService.js`, `KegiatanDirektoratService.js`, `LookerMartService.js`, dan `RiwayatService.js`.
- **Kriteria Verifikasi:**
  - [ ] `node lint_ui.js` lulus **10 / 10 PASS (0 errors)**.
  - [ ] `node --test tests/*.test.js` lulus **100% PASS**.
  - [ ] `node -c Code.js services/*.js utils/*.js data/*.js lint_ui.js` lulus **0 syntax errors**.

---

## 3. Matriks Pengujian & Verifikasi Kualitas (QA Test Suite)

| Kategori Pengujian | Parameter Verifikasi | Perintah / Prosedur Uji | Target Kelulusan |
|---|---|---|---|
| **Playwright 12-Screen & DOM Gates** | Zero page errors, `overflowX === 0`, `markerOverlaps === 0`, `brokenControlRows === 0`, `tinyTextCount === 0`, `distinctBg <= 16` | `node tests/visual_audit.js` + inspeksi PNG `read_file` | **12 / 12 Layar PASS** |
| **Detektor Anti-Slop** | Zero violet/glow/slop, kontras tipografi, hierarki bersih | `.agents/skills/impeccable/scripts/impeccable detect --json` | **`[]` (0 temuan)** |
| **Audit Linter UI & Arsitektur** | Zero-Emoji, 3-Tier Scale, Dock & Top Bar, Logo PSDKP, `Public Sans` | `node lint_ui.js` *(Fase 7)* | **10 / 10 PASS (100%)** |
| **Pemeriksaan Sintaksis JS** | Validasi kompilasi seluruh `.js` backend, utils, data, & script HTML | `node -c Code.js services/*.js utils/*.js data/*.js tests/visual_audit.js` | **0 Syntax Errors** |
| **Unit & Integration Test** | Auth Auto-Seed, Multi-Identifier Login, Federasi SIKAP/Nakhoda, Sync, Kegiatan, Looker Mart | `node --test tests/*.test.js` *(Fase 7)* | **100% Tests Pass** |
| **Audit Kohesi Kontrol Runtime** | Pemeriksaan kesamaan tinggi kontrol sebaris (`40px`, `32px`, `26px`) di DOM | `window._uiAudit()` | **0 Violations** |
