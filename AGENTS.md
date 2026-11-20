zzzzzzzzzzzzzzzzzzzzzz# AGENTS.md — Panduan Kerja Agent: Radar POA

## 1. Urutan Baca Wajib
1. `PRD.md` — Sumber kebenaran tertinggi mengenai kebutuhan agregasi dan kegiatan direktorat.
2. `ARCHITECTURE.md` — Arsitektur teknis, federasi lintas spreadsheet, dan in-memory caching.
3. `DATA_SCHEMA.md` — Skema persis seluruh tabel, jangan mengarang nama kolom.
4. `DESIGN.md` — Kontrak sistem desain *ground-up* Radar POA (hasil sintesis skill `unslop`, `design-taste-frontend`, `colorize`, `apple-hig`, `apple-design`, `d3-visualization`, `animate`, dan `emilkowalski-motion`).
5. `.agents/skills/` — Koleksi *design & engineering skills* acuan implementasi UI/UX.
6. `PHASES.md` — Roadmap dan rencana tahapan kerja aktif.

## 2. Aturan Keras & Non-Negotiable
- **Git & GitHub Hanya Milik User:** Agent dilarang menjalankan perintah `git add`, `git commit`, `git push`, dsb. Agent hanya bertugas menyiapkan kode, mengingatkan user, dan **selalu menyertakan usulan *commit message* di akhir respons setiap kali selesai mengerjakan satu iterasi/perubahan**.
- **Radar POA Sebagai Aggregator:** Dilarang membuat form input operasional harian teknis di Radar POA. Form input eksklusif di Radar POA HANYA untuk Kegiatan Direktorat.
- **Kalkulasi Selalu Server-Side:** Seluruh agregasi metrik nasional dihitung di backend GAS via `AggregatorService.js` dan `DashboardService.js`.
- **Utamakan Design Skills:** Seluruh perancangan visual, tipografi, tata letak, dan CSS baru wajib merujuk pada skill di `.agents/skills/` (seperti `design-taste-frontend`, `impeccable`, `apple-design`, `apple-hig`, `unslop`, `d3-visualization`, `ui-ux-pro-max`).
- **Wajib Screenshot Playwright & Visual Self-Judgment:** Setiap perubahan UI wajib di-render dan di-screenshot melalui Playwright (`tests/visual_audit.js`) untuk desktop & mobile, lalu seluruh gambar screenshot wajib dibuka (`read_file`) dan dinilai langsung oleh agent untuk memverifikasi kesesuaian desain serta memperbaiki cacat visual sebelum iterasi dianggap selesai.
