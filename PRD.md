# PRD.md — Product Requirements Document: Radar POA
**Rekapitulasi Data Strategis POA (Pusat Agregasi & Executive Cockpit - Dit. POA)**

## 1. Pendahuluan & Latar Belakang
Transformasi dari sistem Nautika monolitik melahirkan **Radar POA** sebagai pusat kendali (*executive cockpit*) dan agregasi strategis bagi Direktur Pemantauan dan Operasi Armada, para Pejabat Eselon, dan Kepala Divisi. Radar POA tidak lagi mengelola input teknis harian/mingguan staf (yang telah didelegasikan ke aplikasi satelit SIKAP, Sistik, Nakhoda, dan Siaga), melainkan berfokus pada visualisasi performa makro nasional dan mengelola input eksklusif **Kegiatan Direktorat**.

## 2. Ruang Lingkup Sistem & Modul Utama

```
RADAR POA (PUSAT AGREGASI & EXECUTIVE COCKPIT)
├── [Modul Eksklusif] Input & Feed Kegiatan Direktorat
├── [Aggregator Engine] Federasi Data 4 Satelit & Subsistem Eksternal
├── [Executive Cockpit] 4 Top KPI, Peta Taktis 34 Kapal, & Grid 8 Unit Kerja
└── [Reporting Pipeline] Data Mart Konsolidasi Looker Studio
```

---

## 3. Spesifikasi Fungsional

### 3.1 Modul Input Eksklusif: Kegiatan Direktorat
- **Latar Belakang:** Kegiatan pimpinan dan agenda lintas divisi (pre-award meeting, monitoring pimpinan ABT, serah terima aset antar-lembaga, rakor kementerian) tidak tepat dimasukkan ke salah satu satelit teknis. Input dipusatkan langsung di Radar POA.
- **Hak Akses (RBAC Ketat):** Hanya dapat diakses oleh `SUPERADMIN`, `DIREKTUR`, dan `KADIV` (lintas seluruh divisi). Staf biasa tidak memiliki hak input/modifikasi.
- **Form Popup Modal Kegiatan Direktorat:**
  - `JudulKegiatan`: Judul resmi agenda strategis pimpinan.
  - `Tanggal`: Tanggal pelaksanaan kegiatan.
  - `Deskripsi`: Notula inti, poin kesepakatan, dan tindak lanjut pimpinan.
  - `PihakHadir`: Daftar pejabat/instansi penting yang hadir.
  - `LampiranEvidence`: Multi-file upload foto/dokumen risalah ke Drive folder `POA_Evidence_Pusat`.
- **Feed Kronologis Interaktif:** Tampilan timeline responsif dengan filter rentang tanggal, pencarian instan, dan transparansi status VOID.

### 3.2 Aggregator Engine (Cross-Spreadsheet Data Ingestion)
- **Sumber Data Terintegrasi:**
  1. **SIKAP (TU):** Membaca `RadarPOA_SIKAP_DB` $\rightarrow$ Pagu, Realisasi SP2D & Akrual, Serapan %, Progres Paket Pengadaan, Aset BMN Rusak Berat.
  2. **Sistik (Logistik):** Membaca `RadarPOA_Sistik_DB` $\rightarrow$ Stok Akhir Amunisi, Sisa Kuota BBM, Realisasi Personil.
  3. **Nakhoda (Pengawakan):** Membaca `RadarPOA_Nakhoda_DB` $\rightarrow$ Matriks Postur AKN (Keseluruhan vs POA), Log Pelatihan Personil.
  4. **Siaga (Harwat):** Membaca `RadarPOA_Siaga_DB` $\rightarrow$ Status Kesiapan 34 Kapal Besar (Laik Laut), Monitoring Docking Galangan, Item Pemeliharaan.
  5. **Modul Eksternal:** Membaca spreadsheet tim lain (Operasi Laut, Operasi Udara, Intelijen, Pelayanan VMS).
- **In-Memory Caching:** Hasil konsolidasi di-cache selama 15 menit menggunakan `CacheService`. Dilengkapi tombol *"Sinkronkan Data" / "Sync Now"* untuk pembaruan paksa real-time.

### 3.3 Executive Cockpit (Pola Data-First SiMata)
1. **Top Action Toolbar & 4 KPI Utama SiMata:**
   - Format angka tegas: `Pagu & Serapan Anggaran`, `Realisasi SP2D Kas Nasional`, `Kesiapan Armada Kapal Besar (X dari 34 Siap)`, dan `Intensitas Kegiatan Strategis`.
2. **Peta Taktis 34 Kapal Pengawas Ukuran Besar:**
   - Visualisasi maritim WPP 571 s.d. 718 dengan status taktis 34 kapal besar:
     - 26 Kapal Operasional di Laut (WPP penugasan).
     - 6 Kapal Siap Operasi di Pangkalan.
     - 2 Kapal Pemeliharaan di Galangan.
3. **Executive Monitoring Data Grid 8 Unit Kerja:**
   - Satu tabel terpadu scannable merangkum serapan anggaran, progres fisik, dan status indikator kunci seluruh divisi.
4. **Evaluasi Kinerja Triwulan (Ship of the Period TW I–IV):**
   - Peringkat kapal terbaik berdasarkan formula komprehensif keaktifan dan capaian operasional.

### 3.4 Pipeline Pelaporan Looker Studio
- Penjadwalan ETL berkala yang menghasilkan tabel flat bersih di spreadsheet `RadarPOA_Looker_Mart` (bebas dari baris SUPERSEDED dan VOID) untuk konsumsi dashboard Looker Studio pimpinan.

---

## 4. RBAC (Role-Based Access Control)
- **Superadmin:** Akses konfigurasi master data, manajemen pengguna, input kegiatan direktorat, dan monitoring menyeluruh.
- **Direktur:** Akses penuh seluruh visualisasi eksekutif, input & anulir kegiatan direktorat, dan trigger sinkronisasi.
- **Kadiv (Seluruh Divisi):** Akses monitoring executive grid dan input kegiatan direktorat.
- **Viewer / Staf:** Hak akses read-only terbatas pada tampilan agregasi umum.
