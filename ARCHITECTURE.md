# ARCHITECTURE.md — Arsitektur Teknis

## Peran Sistem
Radar POA = **Central Aggregator & Strategic Dashboard**. Mengkonsolidasi data dari 4 aplikasi satelit dan ingesti eksternal. Satu-satunya input pusat: **Kegiatan Direktorat**.

## Topologi
Federasi lintas-spreadsheet:
- Sumber: `RadarPOA_TU_DB`, `RadarPOA_Logistik_DB`, `RadarPOA_Pengawakan_DB`, `RadarPOA_Harwat_DB`, spreadsheet eksternal tim lain
- Target agregasi: tampilan eksekutif + `RadarPOA_Pusat_DB` (TX_KegiatanDirektorat)
- Master Data: `RadarPOA_Master_DB` (baca)

## Struktur Folder GAS
- `utils/` — Constants, DateUtil, Lock, helpers
- `services/` — `AggregatorService.js`, `KegiatanDirektoratService.js`, dsb
- `data/` — SheetAccess, ValidationRules
- `html/` — Index, Style, Script_Main/Charts, views

## Aggregator Engine
- `SpreadsheetApp.openById()` untuk tarik batch
- `CacheService.getScriptCache()` dengan TTL ~900 detik
- Tombol **Sinkronkan Data / Sync Now** untuk invalidate cache
- Hanya baca sheet dengan `Status == 'ACTIVE'` dimana relevan

## Modul Kegiatan Direktorat
- Disimpan di `RadarPOA_Pusat_DB` sheet `TX_KegiatanDirektorat`
- RBAC: `SUPERADMIN`, `DIREKTUR`, `KADIV` saja (server-side assertion)
- Versioning: `SUPERSEDED` + `VOID` dengan alasan wajib
- Evidence: file upload atau Drive link copy

## LockService
Wajib untuk semua endpoint tulis (terutama Kegiatan Direktorat).

## Keamanan
Tidak ada rahasia hardcoded. Menggunakan `PropertiesService` bila diperlukan.
