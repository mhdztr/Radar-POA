# Radar POA (Rekapitulasi Data Strategis POA)
> **Pusat Agregasi Strategis & Executive Cockpit — Dit. POA (Ditjen PSDKP - KKP)**

- **Script ID (Google Apps Script):** `1qLwCu-2tmCuA8_ICOI8SpystzSP25rGyVftvEPKwFS65K-bnBareyFY4`
- **Repositori GitHub:** `https://github.com/mhdztr/Radar-POA.git`
- **Spreadsheet Basis Data:** `RadarPOA_Pusat_DB`
- **Spreadsheet Data Mart:** `RadarPOA_Looker_Mart`
- **Drive Folder Evidence:** `POA_Evidence_Pusat`
- **Peran Sistem:** Pusat agregasi eksekutif nasional yang mengonsolidasi data dari 4 aplikasi satelit mandiri (**SIKAP**, **Sistik**, **Nakhoda**, **Siaga**) dan subsistem eksternal, serta menjadi portal input eksklusif bagi pelaporan **Kegiatan Direktorat**.

## Referensi Wajib
1. `PRD.md` — Kebutuhan fungsional dan aturan bisnis (Sumber kebenaran tertinggi).
2. `ARCHITECTURE.md` — Struktur aggregator engine, in-memory CacheService, dan cross-spreadsheet federation.
3. `DATA_SCHEMA.md` — Skema kolom tabel transaksi dan master.
4. `.agents/skills/` — Koleksi skill desain & engineering dari Nakhoda dan SIKAP (pengganti `DESIGN.md` lama untuk perancangan UI dari ground-up).
5. `PHASES.md` — Roadmap dan rencana pengembangan bertahap.
6. `AGENTS.md` — Instruksi dan batasan kerja bagi coding agent.
