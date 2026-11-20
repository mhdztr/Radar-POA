# PHASES.md — Roadmap Pengembangan: Radar POA
**Rekapitulasi Data Strategis POA (Pusat Agregasi & Executive Cockpit)**

## Ikhtisar Siklus Pengembangan
Pengembangan Radar POA dilaksanakan melalui 6 fase terukur:

```
FASE PENGEMBANGAN RADAR POA
├── [Fase 1] Inisialisasi Database Spreadsheet Pusat & Master Hub
├── [Fase 2] Modul Eksklusif: Form & Feed Kegiatan Direktorat
├── [Fase 3] Aggregator Engine & Cross-Spreadsheet Ingestion
├── [Fase 4] Executive Cockpit SiMata & Peta Taktis 34 Kapal
├── [Fase 5] Pipeline Data Mart Looker Studio & Scheduled Trigger
└── [Fase 6] Hardening, Optimasi Performa, & Final Audit
```

---

### Fase 1: Inisialisasi Database Spreadsheet Pusat & Master Hub
- [ ] Setup Spreadsheet `RadarPOA_Pusat_DB` dan `RadarPOA_Looker_Mart`.
- [ ] Konfigurasi script properties mapping Sheet ID 4 aplikasi satelit.
- [ ] Setup Drive folder pimpinan `POA_Evidence_Pusat`.
- [ ] Verifikasi koneksi Google Apps Script dan otentikasi login pimpinan.

### Fase 2: Modul Eksklusif: Form & Feed Kegiatan Direktorat
- [ ] Popup modal form input kegiatan direktorat (Judul, Tanggal, Deskripsi, Pihak Hadir, Lampiran).
- [ ] Penegakan RBAC eksklusif pimpinan (Superadmin, Direktur, Kadiv).
- [ ] Timeline feed kronologis interaktif dengan filter rentang tanggal dan pencarian.
- [ ] Transparansi entri VOID dengan watermark dan keterangan pembatalan.

### Fase 3: Aggregator Engine & Cross-Spreadsheet Ingestion
- [ ] Pembangunan `AggregatorService.js` untuk membaca data dari SIKAP, Sistik, Nakhoda, Siaga, dan eksternal.
- [ ] Integrasi in-memory `CacheService` dengan TTL 15 menit.
- [ ] Tombol aksi toolbar *"Sinkronkan Data" / "Sync Now"* untuk live cache-bust.

### Fase 4: Executive Cockpit SiMata & Peta Taktis 34 Kapal
- [ ] 4 Top Action KPI Cards SiMata (Pagu & Serapan, Realisasi SP2D, Kesiapan 34 Kapal, Kegiatan).
- [ ] Peta Leaflet maritim interaktif taktis 34 Kapal Pengawas Ukuran Besar (WPP 571 - 718).
- [ ] Executive Monitoring Data Grid 8 Unit Kerja Terpadu.
- [ ] Peringkat evaluasi Kapal Terbaik Triwulan (Ship of the Period TW I-IV).

### Fase 5: Pipeline Data Mart Looker Studio & Scheduled Trigger
- [ ] Pembuatan `LookerMartService.js` untuk transformasi data flat bersih.
- [ ] Konfigurasi trigger waktu berkala (time-driven trigger) untuk pembaruan `RadarPOA_Looker_Mart`.

### Fase 6: Hardening, Optimasi Performa, & Final Audit
- [ ] Uji responsivitas dashboard agregasi ($< 1.5$ detik saat cached).
- [ ] Audit konsistensi kontrol UI 3-tier (`LG: 40px`, `MD: 32px`, `SM: 26px`).
- [ ] Penegakan Zero-Emoji Policy pada seluruh teks dashboard eksekutif.
- [ ] UAT bersama Direktur dan para Kepala Divisi.
