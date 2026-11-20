# DESIGN.md — Panduan Desain & Sistem Antarmuka: Radar POA
**Rekapitulasi Data Strategis POA — Pusat Agregasi & Executive Cockpit**  
*Direktorat Pemantauan dan Operasi Armada (Dit. POA) · Ditjen PSDKP · KKP RI*

> Dokumen ini dibangun dari *ground-up* sebagai kontrak desain tunggal (**Single Source of Truth**) untuk **Radar POA**, menyintesis delapan disiplin desain dan *design engineering* di `.agents/skills/`:
> `unslop` · `design-taste-frontend` (tasteskill 2.5.0) · `colorize` (OKLCH) · `apple-hig` · `apple-design` (WWDC Fluid Interfaces) · `d3-visualization` · `animate` · `emilkowalski-motion`.

---

## 1. Kontrak Arah Produk (*5-Line Direction Contract — `/unslop`*)

Sebelum menulis satu baris CSS atau komponen HTML, seluruh keputusan visual Radar POA tunduk pada lima baris identitas produk berikut:

1. **Product (Produk):** Pusat kendali eksekutif (*executive cockpit*) bagi Direktur POA, Pejabat Eselon, dan Kepala Divisi untuk memantau agregasi performa nasional dari aplikasi satelit (**SIKAP**, **Nakhoda**, **Sistik**, **Siaga**, **Operasi**) serta mencatat agenda eksklusif **Kegiatan Direktorat**.
2. **Character (Karakter):** *Tegas, presisi hidrografis, tenang di bawah tekanan.* (Tanpa jargon template seperti "modern", "sleek", atau "futuristic").
3. **World (Dunia & Material):** **Anjungan Komando Armada & Peta Hidrografi Maritim WPPNRI 571–718** — kertas peta laut bergradasi dingin (*cool mineral chart paper*), tinta karbon instrumen navigasi, dan penanda suar telemetri kapal pengawas.
4. **Moments (Momen Visual Utama):**
   - **Momen 1:** *Peta Taktis Interaktif WPPNRI 571–718 & Disposisi 34 Kapal Pengawas Ukuran Besar* (26 Operasional di Laut, 6 Siap Operasi di Pangkalan, 2 Pemeliharaan di Galangan) dengan lapisan poligon WPP bergradasi satu-hue hidrografis.
   - **Momen 2:** *Matriks Eksekutif Lintas Satelit (SIKAP $\times$ Nakhoda $\times$ Pusat)* — strip KPI terpadu dengan bar komposisi linear (D3/SVG *bullet & plan tracks*) dan kalimat temuan otomatis berbasis data.
5. **Signature (Detail Khas Tunggal):**
   - **Identitas Instansi Resmi — Lambang Ditjen PSDKP (`PSDKP Crest Outline`):** Sama seperti satelit **SIKAP** dan **Nakhoda**, puncak sidebar, bilah mobile, dan kartu autentikasi menampilkan **Lambang Resmi Ditjen PSDKP** (base64 PNG transparan dengan SVG filter `#psdkp-crest-outline` tanpa kotak latar kaku), didampingi wordmark **Radar POA**, lencana `Dit. POA`, dan sub-judul `Pusat Agregasi & Executive Cockpit`.
   - **Lencana Telemetri Satelit (`Satellite Sync Pulse & Provenance Tag`):** Setiap kartu agregasi mencantumkan asal basis data satelit secara eksplisit (`SIKAP · TX_TataUsaha`, `NAKHODA · TX_Pengawakan_AKN`, `PUSAT · TX_KegiatanDirektorat`) beserta indikator kesegaran cache 15 menit dan pemicu *Sinkronkan Sekarang*.

---

## 2. Prinsip Arsitektur Visual (*Anti-AI-Slop & One-Question-Per-Screen*)

### 2.1 Warna pada Data, Bukan pada Chrome (`/unslop` & `/design-taste-frontend`)
- **92%–95% piksel layar adalah netral ber-tint dingin** (*mineral slate/chart paper*). Sidebar, latar halaman, kartu, border, dan tombol utama menggunakan tangga nada netral dan tinta karbon (`#0C1117`).
- Warna kromatik disimpan secara ketat hanya untuk **elemen pembawa informasi data**: kurva serapan anggaran, penanda posisi 34 kapal pengawas, bar komposisi AKN, dan lencana status semantik (kritis/peringatan/laik).
- **Maksimal 2 tingkat kedalaman kontainer (*Max 2-Boxes Deep*):** Dilarang membungkus teks di dalam kotak di dalam kotak di dalam kartu (*nested box-in-box slop*). Pemisahan struktur di dalam kartu menggunakan garis `1px` (`--rule`) atau ruang kosong (*whitespace* pada skala `4px`).

### 2.2 Satu Pertanyaan Utama per Layar & Kalimat Temuan Otomatis
Setiap layar di Radar POA wajib menjawab satu pertanyaan strategis pimpinan dalam $\le 5$ detik (*5-Second Rule*), dipandu oleh **Kalimat Temuan Berbasis Data** satu baris tepat di bawah judul `h1`:

| Layar (`viewId`) | Pertanyaan Strategis Pimpinan | Elemen Terbesar (Penjawab Utama) | Contoh Kalimat Temuan Berbasis Data (Dibangun Server/JS) |
|---|---|---|---|
| **Ikhtisar Eksekutif** (`overview`) | Bagaimana postur anggaran, kekuatan awak, kesiapan 34 kapal besar, dan kepatuhan laporan minggu ini? | Strip 4 KPI Utama + Peta Taktis WPP 34 Kapal + Grid Agregasi Satelit | *"Serapan SP2D mencapai 74,2% (Rp 11,1 M); 32 dari 34 kapal besar siap operasi; 1 disparitas data awak menunggu verifikasi TU."* |
| **Kegiatan Direktorat** (`kegiatan`) | Agenda strategis lintas-divisi apa yang telah diputuskan pimpinan dan apa bukti risalahnya? | Feed Kronologis Kegiatan Pimpinan + Strip Ringkasan YTD | *"14 kegiatan strategis tercatat sepanjang 2026 (3 kegiatan pada November 2026)."* |
| **Kapal Terbaik** (`kapal-terbaik`) | Kapal pengawas mana yang memiliki performa operasional dan penindakan tertinggi pada triwulan berjalan? | Podium 3 Kapal Terbaik + Tabel Peringkat Skor 34 Kapal Besar | *"KP. Orca 05 memimpin evaluasi TW IV 2026 dengan skor 94,2 (69 hari layar, 2 KIA)."* |
| **Profil Kapal** (`profil-kapal`) | Bagaimana kesiapan teknis, formasi kru Nakhoda, dan inventaris BMN SIKAP yang melekat pada kapal ini? | Header Identitas Kapal + Ringkasan Kru Sijil Aktif & BMN Kapal | *"KP. Orca 01 berstatus Operasional di WPP 715 dengan 18 awak aktif terpasang."* |
| **Riwayat Federasi** (`riwayat`) | Transaksi apa saja yang masuk, direvisi (`SUPERSEDED`), atau dianulir (`VOID`) lintas satelit? | Tabel Kronologis Lintas Satelit (`PUSAT`, `SIKAP`, `NAKHODA`) | *"Menampilkan 48 rekaman transaksi lintas satelit pada periode terpilih (2 dianulir)."* |
| **Master Data** (`master-data`) | Apakah referensi 34 Kapal Besar, WPPNRI, Kawasan Konservasi, dan Opsi enum sudah mutakhir? | Tabel Master Kapal / WPP / Kawasan / Opsi | *"34 kapal pengawas ukuran besar dan 11 wilayah WPPNRI terdaftar aktif."* |
| **Admin Panel** (`kelola-akun`) | Siapa pendaftar yang menunggu persetujuan akses dan bagaimana jejak audit pimpinan? | Tabel Antrean Persetujuan / Pengguna / Audit Log | *"2 permohonan akun menunggu keputusan; 128 aktivitas terekam di log audit."* |

---

## 3. Sistem Warna Strategis (*Perceptually Uniform OKLCH — `/colorize`*)

Strategi warna dirancang dengan ruang warna **OKLCH** (beserta padanan Hex deterministik) agar setiap langkah kecerahan (*lightness*) memiliki kontras persepsi yang seragam dan bebas dari estetika *purple-blue AI gradient*.

### 3.1 Tangga Netral: *Hydrographic Mineral Ramp* (92% Piksel Layar)
Tidak menggunakan abu-abu mati (`#F5F5F5`) atau hitam murni (`#000000`). Seluruh permukaan di-tint halus ke arah biru-mineral hidrografi (`hue ~240°`, `chroma 0.006–0.015`):

| Token CSS | Nilai Hex | Padanan OKLCH | Peran Arsitektural | Kontras vs `#FFFFFF` |
|---|:---:|---|---|:---:|
| `--bg-ground` | `#F3F5F8` | `oklch(96.8% 0.006 242)` | Kanvas dasar halaman & latar sidebar | — |
| `--bg-surface` | `#FFFFFF` | `oklch(100% 0 0)` | Permukaan kartu utama, tabel, modal dialog | — |
| `--bg-raised` | `#EAEFF5` | `oklch(94.6% 0.009 242)` | Sumur kontrol, trek progress bar kosong, skeleton | — |
| `--bg-active` | `#E1E8F0` | `oklch(92.4% 0.013 242)` | Baris navigasi aktif, baris tabel terpilih | — |
| `--bg-glass` | `rgba(255,255,255,0.86)` | — | Lapisan header/toolbar mengambang (`backdrop-filter`) | — |
| `--border-card` | `#DCE3EC` | `oklch(91.0% 0.012 242)` | Garis tepi luar kartu, kontainer KPI, & sidebar (`1px`) | — |
| `--border-rule` | `#EDF1F6` | `oklch(95.8% 0.007 242)` | Garis pemisah horizontal antarbaris tabel (`1px`) | — |
| `--border-ctl` | `#C5D0DE` | `oklch(85.5% 0.018 242)` | Garis tepi input, select, dan tombol sekunder | — |
| `--ink-primary` | `#0C1117` | `oklch(17.5% 0.016 245)` | Teks utama, angka KPI jawaban, judul `h1`/`h2` | **18.9 : 1** (AAA) |
| `--ink-secondary`| `#3B4654` | `oklch(39.5% 0.022 245)` | Teks isi tabel, sub-judul, deskripsi kegiatan | **9.4 : 1** (AAA) |
| `--ink-muted` | `#5C6878` | `oklch(51.5% 0.024 245)` | Label kolom, metadata, cap waktu, satuan angka | **5.7 : 1** (AA+) |
| `--ink-faint` | `#7A8696` | `oklch(61.5% 0.022 245)` | Placeholder input & garis bantu | **3.7 : 1** |
| `--action-primary`| `#0F1722` | `oklch(20.5% 0.020 245)` | Isi tombol aksi primer (teks `#FFFFFF`) | **17.6 : 1** (AAA) |

### 3.2 Warna Identitas & Kode Sumber Satelit (*60 / 30 / 10 Data Color Rule*)
Karena Radar POA adalah **Aggregator Pusat**, warna kromatik pada grafik dan lencana data memiliki arti semantik yang mengidentifikasi **asal sistem satelit** dan **status taktis armada**:

1. **Aksen Dominan Radar POA (60% elemen data berwarna) — *Hydrographic Cerulean*:**
   - `--accent-radar`: `#0369A1` (`oklch(50.5% 0.132 238)`) — dipakai untuk fokus utama Radar POA, poligon intensitas peta WPPNRI, penanda **26 Kapal Operasional di Laut**, cincin fokus (`--focus-ring`), dan seri data utama.
   - `--accent-radar-soft`: `#E0F2FE` (latar chip/sorotan lembut; teks `#0C4A6E`).
2. **Aksen Referensi Lintas Satelit (30% elemen data berwarna — pembeda sumber federasi):**
   - **Satelit SIKAP (Fiskal, Pengadaan, BMN):** `--sat-sikap: #065F46` (*Imperial Forest Jade*, tint `#D1FAE5`) — dipakai pada kurva realisasi SP2D dan penanda sumber SIKAP.
   - **Satelit Nakhoda (Postur AKN & Sijil Awak):** `--sat-nakhoda: #D9480F` (*Maritime Safety Orange*, tint `#FFEDD5`) — dipakai pada bar komposisi AKN POA dan penanda sumber Nakhoda.
   - **Pusat Dit. POA (Kegiatan Direktorat):** `--sat-pusat: #0369A1` (*Hydrographic Cerulean*, tint `#E0F2FE`).
3. **Warna Semantik Status & Taktis Armada (10% elemen peringatan/keputusan):**

| Status / Makna Taktis | Token Teks / Garis | Token Latar Pill | Token Teks Pill | Kontras Pill | Contoh Pemakaian |
|---|:---:|:---:|:---:|:---:|---|
| **Positif / Siap / Laik** | `--sem-pos: #15803D` | `#DCFCE7` | `#052E16` | **14.2 : 1** | `ACTIVE`, `6 Kapal Siap di Pangkalan`, `BMN Baik`, `Sertifikat Berlaku` |
| **Peringatan / Galangan / Revisi** | `--sem-warn: #B45309` | `#FEF3C7` | `#78350F` | **7.8 : 1** | `2 Kapal di Galangan`, `Disparitas Nakhoda`, `SUPERSEDED`, `PENDING` |
| **Kritis / Anulir / Kedaluwarsa** | `--sem-crit: #BE123C` | `#FFE4E6` | `#881337` | **8.4 : 1** | `VOID / Dianulir`, `BMN Rusak Berat`, `Kurang Awak Sijil`, `Sertifikat Kedaluwarsa` |
| **Netral / Belum Terhubung** | `--sem-neut: #475569` | `#EAEFF5` | `#1E293B` | **10.5 : 1** | `Menunggu Integrasi` (`Sistik`, `Siaga`, `Operasi`) |

> [!CAUTION]
> **Aturan Mutlak Warna (`/colorize` & `/design-taste-frontend`):**
> - **Dilarang menggunakan spektrum Ungu / Violet / Lavender** (`OKLCH hue 270°–330°`) di mana pun dalam antarmuka.
> - **Warna menyatakan makna baik/buruk atau kategori satelit, bukan dekorasi.**
> - Jangan pernah meletakkan teks abu-abu (`#64748B`) di atas latar berwarna; gunakan shade gelap dari hue yang sama (seperti `#052E16` di atas `#DCFCE7`).

---

## 4. Tipografi Optik & Disiplin Numerik (`/apple-design` & `/unslop`)

### 4.1 Pasangan Huruf (*Type Families*)
- **Antarmuka & Angka Eksekutif (`--font-sans`):** `'Geist', 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif`.
- **Kode Teknis, ID Transaksi, NIP, & Koordinat (`--font-mono`):** `'Geist Mono', 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace`. Hanya dipakai untuk `RowID` (`KGD-2026-XXXX`), `NIP`, kode `WPP 571`, koordinat lintang/bujur, dan cap waktu sinkronisasi.

### 4.2 Skala Tipografi & *Size-Specific Optical Tracking* (WWDC Typography)
Mengikuti prinsip Apple HIG, *letter-spacing* (*tracking*) dan *line-height* (*leading*) berbanding terbalik dengan ukuran huruf:

| Peran Elemen | Token Ukuran | Ukuran (`px` / `rem`) | Line-Height | Bobot (`font-weight`) | Optical Tracking | Aturan Khusus |
|---|---|---|---|---|---|---|
| **Angka Jawaban Utama (Hero KPI)** | `--fs-hero-num` | `32px` (`2rem`) | `1.05` | `600` | `-0.025em` | Wajib `tabular-nums`; maks 1 angka 32px per blok utama |
| **Angka KPI Strip (4 Top KPI)** | `--fs-kpi-num` | `26px` (`1.625rem`) | `1.10` | `600` | `-0.020em` | Wajib `tabular-nums`, tanpa pemotongan |
| **Judul Layar (`h1`)** | `--fs-h1` | `22px` (`1.375rem`) | `1.20` | `600` | `-0.015em` | Kata benda spesifik, kalimat biasa (*sentence case*) |
| **Judul Seksi / Kartu (`h2`)** | `--fs-h2` | `15px` (`0.9375rem`) | `1.35` | `600` | `-0.005em` | Kalimat biasa, tanpa ikon/emoji di depannya |
| **Kalimat Temuan & Isi Utama** | `--fs-body` | `14px` (`0.875rem`) | `1.50` | `400` (`500` penekanan) | `0em` | Panjang baris bacaan $\le 65$ karakter (`65ch`) |
| **Kontrol Tier MD & Sel Tabel** | `--fs-md` | `13px` (`0.8125rem`) | `1.40` | `400` / `500` | `0em` | Sel angka tabel rata kanan + `tabular-nums` |
| **Label, Meta, Pill, & Kontrol SM** | `--fs-sm` | `12px` (`0.75rem`) | `1.35` | `500` | `+0.005em` | Batas bawah ukuran teks di seluruh aplikasi (`12px`, tidak boleh `< 11px`) |

### 4.3 Aturan Format Angka & Tanggal Kanonik
- **Tabular Figures Wajib:** Seluruh elemen `.kpi-val`, `td.num`, `.tnum`, persentase, rupiah, dan koordinat wajib memiliki:
  ```css
  font-variant-numeric: tabular-nums lining-nums;
  font-feature-settings: "tnum" 1, "lnum" 1;
  ```
- **Konsistensi Format Nominal:**
  - Di dalam strip KPI: format ringkas presisi dengan 1 desimal bila $\ge 1\text{ juta}$ (`Rp 11,4 M`, `Rp 420,5 jt`) dan nilai penuh saat hover/`title`.
  - Di dalam tabel detail/riwayat: format ribuan titik lengkap (`Rp 11.420.500.000`) rata kanan.
  - Nilai kosong / satelit belum melapor: cetak tanda hubung em (`—`) berwarna `--ink-muted`, **bukan** `0` palsu. Nilai nol sungguhan dicetak `0`.

---

## 5. Geometri Kontrol 3-Tier, Grid 4px, & Nested Radius (`/apple-hig` & `/unslop`)

### 5.1 Skala Geometri Kontrol Tunggal (*3-Tier Single Control Geometry*)
Seluruh kontrol interaktif (`button`, `input`, `select`, segmented control) wajib mematuhi tiga ukuran tinggi kontainer baku tanpa pengecualian:

| Tier | Tinggi (`height`) | Padding Horizontal | Ukuran Font | Radius Sudut | Peruntukan Wajib |
|---|:---:|:---:|:---:|:---:|---|
| **LG** | `40px` | `14px` | `14px` | `8px` | Input form modal Kegiatan Direktorat, form Login/Register, tombol submit primer dialog |
| **MD** | `32px` | `12px` | `13px` | `6px` | Toolbar filter periode utama, tombol *Sinkronkan Data*, segmented tab, pencarian tabel |
| **SM** | `26px` | `10px` | `12px` | `5px` | Khusus aksi di dalam baris tabel (*in-table actions*: `Lihat`, `Revisi`, `Anulir`) |

```css
:root {
  --ctl-h-lg: 40px; --ctl-px-lg: 14px; --ctl-fs-lg: 14px; --ctl-r-lg: 8px;
  --ctl-h-md: 32px; --ctl-px-md: 12px; --ctl-fs-md: 13px; --ctl-r-md: 6px;
  --ctl-h-sm: 26px; --ctl-px-sm: 10px; --ctl-fs-sm: 12px; --ctl-r-sm: 5px;
}
```

- **Kohesi Baris Kontrol:** Kontrol yang berada dalam satu baris horizontal wajib menggunakan tier yang sama dan dibungkus dalam `.ctl-row.ctl-lg`, `.ctl-row.ctl-md`, atau `.ctl-row.ctl-sm`.
- **Larangan Mutlak:** Dilarang keras menulis inline style `style="height: ..."` pada `<button>`, `<input>`, atau `<select>`.
- **Hit Target Sentuh (Apple HIG):** Pada layar sentuh (`@media (pointer: coarse)`), kontrol tier `MD` dan `SM` memperluas area sentuh tak-kasatmata menjadi minimal `44px × 44px` menggunakan pseudo-element `::after` tanpa mengubah tinggi visual baris.

### 5.2 Grid Spasial `4px` & Rumus *Nested Radius*
- **Skala Jarak (`4px` Grid):** `4px`, `8px`, `12px`, `16px`, `20px`, `24px`, `32px`, `48px`, `64px`.
  - Celah antarkartu dalam grid: `16px` (desktop), `12px` (tablet/mobile).
  - Padding internal kartu: `20px`.
  - Gutter tepi kiri dan kanan kanvas utama: `28px` (desktop $\ge 1200\text{px}$), `20px` (tablet), `16px` (mobile) — **tepi kiri dan kanan wajib simetris (*equal edges*)**.
- **Rumus *Nested Radius* (`/unslop` §7):**
  $$\text{Radius Dalam} = \max\left(4\text{px},\; \text{Radius Luar} - \text{Padding}\right)$$
  - Kartu utama / Modal dialog: `--r-card: 12px`
  - Kontainer dalam / Kontrol LG: `--r-lg: 8px`
  - Kontrol MD / Item navigasi: `--r-md: 6px`
  - Chip / Tag / Kontrol SM: `--r-sm: 5px`
  - Lencana status (*status pill*): `999px` (hanya untuk pill status setinggi `20px`).

---

## 6. Arsitektur Tata Letak & Executive Cockpit Shell

### 6.1 Open-Plane Executive Layout
Radar POA menggunakan tata letak **Open-Plane Cockpit** dengan proporsi aplikasi desktop nyata (lebar penuh dengan batas bacaan konten `max-width: 1520px`):

```
┌────────────────────┬──────────────────────────────────────────────────────────────────────────┐
│ [Mark] Radar POA   │  Ikhtisar Eksekutif       [● Tersinkron · 15m] [Bulanan|Rentang] [Sync]  │
│ Pusat Agregasi     │  Serapan SP2D 74,2%; 32/34 kapal besar siap; 1 disparitas TU-Nakhoda.    │
│ Dit. POA · KKP RI  ├──────────────────────────────────────────────────────────────────────────┤
│                    │  ┌─────────────────┬─────────────────┬─────────────────┬──────────────┐  │
│ UTAMA              │  │ Pagu & Serapan  │ Postur Awak AKN │ Kesiapan Armada │ Kegiatan Dit.│  │
│  ● Ikhtisar        │  │ 74,2%           │ 396 personel    │ 32 / 34 kapal   │ 14 kegiatan  │  │
│    Kegiatan Dit.   │  │ SP2D Rp 11,1 M  │ POA 312 · 4 Kat │ 26 Laut · 6 Pkl │ Periode: 3   │  │
│                    │  └─────────────────┴─────────────────┴─────────────────┴──────────────┘  │
│ EVALUASI & ARMADA  │  ┌───────────────────────────────────────────────────┬────────────────┐  │
│    Kapal Terbaik   │  │ PETA TAKTIS WPPNRI 571–718 & 34 KAPAL BESAR       │ PERINGKAT WPP  │  │
│                    │  │ [Semua 34] [● 26 di Laut] [● 6 Pangkalan] [● 2 Gl]│ & KAPAL AKTIF  │  │
│ SISTEM             │  │                                                   │ 1. WPP 715 (7) │  │
│    Riwayat Laporan │  │   (Choropleth WPP + Marker Taktis 34 Kapal)       │ 2. WPP 711 (6) │  │
│    Notifikasi  [2] │  │                                                   │ 3. WPP 712 (6) │  │
│    Master Data     │  └───────────────────────────────────────────────────┴────────────────┘  │
│    Admin Panel     │  ┌───────────────────────────────────────┬────────────────────────────┐  │
│ ────────────────── │  │ KURVA SERAPAN ANGGARAN (SIKAP YTD)    │ KOMPOSISI AKN & SERTIFIKAT │  │
│ [AV] Direktur POA  │  │ (D3/Chart Linear SP2D vs Akrual)      │ (Federasi Satelit Nakhoda) │  │
└────────────────────┴──┴───────────────────────────────────────┴────────────────────────────┴──┘
```

- **Sidebar (`248px` tetap di desktop):**
  - Berada di atas `--bg-ground` (`#F3F5F8`) dengan pemisah kanan `1px solid var(--border-card)`.
  - **Puncak Sidebar (Brand Box Resmi Ditjen PSDKP):** Menampilkan **Logo Ditjen PSDKP** (`width="34" height="39"` dengan filter `url(#psdkp-crest-outline)`), judul **Radar POA** (`17px/700`), lencana `Dit. POA`, dan deskripsi `Pusat Agregasi & Executive Cockpit` — selaras penuh dengan identitas visual **SIKAP** dan **Nakhoda**.
  - Baris navigasi setinggi `34px`, jarak antarbaris `2px`, ikon SVG `16px` (`stroke-width: 1.5`), dalam satu kolom lurus (`gap: 10px`).
  - Item aktif menggunakan latar `--bg-active` (`#E1E8F0`), teks `--ink-primary` (`font-weight: 500`), dan indikator bar vertikal `2px` `--accent-radar` di sisi dalam kiri.
  - Label kelompok navigasi (`Utama`, `Sistem`) ditulis dalam **kalimat biasa (*sentence case*)** `12px` `--ink-muted` (`margin-top: 20px; margin-bottom: 6px`), bukan huruf kapital berjarak.
- **Sticky Executive Header (`backdrop-filter` — `/apple-design` §12):**
  - Baris judul halaman (`page-header`) menggunakan material translusen `background: var(--bg-glass); backdrop-filter: blur(16px) saturate(160%); border-bottom: 1px solid var(--border-card)` saat halaman digulir, menjaga kontrol filter periode dan indikator sinkronisasi tetap terjangkau tanpa memakan ruang vertikal berlebih.
- **Strip 4 Top KPI SiMata:**
  - Satu kontainer terpadu (`background: var(--bg-surface); border: 1px solid var(--border-card); border-radius: var(--r-card)`) yang dibagi menjadi 4 kolom dengan garis pemisah vertikal `1px solid var(--border-rule)`.
  - Setiap sel KPI hanya memuat: (1) Label spesifik + tag sumber satelit kecil, (2) Angka utama `26px–32px tabular-nums` + unit, (3) Trek linear tipis `4px` (jika metrik berupa rasio/persentase), dan (4) Baris kaki pembanding (`SP2D YTD vs Pagu`, `POA vs Keseluruhan`). **Tanpa ikon dekoratif bulat dan tanpa sparkline mini.**

---

## 7. Standar Visualisasi Data & Peta Taktis (`/d3-visualization` & `/unslop`)

### 7.1 Hierarki Grafik & Prinsip D3
1. **Satu Visualisasi Utama per Layar:**
   - Pada layar **Ikhtisar**, orientasi spasial utama adalah **Peta Taktis WPPNRI 571–718 & Disposisi 34 Kapal Pengawas Besar** (`2/3` lebar) berdampingan dengan **Panel Ranking WPP & Disposisi Armada** (`1/3` lebar).
   - Di bawahnya, baris analitik menampilkan **Kurva Serapan Anggaran SIKAP (SP2D vs Akrual Bulanan)** (`7/12` kolom) berdampingan dengan **Postur Pengawakan Nakhoda & Kesiapan Sertifikat** (`5/12` kolom).
2. **Pemilihan Jenis Grafik yang Tepat (`/d3-visualization`):**
   - **Tren Waktu (Bulanan YTD):** Grafik garis/area 2D lurus atau kurva monoton (`monotoneX`) dengan pengisian area sangat tipis (`opacity: 0.08`), label nilai langsung di ujung kanan garis, dan 4 garis grid horizontal `1px solid #EDF1F6`.
   - **Perbandingan Kategori (4 Kategori AKN / Top 5 Kapal Teraktif):** *Horizontal Ranked Bar List* (`barList`) — label di kiri, angka tabular rata kanan, dan batang horizontal setinggi `6px–8px` di bawahnya.
   - **Proporsi Terhadap Target (Serapan SP2D terhadap Pagu / POA terhadap AKN Keseluruhan):** *Linear Bullet / Plan Track* horizontal setinggi `8px` (`--bg-raised` sebagai trek pagu total, `--sat-sikap` atau `--accent-radar` sebagai isi realisasi).
   - **Komposisi Kondisi (BMN Baik / Rusak Ringan / Rusak Berat):** *Single Stacked Segmented Bar* horizontal setinggi `10px` dengan celah `2px` antarsegmen, disertai legenda chip berangka eksak di bawahnya.

### 7.2 Spesifikasi Peta Taktis 34 Kapal Pengawas Besar (Leaflet + GeoJSON WPPNRI)
- **Poligon Choropleth WPPNRI (571 s.d. 718):**
  - Menggunakan **satu tangga hue** (*Hydrographic Cerulean*):
    - `0 kapal`: `#F1F5F9` (stroke `#CBD5E1`)
    - `1–2 kapal`: `#BAE6FD` (stroke `#7DD3FC`)
    - `3–5 kapal`: `#38BDF8` (stroke `#0284C7`)
    - `≥ 6 kapal`: `#0369A1` (stroke `#0C4A6E`)
- **Marker Taktis 34 Kapal Pengawas:**
  - Setiap marker kapal berbentuk titik suar presisi (`12px` dengan cincin putih `2px`) yang dikodekan berdasarkan status operasional:
    - **Operasional di Laut (26 Kapal):** Cerulean (`#0369A1`)
    - **Siap Operasi di Pangkalan (6 Kapal):** Emerald (`#15803D`)
    - **Pemeliharaan di Galangan (2 Kapal):** Drydock Amber (`#B45309`)
  - Klik pada marker menampilkan kartu popup taktis bersih berisi: Nama Kapal (`KP. ORCA 01`), Kelas, Komandan, Pangkalan Homebase, WPP Penugasan, Hari Operasi YTD, dan tautan cepat **`Lihat Profil Kapal →`**.

---

## 8. Fisika Gerak & Mikro-Interaksi (`/animate`, `/emilkowalski-motion`, `/apple-design`)

Seluruh animasi di Radar POA wajib melewati **Gerbang Frekuensi & Tujuan Emil Kowalski**:

### 8.1 Gerbang Keputusan Gerak (*The Motion Gate*)
1. **Aksi Frekuensi Tinggi (100+ kali/hari — ketik filter, navigasi keyboard, fokus input):** **0ms (Instan, Tanpa Animasi).**
2. **Aksi Frekuensi Menengah (Puluhan kali/hari — tekan tombol, hover baris tabel, pindah tab/view):**
   - **Tekan Tombol (`pointer-down`):** `transform: scale(0.975)` dalam `90ms` (`--dur-press`).
   - **Hover Kontrol & Kartu Tertaut:** Hanya aktif di dalam `@media (hover: hover) and (pointer: fine)` — perubahan warna latar/border dalam `140ms`.
3. **Aksi Okasional (Buka/tutup Modal Kegiatan Direktorat, Drawer Persetujuan Akun, Toast Sinkronisasi):**
   - **Modal Masuk:** `opacity: 0 -> 1` dan `transform: scale(0.96) translateY(6px) -> scale(1) translateY(0)` dalam `200ms` dengan kurva `--ease-out`. (**Dilarang keras `scale(0)`!**)
   - **Modal Keluar:** ~75% dari durasi masuk (`150ms`) mengikuti jalur simetris yang sama.
   - **Drawer Samping (`#dr-drawer`):** `transform: translateX(100%) -> translateX(0)` dalam `240ms` dengan kurva `--ease-drawer`.

### 8.2 Token Kurva & Durasi Baku
```css
:root {
  --ease-out:    cubic-bezier(0.23, 1, 0.32, 1);     /* Kurva utama masuk/keluar elemen UI */
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);    /* Perpindahan posisi elemen di layar */
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);     /* Kurva lembar samping bergaya iOS/macOS */

  --dur-press:   90ms;   /* Respons tekan tombol seketika */
  --dur-fast:    150ms;  /* Hover, ganti tab, tooltip */
  --dur-modal:   200ms;  /* Dialog modal & popover */
  --dur-drawer:  240ms;  /* Lembar samping (drawer) */
}
```

- **Hanya Properti Kompositor GPU:** Animasi hanya diizinkan pada `transform` dan `opacity` (serta transisi warna eksplisit `background-color`, `border-color`, `color`). **Dilarang keras menggunakan `transition: all`** atau menganimasikan `width`, `height`, `top`, `left`, `margin`, atau `padding`.
- **Aksesibilitas Vestibular & Transparansi Wajib (`/apple-design` §14):**
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
  @media (prefers-reduced-transparency: reduce) {
    .page-header, .n-overlay {
      backdrop-filter: none !important;
      background: var(--bg-surface) !important;
    }
  }
  ```

---

## 9. Spesifikasi Komponen Kunci Radar POA

### 9.1 Indikator Telemetri & Sinkronisasi Satelit (`#sync-indicator`)
- Berukuran tier **MD (`32px`)** di kanan atas header halaman.
- Menampilkan titik status (`6px`), label status (`Tersinkron`, `Menyinkronkan…`, atau `Data Usang`), dan popover rincian waktu sinkronisasi terakhir beserta status koneksi satelit (`SIKAP`, `Nakhoda`, `Pusat`).
- Saat diklik oleh `SUPERADMIN`, `DIREKTUR`, atau `KADIV`, memicu `radar_triggerSyncNow(token)` untuk memutar ikon refresh (`transform: rotate(360deg)`) dan memperbarui cache 15 menit.

### 9.2 Modul Eksklusif: Form Modal & Feed Kegiatan Direktorat
- **Satu-satunya form input operasional di Radar POA** (hanya tampil untuk `SUPERADMIN`, `DIREKTUR`, dan `KADIV`).
- **Dialog Modal (`560px`):**
  - Header dialog `16px/600` dengan tombol tutup ikon SVG `X` (`32px × 32px`).
  - Seluruh input menggunakan tier **LG (`40px`)** (`#kgd-judul`, `#kgd-tanggal`, `#kgd-pihak`), `<textarea id="kgd-deskripsi">`, serta zona unggah multi-berkas `#kgd-attach` ke folder Drive `POA_Evidence_Pusat`.
  - Baris aksi bawah menggunakan `.ctl-row.ctl-lg`: tombol sekunder `Batal` dan tombol primer near-black `Simpan Kegiatan`.
- **Transparansi Baris `SUPERSEDED` & `VOID`:**
  - Entri kegiatan yang direvisi (`SUPERSEDED`) atau dibatalkan (`VOID`) tidak dihapus dari feed; baris diberi pill status resmi (`Ditimpa` / `Dianulir`) dan menampilkan `VoidReason` secara transparan di bawah deskripsi atau di dalam modal detail.

### 9.3 Tabel Eksekutif & Aksi Baris Tier SM
- Header tabel `12px` `--ink-muted`, kalimat biasa (*sentence case*), tinggi `36px`, latar `--bg-ground` tipis atau putih bersih dengan garis bawah `1px solid var(--border-card)`.
- Tinggi baris data `44px`, dipisahkan garis `1px solid var(--border-rule)`, tanpa belang *zebra* yang mencolok.
- Kolom angka rata kanan (`text-align: right`) dengan header rata kanan sejajar.
- Kolom aksi di paling kanan menggunakan tombol tier **SM (`26px`)** di dalam `.ctl-row.ctl-sm`.

---

## 10. Daftar Larangan Mutlak (*Negative Prompts & Anti-Slop Gate*)

Setiap pelanggaran pada daftar ini merupakan cacat desain dan wajib ditolak saat review maupun audit otomatis:

1. **Zero-Emoji Policy:** Dilarang keras menggunakan karakter emoji unicode (`🚢`, `📊`, `✨`, `🚀`, `👋`, dsb.) di seluruh teks label, judul, tombol, badge, toast, dan pesan kosong/galat. Gunakan 100% ikon garis SVG inline (`stroke-width: 1.5` atau `2`).
2. **Dilarang Spektrum Ungu/Violet & Gradasi AI:** Tidak ada warna ungu/indigo/violet (`OKLCH hue 270°–330°`), tidak ada *gradient text*, tidak ada *colored glow shadow*, dan tidak ada *background blob/orb*.
3. **Dilarang *Circular Gauge* / Speedometer / 3D Chart / Pie $> 4$ Kategori:** Gunakan *linear progress/bullet bar* horizontal dan angka `tabular-nums`.
4. **Dilarang Huruf Kapital Berjarak (*Tracked Uppercase Labels*):** Jangan gunakan `text-transform: uppercase; letter-spacing: 0.1em` pada label kartu atau navigasi. Gunakan kalimat biasa (*sentence case*) dengan hierarki ukuran dan warna `--ink-muted`.
5. **Dilarang Kartu KPI Berikon Bulat & Sparkline Hias:** Kartu KPI adalah tipografi angka dan konteks pembandingnya, bukan tempat menaruh ikon di dalam lingkaran berwarna.
6. **Dilarang `transition: all`, `scale(0)`, `ease-in`, dan Animasi Tanpa Henti:** Jangan gunakan `animate-pulse` atau `bounce` pada elemen yang tidak sedang memuat proses aktif secara *real-time*.
7. **Dilarang `style="height: ..."` pada Elemen Kontrol:** Seluruh tinggi kontrol wajib dikendalikan oleh sistem class 3-tier (`LG: 40px`, `MD: 32px`, `SM: 26px`).
8. **Dilarang Copywriting Berlebihan & Sapaan Kosong:** Tidak ada `"Selamat datang kembali!"`, tidak ada tanda seru (`!`), dan tidak ada titik di akhir label pendek atau tombol.
9. **Dilarang Form Input Operasional Satelit di Radar POA:** Radar POA tidak boleh memiliki form input untuk Tata Usaha, BMN, Pengawakan, Logistik, Perawatan, Operasi, Intelijen, atau Pemantauan.

---

## 11. Checklist Penerimaan Desain (*Finish-Gate Review*)

Sebelum sebuah iterasi antarmuka dinyatakan selesai:
- [ ] **5-Second Executive Test:** Apakah 4 KPI utama, kalimat temuan otomatis, dan peta 34 kapal langsung terbaca dalam 5 detik pertama tanpa gangguan dekorasi?
- [ ] **92% Neutral Ratio:** Apakah krom permukaan bersih dari warna-warni berlebih sehingga warna hanya menyala pada data (**Cerulean Radar**, **Jade SIKAP**, **Orange Nakhoda**, dan **Status Semantik**)?
- [ ] **3-Tier Control Cohesion:** Apakah `_uiAudit()` di browser melaporkan `0 violations` untuk seluruh baris kontrol (`40px`, `32px`, `26px`)?
- [ ] **Tabular Numerics & Alignment:** Apakah seluruh nominal Rupiah, persentase, jumlah personel AKN, dan skor kapal memakai `tabular-nums` dan sejajar rata kanan di tabel?
- [ ] **Motion & Accessibility Gate:** Apakah semua transisi hanya menganimasikan `transform`/`opacity` di bawah `250ms` dengan dukungan penuh `prefers-reduced-motion: reduce`?
- [ ] **Zero-Emoji & Zero-Slop:** Apakah seluruh file `.html` dan `.js` bebas dari emoji, bebas dari gradasi ungu, dan bebas dari *box-in-box* berlebih?

