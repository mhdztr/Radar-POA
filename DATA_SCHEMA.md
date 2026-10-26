# DATA_SCHEMA.md — Skema Data

## Spreadsheet Pusat
- `RadarPOA_Pusat_DB`
- `RadarPOA_Master_DB` (shared read-only untuk referensi)
- `RadarPOA_Looker_Mart` (data mart untuk Looker Studio)

## Kolom Standar Transaksi
Semua sheet transaksi wajib memiliki:
`RowID`, `DivisiID`, `Periode`, `SubmittedBy`, `Timestamp`, `Status`, `SupersedesRowID`, `VoidReason`, `VoidedBy`, `VoidedAt`

## TX_KegiatanDirektorat (usulan awal)
| Kolom | Tipe | Keterangan |
|---|---|---|
| RowID | String(UUID) | Primary key |
| Tanggal | Date | Tanggal pelaksanaan |
| JudulKegiatan | String | Wajib |
| Deskripsi | Text | Wajib (notula inti) |
| PihakHadir | String | Pejabat/instansi |
| LampiranEvidence | Text/JSON | Daftar file/link evidence |
| DivisiID | String | Bisa 'PUSAT'/'DIREKTORAT' atau disesuaikan |
| Periode | String | YYYY-MM |
| SubmittedBy | String | UserID/Email |
| Timestamp | DateTime | Server time |
| Status | Enum(ACTIVE/SUPERSEDED/VOID) | Default ACTIVE |
| SupersedesRowID | String | Jika revisi |
| VoidReason | String | Wajib jika VOID |
| VoidedBy/VoidedAt | String/DateTime | Jika VOID |

Rincian lengkap akan disempurnakan saat implementasi Fase 2 tanpa mengubah pola versioning.
