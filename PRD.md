# PRD.md — Product Requirements Document: Radar POA
**Rekapitulasi Data Strategis POA (Pusat Agregasi & Dasbor Strategis Pimpinan — Dit. POA)**

## 1. Pendahuluan & Latar Belakang
Transformasi dari sistem Nautika monolitik melahirkan **Radar POA** sebagai pusat kendali strategis (**Rekapitulasi Data Strategis POA**) bagi Direktur Pengendalian Operasi Armada, para Pejabat Eselon, dan Kepala Divisi. Radar POA tidak lagi mengelola input teknis harian/mingguan staf (yang didelegasikan ke aplikasi satelit SIKAP, Sistik, Nakhoda, dan Siaga), melainkan berfokus pada visualisasi performa makro nasional dan mengelola input eksklusif **Kegiatan Direktorat**.

## 2. Ruang Lingkup Sistem & Modul Utama

```
RADAR POA (REKAPITULASI DATA STRATEGIS DIT. POA)
├── [Modul Eksklusif] Input, Pencarian, & Feed Kronologis Kegiatan Direktorat
├── [Aggregator Engine] Federasi Data 4+ Satelit & Cache 15 Menit
├── [Dasbor Strategis Pimpinan] 4 Top KPI, Peta Taktis 34 Kapal (Kelas I–V), Analitik 65/35, & Tabel Lintas Satelit
└── [Reporting Pipeline] Data Mart Konsolidasi Looker Studio
```

---

## 3. Spesifikasi Fungsional

### 3.1 Modul Input Eksklusif: Kegiatan Direktorat
- **Latar Belakang:** Kegiatan pimpinan dan agenda lintas divisi (pre-award meeting, monitoring pimpinan ABT, serah terima aset antar-lembaga, rakor kementerian) tidak tepat dimasukkan ke salah satu satelit teknis. Input dipusatkan langsung di Radar POA.
- **Hak Akses (RBAC Ketat):** Hanya dapat diakses oleh `SUPERADMIN`, `DIREKTUR`, dan `KADIV` (lintas seluruh divisi). Staf biasa tidak memiliki hak input/modifikasi.
- **Form Popup Modal Kegiatan Direktorat:**
  - `JudulKegiatan`: Judul resmi agenda strategis pimpinan.
  - `Tanggal`: Tanggal pelaksanaan kegiatan — **dilindungi Calendar Picker Anti-Ketik Manual** (`onkeydown="return false"`, `onpaste="return false"`, `showPicker()` otomatis saat klik/fokus).
  - `Deskripsi`: Notula inti, poin kesepakatan, dan tindak lanjut pimpinan.
  - `PihakHadir`: Daftar pejabat/instansi penting yang hadir.
  - `LampiranEvidence`: Multi-file upload foto/dokumen risalah ke folder Drive `POA_Evidence_Pusat`.
- **Daftar Kegiatan Direktorat & Feed Kronologis:**
  - Dilengkapi pencarian instan judul/pihak hadir serta filter status (`Semua`, `Aktif`, `Ditimpa`, `Dianulir`).
  - Transparansi entri `SUPERSEDED` dan `VOID` beserta `VoidReason` menggunakan nama pejabat pengguna (bukan ID teknis mentah).

### 3.2 Aggregator Engine (Cross-Spreadsheet Data Ingestion)
- **Sumber Data Terintegrasi:**
  1. **SIKAP (TU):** Membaca `RadarPOA_SIKAP_DB` → Pagu, Realisasi SP2D & Akrual, Serapan %, Progres Paket Pengadaan, Inventaris BMN & Rusak Berat, serta Disparitas SIKAP-Nakhoda.
  2. **Sistik (Logistik):** Membaca `RadarPOA_Sistik_DB` → Stok Akhir Amunisi, Sisa Kuota BBM, Realisasi Personil *(siap integrasi)*.
  3. **Nakhoda (Pengawakan):** Membaca `RadarPOA_Nakhoda_DB` → Matriks Postur AKN (Keseluruhan vs POA 4 Kategori Baku), 396+ Awak Aktif & Sijil Kapal, serta Log Sertifikasi Pelatihan STCW-F.
  4. **Siaga (Harwat):** Membaca `RadarPOA_Siaga_DB` → Status Kesiapan 34 Kapal Besar, Monitoring Docking Galangan, Item Pemeliharaan *(siap integrasi)*.
  5. **Modul Eksternal:** Membaca spreadsheet tim lain (Operasi Laut, Operasi Udara, Intelijen, Pemantauan) *(siap integrasi)*.
- **In-Memory Caching:** Hasil konsolidasi di-cache 15 menit menggunakan `CacheService`. Tombol indikator status membuka popover status 6 satelit lengkap dengan aksi eksplisit **"Sinkronkan Data Satelit"** (`radar_triggerSyncNow`) untuk pembaruan paksa real-time.

### 3.3 Dasbor Strategis Pimpinan & Shell Navigasi v2.0
1. **Shell Navigasi (`Top Institutional Bar 56px` + `Floating Bottom Maritime Dock`):**
   - Bar atas minimalis menampilkan Logo PSDKP, judul **RADAR POA · Rekapitulasi Data Strategis**, status koneksi 6 satelit, notifikasi, dan menu akun.
   - Navigasi utama berupa **Floating Bottom Maritime Dock** di bawah layar (`Ikhtisar`, `Kegiatan`, `Kapal Terbaik`, `Riwayat` | `Notifikasi`, `Master Data`, `Admin`; mobile menggunakan 4 menu inti + sheet `Lainnya`) sehingga ruang kerja penuh bebas sidebar permanen.
2. **4 Top KPI Strategis Nasional:**
   - Format tegas angka koma Indonesia (`tabular-nums`): `Pagu & Serapan Anggaran (SP2D)`, `Postur Awak Kapal (Nakhoda)`, `Kesiapan Armada Kapal Besar (X / 34)`, dan `Kegiatan Direktorat (YTD)`.
3. **Peta Taktis 34 Kapal Pengawas (Ikon Siluet Kelas I–V, Layout `68/32`):**
   - Visualisasi maritim WPPNRI 571 s.d. 718 menampilkan seluruh 34 kapal besar (`26 Operasional di Laut`, `6 Siap di Pangkalan`, `2 Pemeliharaan Galangan`) menggunakan **ikon siluet SVG kapal berbeda menurut kelas resmi PSDKP**:
     - **Kelas I / `KELAS_I` (`> 60 m`, 6 kapal):** seri `KP. ORCA 01–06`
     - **Kelas II / `KELAS_II` (`40–60 m`, 10 kapal):** seri `KP. PAUS`, `KP. BARAKUDA`, `KP. H.M. TUTUL`, `KP. HIU MACAN`
     - **Kelas III / `KELAS_III` (`28–40 m`, 17 kapal):** seri `KP. HIU 01–17`
     - **Kelas IV / `KELAS_IV` (`18–28 m`, 1 kapal):** `KP. AKAR BAHAR 01`
     - **Kelas V / `KELAS_V` (`< 18 m`):** kategori kapal cepat cadangan dari `Master_Kapal`
   - Bebas tumpang tindih label permanen: hover menampilkan tooltip nama & kelas kapal; klik membuka popup detail + tombol `Buka Profil Kapal`; dilengkapi filter Status Armada + filter/legenda Kelas I–V berdampingan dengan Panel Sebaran WPP (`32%`).
4. **Analitik Asimetris (`65/35`) & Tabel Monitoring Eksekutif Lintas Satelit:**
   - Grafik utama tren fiskal SIKAP (`65%`) berdampingan dengan ringkasan postur AKN Nakhoda (`35%`).
   - Di bawahnya terdapat **1 Tabel Monitoring Eksekutif Lintas Satelit (`executiveGrid`)** scannable yang merangkum indikator utama, capaian, status koneksi, dan catatan disparitas seluruh unit/satelit tanpa duplikasi kartu divisi.
5. **Evaluasi Kinerja Triwulan (`Kapal Terbaik`) & `Profil Kapal`:**
   - Podium Top 3 khusus kapal berstatus siap/operasional (kapal berstatus `GALANGAN` tidak ditempatkan sebagai Juara Podium, tetap masuk tabel peringkat 34 kapal), filter triwulan selalu sinkron dengan headline temuan, serta halaman `Profil Kapal` berfokus pada identitas kapal, awak Sijil (Nakhoda), dan BMN melekat (SIKAP).

### 3.4 Pipeline Pelaporan Looker Studio
- Penjadwalan ETL berkala yang menghasilkan tabel flat bersih di spreadsheet `RadarPOA_Looker_Mart` (bebas dari baris `SUPERSEDED` dan `VOID`) untuk konsumsi dashboard Looker Studio pimpinan.

---

## 4. RBAC & Autentikasi Sistem
- **Peran Baku:**
  - `SUPERADMIN`: Konfigurasi master data, manajemen pengguna, konektor satelit, data mart Looker Studio, input kegiatan direktorat, dan monitoring menyeluruh.
  - `DIREKTUR`: Akses penuh seluruh visualisasi eksekutif, input/revisi/anulir kegiatan direktorat, persetujuan staf/kadiv sesuai scope, dan pemicu sinkronisasi.
  - `KADIV` (Kepala Divisi): Akses monitoring eksekutif dan input/revisi/anulir kegiatan direktorat.
  - `STAF`: Akses baca terbatas sesuai otorisasi.
- **Autentikasi Multi-Identifier & Auto-Seed:**
  - Login mendukung **Email dinas**, **NIP (normalisasi digit)**, atau alias peran baku dengan **proteksi *brute-force lockout* 5x kegagalan (kunci sementara 15 menit via `CacheService`)**.
  - Sistem memiliki **self-healing `ensurePusatSpreadsheet()`** dan **_ensureSuperadminSeeded() / `setup_seedSuperadmin()`** yang otomatis menginisialisasi spreadsheet `RadarPOA_Pusat_DB` beserta 4 akun awal (`SUPERADMIN`, `DIREKTUR`, `KADIV`, `STAF`) saat pertama kali dijalankan.
