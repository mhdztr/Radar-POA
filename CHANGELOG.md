# CHANGELOG.md

## [Fase R0 — Penyelarasan Dokumentasi & Kontrak Redesign UI v2.0] — 23 Nov 2026
**Status:** Selesai

**Temuan Critique Playwright & Pembaruan Kontrak:**
- Mengidentifikasi 6 masalah prioritas melalui audit DOM Playwright (`38` marker overlap di peta 34 kapal, `32` distinct background colors & tinggi `3.086px` karena duplikasi 6 kartu divisi di `Ikhtisar`, `brokenControlRows` `26px` vs `32px` pada toolbar header, double-toast popover sync, framing foto login terpotong, bug `(rows || []).map is not a function` & kontradiksi TW I/TW II serta kapal Galangan Juara 1).
- Menetapkan arsitektur **UI Redesign 4 Fase (`R1`–`R4`)** pada `DESIGN.md` v2.0, `PHASES.md`, `PRD.md`, `ARCHITECTURE.md`, `DATA_SCHEMA.md`, `AGENTS.md`, dan `README.md`:
  - Shell **Top Institutional Bar (`56px`) + Floating Bottom Maritime Dock (`#0E1722`)** + Mobile Overflow Sheet.
  - Peta 34 Kapal berikon siluet SVG berbeda per kelas (`KELAS_I`–`KELAS_V`), layout `68/32`, `0` label menumpuk (`markerOverlaps === 0`).
  - Hierarki `Ikhtisar`: Strip 4 KPI tenang, Analitik asimetris `65/35`, dan **1 Tabel Monitoring Eksekutif Lintas Satelit (`executiveGrid`)** (`<= 2.000px`).
  - Standarisasi `Kapal Terbaik` (podium non-Galangan), `Profil Kapal`, dan 5 halaman sekunder beserta **Calendar Picker Anti-Ketik Manual**.

---

## [Auth Upgrade — Auto-Seed Akun Default & Login Multi-Identifier] — 23 Nov 2026
**Status:** Selesai

**Pencapaian:**
- Menambahkan `ensurePusatSpreadsheet()`, `_autoCreateMasterSheet()`, `_ensureSuperadminSeeded()` di `data/SheetAccess.js` dan `setup_seedSuperadmin()` di `Code.js`.
- Memperbarui `auth_login()` di `services/AuthService.js` untuk mendukung login via Email, NIP ternormalisasi, dan alias peran baku dengan proteksi *brute-force lockout* 5x / 15 menit.
- Membersihkan sisa penamaan lama (`Nautika` / `_NAUTIKA_CHARTS`) di backend dan frontend.

---

## [Fase 2 s.d. Fase 4 — Aggregator SIKAP/Nakhoda, Design System Awal, & Dasbor Pimpinan] — 20 Nov 2026
**Status:** Selesai

**Pencapaian:**
- Pembangunan `AggregatorService.js` (SIKAP, Nakhoda, Pusat) dengan `CacheService` 15 menit dan `RiwayatService.js`.
- Implementasi Split Auth 50/50 fotografis dengan Logo Ditjen PSDKP (`html/AuthPhoto.html`), `Style.html`, `Script_Charts.html`, kalimat temuan dinamis, dan harness Playwright `tests/visual_audit.js`.

---

## [Fase 0 & Fase 1 — Initialization, Skills Migration, & Anti-Monolith Cleanup] — 26 Okt 2026
**Status:** Selesai

**Pencapaian:**
- Inisialisasi repositori terpisah untuk Radar POA (`1qLwCu-2tmCuA8_ICOI8SpystzSP25rGyVftvEPKwFS65K-bnBareyFY4`).
- Migrasi 51 design & engineering skills ke `.agents/skills/` dan penghapusan 20 file form input operasional satelit warisan Nautika.
- Pembaruan `AGENTS.md` dengan aturan non-negotiable aggregator-only dan format commit single-line bahasa Inggris.
