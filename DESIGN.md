# DESIGN.md — Panduan Desain & Sistem Antarmuka: Radar POA
**Rekapitulasi Data Strategis POA — Pusat Agregasi & Dasbor Strategis Pimpinan**  
*Direktorat Pengendalian Operasi Armada (Dit. POA) · Ditjen PSDKP · KKP RI*

> Dokumen ini dibangun dari *ground-up* sebagai kontrak desain tunggal (**Single Source of Truth**) untuk **Radar POA**, berakar pada disiplin `.agents/skills/`:
> `impeccable` · `unslop` · `color-expert` · `apple-hig` · `d3-visualization` · `emilkowalski-motion` · `mobile-native`.

---

## 1. Diferensiasi Total Lintas Aplikasi Dit. POA

Agar **Radar POA** langsung dikenali sebagai portal agregasi tingkat Direktorat dan **tidak pernah tertukar** dengan aplikasi satelit di bawahnya, seluruh arsitektur visualnya dipisahkan secara tegas dari **SIKAP** dan **Nakhoda**:

| Dimensi Visual | **SIKAP** *(Subbag TU)* | **Nakhoda** *(Timja Pengawakan)* | **Radar POA** *(Pusat Agregasi Dit. POA)* |
|---|---|---|---|
| **Dunia Visual** | Portal Bendahara Frosted Mineral | Buku Besar Akromatik (*Achromatic Ledger*) | **Hydrographic Maritime Briefing & Dark-Ink Institutional Rail** |
| **Navigasi Utama** | Top-Bar putih bersekat + glassmorphic subnav | Sidebar terang `#F2F4F7` | **Rail Kiri Gelap `#0E1722` (Prussian Maritime Ink)** dengan indikator kuningan maritim `#C88A2E` |
| **Kanvas & Header** | Porcelain dingin `#F8FAFC` + header `backdrop-filter` blur | Cool slate `#F2F4F7` | **Kanvas Peta Hidrografis Sejuk `#EFF4F7`** + header solid **`#F7FAFC` tanpa blur** |
| **Layar Autentikasi** | Kartu 2-ruang terpusat bergradasi hijau | Kartu form terpusat abu-abu dingin | **50/50 Photographic Split Screen**: Foto resmi penuh personel Ditjen PSDKP (kiri, tanpa tumpukan teks) + panel putih `#FFFFFF` ber-lockup **`RADAR POA`** (*Rekapitulasi Data Strategis*) berlogo PSDKP dan formulir ringkas terpusat optis (kanan) |
| **Warna Aksi Primer** | Forest Jade `#064E3B` | Hitam Arang `#0F1720` | **Deep Admiralty Blue `#0B4F6C`** (`hover: #083B52`) |
| **Keluarga Huruf** | `Plus Jakarta Sans` | `Geist` + `Geist Mono` | *Single-family institutional sans* **`Public Sans`** (`400/500/600/700`) dengan `tabular-nums`, **tanpa huruf gaya teknikal / berspasi tetap** |
| **Geometri & Tajuk** | Sudut membulat `12px–24px` + *layered shadow* | Sudut `6px–8px` datar | **Sudut arsitektural tajam `6px / 4px / 3px`**, elevasi murni garis `1px` (**0 shadow kartu**), tajuk atas broadsheet `2px solid #0E1722` |

---

## 2. Kontrak Arah Produk (*Direction Contract*)

1. **Product (Produk):** Pusat agregasi nasional (**Rekapitulasi Data Strategis POA**) bagi Direktur Pengendalian Operasi Armada, Pejabat Eselon, dan Kepala Divisi untuk membaca laporan konsolidasi dari **SIKAP**, **Nakhoda**, **Sistik**, **Siaga**, dan **Operasi**, serta mencatat **Kegiatan Direktorat**.
2. **Character (Karakter):** *Berwibawa, terukur, berformat dokumen briefing resmi negara.*
3. **World (Dunia & Material):** **Briefing Maritim Resmi & Peta Hidrografis Negara** — sisi kiri gelap tinta laut dalam (`#0E1722`) dengan penanda kuningan kompas (`#C88A2E`), berpadu kanvas biru-abu hidrografis sejuk (`#EFF4F7`) dan pelat tabel putih bertepi tajam.
4. **Moments (Momen Visual Utama):**
   - **Momen 1:** *Strip Broadsheet 4 KPI Utama* yang dinaungi garis tajuk tinta `2px solid #0E1722` beserta bar progres presisi dan tag asal basis data satelit.
   - **Momen 2:** *Peta Sebaran WPPNRI 571–718 & Disposisi 34 Kapal Pengawas Ukuran Besar* dengan marker suar kode status (`Operasional`, `Siap Pangkalan`, `Galangan`).
5. **Signature (Detail Khas):**
   - **Lambang Resmi Ditjen PSDKP (`#psdkp-crest-outline`):** Tampil berwibawa pada lockup hero `.auth-brand` di panel kanan autentikasi (`58×66px`), Puncak Rail Gelap Sidebar (`34×39px`), Bilah Topbar Mobile (`22×25px`), dan Loading Splash (`48×54px`), tanpa kotak latar buatan.
   - **Kepanjangan & Penonjolan Merek (`RADAR POA`):** Seluruh titik identitas menampilkan judul **`RADAR POA`** disertai kepanjangan eksplisit **`Rekapitulasi Data Strategis`** serta nama **Direktorat Pengendalian Operasi Armada**.
   - **Kuningan Maritim (`#C88A2E`) & Garis Tajuk Publikasi (`2px solid #0E1722`):** Digunakan konsisten sebagai bar indikator aktif rail gelap dan tajuk strip KPI.

---

## 3. Sistem Warna Strategis (*Committed Dark Rail + Cool Hydrographic Briefing*)

### 3.1 Rail Kiri Gelap (*Dark-Ink Institutional Rail — `256px`*)
- `--rail-bg`: `#0E1722` (*Prussian Maritime Ink*)
- `--rail-hover`: `#172434`
- `--rail-active`: `#1D2E42` (baris aktif disertai penanda vertikal kiri `2px` `--rail-accent`)
- `--rail-rule`: `rgba(245, 242, 235, 0.12)`
- `--rail-ink`: `#F5F2EB` (putih gading lembut untuk keterbacaan jangka panjang)
- `--rail-ink-muted`: `#93A2B5`
- `--rail-accent`: `#C88A2E` (*Maritime Brass*)

### 3.2 Kanvas Peta Hidrografis Sejuk (*Cool Hydrographic Workspace*)
- `--bg-ground`: `#EFF4F7` (kanvas utama aplikasi & panel formulir kanan split auth)
- `--bg-header`: `#F7FAFC` (header halaman *sticky* solid — **bebas blur / kaca buram**)
- `--bg-surface`: `#FFFFFF` (pelat KPI, tabel, kontainer peta/grafik, dialog)
- `--bg-raised`: `#E4ECF1` (trek bar, chip netral)
- `--bg-active`: `#D9E4EC`
- `--border-card`: `#D1DCE5` (garis tepi tunggal pelat `1px` — tanpa *box-shadow* statis)
- `--border-rule`: `#E2EAF0` (garis pemisah antarbaris `1px`)
- `--border-ctl`: `#B9C7D4` (garis tepi input/select/tombol sekunder)
- `--ink-primary`: `#14191F` (kontras `17.6:1` AAA pada `#FFFFFF`)
- `--ink-secondary`: `#3E4752` (`9.4:1` AAA)
- `--ink-muted`: `#535D68` (`6.7:1` AA+)
- `--ink-faint`: `#5D656F` (`5.8:1` AA pada `#FFFFFF` & `>= 5.1:1` pada `#EFF4F7`)

### 3.3 Warna Aksi, Satelit, & Semantik Data
- **Aksi Primer Radar POA:** `--action-primary: #0B4F6C` (*Deep Admiralty Blue*, teks `#FFFFFF` kontras `8.9:1` AAA, hover `#083B52`), `--accent-radar-soft: #E1EFF5`, `--accent-radar-ink: #07384D`.
- **Aksen Brass Institusional:** `--accent-brass: #B4761F`, `--accent-brass-soft: #FBF1DF`, `--accent-brass-ink: #6D450B`.
- **Kode Sumber Data Satelit:**
  - **SIKAP (Anggaran & BMN):** `--sat-sikap: #0F766E`, soft `--sat-sikap-soft: #D9F2EE`
  - **Nakhoda (Awak Kapal & AKN):** `--sat-nakhoda: #C2410C`, soft `--sat-nakhoda-soft: #FDE8DC`
  - **Pusat Dit. POA (Kegiatan Direktorat):** `--sat-pusat: #0B4F6C`, soft `--sat-pusat-soft: #E1EFF5`
- **Semantik Status:** Positif `--sem-pos: #15803D` (`#DCFCE7` / `#052E16`), Peringatan `--sem-warn: #B45309` (`#FEF3C7` / `#78350F`), Kritis `--sem-crit: #B91C1C` (`#FEE2E2` / `#7F1D1D`), Netral `--sem-neut: #475569` (`#E4ECF1` / `#1E293B`).

> [!CAUTION]
> - Dilarang menggunakan warna spektrum ungu/violet (`#2B3674`, `#7C3AED`, `#6366F1`), efek kaca blur (`backdrop-filter`), atau kotak bayangan tebal (*ghost card*).
> - Dilarang menaruh garis warna kiri/kanan (`border-left` / `border-right` > `1px`) pada kartu maupun banner peringatan; gunakan `border-top: 2px solid ...` bila diperlukan hierarki tajuk.

---

## 4. Tipografi Publikasi & Disiplin Numerik

- **Huruf Tunggal Antarmuka:** `'Public Sans', system-ui, -apple-system, BlinkMacSystemFont, sans-serif` (`400, 500, 600, 700`). Seluruh elemen—termasuk `RowID`, `NIP`, `WPP`, koordinat, tag satelit, dan cap waktu—tetap memakai `Public Sans` yang rapi (**bebas huruf gaya teknikal / berspasi tetap**).
- **Skala Tipografi (Rasio kontras jelas $\ge 1,25\times$):**
  - `h1.auth-brand-name`: `30px` (`700`, `line-height: 1.08`, `letter-spacing: -0.025em`, dual-tone `RADAR` `#0E1722` + `POA` `#0B4F6C`)
  - `h1 / .page-title`: `26px` (`700`, `line-height: 1.2`, `letter-spacing: -0.02em`)
  - Hero KPI: `32px` (`700`, `tabular-nums`)
  - KPI Strip Utama: `28px` (`600`, `tabular-nums`)
  - `h2 / .auth-title / .n-modal h2 / .n-drawer-hd h2`: `18px` (`600`, `line-height: 1.3`)
  - Judul Seksi / Kartu (`.content-section-hd`, `.div-card-title`, `.chart-cell-title`): `15px` (`600`)
  - Isi Utama (`body` / `.auth-brand-exp`): `14px` (`400` isi, `600` kepanjangan `Rekapitulasi Data Strategis`)
  - Kontrol MD / Tabel: `13px` (`400 / 500`)
  - Sub-organisasi (`.auth-brand-org`), Label, Pill, Kontrol SM: `12px–12.5px` (batas bawah baca `12px`)
- **Tabular Numerals Wajib:** `font-variant-numeric: tabular-nums lining-nums; font-feature-settings: "tnum" 1, "lnum" 1;` aktif di seluruh KPI, tabel (`.n-table`, `.kt-table td`), koordinat, cap waktu, dan angka pembanding.

---

## 5. Geometri Tajam, Kontrol 3-Tier, & Aturan Tata Letak

### 5.1 Sudut Arsitektural Tajam & Elevasi Tunggal
- `--r-card: 6px` · `--r-lg: 4px` · `--r-md: 4px` · `--r-sm: 3px` · `--r-pill: 999px` (khusus pill status).
- **Elevasi Tunggal:** Kartu, pelat KPI, dan tabel hanya memakai `1px solid var(--border-card)` (tanpa *box-shadow*). Bayangan lembut (`var(--shadow-popover)` / `var(--shadow-modal)`) hanya dipakai elemen mengambang (dropdown akun, popover sinkronisasi, dialog modal, drawer, dan Sonner toast).
- **Underline Tabs Rata (`.n-tabs`):** Tidak menggunakan pill abu-abu bergaya SaaS; tab menempel rata dengan garis bawah `1px solid var(--border-card)` dan penanda aktif `2px solid var(--action-primary)`.

### 5.2 Skala Geometri Kontrol 3-Tier (`_uiAudit()`)
```css
--ctl-h-lg: 40px; --ctl-px-lg: 14px; --ctl-fs-lg: 14px; --ctl-r-lg: 4px; /* Form dialog, login/register, modal submit */
--ctl-h-md: 32px; --ctl-px-md: 12px; --ctl-fs-md: 13px; --ctl-r-md: 4px; /* Toolbar header, filter periode, tombol utama halaman */
--ctl-h-sm: 26px; --ctl-px-sm: 10px; --ctl-fs-sm: 12px; --ctl-r-sm: 3px; /* Aksi baris tabel (Lihat, Revisi, Anulir) */
```
- Seluruh tombol sebaris dalam `.ctl-row`, `.ctl-stack`, `.hist-actions`, dan toolbar memiliki tinggi seragam persis.
- Area sentuh diperluas minimal `44px` secara tak kasatmata di `@media (pointer: coarse)` dengan input `font-size: 16px` agar tidak memicu zoom iOS.

### 5.3 Fisika Gerak & Aksesibilitas
- Kurva tunggal `--ease-out: cubic-bezier(0.22, 1, 0.36, 1)`; tekan tombol `:active` `scale(0.98)` (`90ms`), transisi status `150ms`, modal masuk `200ms` (`scale(0.97) translateY(6px)` -> `1`), drawer kanan `240ms`.
- Hover selalu di dalam `@media (hover: hover) and (pointer: fine)`; mendukung penuh `@media (prefers-reduced-motion: reduce)` dan `@media (prefers-reduced-transparency: reduce)`.

---

## 6. Spesifikasi Layar Autentikasi (*50/50 Photographic Split Screen*)

- Layar masuk, registrasi, dan status tunggu berbagi satu arsitektur **50/50 split screen** (`.auth-split`) tanpa kartu mengambang terpusat dan **tanpa teks hias / paragraf pengisi di atas foto**.
- **Sisi Kiri (`50%`, `.auth-media`):** Foto penuh *sticky* (`100dvh`) personel Ditjen PSDKP dari partial [AuthPhoto.html](file:///home/pinefeast/Projects/Radar-POA/html/AuthPhoto.html) (`object-fit: cover; object-position: 34% 24%`) agar figur utama berserta baret dan emblem emas PSDKP tetap utuh di bidang vertikal.
- **Sisi Kanan (`50%`, `.auth-panel` `#FFFFFF`):** Panel formulir putih bersih dengan pemisah hairline `1px solid var(--border-rule)`, konten terpusat optis (`max-width: 400px`), diawali lockup identitas hero `.auth-brand` (Logo PSDKP `58×66px` + `h1.auth-brand-name` **`RADAR POA`** `30px` dual-tone `#0E1722` & `#0B4F6C` + **`Rekapitulasi Data Strategis`** `14px` semibold + `Direktorat Pengendalian Operasi Armada` `12.5px`, ditutup garis bawah `1px solid var(--border-rule)`), diikuti judul form `h2.auth-title` (`18px`), field tinggi `40px`, tanpa ikon hias di dalam input, dan tombol primer `#0B4F6C` lebar penuh.
- Pada layar mobile (`<= 900px`), `.auth-split` bertumpuk satu kolom: tajuk foto ringkas setinggi `220px` di atas dan formulir penuh di bawah.

---

## 7. Daftar Larangan Mutlak (*Negative Prompts*)
1. **Zero Emoji:** Gunakan 100% ikon garis SVG inline.
2. **Dilarang Huruf Fixed-Width / Teknikal (*fixed-pitch* / gaya terminal):** Seluruh antarmuka memakai satu keluarga huruf **`Public Sans`** beserta `tabular-nums`.
3. **Dilarang Teks Berlebihan / Filler pada Layar Autentikasi:** Panel foto kiri mutlak bebas paragraf deskripsi maupun daftar tag; panel kanan langsung berfokus pada lockup identitas singkat dan formulir inti.
4. **Penamaan & Istilah Baku Mutlak:** Wajib memakai **Direktorat Pengendalian Operasi Armada** serta istilah resmi *Rekapitulasi Data Strategis* / *Dasbor Strategis Pimpinan* di seluruh label UI, tombol masuk, komentar kode, dan dokumentasi; hindari seluruh istilah kasual/non-resmi atau singkatan salah kaprah.
5. **Dilarang Menyerupai SIKAP/Nakhoda:** Tidak ada header kaca blur, tidak ada hijau jade SIKAP sebagai warna utama shell, tidak ada auth card 2-ruang terpusat, dan tidak ada sidebar abu-abu terang ala Nakhoda.
6. **Dilarang `transition: all`, `text-transform: uppercase`, `scale(0)`, `style="height:..."`, latar kisi dekoratif, dan form input harian satelit.**
