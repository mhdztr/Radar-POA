# ARCHITECTURE.md — Arsitektur Teknis: Radar POA
**Rekapitulasi Data Strategis POA (Pusat Agregasi & Executive Cockpit)**

## 1. Topologi Sistem & Ekosistem
- **Runtime:** Google Apps Script (HTML Service + V8 JavaScript Engine)
- **Database Utama:** Google Spreadsheet `RadarPOA_Pusat_DB`
- **Database Data Mart:** Google Spreadsheet `RadarPOA_Looker_Mart`
- **File Storage:** Google Drive Folder `POA_Evidence_Pusat`
- **Satelit Ingestion:** Menghubungkan secara federated ke:
  - `RadarPOA_SIKAP_DB`
  - `RadarPOA_Sistik_DB`
  - `RadarPOA_Nakhoda_DB`
  - `RadarPOA_Siaga_DB`
  - Spreadsheet Operasi, Intelijen, dan Pelayanan.

## 2. Struktur Modul & Layanan Backend
```
services/
├── AggregatorService.js      # Engine konsolidasi lintas spreadsheet & caching
├── KegiatanDirektoratService.js # CRUD & Feed kegiatan strategis pimpinan
├── DashboardEksekutifService.js # Kalkulasi metrik SiMata & 34 Kapal Taktis
├── LookerMartService.js      # Batch ETL sinkronisasi ke Looker Mart
├── MasterService.js          # Pembacaan master kapal, WPP, dan opsi
└── AuditService.js           # Pencatatan audit log pimpinan
```

## 3. Konvensi Fungsi Layanan (Service Functions)
- `radar_getExecutiveDashboard(token, filter)`: Mengembalikan seluruh payload SiMata KPI, Peta 34 Kapal, dan Grid 8 Divisi.
- `radar_triggerSyncNow(token)`: Invalidate cache dan melakukan query segar ke seluruh spreadsheet satelit.
- `kegiatan_submit(token, payload)`: Pencatatan kegiatan direktorat baru + upload lampiran ke Drive.
- `kegiatan_getFeed(token, filter)`: Mengambil timeline feed kronologis kegiatan pimpinan.
- `looker_syncMart(token)`: Eksekusi batch writing tabel mart flat bersih.

## 4. Mekanisme Ingestion & Cache In-Memory
1. Saat dashboard diakses, `AggregatorService` memeriksa `CacheService.getScriptCache()`.
2. Jika cache hit ($< 15$ menit), kembalikan data agregasi dalam waktu $< 300$ ms.
3. Jika cache miss atau tombol "Sync Now" ditekan:
   - Gunakan `SpreadsheetApp.openById()` ke masing-masing spreadsheet satelit secara batch.
   - Ambil seluruh baris `Status == 'ACTIVE'` menggunakan `Range.getValues()`.
   - Hitung metrik nasional, simpan ke CacheService (TTL: 900 detik), dan kirim ke frontend.
