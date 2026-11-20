# DATA_SCHEMA.md — Skema Basis Data: Radar POA
**Spreadsheet Basis Data Utama:** `RadarPOA_Pusat_DB`  
**Spreadsheet Data Mart:** `RadarPOA_Looker_Mart`

## Kolom Standar Relasional (Ada di Setiap Sheet `TX_*`)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `RowID` | text (PK) | Format unik per modul, mis. `KGD-2026-XXXX` |
| `DivisiID` | text | Diisi `PUSAT` atau Divisi Pengunggah |
| `Periode` | text | Diturunkan dari Tanggal Kegiatan (`YYYY-MM-WW`) |
| `SubmittedBy` | ref(Users) | UserID pembuat data (Direktur/Kadiv/Superadmin) |
| `Timestamp` | datetime | Waktu pencatatan data |
| `Status` | enum | `ACTIVE`, `SUPERSEDED`, `VOID` |
| `SupersedesRowID`| ref(Self) | Diisi jika merupakan revisi |
| `VoidReason` | text | Catatan alasan pembatalan (wajib jika VOID) |
| `VoidedBy` | ref(Users) | UserID yang menganulir |
| `VoidedAt` | datetime | Waktu pembatalan |

---

## 1. `TX_KegiatanDirektorat` (Feed Agenda Strategis Pimpinan)
Kolom standar +
| Kolom | Tipe | Keterangan |
|---|---|---|
| `JudulKegiatan` | text | Nama agenda strategis pimpinan |
| `Tanggal` | date | Tanggal pelaksanaan kegiatan |
| `Deskripsi` | text | Notula inti, arahan pimpinan, dan poin kesepakatan |
| `PihakHadir` | text, nullable | Pejabat / instansi penting yang hadir |
| `EvidenceUrl` | text, nullable | Tautan file dokumen/foto di Google Drive |

---

## 2. `Mart_Ikhtisar_Nasional` (Data Mart Looker Studio di `RadarPOA_Looker_Mart`)
Tabel pelaporan flat yang diperbarui berkala, bersih dari baris SUPERSEDED dan VOID:
| Kolom | Tipe | Keterangan |
|---|---|---|
| `Periode` | text | Format `YYYY-MM-WW` |
| `BulanTahun` | text | Format `YYYY-MM` |
| `TotalPagu_Reguler` | number | Pagu Reguler konsolidasi nasional |
| `TotalPagu_ABT` | number | Pagu ABT konsolidasi nasional |
| `TotalRealisasi_SP2D_Reguler`| number | Realisasi SP2D Reguler nasional |
| `TotalRealisasi_SP2D_ABT` | number | Realisasi SP2D ABT nasional |
| `PctSerapan_Nasional` | number | Persentase serapan nasional |
| `Armada_Siap_Pct` | number | Persentase kesiapan armada 34 kapal besar |
| `TotalKegiatanDirektorat` | number | Akumulasi kegiatan pimpinan terlaksana |
| `Aset_RusakBerat_Unit` | number | Total unit BMN kondisi rusak berat |

---

## 3. `Audit_Log` (Log Audit Transaksi Pimpinan)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `LogID` | text (PK) | Format `RADAR-AUD-XXXX` |
| `UserID` | ref(Users) | Pelaksana aksi |
| `Aksi` | enum | `CREATE`, `UPDATE`, `VOID`, `SYNC_MANUAL`, `LOGIN` |
| `SheetTarget` | text | Nama sheet yang disentuh |
| `RowIDTarget` | text | RowID data yang disentuh |
| `Alasan` | text, nullable | Alasan revisi / pembatalan |
| `Timestamp` | datetime | Waktu pencatatan log |
