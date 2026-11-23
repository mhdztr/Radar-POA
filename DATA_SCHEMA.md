# DATA_SCHEMA.md — Skema Basis Data: Radar POA
**Spreadsheet Basis Data Utama:** `RadarPOA_Pusat_DB` *(otomatis ter-seed oleh `ensurePusatSpreadsheet()` bila `MASTER_SS_ID`/`PUSAT_SS_ID` belum dikonfigurasi)*  
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
| `SupersedesRowID` | ref(Self) | Diisi jika merupakan revisi |
| `VoidReason` | text | Catatan alasan pembatalan (wajib jika `VOID`) |
| `VoidedBy` | ref(Users) | UserID yang menganulir |
| `VoidedAt` | datetime | Waktu pembatalan |

---

## 1. `TX_KegiatanDirektorat` (Feed Agenda Strategis Pimpinan)
Kolom standar +
| Kolom | Tipe | Keterangan |
|---|---|---|
| `JudulKegiatan` | text | Nama agenda strategis pimpinan |
| `Tanggal` | date | Tanggal pelaksanaan kegiatan (`yyyy-mm-dd`) |
| `Deskripsi` | text | Notula inti, arahan pimpinan, dan poin kesepakatan |
| `PihakHadir` | text, nullable | Pejabat / instansi penting yang hadir |
| `EvidenceUrl` | text, nullable | Tautan file dokumen/foto di Google Drive |

---

## 2. `Mart_Ikhtisar_Nasional` (Data Mart Looker Studio di `RadarPOA_Looker_Mart`)
Tabel pelaporan flat yang diperbarui berkala, bersih dari baris `SUPERSEDED` dan `VOID`:
| Kolom | Tipe | Keterangan |
|---|---|---|
| `Periode` | text | Format `YYYY-MM-WW` |
| `BulanTahun` | text | Format `YYYY-MM` |
| `TotalPagu_Reguler` | number | Pagu Reguler konsolidasi nasional |
| `TotalPagu_ABT` | number | Pagu ABT konsolidasi nasional |
| `TotalRealisasi_SP2D_Reguler` | number | Realisasi SP2D Reguler nasional |
| `TotalRealisasi_SP2D_ABT` | number | Realisasi SP2D ABT nasional |
| `PctSerapan_Nasional` | number | Persentase serapan nasional |
| `Armada_Siap_Pct` | number | Persentase kesiapan armada 34 kapal besar |
| `TotalKegiatanDirektorat` | number | Akumulasi kegiatan pimpinan terlaksana |
| `Aset_RusakBerat_Unit` | number | Total unit BMN kondisi rusak berat |

---

## 3. `Audit_Log` (Log Audit Transaksi Pimpinan)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `LogID` | text (PK) | Format `LOG-XXXXXXXXXXXX` / `RADAR-AUD-XXXXXXXXXX` |
| `UserID` | ref(Users) | Pelaksana aksi |
| `Aksi` | enum | `CREATE`, `UPDATE`, `VOID`, `SYNC_MANUAL`, `LOGIN` |
| `SheetTarget` | text | Nama sheet yang disentuh |
| `RowIDTarget` | text | RowID data yang disentuh |
| `Alasan` | text, nullable | Alasan revisi / pembatalan |
| `Timestamp` | datetime | Waktu pencatatan log |

---

## 4. `Kapal` (`Master_Kapal`) & Klasifikasi Kelas Armada (`KELAS_I` – `KELAS_V`)
Skema persis sheet master `Kapal` di `data/SheetAccess.js` & `services/MasterDataService.js`:
| Kolom | Tipe | Keterangan |
|---|---|---|
| `KapalID` | text (PK) | Kode unik kapal, mis. `KP-ORCA-01` |
| `Nama` | text | Nama resmi kapal pengawas, mis. `KP. ORCA 01` |
| `Kelas` | text | Seri kapal (`ORCA`, `BARAKUDA`, `PAUS`, `TUTUL`, `HIU_MACAN`, `HIU`, `AKAR_BAHAR`) |
| `Homebase_UPT` | text | Pangkalan atau Stasiun PSDKP asal |
| `StatusAktif` | boolean | Status aktif di master |
| `JenisKapal` | enum(Opsi) | Token grup `KAPAL_JENIS` (`KAPAL_PUSAT` / lainnya) |
| `KelasKapal` | enum | Klasifikasi resmi PSDKP: `KELAS_I`, `KELAS_II`, `KELAS_III`, `KELAS_IV`, `KELAS_V` |
| `PanjangMeter` | number | Panjang keseluruhan kapal (meter) |
| `WPPDefault` | text | Kode WPPNRI penugasan (`571`–`718`, `Pangkalan`, atau `Galangan`) |
| `PangkalanHomebase` | text | Nama kota/pangkalan sandar utama |

### Pemetaan Resmi 5 Kelas Kapal Pengawas (34 Kapal Besar + Cadangan Speedboat)
| Token `KelasKapal` | Romawi | Rentang Panjang | Armada dalam `FLEET_34_TACTICAL_SEED` |
|---|---|---|---|
| `KELAS_I` | `Kelas I` | `> 60 m` | **6 kapal:** `KP. ORCA 01` s.d. `KP. ORCA 06` |
| `KELAS_II` | `Kelas II` | `40–60 m` | **10 kapal:** `KP. PAUS 01`, `KP. BARAKUDA 01–02`, `KP. H.M. TUTUL 01–02`, `KP. HIU MACAN 01, 03, 04, 05, 06` |
| `KELAS_III` | `Kelas III` | `28–40 m` | **17 kapal:** `KP. HIU 01` s.d. `KP. HIU 17` |
| `KELAS_IV` | `Kelas IV` | `18–28 m` | **1 kapal:** `KP. AKAR BAHAR 01` |
| `KELAS_V` | `Kelas V` | `< 18 m` | Cadangan dinamis untuk speedboat pengawas dari `Master_Kapal` |

### Konversi Wajib Enum Teknis ke Label Antarmuka Manusiawi
Frontend **dilarang** menampilkan token huruf besar/underscore database langsung ke pimpinan; seluruh tampilan wajib menerjemahkannya secara konsisten:
- `OPERASIONAL` → `Operasional di Laut`
- `SIAP_PANGKALAN` → `Siap di Pangkalan`
- `GALANGAN` → `Pemeliharaan Galangan` *(dikecualikan dari Podium Top 3 `Kapal Terbaik`)*
- `BAIK` → `Baik` · `RUSAK_RINGAN` → `Rusak Ringan` · `RUSAK_BERAT` → `Rusak Berat`
- `P3K_PARUH_WAKTU` → `P3K Paruh Waktu` *(atau `P3K Paruh` pada sumbu grafik)*
- `ACTIVE` → `Aktif` · `SUPERSEDED` → `Ditimpa (Digantikan revisi)` · `VOID` → `Dianulir`

---

## 5. `Users` & `Divisi` (Master Autentikasi & Unit Kerja Terfederasi)
Diinisialisasi otomatis oleh `_autoCreateMasterSheet()` dan `_ensureSuperadminSeeded()` di `data/SheetAccess.js`:

### `Users`
`UserID`, `Nama`, `Email`, `NIP`, `PasswordHash` *(SHA-256 hex)*, `DivisiID`, `Role` (`SUPERADMIN` | `DIREKTUR` | `KADIV` | `STAF`), `Status` (`PENDING` | `APPROVED` | `REJECTED` | `NONAKTIF`), `ApprovedBy`, `RegisteredAt`, `ApprovedAt`.

### `Divisi` (7 Unit Kerja Direktorat POA)
Kolom: `DivisiID`, `NamaResmi`, `NamaDashboard`, `Kode`
1. `DIV-TU` — `Subbagian Tata Usaha` (`Tata Usaha (SIKAP)`, `TU`)
2. `DIV-AWAK` — `Tim Kerja Pengawakan Kapal Pengawas` (`Pengawakan (Nakhoda)`, `AWAK`)
3. `DIV-LOG` — `Tim Kerja Logistik Armada` (`Logistik (Sistik)`, `LOG`)
4. `DIV-RAWAT` — `Tim Kerja Pemeliharaan dan Perawatan` (`Pemeliharaan & Perawatan (Siaga)`, `RAWAT`)
5. `DIV-OPS` — `Tim Kerja Operasi Armada` (`Operasi Armada`, `OPS`)
6. `DIV-INTEL` — `Tim Kerja Intelijen Pengawasan` (`Intelijen`, `INTEL`)
7. `DIV-PANTAU` — `Tim Kerja Pemantauan Armada` (`Pemantauan`, `PANTAU`)
