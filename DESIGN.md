# DESIGN.md — Kontrak Sistem Desain v2.0: Radar POA
**Rekapitulasi Data Strategis POA — Pusat Agregasi & Dasbor Strategis Pimpinan**  
*Direktorat Pengendalian Operasi Armada (Dit. POA) · Ditjen PSDKP · KKP RI*

> Dokumen ini merupakan kontrak desain tunggal (**Single Source of Truth v2.0**) untuk **Radar POA**, diperbarui menyeluruh pasca-audit **Playwright Chromium** & kritik UI lintas disiplin `.agents/skills/`:
> `unslop` · `frontend-design` · `design-taste-frontend` · `apple-design` · `apple-hig` · `emilkowalski-motion` · `impeccable` · `d3-visualization` · `color-expert` · `mobile-native`.

---

## 1. Diferensiasi Total Lintas Aplikasi Dit. POA

Agar **Radar POA** langsung dikenali sebagai portal agregasi tingkat Direktorat dan **tidak pernah tertukar** dengan aplikasi satelit maupun template SaaS generik, arsitektur visualnya dipisahkan secara tegas:

| Dimensi Visual | **SIKAP** *(Subbag TU)* | **Nakhoda** *(Timja Pengawakan)* | **Radar POA v2.0** *(Pusat Agregasi Dit. POA)* |
|---|---|---|---|
| **Dunia Visual** | Portal Bendahara Frosted Mineral | Buku Besar Akromatik (*Achromatic Ledger*) | **Full-Width Hydrographic Briefing & Two-Tier Deep Admiralty Header** |
| **Navigasi Utama** | Top-Bar putih bersekat + glassmorphic subnav | Sidebar kiri terang `#F2F4F7` | **Two-Tier Header (`56px` Deep Admiralty Brand Bar berwatermark grid radar + `44px` Frosted Nav Tab Bar bergaris bawah `#0B4F6C`)** di desktop; **Flush Mobile Bottom Tab Bar (`<= 768px`)** |
| **Kanvas & Ruang Kerja** | Porcelain `#F8FAFC` + blur header | Cool slate `#F2F4F7` | **Kanvas Hidrografis Penuh (`#F4F7F9` + tekstur Micro Dot Matrix `--pattern-dot-matrix` `20px`, `max-width: 1440px`)** berbingkai kedalaman optik konsentris (`12px/10px/8px/6px`) |
| **Layar Autentikasi** | Kartu 2-ruang bergradasi hijau | Kartu form terpusat abu-abu dingin | **50/50 Photographic Split Screen** (#FAFCFD panel kanan berjangkar footer KKP/PSDKP + foto personel fokus tengah tanpa wajah terpotong) |
| **Warna Aksi Primer** | Forest Jade `#064E3B` | Hitam Arang `#0F1720` | **Deep Admiralty Blue `#0B4F6C`** (`hover: #083B52`), hemat & fokus |
| **Keluarga Huruf** | `Plus Jakarta Sans` | `Geist` + `Geist Mono` | **`Public Sans` tunggal** (`400 / 500 / 600`), **`<= 6` skala ukuran (`>= 12px`)**, wajib `tabular-nums`, format koma Indonesia |
| **Kepadatan Halaman** | Multi-kartu tabular | Tabel penuh layar | **Executive Briefing terkompresi (`<= 2.000px` pada `Ikhtisar 1440px`)**: Peta `68/32` berikon siluet kapal Kelas I–V, Analitik `65/35`, & 1 Tabel Lintas Satelit |

---

## 2. Kontrak Arah Produk (*5-Line Direction Contract*)

1. **Product (Produk):** Portal rekapitulasi data strategis dan monitoring disposisi armada nasional bagi Direktur POA, Pejabat Eselon, dan Kepala Divisi untuk mengawasi konsolidasi dari **SIKAP**, **Nakhoda**, **Sistik**, **Siaga**, dan **Operasi**, serta mencatat **Kegiatan Direktorat**.
2. **Character (Karakter):** *Berwibawa, tenang, ringkas, presisi — berformat briefing eksekutif negara, bukan tumpukan kartu SaaS.*
3. **World (Dunia & Material):** **Peta Hidrografis Resmi & Briefing Maritim Negara** — kanvas biru-abu sejuk yang netral dan tenang (`#F4F7F9`), Tier 1 header maritim *Deep Admiralty* (`56px`) bermotif grid radar nautikal dengan kontrol kaca translusen, Tier 2 bilah tab *frosted glass* (`44px`), pelat kartu berbayangan optik berlapis (`12px` konsentris) dan bevel cahaya atas, serta aksen primer biru maritim (`#0B4F6C`).
4. **Moments (Hanya 2 Momen Visual Utama, Sisanya Tenang):**
   - **Momen 1 — Peta Taktis 34 Kapal Berikon Siluet Kelas I–V (`68% / 32%`):** Peta Indonesia berskala jelas dengan **5 bentuk/skala ikon kapal berbeda** berdasarkan Kelas I–V PSDKP, warna status taktis, 0 pil label bertumpuk (`markerOverlaps === 0`), berdampingan dengan panel ringkasan WPP & disposisi armada di kanan.
   - **Momen 2 — Analitik Asimetris (`65% / 35%`) & Tabel Monitoring Eksekutif Lintas Satelit:** Satu grafik kurva garis ganda SIKAP dominan (gradien area vertikal halus + titik berbingkai putih) didampingi daftar postur AKN Nakhoda di sisi kanan, diikuti tepat **1 Tabel Terpadu Lintas Satelit** di bawah (menggantikan 6 kartu divisi duplikatif).
5. **Signature (Detail Khas Konsisten):**
   - **Two-Tier Deep Admiralty + Frosted Header** (desktop `56px` Deep Admiralty + `44px` frosted nav bar berindikator pegas `#0B4F6C`) & **Flush Mobile Bottom Tab Bar** (`<= 768px`) menempel rapi di dasar layar.
   - **Lambang Resmi Ditjen PSDKP (`#psdkp-crest-outline`)** pada panel masuk (`58×66px`), Top Bar (`30×34px`), dan Loading Splash (`48×54px`), tanpa lencana `[Dit. POA]` di sebelah merek.
   - **Garis Tajuk Publikasi (`2.5px solid #0B4F6C`)** khusus untuk **1 strip ringkasan utama** per halaman, dipadukan angka `tabular-nums` rata kanan dengan koma desimal Indonesia.

---

## 3. Sistem Warna & Anggaran Warna Ketat (`distinctBg <= 16`)

> [!IMPORTANT]
> Audit visual membuktikan terlalu banyak pil warna pastel (`32` warna latar di `Ikhtisar`) merusak ketenangan dan fokus pimpinan. Dalam desain v2.0, **jumlah warna latar berbeda pada satu layar `Ikhtisar` wajib ditekan menjadi `<= 16`**.

### 3.1 Tinta Korporat & Permukaan Navigasi Terang (`#app-topbar` & `#app-dock`)
- `--maritime-ink`: `#0E1722` (tinta gelap korporat untuk bingkai autentikasi, wordmark, dan tooltip peta)
- `--maritime-ink-text`: `#F5F2EB`
- `--dock-bg`: `rgba(255, 255, 255, 0.96)` (Flush Mobile Bottom Tab Bar `<= 768px` bergaris batas atas `--border-card`)
- `--dock-hover`: `#F4F7F9`
- `--dock-active`: `#E1EFF5` (latar lembut tab aktif mobile, ikon & teks `#0B4F6C`)
- `--dock-active-ink`: `#0B4F6C`
- `--dock-ink`: `#14191F`
- `--dock-ink-muted`: `#535D68`
- `--dock-accent`: `#0B4F6C`
- `--dock-border`: `#D1DCE5`
- `--dock-highlight`: `inset 0 1px 0 rgba(255, 255, 255, 0.94)`
- `--dock-shadow`: `0 -2px 10px rgba(14, 23, 34, 0.05)`

### 3.2 Kanvas Hidrografis & Permukaan Kerja
- `--bg-ground`: `#F4F7F9` (kanvas kerja utama aplikasi — sejuk dengan pendar atmosferik & pola *Micro Dot Matrix* `--pattern-dot-matrix` `20px`)
- `--bg-header`: `#FFFFFF` & `--bg-header-frost`: `rgba(255, 255, 255, 0.88)` (Tier 1 Deep Admiralty `#0B4F6C` + Tier 2 Frosted Nav Tab Bar `44px` + legenda peta kaca)
- `--bg-surface`: `#FFFFFF` (pelat KPI, tabel, kontainer peta/grafik, modal, drawer dengan bayangan ambient berlapis & inner top specular bevel)
- `--bg-raised`: `#E6EDF2` (trek segmen pasif, baris selang-seling, header kontrol netral)
- `--bg-active`: `#D9E4EC`
- `--bg-auth-panel`: `#FAFCFD` (latar panel form autentikasi kanan — bertekstur *Micro Dot Matrix* `20px` dengan radial vignette tengah agar form tetap bersih)
- `--border-card`: `rgba(14, 23, 34, 0.09)` (border optik translusen + bayangan ambient halus, menggantikan tampilan flat kaku)
- `--border-rule`: `rgba(14, 23, 34, 0.065)` (pemisah baris tabel & antarsel KPI)
- `--border-ctl`: `rgba(14, 23, 34, 0.14)` (tepi jelas input, select, dan tombol sekunder + inner highlight)
- `--ink-primary`: `#14191F` (kontras AAA pada `#FFFFFF`)
- `--ink-secondary`: `#3E4752`
- `--ink-muted`: `#535D68`
- `--ink-faint`: `#5D656F` (`>= 4,5:1` di atas `#FFFFFF` & `#F4F7F9`)

### 3.3 Warna Aksi, Kode Satelit, & Semantik (Penggunaan Hemat)
- **Aksi Primer:** `--action-primary: #0B4F6C` (*Deep Admiralty Blue*, teks `#FFFFFF`, hover `#083B52`), `--accent-radar-soft: #E1EFF5`, `--accent-radar-ink: #07384D`.
- **Kuningan Institusional:** `--accent-brass: #B4761F` (khusus indikator aktif dock & tanda eksklusif **Juara 1** podium; tidak dipakai bertabrakan sebagai border atas banner notifikasi).
- **Kode Sumber Satelit (Titik `6px` + teks netral, bukan pil latar penuh warna di KPI):**
  - `SIKAP`: `--sat-sikap: #0F766E`
  - `NAKHODA`: `--sat-nakhoda: #C2410C`
  - `PUSAT`: `--sat-pusat: #0B4F6C`
- **Semantik Status:** Positif `--sem-pos: #15803D` (`#DCFCE7` / `#052E16`), Peringatan `--sem-warn: #B45309` (`#FEF3C7` / `#78350F`), Kritis `--sem-crit: #B91C1C` (`#FEE2E2` / `#7F1D1D`), Netral `--sem-neut: #475569` (`#E6EDF2` / `#1E293B`).

---

## 4. Disiplin Tipografi (`Public Sans` Tunggal, 6 Skala, `>= 12px`)

1. **Huruf Tunggal Di Mana Saja (Termasuk Peta Leaflet):**
   - `'Public Sans', system-ui, -apple-system, BlinkMacSystemFont, sans-serif`.
   - Wajib memaksa `.leaflet-container`, `.leaflet-tooltip`, `.leaflet-popup-content-wrapper`, dan `.leaflet-control-attribution` mewarisi `'Public Sans'` (**`0` kebocoran font `Helvetica Neue` atau `Lucida Console`**).
2. **Enam Langkah Skala Ketat (`0` teks `< 12px`):**
   - `28px–30px` (`h1.auth-brand-name`, `.kpi-val`): `weight: 600`, `line-height: 1.1`, `letter-spacing: -0.02em`
   - `24px–26px` (`h1 / .page-title`): `weight: 600`, `line-height: 1.2`, `letter-spacing: -0.015em`
   - `16px` (`h2 / .brand-name / judul seksi utama`): `weight: 600`, `line-height: 1.3`
   - `14px` (`body`, `.auth-brand-exp`, label utama, input dialog): `weight: 400 / 500`
   - `13px` (tabel `.n-table td`, kontrol `MD`, deskripsi kartu, tombol dock desktop): `weight: 400 / 500`
   - `12px` (meta, tag sumber KPI, sumbu grafik, header tabel, kontrol `SM`, keterangan tooltip): `weight: 400 / 500` — **batas bawah absolut (`tinyTextCount === 0`)**! Label tengah donut SVG wajib `>= 12px` (tidak boleh `10px`).
3. **Pengendalian Bobot Huruf (Anti "Everything Is Bold"):**
   - Isi, deskripsi, navigasi non-aktif, dan sel tabel menggunakan **`400`**.
   - Subjudul kelompok, header kolom tabel, label kontrol, dan item dock aktif menggunakan **`500`**.
   - **`600` hanya untuk `h1`, judul seksi, dan angka utama KPI**. **Dilarang bobot `700`/`800`/`900` di dalam ruang kerja** (pengecualian opsional hanya untuk wordmark logo `RADAR POA` pada layar masuk jika masih dalam rentang `600`).
4. **Format Angka, Tanggal, & Copy Baku Bahasa Indonesia:**
   - **Tabular Numerals:** `font-variant-numeric: tabular-nums lining-nums; font-feature-settings: "tnum" 1, "lnum" 1;` aktif di semua angka KPI, kolom tabel angka rata kanan, sumbu grafik, dan koordinat.
   - **Desimal & Mata Uang Seragam:** Selalu gunakan pemisah desimal **koma Indonesia** dengan presisi konsisten dalam satu kelompok (contoh: `64,8%`, `79,8`, `66,0`, `43,2`; `Rp 83,2 M`, `Rp 45.200.000.000`). Dilarang mencampur `79.8`, `66`, dan `64,8%`.
   - **Tanggal Tunggal Konsisten:** Gunakan format `14 Jun 2026` (`DD MMM YYYY` Indonesia) di semua tabel dan ringkasan, hindari mencampur `14 Jun 2026` dengan `14/6/2026`. Kolom `Periode` dan `Tanggal` di tabel wajib `white-space: nowrap` agar tidak patah dua baris (`2026-\nW24`).
   - **Anti Titik Ekor & Anti Jargon Developer:** Hapus titik di akhir label pendek, toast (`Data satelit berhasil disinkronkan`), dan kalimat temuan `#page-finding`. Dilarang keras menampilkan istilah database atau ID teknis mentah ke pengguna (`PRD §6`, `SUPERSEDED & VOID`, `USR-DIR-01`, `RUSAK_RINGAN`, `715 (OPERASIONAL)`).

---

## 5. Arsitektur Shell Baru (Two-Tier Top Header + Flush Mobile Bar + Kontrol 3-Tier)

### 5.1 Baris Atas Institusional (`#app-topbar`, Tier 1 `56px` Deep Admiralty)
- **Kontainer:** Tier 1 bertinggi `56px` berlatar gradien maritim *Deep Admiralty* (`#092234 → #0B3B54 → #0B4F6C`) dengan watermark grid radar nautikal tipis (`::before`), terintegrasi di dalam `<header id="app-topbar" class="app-topbar">` (`position: sticky; top: 0; z-index: 120;`).
- **Kiri:** Crest resmi Ditjen PSDKP (`30×34px`, filter `#psdkp-crest-outline`) + lockup **`RADAR POA`** dan subjudul **`Rekapitulasi Data Strategis · Dit. POA`**. **Dilarang memasang pil lencana `[Dit. POA]`**.
- **Kanan (`.ctl-row.ctl-md`, kontrol kaca translusen tepat `32px`):**
  1. **`#sync-indicator` (`32px`):** Menampilkan dot live status berdenyut halus (`.sync-live-dot`) + label ringkas di atas kaca translusen (`rgba(255,255,255,0.13)`). **Klik `#sync-indicator` HANYA membuka/menutup `#sync-popover`** (menampilkan cap waktu terakhir dan daftar status 6 satelit: `Pusat`, `SIKAP`, `Nakhoda`, `Sistik`, `Siaga`, `Operasi`). Di bagian bawah `#sync-popover` ditempatkan tombol eksplisit **`Sinkronkan Data Satelit`** (`_triggerManualSync()`).
  2. **Pintasan Notifikasi (`#topbar-notif-btn`, `32px`):** Satu-satunya pintu masuk `Notifikasi` pada bilah utama (dengan badge angka unread bila `> 0` dan status aktif kontras tinggi saat halaman Notifikasi terbuka).
  3. **Akun Pengguna (`#topbar-user-btn`, `32px`):** Avatar inisial 2-huruf putih kontras tinggi + nama singkat + chevron berotasi pegas yang membuka popover kaca menu akun (Identitas & Role, Admin Panel bila `SUPERADMIN`/`DIREKTUR`, dan tombol `Keluar`).

### 5.2 Navigasi Utama: Tier 2 Frosted Tab Bar (Desktop) & Flush Bottom Tab Bar (Mobile)
- **Desktop (`> 768px`, `#app-nav-bar` bertinggi `44px` *frosted glass* di bawah Tier 1):**
  - Berlatar kaca translusen (`--bg-header-frost`, `backdrop-filter: blur(20px) saturate(180%)`) dengan bayangan lembut dan garis bawah sejajar lurus pada grid `28px`:
    - **Utama:** `Ikhtisar` (`overview`), `Kegiatan` (`kegiatan` — hanya `SUPERADMIN`/`DIREKTUR`/`KADIV`), `Kapal Terbaik` (`kapal-terbaik`), `Riwayat` (`riwayat`).
    - **Sistem (dipisah garis vertikal `#D1DCE5`):** `Master Data` (`master-data` — hanya `SUPERADMIN`/`DIREKTUR`), `Admin` (`kelola-akun` — hanya `SUPERADMIN`/`DIREKTUR`). *`Notifikasi` tidak diduplikasi sebagai tab.*
  - Tab aktif memakai teks `#0B4F6C` (`font-weight: 600`) dengan indikator garis bawah meluncur `2px solid #0B4F6C` (`.topnav-indicator`).
  - `#app-dock` disembunyikan di desktop (`display: none`) agar 0% menutupi peta maupun tabel.
- **Mobile (`<= 768px`, `#app-dock` Flush Bottom Tab Bar):**
  - `#app-nav-bar` disembunyikan; `#app-dock` menempel penuh di tepi dasar layar (`left: 0; right: 0; bottom: 0; border-top: 1px solid #D1DCE5; border-radius: 0; background-color: rgba(255, 255, 255, 0.96); backdrop-filter: blur(16px)`) dengan 4 slot utama (`Ikhtisar`, `Kegiatan`, `Kapal`, `Riwayat`) + tombol `Lainnya`.
  - Tombol `Lainnya` membuka **Mobile Overflow Sheet** (`#dock-more-sheet`) menempel bawah penuh (`left: 0; right: 0; bottom: 0; border-radius: 18px 18px 0 0`) untuk mengakses `Master Data`, `Admin Panel`, dan `Keluar`.
- **Padding Bawah Kanvas:** `.app-main` (`max-width: 1440px; margin: 0 auto; padding: 20px 28px 40px;` desktop; `16px 16px 84px;` mobile) menjamin margin seimbang dan bebas tabrakan navigasi.

### 5.3 Pemisahan Header Layar & Kontrol Toolbar (`brokenControlRows === 0`)
- **`#page-header` Diperamping (`0` selisih tinggi):** Baris judul hanya memuat `h1.page-title` di kiri dan kelompok kontrol `.page-controls.ctl-row.ctl-md` di kanan — seluruh elemen di dalamnya (`Bulanan | Rentang` wrapper `32px`, `select.filter-sel` `32px`, `input[type="date"]` `32px`, dan tombol aksi halaman `32px`) **wajib tepat `32px`** agar tidak ada lagi mismatch `26px` vs `32px`.
- **`#page-finding` dipisah ke bawah judul:** Kalimat temuan satu baris diletakkan di bawah baris header utama dengan max-width nyaman (`~78ch`) sehingga pada `1024px` header tidak melar dan mendorong toolbar jatuh berantakan.

---

## 6. Spesifikasi Layar Autentikasi (*50/50 Photographic Split Screen*)

- **Sisi Kiri (`.auth-media`, `50%` desktop / `240px` mobile):**
  - Menggunakan foto personel Ditjen PSDKP dari [AuthPhoto.html](file:///home/pinefeast/Projects/Radar-POA/html/AuthPhoto.html) dengan `object-fit: cover; object-position: 62% 20%;` (desktop) dan `object-position: 50% 18%;` (mobile) supaya barisan personel utama beserta baret & emblem tampak utuh **tanpa wajah atau dahi yang terpotong tepi layar**.
  - Tanpa teks pengisi di atas foto; hanya vignette halus tipis di tepi bawah/kanan agar menyatu tenang.
- **Sisi Kanan (`.auth-panel`, `50%`, `#FAFCFD`):**
  - Tata `display: flex; flex-direction: column; justify-content: space-between; min-height: 100dvh; padding: 32px 48px;` dengan 1 zona spacer atas, zona formulir tengah (`max-width: 396px`, terpusat horizontal), dan 1 baris jangkar kaki di dasar panel (`Direktorat Jenderal PSDKP · Kementerian Kelautan dan Perikanan RI`).
  - Lockup `.auth-brand` (Crest `58×66px` + `RADAR POA` + `Rekapitulasi Data Strategis` + `Direktorat Pengendalian Operasi Armada`) dipisahkan dengan **jarak ritmis `24px`** (buang garis `<hr>` pemotong).
  - Input login/daftar setinggi `40px`, border `1px solid #B5C4D1`, radius `4px`, focus ring `0 0 0 3px rgba(11,79,108,0.16)`, dan tombol primer `Masuk` `#0B4F6C` bersih **tanpa ikon dekoratif**.

---

## 7. Spesifikasi Visualisasi `Ikhtisar` & Peta Ikon Siluet Kapal Kelas I–V

### 7.1 Klasifikasi Ikon Siluet Kapal Pengawas (Dual-Encoding)
Setiap dari **34 Kapal Pengawas Besar** di peta diwakili oleh **ikon SVG siluet kapal tampak samping** (`_shipClassSvg`) — **bukan kotak teks nama kapal permanen** yang menyebabkan `38` tabrakan label:

| Kelas Resmi (`Permen KP`) | Panjang | Jumlah Seed | Ukuran Ikon SVG | Karakteristik Siluet SVG | Lencana |
|---|---|---|---|---|---|
| **`KELAS_I`** (`ORCA 01–06`) | `> 60 m` | 6 kapal | `34×18px` | Lambung samudra panjang, superstruktur kemudi 2 tingkat, tiang radar tinggi + aksen dek tipis | `I` |
| **`KELAS_II`** (`PAUS`, `BARAKUDA`, `TUTUL`, `HIU MACAN`) | `40–60 m` | 10 kapal | `28×15px` | Lambung patroli lepas pantai ramping, kabin 2 jenjang + 1 tiang radar | `II` |
| **`KELAS_III`** (`HIU 01–17`) | `28–40 m` | 17 kapal | `23×13px` | Lambung patroli wilayah kompak, kabin kemudi tunggal sudut tegas | `III` |
| **`KELAS_IV`** (`AKAR BAHAR 01`) | `18–28 m` | 1 kapal | `19×11px` | Lambung patroli pantai ringkas tanpa tiang tinggi | `IV` |
| **`KELAS_V`** (Speedboat / Cadangan Master) | `< 18 m` | Dinamis | `16×10px` | Siluet *V-hull* reaksi cepat ramping | `V` |

- **Warna Isi SVG = Status Taktis:**
  - `#0B4F6C` (*Deep Admiralty Blue*) → `OPERASIONAL` (Operasional di Laut)
  - `#15803D` (*Emerald*) → `SIAP_PANGKALAN` (Siap di Pangkalan)
  - `#B45309` (*Amber*) → `GALANGAN` (Pemeliharaan Galangan)
- **Keterbacaan & Anti-Tumpuk (`markerOverlaps === 0`):**
  - Setiap SVG dibingkai *halo stroke* putih `#FFFFFF` (`2px`) agar tetap tajam di atas peta/choropleth maupun saat berdekatan.
  - Koordinat kapal pangkalan bersama (Batam & Tanjung Priok Jakarta) diberi *spatial spread offset* halus agar seluruh ikon terbaca jelas.
  - Nama kapal & kelas tidak lagi dicetak permanen menumpuk di peta; arahkan kursor (*hover*) untuk melihat tooltip Leaflet (`KP. ORCA 01 · Kelas I (60 m) · WPP 715`), atau klik ikon untuk membuka popup lengkap beserta tombol `Buka Profil Kapal`.
- **Filter Ganda Status + Kelas & Layout `68/32`:**
  - Kiri `68%`: Kanvas Peta Indonesia (`height: 430px`) dengan toolbar kontrol status (`Semua 34`, `Operasional 26`, `Siap Pangkalan 6`, `Galangan 2`) dan **bar legenda/filter Kelas I–V** interaktif yang langsung menampilkan masing-masing mini siluet SVG (`Semua Kelas`, `Kelas I · 6`, `Kelas II · 10`, `Kelas III · 17`, `Kelas IV · 1`). Banner error GeoJSON offline tampil ringkas di dalam kontainer tanpa terpotong (`clippedCount === 0`).
  - Kanan `32%`: Panel **Sebaran WPP & Disposisi Armada** (1 bar proporsi siap operasi + daftar ringkas `5 WPP Teratas` berbar proporsional pendek + tautan `Lihat Kapal Terbaik →`).

### 7.2 Urutan Layar `Ikhtisar` (`<= 2.000px` di `1440×900`, Tanpa Duplikasi)
1. **Bar Notifikasi Persetujuan (Conditional):** Strip 1 baris ramping `44px` (latar lembut + 1 aksi `Lihat & Putuskan`, tanpa `border-top` tebal).
2. **Strip 4 KPI Broadsheet (`border-top: 2px solid #0E1722`):** 4 sel bersekat garis `1px` — label sumber teks tenang `12px` + titik `6px` (**tanpa kotak pil pastel & tanpa bar progres dekoratif**), angka `28px tabular-nums`, dan 1 baris pembanding jelas.
3. **Momen 1 — Peta Taktis `68% / 32%`** (rincian §7.1).
4. **Momen 2 — Analitik Asimetris `65% / 35%`:**
   - Kiri `65%`: Grafik garis ganda **Realisasi Anggaran SIKAP (YTD)** (`SP2D` solid `#0F766E` dengan fill ultra-tipis `0,07` + `Akrual` garis putus-putus `#64748B`, sumbu Y seragam `0`, `4 M`, `8 M`, `12 M`, `16 M`, `18 M`). **Hapus duplikasi grafik bar vertikal & donut chart** yang memecah fokus.
   - Kanan `35%`: Panel **Postur Awak Kapal (Nakhoda)** — daftar bar horizontal terukur 4 kategori baku (`PNS`, `P3K`, `P3K Paruh`, `PJLP`: POA vs keseluruhan) + ringkasan laik sijil & sertifikat kedaluwarsa.
5. **Tabel Monitoring Eksekutif Lintas Satelit (Full-Width):**
   - Menggantikan **6 kartu divisi 50/50 duplikatif** dengan **1 Tabel Publikasi Terpadu (`executiveGrid`)** berkolom: `Unit Kerja`, `Satelit Sumber`, `Indikator Utama`, `Capaian / Postur`, `Status & Disparitas`.
   - Satelit yang belum aktif (`Sistik`, `Siaga`, `Operasi & Pantau`) diringkas tenang sebagai baris tabel berstatus `Menunggu Integrasi`.

---

## 8. Spesifikasi `Kapal Terbaik`, `Profil Kapal`, & Standarisasi 5 Halaman Sekunder

### 8.1 `Kapal Terbaik` & `Profil Kapal`
- **Kapal Terbaik:**
  - **Kelayakan Podium Non-Galangan:** Kapal berstatus `GALANGAN` dikeluarkan dari kelayakan `top3` Juara 1–3 agar kapal yang sedang *docking* tidak tampil sebagai juara terbaik (tetap tampil pada peringkat tabel dengan label status `Pemeliharaan Galangan`).
  - **Sinkronisasi Filter Triwulan:** Nilai dropdown `#kt-filter-tw` & `#kt-filter-year` selalu disinkronkan dengan `res.data.triwulan` / `res.data.year` agar identik dengan kalimat temuan header.
  - **Podium Tenang:** Hilangkan 3 warna border yang bertabrakan serta blok angka abu-abu hampa di bawah podium; beri aksen `#C88A2E` *Maritime Brass* **hanya untuk Juara 1**, lengkapi dengan ikon siluet SVG sesuai Kelas I–V pada podium & tabel 34 kapal, dan seragamkan skor 1 desimal koma Indonesia (`79,8`, `66,0`).
- **Profil Kapal:**
  - Jadikan nama kapal (**`KP. ORCA 01`**) sebagai `h1.page-title` (`26px`) disertai ikon siluet kelas & lencana `Kelas I · 60 m`, dengan tautan balik tenang di atas judul (`← Kembali ke Kapal Terbaik` / `← Kembali ke Ikhtisar`).
  - Ganti 3 kotak putih identik dengan **1 strip spesifikasi broadsheet** 5 kolom (`Status Taktis`, `Wilayah / Pangkalan`, `Hari Layar YTD`, `Awak Aktif Nakhoda`, `Aset BMN SIKAP`).
  - Terjemahkan semua enum database mentah ke bahasa manusia (`OPERASIONAL` → `Operasional di Laut`, `SIAP_PANGKALAN` → `Siap di Pangkalan`, `GALANGAN` → `Pemeliharaan Galangan`, `BAIK` → `Baik`, `RUSAK_RINGAN` → `Rusak Ringan`, `RUSAK_BERAT` → `Rusak Berat`, `P3K_PARUH_WAKTU` → `P3K Paruh Waktu`).

### 8.2 Standarisasi 5 Halaman Sekunder (`Kegiatan`, `Notifikasi`, `Admin Panel`, `Master Data`, `Riwayat`)
- **Zero Runtime `.map()` Crash:** Semua renderer (`_histRender`, `_riwLoad`, `_ntfReload`, `_mdLoad`) wajib memvalidasi `Array.isArray(rows)` dan memperbaiki alur render data agar halaman `Notifikasi`, `Master Data`, dan `Riwayat` tidak pernah terjebak kosong.
- **Satu Bahasa Desain Komponen:**
  - Strip ringkasan seragam (`.kpi-strip`), buang 4 gaya kartu yang berbeda antarmenu.
  - Tabel publikasi dengan `white-space: nowrap` pada `Periode` dan `Tanggal`, format tanggal tunggal `14 Jun 2026`, serta tombol aksi baris tenang (`Lihat` & `Revisi` subtle, `Anulir`/`Tolak` text-danger halus).
  - Empty state bermakna dengan pesan tenang dan tombol tindakan bila diperlukan (bukan kotak kosong hampa).
- **Perbaikan Spesifik Per Layar:**
  - **`Kegiatan`:** Judul tabel **`Daftar Kegiatan Direktorat`** (bukan `Feed Kegiatan Pendukung`), pencarian instan judul/pihak hadir, tab status (`Semua`, `Aktif`, `Ditimpa`, `Dianulir`), tampilkan nama pejabat peng-anulir (bukan ID mentah `USR-DIR-01`), dan **Calendar Picker Anti-Ketik Manual** (`onkeydown="return false"`, `onpaste="return false"`, `showPicker()` saat klik/fokus) pada semua `<input type="date">` (`#kgd-tanggal`, `#rv-kgd-tanggal`, filter rentang header).
  - **`Notifikasi`:** Hapus 2 kartu selebar setengah layar kosong; tampilkan ringkasan ringkas *unread* + tombol aksi `Tandai Semua Dibaca` & `Muat Ulang` seragam `32px` dan indikator titik biru untuk notifikasi baru.
  - **`Admin Panel`:** *Underline tabs* rata, kontras aksi `Setujui` / `Tolak`, kontrol tinggi seragam.
  - **`Master Data`:** Hapus teks internal `(PRD §6)`, ganti 3 pil mini inline menjadi strip ringkasan standar, dan tampilkan kolom `Kelas Kapal (I–V)` + ikon siluet di tabel Master Kapal.
  - **`Riwayat`:** Judul menjadi **`Riwayat Transaksi Terfederasi`** (hapus **`Seluruh Entri (& incl. SUPERSEDED & VOID)`**), satukan 5 kotak menjadi 1 strip ringkasan 4 metrik, dan perbaiki keterangan status `Ditimpa` dari `"Berlaku saat ini"` → **`Digantikan revisi`**.

---

## 9. Daftar Larangan Mutlak & Playwright Quality Gates

1. **Zero Emoji:** 100% ikon SVG garis stroke `1.5` + ikon siluet SVG kapal kelas I–V.
2. **Zero Huruf Teknis / Non-`Public Sans`:** Termasuk di dalam Leaflet map & Chart.js tooltips (`Helvetica Neue`/`Lucida Console` terlarang).
3. **Zero Jargon Developer & Database di UI:** Dilarang tampil `PRD §6`, `SUPERSEDED & VOID`, `USR-DIR-01`, `RUSAK_RINGAN`, `715 (OPERASIONAL)` tanpa konversi label manusiawi.
4. **Zero Kata Terlarang:** Dilarang keras memakai istilah non-resmi atau singkatan keliru terkait ruang kemudi/direktorat di kode, CSS, dan dokumen.
5. **Zero Anti-Patterns Teknis:** Tidak ada `transition: all`, `text-transform: uppercase`, `scale(0)`, backdrop blur tak terkendali yang membuat teks kabur, warna violet `#2B3674`, inline `style="height:..."`, maupun form input harian satelit.

### Automated Playwright Acceptance Gates (`tests/visual_audit.js` — 12 Skenario)
| Gate | Target Ambang Batas Kelulusan |
|---|---|
| `pageErrors` | **`0`** di seluruh 12 skenario |
| `overflowX` | **`0`** pada `1440×900`, `1024×768`, dan `390×844` |
| `markerOverlaps` | **`0`** pada Peta 34 Kapal |
| `brokenControlRows` | **`0`** di seluruh baris header/filter/toolbar |
| `tinyTextCount` | **`0`** (tidak ada teks `< 12px`) |
| `clippedCount` | **`0`** (tidak ada teks atau pesan peta yang terpotong) |
| `distinctBg` (`Ikhtisar`) | **`<= 16`** |
| `docHeight` (`Ikhtisar 1440px`) | **`<= 2.100px`** (`<= 2` layar penuh) |
| `impeccable detect --json` | **`[]`** (0 temuan slop) |
| **Visual Self-Judgment** | Seluruh PNG di `tests/screenshots/` dibuka & dinilai via `read_file` |
