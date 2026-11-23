# Radar POA (Rekapitulasi Data Strategis POA)

![Runtime: Google Apps Script](https://img.shields.io/badge/runtime-Google%20Apps%20Script-4285F4?logo=google&logoColor=white)
![Status: internal use](https://img.shields.io/badge/status-internal%20use-orange)
![Language: JavaScript](https://img.shields.io/badge/language-JavaScript-f7e03a?logo=javascript&logoColor=black)

> **Pusat Agregasi Data Strategis — Direktorat Pengendalian Operasi Armada, Ditjen PSDKP, KKP RI.**

Radar POA adalah dashboard eksekutif yang mengonsolidasikan data armada dan kegiatan dari aplikasi satelit mandiri (**SIKAP**, **Sistik**, **Nakhoda**, **Siaga**) serta subsistem eksternal menjadi satu tampilan strategis nasional. Radar POA juga merupakan portal input eksklusif untuk pelaporan **Kegiatan Direktorat**.

> **Status:** aplikasi internal KKP RI. Tidak ada lisensi open-source yang diberikan. Lihat [Penggunaan & Lisensi](#penggunaan--lisensi).

## Daftar Isi

- [Peran dalam Ekosistem POA](#peran-dalam-ekosistem-poa)
- [Fitur Utama](#fitur-utama)
- [Identitas Teknis](#identitas-teknis)
- [Arsitektur Singkat](#arsitektur-singkat)
- [Struktur Repositori](#struktur-repositori)
- [Prasyarat](#prasyarat)
- [Instalasi & Deployment](#instalasi--deployment)
- [Konfigurasi](#konfigurasi)
- [Pengujian & QA](#pengujian--qa)
- [Dokumentasi](#dokumentasi)
- [Repositori Terkait](#repositori-terkait)
- [Penggunaan & Lisensi](#penggunaan--lisensi)

## Peran dalam Ekosistem POA

Radar POA berkedudukan sebagai **aggregator**, bukan pengumpul input operasional harian. Seluruh form transaksi teknis berada di aplikasi satelit masing-masing; Radar POA membaca, mengagregasi, dan menyajikan hasilnya.

| Aplikasi | Fokus | Hubungan dengan Radar POA |
| --- | --- | --- |
| [SIKAP](https://github.com/mhdztr/SIKAP) | Anggaran, pengadaan, kepegawaian, BMN | Sumber data satelit |
| [Nakhoda](https://github.com/mhdztr/Nakhoda) | Pengawakan, kompetensi, sertifikasi awak | Sumber data satelit |
| Sistik | Sistem informasi satelit terkait | Sumber data satelit |
| Siaga | Sistem informasi satelit terkait | Sumber data satelit |
| **Radar POA** | Agregasi eksekutif + Kegiatan Direktorat | Pusat federasi data |

Konsekuensi desain ini: tidak ada form input operasional teknis di Radar POA. Satu-satunya form input di aplikasi ini adalah **Kegiatan Direktorat**, dengan *Calendar Picker* anti-ketik-manual.

## Fitur Utama

- **Agregasi eksekutif nasional** — metrik armada, klasifikasi kapal `KELAS_I`–`KELAS_V`, dan `executiveGrid` dihitung seluruhnya di backend GAS.
- **Federasi lintas spreadsheet** — konsolidasi data dari spreadsheet satelit tanpa memindahkan kepemilikan data.
- **Peringkat Kapal Terbaik** — *scoring* server-side dengan label manusiawi, bukan enum mentah.
- **Manajemen Kegiatan Direktorat** — input, riwayat, bukti fisik, dan notifikasi terkait.
- **Self-healing spreadsheet & auth** — inisialisasi ulang struktur data dan akun saat lingkungan belum siap.
- **In-memory `CacheService`** — mengurangi baca spreadsheet berulang pada jalur agregasi.
- **RBAC berjenjang** — `SUPERADMIN`, `DIREKTUR`, `KADIV`, `STAF` dengan kebijakan akses terpisah.
- **Audit visual Playwright** — pemeriksaan layout desktop, laptop, dan mobile dengan *quality gates*.

## Identitas Teknis

| Item | Nilai |
| --- | --- |
| Script ID (Google Apps Script) | `1qLwCu-2tmCuA8_ICOI8SpystzSP25rGyVftvEPKwFS65K-bnBareyFY4` |
| Repositori | https://github.com/mhdztr/Radar-POA |
| Spreadsheet basis data | `RadarPOA_Pusat_DB` (dibuat otomatis via `ensurePusatSpreadsheet()` / `setup_seedSuperadmin()`) |
| Spreadsheet data mart | `RadarPOA_Looker_Mart` |
| Folder bukti (Drive) | `POA_Evidence_Pusat` |
| Runtime | Google Apps Script (V8), JavaScript |
| Antarmuka | HTML/CSS/JS Apps Script SPA |

## Arsitektur Singkat

```text
Aplikasi satelit (SIKAP / Sistik / Nakhoda / Siaga)
        |
        | federasi lintas spreadsheet (read-only)
        v
Spreadsheet satelit  --->  AggregatorService.js
                            DashboardService.js     --->  CacheService
                                    |
                                    v
                            html/Index.html (SPA)
                            Top Institutional Bar
                            Floating Bottom Maritime Dock
```

- `services/AggregatorService.js` dan `services/DashboardService.js` adalah satu-satunya tempat kalkulasi metrik nasional.
- `data/SheetAccess.js` menyediakan akses spreadsheet dengan mekanisme *self-healing*.
- `utils/Lock.js` membungkus eksekusi kritis dengan `LockService`.
- Frontend tidak dipercaya untuk kalkulasi bisnis inti.

## Struktur Repositori

```text
Radar-POA/
├── Code.js                     # Handler doGet() + diagnostik sistem
├── appsscript.json             # Manifest Apps Script (runtime V8, scopes)
├── .claspignore                # Filter agar docs/test tidak ikut ter-push ke GAS
├── services/                   # Business logic backend
│   ├── AggregatorService.js    # Agregasi & federasi data satelit
│   ├── DashboardService.js     # executiveGrid, metrik, peringkat kapal
│   ├── KegiatanDirektoratService.js
│   ├── AuthService.js          # Sesi, RBAC, self-healing auth
│   ├── AdminService.js
│   ├── MasterDataService.js
│   ├── EvidenceService.js      # Bukti fisik di Google Drive
│   ├── NotifikasiService.js
│   └── RiwayatService.js
├── data/
│   └── SheetAccess.js          # Akses & self-healing spreadsheet
├── utils/
│   ├── Constants.js            # ID master, enum peran, pemetaan sheet
│   ├── DateUtil.js
│   └── Lock.js                 # Wrapper LockService
├── html/                       # Presentation layer (SPA)
│   ├── Index.html
│   ├── Style.html              # Design system v2.0
│   ├── Script_Main.html
│   ├── Script_Charts.html
│   ├── AuthPhoto.html
│   └── views/                  # Partial: Admin, KapalTerbaik, Kegiatan,
│                               # MasterData, Notifikasi, Riwayat
├── tests/
│   ├── visual_audit.js         # Audit Playwright 3 viewport
│   └── screenshots/            # Artefak audit (tidak ikut ke GAS)
├── PRD.md, ARCHITECTURE.md, DATA_SCHEMA.md,
├── DESIGN.md, PHASES.md, CHANGELOG.md, AGENTS.md
└── .agent/                     # Design & engineering skills untuk agent
```

## Prasyarat

- Akun Google dengan akses edit ke spreadsheet dan Drive folder di atas.
- Node.js 18+ (untuk audit Playwright).
- Google Clasp: `npm install -g @google/clasp`.
- Chrome/Chromium untuk menjalankan audit visual.

## Instalasi & Deployment

```bash
# 1. Klon repositori
git clone https://github.com/mhdztr/Radar-POA.git
cd Radar-POA

# 2. Autentikasi Clasp
clasp login

# 3. Inisialisasi akun & spreadsheet (sekali saat lingkungan baru)
#    Dari editor Apps Script, atau:
clasp run setup_seedSuperadmin

# 4. Push kode ke container GAS
clasp push

# 5. Deploy Web App melalui editor Apps Script
#    Deploy > New deployment > Web app > Execute as: me > Access: sesuai kebijakan
```

`clasp run setup_seedSuperadmin` mengisi empat akun awal: `SUPERADMIN`, `DIREKTUR`, `KADIV`, `STAF`. Login pertama kali juga memicu auto-seed yang sama.

## Konfigurasi

- **Script Properties** dikonfigurasi melalui Project Settings di editor Apps Script.
- ID spreadsheet pusat, data mart, dan folder evidence mengikuti nilai di tabel [Identitas Teknis](#identitas-teknis).
- Perubahan enum, pemetaan sheet, dan batas file berada di `utils/Constants.js`.
- `DESIGN.md` adalah kontrak sistem desain v2.0; jangan menaruh jargon teknis atau enum mentah di antarmuka pengguna.

## Pengujian & QA

```bash
# Audit visual Playwright: 1440x900, 1024x768, 390x844
node tests/visual_audit.js
```

Hasil screenshot tersimpan di `tests/screenshots/` dan dikecualikan oleh push GAS lewat `.claspignore`. Quality gates yang wajib lolos: `pageErrors === 0`, `overflowX === 0`, `markerOverlaps === 0`, `brokenControlRows === 0`, `tinyTextCount === 0`, `clippedCount === 0`.

```bash
# Verifikasi sintaks JavaScript
node -c Code.js services/*.js utils/*.js data/*.js
```

## Dokumentasi

| Dokumen | Isi |
| --- | --- |
| [PRD.md](PRD.md) | Kebutuhan fungsional, RBAC, klasifikasi 34 kapal, aturan bisnis |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Aggregator engine, self-healing, `CacheService`, federasi |
| [DATA_SCHEMA.md](DATA_SCHEMA.md) | Skema tabel transaksi, master kapal Kelas I–V, autentikasi |
| [DESIGN.md](DESIGN.md) | Kontrak desain v2.0, *Floating Bottom Maritime Dock*, QA gates |
| [PHASES.md](PHASES.md) | Roadmap dan fase aktif R1–R4 |
| [CHANGELOG.md](CHANGELOG.md) | Riwayat pembaruan sistem |
| [AGENTS.md](AGENTS.md) | Instruksi dan batasan kerja coding agent |

## Repositori Terkait

- [SIKAP](https://github.com/mhdztr/SIKAP) — keuangan, anggaran, kepegawaian, BMN.
- [Nakhoda](https://github.com/mhdztr/Nakhoda) — pengawakan dan sertifikasi awak armada.

## Penggunaan & Lisensi

Aplikasi internal Kementerian Kelautan dan Perikanan Republik Indonesia (Ditjen PSDKP / Direktorat POA). **Tidak ada lisensi open-source yang diberikan** atas kode, dokumentasi, atau aset dalam repositori ini. Penggunaan, reproduksi, dan distribusi hanya dengan izin pemilik sistem.
