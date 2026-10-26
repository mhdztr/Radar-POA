# PHASES.md — Roadmap & Status Fase

## Proyek
**Nama Proyek:** Radar POA (Pusat Aggregator & Executive Cockpit)  
**Repositori:** https://github.com/mhdztr/Radar-POA.git  
**Apps Script ID:** 1qLwCu-2tmCuA8_ICOI8SpystzSP25rGyVftvEPKwFS65K-bnBareyFY4

## Status Keseluruhan
**Status:** Fase 1 Selesai — Siap Fase 2

## Daftar Fase

| Fase | Nama | Status | Target | Keterangan |
|---|---|---|---|---|
| Fase 1 | Initialization & Project Setup (Establishment) | Selesai | 26 Okt 2026 | Repo, clasp, seluruh dokumen wajib, struktur dasar, konfigurasi awal |
| Fase 2 | Modul Kegiatan Direktorat (Input Eksklusif) | Belum Mulai | - | Form modal, penyimpanan ke `RadarPOA_Pusat_DB` (TX_KegiatanDirektorat), feed kronologis interaktif, RBAC ketat, versioning/anulir + evidence |
| Fase 3 | Aggregator Engine & Federasi Data | Belum Mulai | - | `AggregatorService.js`, pembacaan batch dari 4 satelit + eksternal via `SpreadsheetApp.openById`, `CacheService` + Sync Now, isolasi lock |
| Fase 4 | Executive Dashboard (SiMata-style) | Belum Mulai | - | 4 KPI cards, Peta Taktis 34 Kapal Besar, Executive Monitoring Grid 8 Unit Kerja, Feed Kegiatan Direktorat, Peringkat Kapal Terbaik Triwulan |
| Fase 5 | Data Mart & Integrasi Looker Studio + Hardening | Belum Mulai | - | Cron ETL ke `RadarPOA_Looker_Mart`, pengujian performa, RBAC server-side, audit 3-tier kontrol UI, finalisasi dokumentasi |

## Prioritas Saat Ini
Fokus Fase 2: bangun modul **Kegiatan Direktorat** terlebih dahulu (satu-satunya input di pusat). Pastikan RBAC hanya SUPERADMIN/DIREKTUR/KADIV, versioning/anulir berfungsi, evidence upload/link berfungsi.
