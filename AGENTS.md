# AGENTS.md — Panduan Kerja Agent: Radar POA

## 1. Urutan Baca Wajib
1. `PRD.md` — Sumber kebenaran tertinggi mengenai kebutuhan agregasi dan kegiatan direktorat.
2. `ARCHITECTURE.md` — Arsitektur teknis, federasi lintas spreadsheet, self-healing auth, dan in-memory caching.
3. `DATA_SCHEMA.md` — Skema persis seluruh tabel, klasifikasi kapal `KELAS_I`–`KELAS_V`, serta konversi enum ke label manusiawi.
4. `DESIGN.md` — Kontrak sistem desain v2.0 *ground-up* Radar POA (hasil sintesis skill `unslop`, `frontend-design`, `design-taste-frontend`, `apple-design`, `apple-hig`, `emilkowalski-motion`, `d3-visualization`, `color-expert`, dan `impeccable`).
5. `.agents/skills/` — Koleksi *design & engineering skills* acuan implementasi UI/UX.
6. `PHASES.md` — Roadmap dan rencana tahapan kerja aktif (termasuk `Fase R1`–`R4`).

## 2. Aturan Keras & Non-Negotiable
- **Git & GitHub Hanya Milik User:** Agent dilarang menjalankan perintah `git add`, `git commit`, `git push`, dsb. Agent hanya bertugas menyiapkan kode, mengingatkan user, dan **selalu menyertakan usulan *commit message* di akhir respons setiap kali selesai mengerjakan satu iterasi/perubahan** dengan aturan ketat: wajib **berbahasa Inggris**, hanya **1 baris** (*single-line*, tanpa *body* tambahan), dan mengikuti format prefiks standar `<type>: <summary>` tanpa tanda kurung *scope* (hanya boleh seperti `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `style:`, `test:`, `perf:`, `build:`, `ci:`).
- **Radar POA Sebagai Aggregator:** Dilarang membuat form input operasional harian teknis di Radar POA. Form input eksklusif di Radar POA HANYA untuk Kegiatan Direktorat (dengan Calendar Picker Anti-Ketik Manual).
- **Kalkulasi Selalu Server-Side:** Seluruh agregasi metrik nasional, klasifikasi armada, scoring kapal terbaik, dan `executiveGrid` dihitung di backend GAS via `AggregatorService.js` dan `DashboardService.js`.
- **Utamakan Design Skills & Kebersihan Bahasa UI:** Seluruh perancangan visual, tipografi (`Public Sans`), tata letak (*Two-Tier Institutional Top Header* desktop + *Flush Mobile Bottom Tab Bar*), dan CSS wajib merujuk pada `.agents/skills/` serta `DESIGN.md` v2.0. Dilarang membocorkan jargon teknis/database atau referensi internal developer (`PRD §6`, `SUPERSEDED & VOID`, ID mentah `USR-*`, atau token enum mentah tanpa konversi) ke antarmuka pengguna, dan dilarang memakai kata/frasa terlarang yang dilarang di `DESIGN.md`.
- **Wajib Screenshot Playwright, DOM Quality Gates, & Visual Self-Judgment:** Setiap perubahan UI wajib dijalankan melalui Playwright (`tests/visual_audit.js`) untuk desktop (`1440×900`), laptop (`1024×768`), dan mobile (`390×844`), menyimpan screenshot ke `tests/screenshots/`, memenuhi seluruh DOM quality gates (`pageErrors === 0`, `overflowX === 0`, `markerOverlaps === 0`, `brokenControlRows === 0`, `tinyTextCount === 0`, `clippedCount === 0`, `distinctBg <= 16` di Ikhtisar), lalu **seluruh gambar screenshot wajib dibuka (`read_file`) dan dinilai langsung oleh agent** untuk memverifikasi kesesuaian desain serta memperbaiki cacat visual sebelum iterasi dianggap selesai.
