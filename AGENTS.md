# AGENTS.md — Panduan Kerja Agent: Radar POA

## 1. Urutan Baca Wajib
1. `PRD.md` — Sumber kebenaran tertinggi mengenai kebutuhan agregasi dan kegiatan direktorat.
2. `ARCHITECTURE.md` — Arsitektur teknis, federasi lintas spreadsheet, dan in-memory caching.
3. `DATA_SCHEMA.md` — Skema persis seluruh tabel, jangan mengarang nama kolom.
4. `.agents/skills/` — Koleksi *design & engineering skills* (hasil gabungan dari **Nakhoda** dan **SIKAP**) yang menjadi acuan utama perancangan UI/UX dari *ground-up*.
5. `PHASES.md` — Roadmap dan rencana tahapan kerja aktif.

*(Catatan: `DESIGN.md` dan `html/Style.html` lama telah dihapus secara sengaja agar desain antarmuka Radar POA dibangun ulang dari ground-up dengan memprioritaskan skill di `.agents/skills/`.)*

## 2. Aturan Keras & Non-Negotiable
- **Git & GitHub Hanya Milik User:** Agent dilarang menjalankan perintah `git add`, `git commit`, `git push`, dsb. Agent hanya bertugas menyiapkan kode, mengingatkan user, dan **selalu menyertakan usulan *commit message* di akhir respons setiap kali selesai mengerjakan satu iterasi/perubahan**.
- **Radar POA Sebagai Aggregator:** Dilarang membuat form input operasional harian teknis di Radar POA. Form input eksklusif di Radar POA HANYA untuk Kegiatan Direktorat.
- **Kalkulasi Selalu Server-Side:** Seluruh agregasi metrik nasional dihitung di backend GAS via `AggregatorService.js` dan `DashboardService.js`.
- **Utamakan Design Skills:** Seluruh perancangan visual, tipografi, tata letak, dan CSS baru wajib merujuk pada skill di `.agents/skills/` (seperti `design-taste-frontend`, `impeccable`, `apple-design`, `apple-hig`, `unslop`, `d3-visualization`, `ui-ux-pro-max`).
