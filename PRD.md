# PRD.md — Product Requirements Document

## Nama Proyek
**Radar POA** (Rekapitulasi Data Strategis POA) — Aplikasi Pusat Aggregator & Executive Cockpit

## Latar Belakang
Transformasi Nautika menjadi Radar POA beralih fungsi menjadi aggregator dashboard eksekutif murni yang mengonsolidasi data dari aplikasi satelit dan modul eksternal. Satu-satunya modul input eksklusif adalah **Kegiatan Direktorat**.

## Tujuan
Menyajikan data agregasi strategis Direktorat POA secara real-time/near real-time untuk pimpinan (Direktur, Eselon, Kadiv) dalam satu tampilan terpadu.

## Ruang Lingkup
- **Modul Kegiatan Direktorat (Input Eksklusif)**: Pre-Award Meeting, Rapat Koordinasi, Kunjungan Kerja Direktur, Monitoring ABT Pimpinan, Serah Terima, dll. RBAC terbatas (SUPERADMIN, DIREKTUR, KADIV).
- **Aggregator Engine**: Penarikan data dari 4 aplikasi satelit (SISTIK/TU, SIKAP/Logistik, SIAGA/Pengawakan, Nakhoda/Harwat) + spreadsheet eksternal (Operasi Laut/Udara, Intelijen, Pelayanan VMS).
- **Executive Dashboard (SiMata-style)**: 4 KPI cards, Peta Taktis 34 Kapal Pengawas Besar, Executive Monitoring Grid 8 Unit Kerja, Feed Kegiatan Direktorat, Peringkat Kapal Terbaik Triwulan.
- **Data Mart**: Sinkronisasi ke `RadarPOA_Looker_Mart` untuk Looker Studio.
- **Caching**: CacheService (TTL ~15 menit) + tombol "Sinkronkan Data" / "Sync Now".

## Batasan
- Bukan aplikasi input untuk Operasi/Intelijen/Pelayanan (hanya ingest dari spreadsheet mereka)
- Modul input utama kecuali Kegiatan Direktorat TIDAK berada di Radar POA
- Semua agregasi dihitung server-side

## RBAC
- **SUPERADMIN/DIREKTUR/KADIV**: Akses penuh dashboard + input/modifikasi/anulir Kegiatan Direktorat
- **Staf**: Hanya view dashboard sesuai scope (tanpa akses form Kegiatan Direktorat)

## Referensi
Master Blueprint v2.1.0 - BAB 8 (Radar POA)
