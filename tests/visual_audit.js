/**
 * tests/visual_audit.js
 * Playwright headless Chromium visual & layout audit harness for Radar POA.
 * Excluded from GAS push via .claspignore (tests/**).
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const vm = require('vm');
const { chromium } = require('/home/pinefeast/node_modules/playwright');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.resolve(__dirname, 'screenshots');

function buildCompiledHtml() {
  let html = fs.readFileSync(path.join(ROOT, 'html/Index.html'), 'utf8');
  html = html.replace(/<\?!=?\s*html_include\(['"]([^'"]+)['"]\);\s*\?>/g, (_, target) => {
    const filePath = path.join(ROOT, target + '.html');
    return fs.readFileSync(filePath, 'utf8');
  });
  return html;
}

function buildBackendFixture() {
  const ctx = {
    console,
    Date,
    Math,
    Number,
    String,
    Object,
    Array,
    JSON,
    Logger: { log: () => { } },
    Utilities: {
      formatDate: () => '2026-06-15'
    },
    CacheService: {
      getScriptCache: () => ({
        get: (k) => (k === 'DASH_TX_VERSION' ? '14' : null),
        put: () => { }
      })
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: () => null
      })
    },
    _requireSession: (token) => {
      if (token !== 'DEMO_DIR_TOKEN') throw new Error('UNAUTHORIZED');
      return {
        userId: 'USR-DIR-01',
        nama: 'Ir. Haryo Prakoso, M.Si.',
        email: 'direktur.poa@kkp.go.id',
        role: 'DIREKTUR',
        status: 'APPROVED',
        divisiId: null
      };
    },
    assertScope: () => { },
    getCurrentPeriode: () => '2026-W24',
    utils_getTrendMonths: () => ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'],
    openMasterSheet: () => ({}),
    sheetToObjects: () => [
      { KapalID: 'KP-ORCA-01', Nama: 'KP. ORCA 01', Kelas: 'ORCA (60m)', Homebase_UPT: 'Pangkalan Ambon', StatusAktif: true },
      { KapalID: 'KP-ORCA-05', Nama: 'KP. ORCA 05', Kelas: 'ORCA (60m)', Homebase_UPT: 'Pangkalan Bitung', StatusAktif: true }
    ],
    readSatelliteRows: (keys, sheetName) => {
      if (sheetName === 'TX_Penugasan_Kapal') {
        return {
          connected: true,
          rows: [
            { KapalID: 'KP-ORCA-01', PegawaiID: 'AWK-001', PosSijil: 'Nakhoda', TanggalNaik: '2026-01-10', TanggalTurun: '' },
            { KapalID: 'KP-ORCA-01', PegawaiID: 'AWK-002', PosSijil: 'KKM / Chief Engineer', TanggalNaik: '2026-01-10', TanggalTurun: '' },
            { KapalID: 'KP-ORCA-01', PegawaiID: 'AWK-003', PosSijil: 'Mualim I', TanggalNaik: '2026-02-01', TanggalTurun: '' },
            { KapalID: 'KP-ORCA-01', PegawaiID: 'AWK-004', PosSijil: 'Masinis II', TanggalNaik: '2026-02-05', TanggalTurun: '' },
            { KapalID: 'KP-ORCA-01', PegawaiID: 'AWK-005', PosSijil: 'Juru Mudi', TanggalNaik: '2026-03-01', TanggalTurun: '' }
          ]
        };
      }
      if (sheetName === 'Master_Awak') {
        return {
          connected: true,
          rows: [
            { PegawaiID: 'AWK-001', Nama: 'Capt. M. Ridwan, S.St.Pi.', KategoriKepegawaian: 'PNS' },
            { PegawaiID: 'AWK-002', Nama: 'Hendra Wijaya, A.Md.', KategoriKepegawaian: 'PNS' },
            { PegawaiID: 'AWK-003', Nama: 'Budi Santoso, S.Pi.', KategoriKepegawaian: 'P3K' },
            { PegawaiID: 'AWK-004', Nama: 'Rahmat Hidayat', KategoriKepegawaian: 'P3K_PARUH_WAKTU' },
            { PegawaiID: 'AWK-005', Nama: 'Dedi Kurniawan', KategoriKepegawaian: 'PJLP' }
          ]
        };
      }
      if (sheetName === 'TX_BMN_Aset') {
        return {
          connected: true,
          rows: [
            { KapalID: 'KP-ORCA-01', KodeBarang: '3.09.01.01.002-11', NamaBarang: 'Radar Navigasi X-Band Furuno', Kondisi: 'BAIK', NilaiBuku: 840000000 },
            { KapalID: 'KP-ORCA-01', KodeBarang: '3.09.01.04.008-04', NamaBarang: 'Rigid Inflatable Boat (RIB) Patroli', Kondisi: 'BAIK', NilaiBuku: 425000000 },
            { KapalID: 'KP-ORCA-01', KodeBarang: '3.06.03.11.003-09', NamaBarang: 'Perangkat Komunikasi Satelit VSAT', Kondisi: 'RUSAK_RINGAN', NilaiBuku: 190000000 }
          ]
        };
      }
      return { connected: false, rows: [] };
    },
    agg_collectAll: () => ({
      meta: {
        syncedAt: new Date().toISOString(),
        fromCache: false,
        cacheTtlSec: 900,
        periodeAktif: '2026-W24',
        year: 2026
      },
      satellites: {
        PUSAT: { label: 'Pusat (Dit. POA)', connected: true },
        SIKAP: { label: 'SIKAP (TU)', connected: true },
        NAKHODA: { label: 'Nakhoda (Awak)', connected: true },
        SISTIK: { label: 'Sistik (Logistik)', connected: false, error: 'Menunggu integrasi' },
        SIAGA: { label: 'Siaga (Harwat)', connected: false, error: 'Menunggu integrasi' },
        OPERASI: { label: 'Operasi & Pantau', connected: false, error: 'Menunggu integrasi' }
      },
      sikap: {
        connected: true,
        melaporMingguIni: true,
        anggaran: {
          paguTotal: 128400000000,
          paguReguler: 108400000000,
          paguABT: 20000000000,
          realisasiSP2D: 83200000000,
          realisasiAkrual: 89600000000,
          sp2dPct: 64.8,
          akrualPct: 69.8,
          sisaSP2D: 45200000000,
          sp2dMonthly: [8200000000, 12400000000, 14900000000, 15100000000, 16200000000, 16400000000],
          akrualMonthly: [9100000000, 13600000000, 15800000000, 16400000000, 17100000000, 17600000000]
        },
        paket: { totalPaket: 42, totalNilaiKontrak: 64500000000, totalRealisasiKeu: 41800000000, avgProgresFisik: 71.4 },
        bmn: {
          totalUnit: 1248,
          totalNilaiPerolehan: 1420000000000,
          totalNilaiBuku: 985000000000,
          kondisi: { BAIK: 1126, RUSAK_RINGAN: 94, RUSAK_BERAT: 28 },
          dalamPenghapusan: 12
        },
        kepegawaian: { totalPegawaiPOA: 514, disparitasNakhoda: 2 }
      },
      nakhoda: {
        connected: true,
        melaporMingguIni: true,
        akn: {
          keseluruhan: 512,
          poa: 396,
          byKategori: {
            PNS: { keseluruhan: 248, poa: 196 },
            P3K: { keseluruhan: 132, poa: 104 },
            P3K_PARUH_WAKTU: { keseluruhan: 64, poa: 48 },
            PJLP: { keseluruhan: 68, poa: 48 }
          }
        },
        kompetensi: { totalSertifikat: 432, berlaku: 388, segeraHabis: 28, kedaluwarsa: 16 },
        sijil: { totalKapalEvaluasi: 34, laikAwak: 31, kurangAwak: 3, totalAwakOnBoard: 374 }
      },
      pusat: {
        kegiatanYtd: 19,
        kegiatanPeriode: 4,
        terakhirDicatat: '2026-06-14T14:20:00+07:00'
      }
    })
  };

  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'utils/Constants.js'), 'utf8'), ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'services/DashboardService.js'), 'utf8'), ctx);

  const token = 'DEMO_DIR_TOKEN';
  return {
    overview: ctx.dashboard_getOverview(token, { mode: 'monthly', month: 6, year: 2026 }),
    kapalTerbaik: ctx.dashboard_getScoringKapalTerbaik(token, { year: 2026, triwulan: 2 }),
    profilOrca01: ctx.dashboard_profilKapal(token, { kapalId: 'KP-ORCA-01' }),
    profilOrca05: ctx.dashboard_profilKapal(token, { kapalId: 'KP-ORCA-05' }),
    syncNow: { success: true, data: ctx.agg_collectAll(null, true) }
  };
}

function buildMockInitScript(fixtures) {
  return `
    (function () {
      const F = ${JSON.stringify(fixtures)};
      const CURRENT_USER = {
        userId: 'USR-DIR-01',
        nama: 'Ir. Haryo Prakoso, M.Si.',
        email: 'direktur.poa@kkp.go.id',
        role: 'DIREKTUR',
        status: 'APPROVED',
        divisiId: null
      };
      window.__auditSetUser = function (patch) {
        Object.assign(CURRENT_USER, patch || {});
      };
      const DIVISI_LIST = [
        { divisiId: 'DIV-TU',     namaDashboard: 'Tata Usaha (SIKAP)',   namaResmi: 'Subbagian Tata Usaha' },
        { divisiId: 'DIV-AWAK',   namaDashboard: 'Pengawakan (Nakhoda)', namaResmi: 'Timja Pengawakan & Personel' },
        { divisiId: 'DIV-LOG',    namaDashboard: 'Logistik (Sistik)',    namaResmi: 'Timja Logistik & Sarpras' },
        { divisiId: 'DIV-RAWAT',  namaDashboard: 'Pemeliharaan (Siaga)', namaResmi: 'Timja Pemeliharaan Kapal' }
      ];
      const MASTER_KAPAL = [
        { kapalId: 'KP-ORCA-01',      nama: 'KP. ORCA 01',      kelas: 'ORCA (60 m)',      kelasKapal: 'KELAS_I',   kelasRomawi: 'I',   kelasLabel: 'Kelas I',   panjangMeter: 60, homebaseUpt: 'Pangkalan Tual/Ambon', jenisKapal: 'KAPAL_PUSAT', statusAktif: true },
        { kapalId: 'KP-ORCA-02',      nama: 'KP. ORCA 02',      kelas: 'ORCA (60 m)',      kelasKapal: 'KELAS_I',   kelasRomawi: 'I',   kelasLabel: 'Kelas I',   panjangMeter: 60, homebaseUpt: 'Pangkalan Belawan',    jenisKapal: 'KAPAL_PUSAT', statusAktif: true },
        { kapalId: 'KP-ORCA-05',      nama: 'KP. ORCA 05',      kelas: 'ORCA (60 m)',      kelasKapal: 'KELAS_I',   kelasRomawi: 'I',   kelasLabel: 'Kelas I',   panjangMeter: 60, homebaseUpt: 'Pangkalan Bitung',     jenisKapal: 'KAPAL_PUSAT', statusAktif: true },
        { kapalId: 'KP-HM-TUTUL-01',  nama: 'KP. H.M. TUTUL 01',kelas: 'TUTUL (40 m)',     kelasKapal: 'KELAS_II',  kelasRomawi: 'II',  kelasLabel: 'Kelas II',  panjangMeter: 40, homebaseUpt: 'Pangkalan Kupang',     jenisKapal: 'KAPAL_PUSAT', statusAktif: true },
        { kapalId: 'KP-BARAKUDA-01',  nama: 'KP. BARAKUDA 01',  kelas: 'BARAKUDA (42 m)',  kelasKapal: 'KELAS_II',  kelasRomawi: 'II',  kelasLabel: 'Kelas II',  panjangMeter: 42, homebaseUpt: 'Pangkalan Jakarta',    jenisKapal: 'KAPAL_PUSAT', statusAktif: true },
        { kapalId: 'KP-BARAKUDA-02',  nama: 'KP. BARAKUDA 02',  kelas: 'BARAKUDA (42 m)',  kelasKapal: 'KELAS_II',  kelasRomawi: 'II',  kelasLabel: 'Kelas II',  panjangMeter: 42, homebaseUpt: 'Galangan Jakarta',     jenisKapal: 'KAPAL_PUSAT', statusAktif: false },
        { kapalId: 'KP-PAUS-01',      nama: 'KP. PAUS 01',      kelas: 'PAUS (42 m)',      kelasKapal: 'KELAS_II',  kelasRomawi: 'II',  kelasLabel: 'Kelas II',  panjangMeter: 42, homebaseUpt: 'Pangkalan Ambon',      jenisKapal: 'KAPAL_PUSAT', statusAktif: true },
        { kapalId: 'KP-HIU-MACAN-01', nama: 'KP. HIU MACAN 01', kelas: 'HIU MACAN (36 m)', kelasKapal: 'KELAS_II',  kelasRomawi: 'II',  kelasLabel: 'Kelas II',  panjangMeter: 36, homebaseUpt: 'Pangkalan Batam',      jenisKapal: 'KAPAL_PUSAT', statusAktif: true },
        { kapalId: 'KP-HIU-01',       nama: 'KP. HIU 01',       kelas: 'HIU (32 m)',       kelasKapal: 'KELAS_III', kelasRomawi: 'III', kelasLabel: 'Kelas III', panjangMeter: 32, homebaseUpt: 'Pangkalan Belawan',    jenisKapal: 'KAPAL_UPT',   statusAktif: true },
        { kapalId: 'KP-HIU-11',       nama: 'KP. HIU 11',       kelas: 'HIU (32 m)',       kelasKapal: 'KELAS_III', kelasRomawi: 'III', kelasLabel: 'Kelas III', panjangMeter: 32, homebaseUpt: 'Pangkalan Batam',      jenisKapal: 'KAPAL_UPT',   statusAktif: true },
        { kapalId: 'KP-AKAR-BAHAR-01',nama: 'KP. AKAR BAHAR 01',kelas: 'AKAR BAHAR (22 m)',kelasKapal: 'KELAS_IV',  kelasRomawi: 'IV',  kelasLabel: 'Kelas IV',  panjangMeter: 22, homebaseUpt: 'Pangkalan Jakarta',    jenisKapal: 'KAPAL_UPT',   statusAktif: true }
      ];
      const MASTER_KAWASAN = [
        { kawasanId: 'TN-WAKATOBI',    nama: 'Taman Nasional Wakatobi',          provinsi: 'Sulawesi Tenggara', latitude: -5.52, longitude: 123.75 },
        { kawasanId: 'KKPD-RAJAAMPAT', nama: 'KKPD Kepulauan Raja Ampat',        provinsi: 'Papua Barat Daya',  latitude: -0.52, longitude: 130.52 },
        { kawasanId: 'TNP-LAUTSAWU',   nama: 'Taman Nasional Perairan Laut Sawu', provinsi: 'Nusa Tenggara Timur', latitude: -9.85, longitude: 121.85 }
      ];
      const MASTER_WPP = [
        { WPPCode: '571', NamaWilayah: 'Selat Malaka dan Laut Andaman' },
        { WPPCode: '572', NamaWilayah: 'Samudera Hindia Barat Sumatera dan Selat Sunda' },
        { WPPCode: '573', NamaWilayah: 'Samudera Hindia Selatan Jawa hingga Laut Timor' },
        { WPPCode: '711', NamaWilayah: 'Selat Karimata, Laut Natuna, dan Laut Natuna Utara' },
        { WPPCode: '712', NamaWilayah: 'Laut Jawa' },
        { WPPCode: '713', NamaWilayah: 'Selat Makassar, Teluk Bone, Laut Flores, dan Laut Bali' },
        { WPPCode: '714', NamaWilayah: 'Teluk Tolo dan Laut Banda' },
        { WPPCode: '715', NamaWilayah: 'Teluk Tomini, Laut Maluku, Laut Halmahera, Laut Seram' },
        { WPPCode: '716', NamaWilayah: 'Laut Sulawesi dan Sebelah Utara Pulau Halmahera' },
        { WPPCode: '717', NamaWilayah: 'Teluk Cenderawasih dan Samudera Pasifik' },
        { WPPCode: '718', NamaWilayah: 'Laut Aru, Laut Arafuru, dan Laut Timor Bagian Timur' }
      ];
      const MASTER_OPSI = {
        kodeList: ['KAPAL_JENIS', 'AWAK_KATEGORI', 'AMUNISI', 'BBM'],
        labels: {
          KAPAL_JENIS: 'Jenis Kapal',
          AWAK_KATEGORI: 'Kategori Pengawakan',
          AMUNISI: 'Jenis Amunisi',
          BBM: 'Jenis BBM'
        },
        groups: {
          KAPAL_JENIS: [
            { label: 'KAPAL_PUSAT', labelTampil: 'Kapal Pengawas Pusat', aktif: true },
            { label: 'KAPAL_UPT',   labelTampil: 'Kapal Pengawas UPT',   aktif: true }
          ],
          AWAK_KATEGORI: [
            { label: 'PNS',             labelTampil: 'PNS',             aktif: true },
            { label: 'P3K',             labelTampil: 'P3K',             aktif: true },
            { label: 'P3K_PARUH_WAKTU', labelTampil: 'P3K Paruh Waktu', aktif: true },
            { label: 'PJLP',            labelTampil: 'PJLP',            aktif: true }
          ],
          AMUNISI: [
            { label: 'KALIBER_12_7', labelTampil: 'Peluru 12,7 mm', aktif: true },
            { label: 'KALIBER_20',   labelTampil: 'Amunisi 20 mm',  aktif: true }
          ],
          BBM: [
            { label: 'SOLAR_HSD', labelTampil: 'Biosolar / HSD', aktif: true },
            { label: 'B40',       labelTampil: 'Biodiesel B40',  aktif: true }
          ]
        }
      };
      const KEGIATAN_ROWS = [
        {
          RowID: 'KGD-2026-001',
          Periode: '2026-W24',
          Tanggal: '2026-06-14',
          JudulKegiatan: 'Rapat Evaluasi Operasi Terpadu TW II',
          Deskripsi: 'Penyelarasan sektor pengawasan WPP 715 dan 718 bersama komandan kapal.',
          PihakHadir: 'Direktur POA, Timja Operasi, Timja Pengawakan',
          DivisiID: 'PUSAT',
          divisiNama: 'Direktorat POA',
          SubmittedBy: 'USR-DIR-01',
          submittedByName: 'Ir. Haryo Prakoso, M.Si.',
          Timestamp: '2026-06-14T14:20:00+07:00',
          Status: 'ACTIVE',
          VoidReason: '',
          VoidedBy: '',
          voidedByName: ''
        },
        {
          RowID: 'KGD-2026-002',
          Periode: '2026-W24',
          Tanggal: '2026-06-11',
          JudulKegiatan: 'Koordinasi Kelaiklautan & Sijil Awak KP. Orca 01',
          Deskripsi: 'Verifikasi sijil 5 pos utama dan kelengkapan navigasi radar.',
          PihakHadir: 'Timja Pengawakan, Nakhoda KP. Orca 01',
          DivisiID: 'DIV-AWAK',
          divisiNama: 'Pengawakan (Nakhoda)',
          SubmittedBy: 'USR-KADIV-01',
          submittedByName: 'Andi Wijaya, S.Pi.',
          Timestamp: '2026-06-11T10:15:00+07:00',
          Status: 'ACTIVE',
          VoidReason: '',
          VoidedBy: '',
          voidedByName: ''
        },
        {
          RowID: 'KGD-2026-003',
          Periode: '2026-W23',
          Tanggal: '2026-06-05',
          JudulKegiatan: 'Sinkronisasi Jadwal Docking Galangan Lamongan',
          Deskripsi: 'Penjadwalan ulang pemeliharaan berkala KP. Hiu Macan 03.',
          PihakHadir: 'Timja Pemeliharaan, Galangan Lamongan',
          DivisiID: 'DIV-RAWAT',
          divisiNama: 'Pemeliharaan (Siaga)',
          SubmittedBy: 'USR-KADIV-02',
          submittedByName: 'Bambang Sutrisno, S.T.',
          Timestamp: '2026-06-05T16:00:00+07:00',
          Status: 'SUPERSEDED',
          VoidReason: 'Jadwal diperbarui setelah inspeksi lambung',
          VoidedBy: 'USR-DIR-01',
          voidedByName: 'Ir. Haryo Prakoso, M.Si.'
        },
        {
          RowID: 'KGD-2026-004',
          Periode: '2026-W23',
          Tanggal: '2026-06-03',
          JudulKegiatan: 'Rapat Teknis Pengisian BBM Darurat Zona Timur',
          Deskripsi: 'Koordinasi penyaluran BBM cadangan di Pangkalan Tual.',
          PihakHadir: 'Timja Logistik, Pangkalan Tual',
          DivisiID: 'DIV-LOG',
          divisiNama: 'Logistik (Sistik)',
          SubmittedBy: 'USR-STAF-02',
          submittedByName: 'Dewi Anggraini, M.M.',
          Timestamp: '2026-06-03T09:30:00+07:00',
          Status: 'VOID',
          VoidReason: 'Digabung dengan agenda koordinasi wilayah timur minggu ke-24',
          VoidedBy: 'USR-DIR-01',
          voidedByName: 'Ir. Haryo Prakoso, M.Si.'
        }
      ];
      const NOTIF_ITEMS = [
        { notifId: 'NTF-01', jenis: 'APPROVAL_REQUEST', pesan: 'Capt. Ahmad Fauzi (Timja Pengawakan) mengajukan aktivasi akun pengguna baru.', isRead: false, createdAt: '2026-06-15T09:10:00+07:00' },
        { notifId: 'NTF-02', jenis: 'APPROVAL_REQUEST', pesan: 'Rina Kusuma, S.Kom. (Subbagian Tata Usaha) menunggu persetujuan akun.', isRead: false, createdAt: '2026-06-15T08:15:00+07:00' },
        { notifId: 'NTF-03', jenis: 'DATA_VOIDED', pesan: 'Kegiatan Direktorat (Rapat Teknis Pengisian BBM Darurat Zona Timur) dianulir oleh Ir. Haryo Prakoso, M.Si.', isRead: false, createdAt: '2026-06-14T17:05:00+07:00' },
        { notifId: 'NTF-04', jenis: 'REMINDER_MINGGUAN', pesan: 'Pengingat laporan mingguan periode 2026-W24 telah dikirim ke seluruh unit kerja.', isRead: true, createdAt: '2026-06-12T16:00:00+07:00' },
        { notifId: 'NTF-05', jenis: 'REMINDER_MINGGUAN', pesan: 'Konsolidasi data satelit SIKAP dan Nakhoda periode 2026-W23 selesai diverifikasi.', isRead: true, createdAt: '2026-06-08T11:30:00+07:00' }
      ];
      const ADMIN_USERS = [
        { userId: 'USR-DIR-01', nama: 'Ir. Haryo Prakoso, M.Si.', email: 'direktur.poa@kkp.go.id', nip: '197204111998031002', role: 'DIREKTUR', divisiId: '', namaDivisi: 'Direktorat POA', status: 'APPROVED', registeredAt: '2026-01-05T08:00:00+07:00' },
        { userId: 'USR-SA-01', nama: 'Surya Pratama, S.Kom.', email: 'admin.poa@kkp.go.id', nip: '198609182010121004', role: 'SUPERADMIN', divisiId: '', namaDivisi: 'Direktorat POA', status: 'APPROVED', registeredAt: '2026-01-04T08:00:00+07:00' },
        { userId: 'USR-KADIV-01', nama: 'Andi Wijaya, S.Pi.', email: 'andi.wijaya@kkp.go.id', nip: '198103222006041007', role: 'KADIV', divisiId: 'DIV-AWAK', namaDivisi: 'Pengawakan (Nakhoda)', status: 'APPROVED', registeredAt: '2026-01-12T09:30:00+07:00' },
        { userId: 'USR-STAF-02', nama: 'Rina Kusuma, S.Kom.', email: 'rina.kusuma@kkp.go.id', nip: '199311082019022003', role: 'STAF', divisiId: 'DIV-TU', namaDivisi: 'Tata Usaha (SIKAP)', status: 'PENDING', registeredAt: '2026-06-15T08:15:00+07:00' }
      ];
      const ADMIN_AUDIT = [
        { logId: 'LOG-01', aksi: 'CREATE', sheetTarget: 'TX_KegiatanDirektorat', rowIdTarget: 'KGD-2026-001', alasan: 'Tambah kegiatan: Rapat Evaluasi Operasi Terpadu TW II', timestamp: '2026-06-14T14:20:00+07:00', userId: 'USR-DIR-01', userName: 'Ir. Haryo Prakoso, M.Si.', userRole: 'DIREKTUR' },
        { logId: 'LOG-02', aksi: 'VOID', sheetTarget: 'TX_KegiatanDirektorat', rowIdTarget: 'KGD-2026-004', alasan: 'Digabung dengan agenda koordinasi wilayah timur minggu ke-24', timestamp: '2026-06-14T13:10:00+07:00', userId: 'USR-DIR-01', userName: 'Ir. Haryo Prakoso, M.Si.', userRole: 'DIREKTUR' },
        { logId: 'LOG-03', aksi: 'UPDATE', sheetTarget: 'Users', rowIdTarget: 'USR-KADIV-01', alasan: 'Pembaruan jabatan Kepala Timja Pengawakan', timestamp: '2026-06-12T10:05:00+07:00', userId: 'USR-SA-01', userName: 'Surya Pratama, S.Kom.', userRole: 'SUPERADMIN' },
        { logId: 'LOG-04', aksi: 'SYNC', sheetTarget: 'WPP', rowIdTarget: '', alasan: 'Sinkronisasi 11 Wilayah Pengelolaan Perikanan NRI', timestamp: '2026-06-10T09:00:00+07:00', userId: 'USR-SA-01', userName: 'Surya Pratama, S.Kom.', userRole: 'SUPERADMIN' }
      ];
      const RIWAYAT_ROWS = [
        { rowId: 'KGD-2026-001', sheet: 'TX_KegiatanDirektorat', sheetLabel: 'Kegiatan Direktorat', periode: '2026-W24', divisiId: 'PUSAT', divisiNama: 'Direktorat POA', submittedBy: 'USR-DIR-01', submittedByName: 'Ir. Haryo Prakoso, M.Si.', timestamp: '2026-06-14T14:20:00+07:00', status: 'ACTIVE', ringkasan: 'Rapat Evaluasi Operasi Terpadu TW II', detail: [['Tanggal', '14 Jun 2026'], ['Pihak Hadir', 'Direktur POA, Timja Operasi']] },
        { rowId: 'TU-2026-W24', sheet: 'TX_TataUsaha', sheetLabel: 'SIKAP — Tata Usaha', periode: '2026-W24', divisiId: 'DIV-TU', divisiNama: 'Tata Usaha (SIKAP)', submittedBy: 'USR-STAF-02', submittedByName: 'Rina Kusuma, S.Kom.', timestamp: '2026-06-14T11:45:00+07:00', status: 'ACTIVE', ringkasan: 'SP2D Rp 83,2 M · Akrual Rp 89,6 M', detail: [['Pagu Total', 'Rp 128.400.000.000'], ['Realisasi SP2D', '64,8%']] },
        { rowId: 'AWK-2026-W24', sheet: 'TX_Pengawakan_AKN', sheetLabel: 'Nakhoda — Komposisi AKN', periode: '2026-W24', divisiId: 'DIV-AWAK', divisiNama: 'Pengawakan (Nakhoda)', submittedBy: 'USR-KADIV-01', submittedByName: 'Andi Wijaya, S.Pi.', timestamp: '2026-06-13T15:10:00+07:00', status: 'ACTIVE', ringkasan: '396 awak POA dari total 512 personel', detail: [['PNS', '196 POA / 248 total'], ['P3K', '104 POA / 132 total']] },
        { rowId: 'PKT-2026-W23', sheet: 'TX_Paket_Progres', sheetLabel: 'SIKAP — Paket Pengadaan', periode: '2026-W23', divisiId: 'DIV-TU', divisiNama: 'Tata Usaha (SIKAP)', submittedBy: 'USR-STAF-02', submittedByName: 'Rina Kusuma, S.Kom.', timestamp: '2026-06-08T16:40:00+07:00', status: 'SUPERSEDED', ringkasan: '42 paket aktif (progres fisik 68,2%)', detail: [['Status', 'Digantikan pembaruan 2026-W24']] },
        { rowId: 'KGD-2026-003', sheet: 'TX_KegiatanDirektorat', sheetLabel: 'Kegiatan Direktorat', periode: '2026-W23', divisiId: 'DIV-RAWAT', divisiNama: 'Pemeliharaan (Siaga)', submittedBy: 'USR-KADIV-02', submittedByName: 'Bambang Sutrisno, S.T.', timestamp: '2026-06-05T16:00:00+07:00', status: 'SUPERSEDED', ringkasan: 'Sinkronisasi Jadwal Docking Galangan Lamongan', detail: [['Tanggal', '5 Jun 2026']] },
        { rowId: 'TU-2026-W23-V', sheet: 'TX_TataUsaha', sheetLabel: 'SIKAP — Tata Usaha', periode: '2026-W23', divisiId: 'DIV-TU', divisiNama: 'Tata Usaha (SIKAP)', submittedBy: 'USR-STAF-02', submittedByName: 'Rina Kusuma, S.Kom.', timestamp: '2026-06-04T10:20:00+07:00', status: 'VOID', voidReason: 'Koreksi nilai pagu revisi anggaran Juni', voidedBy: 'USR-DIR-01', voidedByName: 'Ir. Haryo Prakoso, M.Si.', ringkasan: 'Draf realisasi minggu ke-23', detail: [['Catatan', 'Entri koreksi sebelum revisi DIPA']] }
      ];
      const EVIDENCE_BY_ROW = {
        'KGD-2026-001': [
          {
            evidenceId: 'EV-DEMO-001',
            fileName: 'Risalah-Rapat-Operasi-TW2.pdf',
            fileType: 'application/pdf',
            driveFileId: 'DEMO_DRIVE_FILE_001',
            viewUrl: 'https://drive.google.com/file/d/DEMO_DRIVE_FILE_001/view',
            sourceMode: 'UPLOAD',
            uploadedBy: 'USR-DIR-01',
            uploadedAt: '2026-06-14T14:25:00+07:00'
          }
        ]
      };
      let kgdSeq = 10;
      const runObj = {};
      function cloneWith(base, patch) {
        const next = Object.create(base);
        Object.assign(next, patch);
        return next;
      }
      function respond(runner, payload) {
        const ok = runner._ok;
        const err = runner._err;
        setTimeout(() => {
          if (payload && payload.success === false && typeof err === 'function' && !ok) {
            err(new Error(payload.error || 'Error'));
          } else if (typeof ok === 'function') {
            ok(payload);
          }
        }, 20);
      }
      Object.assign(runObj, {
        _ok: null,
        _err: null,
        withSuccessHandler(fn) { return cloneWith(this, { _ok: fn }); },
        withFailureHandler(fn) { return cloneWith(this, { _err: fn }); },
        auth_getDivisiList() { respond(this, { success: true, data: DIVISI_LIST }); },
        auth_getSessionInfo(token) {
          if (token === 'DEMO_DIR_TOKEN') respond(this, { success: true, data: CURRENT_USER });
          else respond(this, { success: false, error: 'No session' });
        },
        auth_login() { respond(this, { success: true, data: { token: 'DEMO_DIR_TOKEN', user: CURRENT_USER } }); },
        auth_logout() { respond(this, { success: true }); },
        app_getSyncState() {
          respond(this, {
            success: true,
            data: {
              txVersion: 14,
              unreadNotif: 3,
              queueCount: 2,
              lastTxMetadata: { timestamp: new Date().toISOString(), sheet: 'Federasi Satelit' },
              serverTime: new Date().toISOString()
            }
          });
        },
        auth_getPendingApprovals() {
          respond(this, {
            success: true,
            data: [
              { queueId: 'Q-01', nama: 'Capt. Ahmad Fauzi', email: 'ahmad.fauzi@kkp.go.id', namaDivisi: 'Pengawakan', roleDilamar: 'STAF', registeredAt: '2026-06-14T10:00:00Z' },
              { queueId: 'Q-02', nama: 'Rina Kusuma, S.Kom.', email: 'rina.kusuma@kkp.go.id', namaDivisi: 'Tata Usaha', roleDilamar: 'STAF', registeredAt: '2026-06-15T08:15:00Z' }
            ]
          });
        },
        notifikasi_getRingkasan() { respond(this, { success: true, data: { unreadCount: 3, divisiBelumMelapor: null } }); },
        notifikasi_getList() { respond(this, { success: true, data: { unreadCount: 3, items: NOTIF_ITEMS } }); },
        notifikasi_markRead() { respond(this, { success: true, data: {} }); },
        notifikasi_markAllRead() { respond(this, { success: true, data: { marked: 3 } }); },
        notifikasi_getReminderSettings() { respond(this, { success: true, data: { aktif: true, jadwal: 'Jumat 16:00 (mingguan)' } }); },
        dashboard_getOverview() { respond(this, F.overview); },
        radar_triggerSyncNow() { respond(this, F.syncNow); },
        dashboard_getScoringKapalTerbaik() { respond(this, F.kapalTerbaik); },
        dashboard_profilKapal(token, params) {
          const id = params && params.kapalId;
          if (id === 'KP-ORCA-05') respond(this, F.profilOrca05);
          else respond(this, F.profilOrca01);
        },
        master_getKapalList() { respond(this, { success: true, data: MASTER_KAPAL }); },
        master_getKawasanList() { respond(this, { success: true, data: MASTER_KAWASAN }); },
        master_getWppList() { respond(this, { success: true, data: MASTER_WPP, fromFallback: false }); },
        master_getOpsiJenis() { respond(this, { success: true, data: MASTER_OPSI }); },
        utils_getCartoKey() { respond(this, ''); },
        riwayat_getAll() { respond(this, { success: true, data: RIWAYAT_ROWS }); },
        kegiatanDirektorat_getKPI() {
          const active = KEGIATAN_ROWS.filter((r) => r.Status === 'ACTIVE');
          respond(this, {
            success: true,
            data: {
              kegiatanPeriode: active.length,
              kegiatanYtd: 17 + active.length,
              terakhirDicatat: (active[0] && active[0].Timestamp) || '2026-06-14T14:20:00+07:00'
            }
          });
        },
        kegiatanDirektorat_getHistory() { respond(this, { success: true, data: KEGIATAN_ROWS.slice() }); },
        kegiatan_getList() { respond(this, { success: true, data: KEGIATAN_ROWS.slice() }); },
        kegiatanDirektorat_submit(token, params) {
          kgdSeq++;
          const newId = 'KGD-2026-0' + kgdSeq;
          const tgl = String((params && params.tanggal) || '2026-06-15');
          const dayNum = parseInt(tgl.slice(8, 10), 10) || 15;
          const wk = Math.ceil(dayNum / 7);
          const row = {
            RowID: newId,
            Periode: tgl.slice(0, 7) + '-W0' + wk,
            Tanggal: tgl,
            JudulKegiatan: String((params && params.judul) || ''),
            Deskripsi: String((params && params.deskripsi) || ''),
            PihakHadir: String((params && params.pihakHadir) || ''),
            DivisiID: (CURRENT_USER && CURRENT_USER.divisiId) || 'PUSAT',
            divisiNama: 'Direktorat POA',
            SubmittedBy: (CURRENT_USER && CURRENT_USER.userId) || 'USR-DIR-01',
            submittedByName: (CURRENT_USER && CURRENT_USER.nama) || 'Ir. Haryo Prakoso, M.Si.',
            Timestamp: new Date().toISOString(),
            Status: 'ACTIVE',
            VoidReason: '',
            VoidedBy: '',
            voidedByName: ''
          };
          KEGIATAN_ROWS.unshift(row);
          respond(this, { success: true, data: { rowIds: [newId], message: 'Kegiatan berhasil dicatat.' } });
        },
        kegiatanDirektorat_revisi(token, params) {
          const old = KEGIATAN_ROWS.find((r) => r.RowID === params.targetRowId && r.Status === 'ACTIVE');
          if (!old) {
            respond(this, { success: false, error: 'Baris tidak ditemukan atau bukan status ACTIVE.' });
            return;
          }
          old.Status = 'SUPERSEDED';
          old.VoidReason = params.alasanRevisi;
          old.VoidedBy = CURRENT_USER.userId;
          old.voidedByName = CURRENT_USER.nama;
          kgdSeq++;
          const newId = 'KGD-2026-0' + kgdSeq;
          const tgl = String(params.tanggal || old.Tanggal);
          const newRow = {
            RowID: newId,
            Periode: old.Periode,
            Tanggal: tgl,
            JudulKegiatan: params.judul,
            Deskripsi: params.deskripsi,
            PihakHadir: params.pihakHadir || '',
            DivisiID: 'PUSAT',
            divisiNama: 'Direktorat POA',
            SubmittedBy: CURRENT_USER.userId,
            submittedByName: CURRENT_USER.nama,
            Timestamp: new Date().toISOString(),
            Status: 'ACTIVE',
            SupersedesRowID: old.RowID,
            VoidReason: '',
            VoidedBy: '',
            voidedByName: ''
          };
          KEGIATAN_ROWS.unshift(newRow);
          const carried = (EVIDENCE_BY_ROW[old.RowID] || []).slice();
          EVIDENCE_BY_ROW[newId] = carried.map((ev, idx) => Object.assign({}, ev, { evidenceId: 'EV-CARRY-' + kgdSeq + '-' + idx }));
          respond(this, { success: true, data: { rowId: newId, carriedEvidence: carried.length, message: 'Revisi berhasil disimpan.' } });
        },
        kegiatanDirektorat_anulir(token, params) {
          const target = KEGIATAN_ROWS.find((r) => r.RowID === params.targetRowId && r.Status === 'ACTIVE');
          if (!target) {
            respond(this, { success: false, error: 'Hanya entri ACTIVE yang dapat dianulir.' });
            return;
          }
          target.Status = 'VOID';
          target.VoidReason = params.alasan;
          target.VoidedBy = CURRENT_USER.userId;
          target.voidedByName = CURRENT_USER.nama;
          respond(this, { success: true, message: 'Kegiatan berhasil dianulir.' });
        },
        evidence_upload(token, params) {
          const list = EVIDENCE_BY_ROW[params.refRowId] || (EVIDENCE_BY_ROW[params.refRowId] = []);
          const evId = 'EV-UP-' + (++kgdSeq);
          list.push({
            evidenceId: evId,
            fileName: params.fileName,
            fileType: params.mimeType,
            driveFileId: 'DRV-' + kgdSeq,
            viewUrl: 'https://drive.google.com/file/d/DRV-' + kgdSeq + '/view',
            sourceMode: 'UPLOAD',
            uploadedBy: CURRENT_USER.userId,
            uploadedAt: new Date().toISOString()
          });
          respond(this, { success: true, data: { evidenceId: evId, fileName: params.fileName } });
        },
        evidence_uploadFromLink(token, params) {
          const list = EVIDENCE_BY_ROW[params.refRowId] || (EVIDENCE_BY_ROW[params.refRowId] = []);
          const evId = 'EV-LNK-' + (++kgdSeq);
          list.push({
            evidenceId: evId,
            fileName: params.fileName || 'Dokumen-Tautan-Drive.pdf',
            fileType: 'application/pdf',
            driveFileId: 'DRV-LNK-' + kgdSeq,
            viewUrl: params.url,
            sourceMode: 'DRIVE_LINK_COPY',
            uploadedBy: CURRENT_USER.userId,
            uploadedAt: new Date().toISOString()
          });
          respond(this, { success: true, data: { evidenceId: evId, fileName: params.fileName || 'Dokumen-Tautan-Drive.pdf' } });
        },
        evidence_carry() { respond(this, { success: true, data: { copied: 0 } }); },
        evidence_list(token, refSheet, rowId) {
          respond(this, { success: true, data: (EVIDENCE_BY_ROW[rowId] || []).slice() });
        },
        admin_getUsers() { respond(this, { success: true, data: ADMIN_USERS }); },
        admin_getAuditLog() { respond(this, { success: true, data: ADMIN_AUDIT }); },
        admin_getSatelliteConfig() {
          respond(this, {
            success: true,
            data: {
              pusatId: 'DEMO_PUSAT_SS_ID',
              items: (this._satItems || (this._satItems = [
                { key: 'SIKAP_SS_ID', label: 'SIKAP — Tata Usaha & BMN', category: 'SATELLITE', ssId: '1AbC_SIKAP_DEMO_SS_ID_2026', connected: true, spreadsheetName: 'RadarPOA_SIKAP_DB', error: null },
                { key: 'NAKHODA_SS_ID', label: 'Nakhoda — Pengawakan & Sijil', category: 'SATELLITE', ssId: '1XyZ_NAKHODA_DEMO_SS_ID_2026', connected: true, spreadsheetName: 'RadarPOA_Nakhoda_DB', error: null },
                { key: 'SISTIK_SS_ID', label: 'Sistik — Logistik & BBM', category: 'SATELLITE', ssId: '', connected: false, spreadsheetName: '', error: 'Belum dikonfigurasi' },
                { key: 'SIAGA_SS_ID', label: 'Siaga — Pemeliharaan & Galangan', category: 'SATELLITE', ssId: '', connected: false, spreadsheetName: '', error: 'Belum dikonfigurasi' },
                { key: 'OPERASI_SS_ID', label: 'Operasi & Pemantauan Armada', category: 'SATELLITE', ssId: '', connected: false, spreadsheetName: '', error: 'Belum dikonfigurasi' },
                { key: 'LOOKER_MART_SS_ID', label: 'Looker Studio — Data Mart Nasional', category: 'MART', ssId: '1LmN_LOOKER_MART_SS_ID_2026', connected: true, spreadsheetName: 'RadarPOA_Looker_Mart', error: null }
              ])),
              lookerTrigger: (this._lookerTrig || (this._lookerTrig = {
                aktif: true,
                jadwal: 'Setiap hari 06:00 WIB',
                lookerMartId: '1LmN_LOOKER_MART_SS_ID_2026',
                lastSyncedAt: '2026-06-15T06:00:00Z'
              }))
            }
          });
        },
        admin_saveSatelliteConfig(token, params) {
          respond(this, {
            success: true,
            data: { changed: true, updatedKeys: Object.keys(params || {}), items: this._satItems || [], lookerTrigger: this._lookerTrig || {} }
          });
        },
        looker_syncMart() {
          respond(this, {
            success: true,
            data: { periode: '2026-06-W02', action: 'UPDATED', totalRows: 1 }
          });
        },
        looker_setTriggerAktif(token, aktif) {
          this._lookerTrig = Object.assign({}, this._lookerTrig || {}, { aktif: !!aktif });
          respond(this, { success: true, data: this._lookerTrig });
        }
      });
      window.google = { script: { run: runObj } };
    })();
  `;
}

async function inspectPage(page, name) {
  await page.waitForTimeout(600);
  const report = await page.evaluate(() => {
    const docEl = document.documentElement;
    const docW = docEl.scrollWidth;
    const docHeight = docEl.scrollHeight;
    const winW = window.innerWidth;
    const audit = typeof window._uiAudit === 'function' ? window._uiAudit() : null;
    const imgs = Array.from(document.querySelectorAll('img')).filter((i) => i.offsetParent !== null && !i.classList.contains('leaflet-tile'));
    const brokenImgs = imgs.filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.alt || i.src.slice(0, 40));
    const finding = document.getElementById('page-finding');
    const brokenControlRows = [];
    document.querySelectorAll('.page-header, .topbar-actions, .filter-box, .n-tabs, .hist-actions, .ctl-row, .kt-page-toolbar, .kt-filter-group, .sec-hd-bar, .ntf-toolbar, .md-opsi-add-row, .adn-rem-row').forEach((box) => {
      if (box.offsetParent === null) return;
      const ctls = Array.from(box.querySelectorAll('button, select, input')).filter((c) => c.offsetParent !== null);
      const hs = [...new Set(ctls.map((c) => Math.round(c.getBoundingClientRect().height)))];
      if (hs.length > 1) brokenControlRows.push({ box: (box.className || box.id || '').slice(0, 30), heights: hs });
    });

    // Ship marker count & pairwise bounding-box overlap check
    const markers = Array.from(document.querySelectorAll('#ov-map .ship-svg-wrap')).filter((m) => {
      const r = m.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });
    let markerOverlaps = 0;
    const mRects = markers.map((m) => {
      const r = m.getBoundingClientRect();
      return { left: r.left + 1, right: r.right - 1, top: r.top + 1, bottom: r.bottom - 1 };
    });
    for (let i = 0; i < mRects.length; i++) {
      for (let j = i + 1; j < mRects.length; j++) {
        const a = mRects[i], b = mRects[j];
        if (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) {
          markerOverlaps++;
        }
      }
    }

    // Distinct background colors, tiny text (<12px), font-family compliance, clipped notices
    const bgSet = new Set();
    const tinyTextSamples = [];
    const nonPublicSansSamples = [];
    const clippedSamples = [];
    const appVisible = document.getElementById('app-wrapper') && !document.getElementById('app-wrapper').classList.contains('n-hidden');
    const scopeEls = appVisible
      ? document.querySelectorAll('#app-wrapper *')
      : document.querySelectorAll('#auth-wrapper *');

    scopeEls.forEach((el) => {
      if (!el.getClientRects || el.getClientRects().length === 0) return;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return;
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return;

      const bg = cs.backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
        bgSet.add(bg);
      }

      const hasDirectText = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim().length > 0);
      if (hasDirectText) {
        const fs = parseFloat(cs.fontSize);
        if (!isNaN(fs) && fs < 12) {
          tinyTextSamples.push({ tag: el.tagName, cls: String(el.className || '').slice(0, 30), fs, txt: el.textContent.trim().slice(0, 30) });
        }
        const ff = (cs.fontFamily || '').toLowerCase();
        if (ff && !ff.includes('public sans') && !ff.includes('monospace')) {
          nonPublicSansSamples.push({ tag: el.tagName, cls: String(el.className || '').slice(0, 30), ff });
        }
      }
    });

    document.querySelectorAll('.ops-map-notice, .ops-map-status, .page-finding, .dr-banner-t').forEach((el) => {
      if (el.getClientRects().length === 0) return;
      if (el.scrollWidth > el.clientWidth + 2) {
        clippedSamples.push({ cls: String(el.className || '').slice(0, 30), sw: el.scrollWidth, cw: el.clientWidth });
      }
    });

    return {
      overflowX: docW - winW,
      docW,
      docHeight,
      winW,
      brokenImgs,
      brokenControlRows,
      markerCount: markers.length,
      markerOverlaps,
      distinctBg: bgSet.size,
      distinctBgList: Array.from(bgSet),
      tinyTextCount: tinyTextSamples.length,
      tinyTextSamples: tinyTextSamples.slice(0, 5),
      clippedCount: clippedSamples.length,
      clippedSamples,
      nonPublicSansCount: nonPublicSansSamples.length,
      nonPublicSansSamples: nonPublicSansSamples.slice(0, 5),
      findingVisible: finding ? !finding.classList.contains('n-hidden') : false,
      findingText: finding ? finding.textContent : '',
      uiAudit: audit ? { pass: audit.pass, checked: audit.containersChecked, violations: audit.violations } : null
    };
  });
  console.log(`[AUDIT] ${name}:`, JSON.stringify(report));
  return report;
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const html = buildCompiledHtml();
  const fixtures = buildBackendFixture();
  const initScript = buildMockInitScript(fixtures);

  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const url = `http://127.0.0.1:${port}/`;

  const browser = await chromium.launch({ headless: true });
  const consoleErrors = [];
  const pageErrors = [];
  const reports = {};

  try {
    // ── 1. Desktop Auth Login ──
    const ctxDesktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    await ctxDesktop.addInitScript(initScript);
    const page = await ctxDesktop.newPage();
    page.on('console', (m) => {
      if (m.type() === 'error') {
        consoleErrors.push(m.text());
        console.log('[PAGE CONSOLE ERR]:', m.text());
      }
    });
    page.on('pageerror', (e) => {
      pageErrors.push(e.message);
      console.log('[PAGE RUNTIME ERR]:', e.message);
    });

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForSelector('#v-login:not(.n-hidden)', { timeout: 10000 });
    await page.waitForTimeout(400);
    reports['login-desktop'] = await inspectPage(page, 'login-desktop');
    await page.screenshot({ path: path.join(OUT_DIR, '01-login-desktop.png') });

    // ── 2. Mobile Auth Login ──
    const ctxMobile = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    await ctxMobile.addInitScript(initScript);
    const mPage = await ctxMobile.newPage();
    await mPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await mPage.waitForSelector('#v-login:not(.n-hidden)', { timeout: 10000 });
    await mPage.waitForTimeout(400);
    reports['login-mobile'] = await inspectPage(mPage, 'login-mobile');
    await mPage.screenshot({ path: path.join(OUT_DIR, '02-login-mobile.png') });

    // ── 3. Authenticated Desktop Overview (1440x900) ──
    await page.fill('#login-email', 'direktur.poa@kkp.go.id');
    await page.fill('#login-password', 'RadarPOA2026!');
    await page.click('#btn-login');
    await page.waitForSelector('#app-wrapper:not(.n-hidden)', { timeout: 10000 });
    await page.waitForSelector('#ov-exec-body tr', { timeout: 10000 }).catch(() => { });
    await page.waitForSelector('#ov-map .ship-svg-wrap', { timeout: 10000 }).catch(() => { });
    await page.waitForSelector('#ov-map .ov-map-legend', { timeout: 6000 }).catch(() => { });
    await page.waitForTimeout(900);
    const inspectWppMap = async (p, label) => {
      const s = await p.evaluate(() => {
        const mapEl = document.getElementById('ov-map');
        const mr = mapEl ? mapEl.getBoundingClientRect() : null;
        const wppPolygons = document.querySelectorAll('#ov-map svg path.leaflet-interactive').length;
        const hasErrorNotice = !!document.querySelector('#ov-map .ops-map-notice');
        const hasLegend = !!document.querySelector('#ov-map .ov-map-legend');
        const markers = [...document.querySelectorAll('#ov-map .ship-svg-wrap')];
        const shipsInBounds = mr ? markers.filter((m) => {
          const r = m.getBoundingClientRect();
          return r.width > 0 && r.left >= mr.left - 4 && r.right <= mr.right + 4 && r.top >= mr.top - 4 && r.bottom <= mr.bottom + 4;
        }).length : 0;
        return { wppPolygons, hasErrorNotice, hasLegend, shipsInBounds };
      });
      console.log(`[AUDIT] wpp-map-${label}:`, JSON.stringify(s));
      return s;
    };
    reports['overview-desktop'] = await inspectPage(page, 'overview-desktop');
    const wppMapDesktop = await inspectWppMap(page, 'desktop');
    const overviewNavState = await page.evaluate(() => {
      const navBar = document.getElementById('app-nav-bar');
      const dock = document.getElementById('app-dock');
      const bar = document.getElementById('topnav-indicator');
      const items = [...document.querySelectorAll('#app-nav-list .topnav-item')];
      const tops = [...new Set(items.map((el) => Math.round(el.getBoundingClientRect().top)))];
      const kapalBtn = document.getElementById('nav-kapal-terbaik');
      const barCs = bar ? getComputedStyle(bar) : null;
      const barRect = bar ? bar.getBoundingClientRect() : null;
      const topbarRect = document.getElementById('app-topbar') ? document.getElementById('app-topbar').getBoundingClientRect() : null;
      const pageHeaderRect = document.getElementById('page-header') ? document.getElementById('page-header').getBoundingClientRect() : null;
      return {
        navBarHeight: navBar ? Math.round(navBar.getBoundingClientRect().height) : 0,
        dockDisplay: dock ? getComputedStyle(dock).display : '',
        hasNotifTab: !!document.getElementById('nav-notifikasi'),
        kapalLabel: kapalBtn ? kapalBtn.textContent.trim() : '',
        singleRow: tops.length === 1,
        topbarBottom: topbarRect ? Math.round(topbarRect.bottom) : 0,
        headerTop: pageHeaderRect ? Math.round(pageHeaderRect.top) : 0,
        indicatorWidth: barRect ? barRect.width : 0,
        indicatorX: barRect ? barRect.left : 0,
        indicatorOpacity: barCs ? barCs.opacity : '0'
      };
    });
    console.log('[AUDIT] overview-nav:', JSON.stringify(overviewNavState));
    await page.screenshot({ path: path.join(OUT_DIR, '03-overview-viewport.png') });
    await page.screenshot({ path: path.join(OUT_DIR, '03-overview-full.png'), fullPage: true });

    // ── 3b. Sync Popover Check (opening popover must NOT trigger manual sync / toast) ──
    await page.click('#sync-indicator');
    await page.waitForSelector('#sync-popover:not(.n-hidden)', { timeout: 5000 });
    await page.waitForTimeout(250);
    const toastCountOnPopover = await page.evaluate(() => document.querySelectorAll('#n-toaster .sonner-toast').length);
    console.log('[AUDIT] sync-popover-toasts:', toastCountOnPopover);
    await page.screenshot({ path: path.join(OUT_DIR, '03b-sync-popover.png') });
    await page.click('#sync-indicator');
    await page.waitForTimeout(200);

    // ── 3c. Laptop Viewport (1024x768) ──
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(550);
    reports['overview-1024'] = await inspectPage(page, 'overview-1024');
    const wppMapLaptop = await inspectWppMap(page, '1024');
    await page.screenshot({ path: path.join(OUT_DIR, '03c-overview-1024.png') });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(450);

    // ── 3d. Ship Class Filter Interaction (Kelas I = 6 markers) ──
    await page.click('[data-class-filter="KELAS_I"]');
    await page.waitForTimeout(300);
    const classOneCount = await page.evaluate(() => document.querySelectorAll('#ov-map .ship-svg-wrap').length);
    console.log('[AUDIT] kelas-1-marker-count:', classOneCount);
    await page.screenshot({ path: path.join(OUT_DIR, '03d-overview-class-filter.png') });
    await page.click('[data-class-filter="ALL"]');
    await page.waitForTimeout(300);

    // ── 4. Authenticated Mobile Overview + Dock Overflow Sheet ──
    await mPage.fill('#login-email', 'direktur.poa@kkp.go.id');
    await mPage.fill('#login-password', 'RadarPOA2026!');
    await mPage.click('#btn-login');
    await mPage.waitForSelector('#app-wrapper:not(.n-hidden)', { timeout: 10000 });
    await mPage.waitForSelector('#ov-exec-body tr', { timeout: 10000 }).catch(() => { });
    await mPage.waitForTimeout(1500);
    reports['overview-mobile'] = await inspectPage(mPage, 'overview-mobile');
    const wppMapMobile = await inspectWppMap(mPage, 'mobile');
    const mobileDockState = await mPage.evaluate(() => {
      const navBar = document.getElementById('app-nav-bar');
      const dock = document.getElementById('app-dock');
      const dockCs = dock ? getComputedStyle(dock) : null;
      const dockRect = dock ? dock.getBoundingClientRect() : null;
      return {
        navBarDisplay: navBar ? getComputedStyle(navBar).display : '',
        dockDisplay: dockCs ? dockCs.display : '',
        dockLeft: dockRect ? Math.round(dockRect.left) : -1,
        dockRight: dockRect ? Math.round(dockRect.right) : -1,
        dockBorderRadius: dockCs ? dockCs.borderRadius : ''
      };
    });
    console.log('[AUDIT] mobile-dock:', JSON.stringify(mobileDockState));
    await mPage.screenshot({ path: path.join(OUT_DIR, '04-overview-mobile.png'), fullPage: true });
    await mPage.click('.dock-more-btn');
    await mPage.waitForSelector('#dock-more-sheet:not(.n-hidden)', { timeout: 5000 });
    await mPage.waitForTimeout(300);
    await mPage.screenshot({ path: path.join(OUT_DIR, '04b-mobile-dock-sheet.png') });
    await mPage.click('#dock-more-mask');
    await mPage.waitForTimeout(200);

    // ── 5. Kapal Terbaik (Desktop + Mobile) ──
    await page.evaluate(() => _routeTo('kapal-terbaik'));
    await page.waitForSelector('#kt-table-body tr .badge', { timeout: 10000 });
    await page.waitForTimeout(300);
    const ktNavState = await page.evaluate(() => {
      const bar = document.getElementById('topnav-indicator');
      const barRect = bar ? bar.getBoundingClientRect() : null;
      const twEl = document.getElementById('kt-filter-tw');
      const yrEl = document.getElementById('kt-filter-year');
      const findingEl = document.getElementById('page-finding');
      const podiumCards = [...document.querySelectorAll('#kt-podium-container .kt-pedestal-card')];
      const podiumTexts = podiumCards.map((c) => c.textContent || '');
      const hasGalanganInPodium = podiumTexts.some((t) => /GALANGAN|BARAKUDA\s*02/i.test(t));
      const podiumHulls = document.querySelectorAll('#kt-podium-container .ship-hull').length;
      const tableHulls = document.querySelectorAll('#kt-table-body .ship-hull').length;
      const ktText = (document.getElementById('page-content') || document.body).textContent || '';
      const rawTokenMatch = ktText.match(/\b(?:HIU_MACAN|AKAR_BAHAR|SIAP_PANGKALAN|RUSAK_RINGAN|P3K_PARUH_WAKTU|AWK-\d+)\b/);
      return {
        indicatorX: barRect ? barRect.left : 0,
        indicatorWidth: barRect ? barRect.width : 0,
        twValue: twEl ? twEl.value : '',
        yrValue: yrEl ? yrEl.value : '',
        findingText: findingEl ? findingEl.textContent : '',
        hasGalanganInPodium,
        podiumHulls,
        tableHulls,
        rawToken: rawTokenMatch ? rawTokenMatch[0] : ''
      };
    });
    console.log('[AUDIT] kapal-terbaik-nav:', JSON.stringify(ktNavState));
    reports['kapal-terbaik-desktop'] = await inspectPage(page, 'kapal-terbaik-desktop');
    await page.screenshot({ path: path.join(OUT_DIR, '05-kapal-terbaik-desktop.png'), fullPage: true });

    await mPage.evaluate(() => _routeTo('kapal-terbaik'));
    await mPage.waitForSelector('#kt-table-body tr .badge', { timeout: 10000 });
    await mPage.waitForTimeout(300);
    reports['kapal-terbaik-mobile'] = await inspectPage(mPage, 'kapal-terbaik-mobile');
    await mPage.screenshot({ path: path.join(OUT_DIR, '05b-kapal-terbaik-mobile.png'), fullPage: true });

    // ── 6. Profil Kapal (Desktop + Mobile) ──
    await page.evaluate(() => _openProfilKapal('KP-ORCA-01'));
    await page.waitForSelector('#pk-tables .n-table', { timeout: 10000 });
    const pkState = await page.evaluate(() => {
      const h1 = document.querySelector('#page-header h1.page-title');
      const specCells = document.querySelectorAll('#pk-kpi .pk-spec-strip .pk-spec-cell').length;
      const bodyTxt = ((document.getElementById('page-header') || {}).textContent || '') + ' ' +
        ((document.getElementById('page-content') || {}).textContent || '');
      const rawTokenMatch = bodyTxt.match(/\b(?:OPERASIONAL|SIAP_PANGKALAN|RUSAK_RINGAN|RUSAK_BERAT|P3K_PARUH_WAKTU|AWK-\d+)\b|\d{4}-\d{2}-\d{2}/);
      return {
        h1Text: h1 ? h1.textContent.trim() : '',
        specCells,
        hasHumanEnum: bodyTxt.includes('Operasional di Laut') && bodyTxt.includes('Rusak Ringan') && bodyTxt.includes('P3K Paruh Waktu') && bodyTxt.includes('PNS') && bodyTxt.includes('PJLP'),
        hasHumanDate: bodyTxt.includes('10 Jan 2026'),
        rawToken: rawTokenMatch ? rawTokenMatch[0] : ''
      };
    });
    console.log('[AUDIT] profil-kapal-state:', JSON.stringify(pkState));
    reports['profil-kapal-desktop'] = await inspectPage(page, 'profil-kapal-desktop');
    await page.screenshot({ path: path.join(OUT_DIR, '06-profil-kapal-desktop.png'), fullPage: true });

    await mPage.evaluate(() => _openProfilKapal('KP-ORCA-01'));
    await mPage.waitForSelector('#pk-tables .n-table', { timeout: 10000 });
    await mPage.waitForTimeout(300);
    reports['profil-kapal-mobile'] = await inspectPage(mPage, 'profil-kapal-mobile');
    await mPage.screenshot({ path: path.join(OUT_DIR, '06b-profil-kapal-mobile.png'), fullPage: true });

    // ── 7. Kegiatan Direktorat (Desktop + Search + Status Tabs + Calendar Anti-Ketik) ──
    await page.evaluate(() => _routeTo('kegiatan'));
    await page.waitForSelector('#kgd-history-wrap .n-table', { timeout: 10000 });
    await page.waitForTimeout(350);
    reports['kegiatan-desktop'] = await inspectPage(page, 'kegiatan-desktop');
    await page.screenshot({ path: path.join(OUT_DIR, '07-kegiatan-desktop.png'), fullPage: true });
    const kgdBeforeSearch = await page.evaluate(() => document.querySelectorAll('#kgd-history-wrap tbody tr:not(.hist-void-note)').length);
    await page.fill('#kgd-search-input', 'Orca');
    await page.waitForTimeout(150);
    const kgdAfterSearch = await page.evaluate(() => document.querySelectorAll('#kgd-history-wrap tbody tr:not(.hist-void-note)').length);
    await page.fill('#kgd-search-input', '');
    await page.waitForTimeout(150);
    await page.click('#kgd-btn-open-form');
    await page.waitForSelector('#modal-kgd-form:not(.n-hidden)', { timeout: 5000 });
    const kgdValBefore = await page.inputValue('#kgd-tanggal');
    await page.focus('#kgd-tanggal');
    await page.keyboard.press('1');
    const kgdValAfter = await page.inputValue('#kgd-tanggal');
    const kgdState = await page.evaluate((meta) => {
      const txt = (document.getElementById('page-content') || {}).textContent || '';
      const kpiCells = document.querySelectorAll('#kgd-kpi-strip .sec-kpi-cell').length;
      const tabs = [...document.querySelectorAll('#kgd-status-tabs .n-tab')].map((t) => t.textContent.trim());
      const formDate = document.getElementById('kgd-tanggal');
      const revDate = document.getElementById('rv-kgd-tanggal');
      return {
        hasTitle: txt.includes('Daftar Kegiatan Direktorat') && !txt.includes('Feed Kegiatan Pendukung'),
        kpiCells,
        tabs,
        beforeSearch: meta.kgdBeforeSearch,
        afterSearch: meta.kgdAfterSearch,
        dateLockedForm: !!(formDate && formDate.getAttribute('onkeydown') === 'return false' && formDate.getAttribute('onpaste') === 'return false' && meta.kgdValBefore === meta.kgdValAfter),
        dateLockedRevisi: !!(revDate && revDate.getAttribute('onkeydown') === 'return false' && revDate.getAttribute('onpaste') === 'return false'),
        hasRawUserId: /\bUSR-[A-Z0-9_-]+\b/.test(txt)
      };
    }, { kgdBeforeSearch, kgdAfterSearch, kgdValBefore, kgdValAfter });
    await page.evaluate(() => { closeModal('modal-kgd-form'); _setFilterMode('range'); });
    await page.waitForTimeout(150);
    const headerRangeLocked = await page.evaluate(() => {
      const inputs = [...document.querySelectorAll('#filter-range .filter-date')];
      return inputs.length === 2 && inputs.every((i) => i.getAttribute('onkeydown') === 'return false' && i.getAttribute('onpaste') === 'return false');
    });
    await page.evaluate(() => _setFilterMode('monthly'));
    await page.waitForTimeout(200);
    console.log('[AUDIT] kegiatan-state:', JSON.stringify(Object.assign({}, kgdState, { headerRangeLocked })));

    // ── 7b. Fase 5 Browser E2E: Calendar showPicker() + Submit + Evidence + Revisi (SUPERSEDED + carry) + Anulir (VOID) ──
    await page.evaluate(() => {
      window.__showPickerCalls = 0;
      const orig = HTMLInputElement.prototype.showPicker;
      HTMLInputElement.prototype.showPicker = function () {
        window.__showPickerCalls++;
        if (typeof orig === 'function') {
          try { return orig.call(this); } catch (e) { }
        }
      };
    });
    await page.click('#kgd-btn-open-form');
    await page.waitForSelector('#modal-kgd-form:not(.n-hidden)', { timeout: 5000 });
    await page.click('#kgd-tanggal');
    const pickerCallsOnForm = await page.evaluate(() => window.__showPickerCalls);
    const valBeforeType = await page.inputValue('#kgd-tanggal');
    await page.keyboard.type('1999-01-01');
    const valAfterType = await page.inputValue('#kgd-tanggal');

    await page.fill('#kgd-judul', 'Rapat Uji Fase Lima E2E');
    await page.fill('#kgd-deskripsi', 'Verifikasi siklus submit revisi anulir dan lampiran Drive.');
    await page.fill('#kgd-pihak', 'Timja Operasi, Timja Pengawakan');
    await page.fill('#kgd-link', 'https://drive.google.com/file/d/FASE5E2ETESTFILE12345/view');
    await page.click('#kgd-btn-submit');
    await page.waitForSelector('#modal-kgd-form.n-hidden', { state: 'attached', timeout: 8000 });
    await page.waitForTimeout(250);

    const afterSubmitCheck = await page.evaluate(() => {
      const txt = (document.getElementById('kgd-history-wrap') || {}).textContent || '';
      return txt.includes('Rapat Uji Fase Lima E2E');
    });

    // Klik Lihat pada entri baru untuk verifikasi label lampiran Drive manusiawi
    await page.click('#kgd-history-wrap tbody tr:first-child button:has-text("Lihat")');
    await page.waitForSelector('#modal-hd:not(.n-hidden)', { timeout: 5000 });
    await page.waitForTimeout(200);
    const hdSubmitEvidence = await page.evaluate(() => {
      const txt = (document.getElementById('hd-evidence') || {}).textContent || '';
      return {
        hasHumanSource: txt.includes('Salinan Google Drive') && !txt.includes('DRIVE_LINK_COPY'),
        hasFile: txt.includes('Dokumen-Tautan-Drive.pdf')
      };
    });
    await page.evaluate(() => _hdClose());

    // Klik Revisi pada entri baru -> cek calendar picker locked + simpan revisi + verifikasi carry-over lampiran
    await page.click('#kgd-history-wrap tbody tr:first-child button:has-text("Revisi")');
    await page.waitForSelector('#modal-kgd-revisi:not(.n-hidden)', { timeout: 5000 });
    await page.click('#rv-kgd-tanggal');
    const pickerCallsOnRev = await page.evaluate(() => window.__showPickerCalls);
    const revDateBefore = await page.inputValue('#rv-kgd-tanggal');
    await page.keyboard.type('2001-02-02');
    const revDateAfter = await page.inputValue('#rv-kgd-tanggal');
    await page.fill('#rv-kgd-judul', 'Rapat Uji Fase Lima E2E (Revisi)');
    await page.fill('#rv-kgd-alasan', 'Pembaruan agenda koordinasi');
    await page.click('#kgd-btn-revisi-save');
    await page.waitForSelector('#modal-kgd-revisi.n-hidden', { state: 'attached', timeout: 5000 });
    await page.waitForTimeout(250);

    const afterRevisiCheck = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('#kgd-history-wrap tbody tr:not(.hist-void-note)')];
      const txt = rows.slice(0, 2).map((r) => r.textContent).join(' | ');
      return txt.includes('Rapat Uji Fase Lima E2E (Revisi)') && txt.includes('Aktif') && txt.includes('Ditimpa');
    });

    await page.click('#kgd-history-wrap tbody tr:first-child button:has-text("Lihat")');
    await page.waitForSelector('#modal-hd:not(.n-hidden)', { timeout: 5000 });
    await page.waitForTimeout(200);
    const hdCarryEvidence = await page.evaluate(() => {
      const txt = (document.getElementById('hd-evidence') || {}).textContent || '';
      return txt.includes('Dokumen-Tautan-Drive.pdf') && txt.includes('Salinan Google Drive');
    });
    await page.evaluate(() => _hdClose());

    // Klik Anulir pada baris hasil revisi -> isi alasan -> konfirmasi -> verifikasi status Dianulir + Alasan Anulir
    await page.click('#kgd-history-wrap tbody tr:first-child button:has-text("Anulir")');
    await page.waitForSelector('#modal-kgd-anulir:not(.n-hidden)', { timeout: 5000 });
    await page.fill('#an-kgd-alasan', 'Dibatalkan dalam uji E2E Fase 5');
    await page.click('#kgd-btn-anulir-save');
    await page.waitForSelector('#modal-kgd-anulir.n-hidden', { state: 'attached', timeout: 5000 });
    await page.waitForTimeout(250);

    const fase5E2E = await page.evaluate((meta) => {
      const wrapTxt = (document.getElementById('kgd-history-wrap') || {}).textContent || '';
      return {
        pickerCalled: meta.pickerCallsOnForm > 0 && meta.pickerCallsOnRev > meta.pickerCallsOnForm,
        dateAntiTypeOk: meta.valBeforeType === meta.valAfterType && meta.revDateBefore === meta.revDateAfter,
        afterSubmitCheck: meta.afterSubmitCheck,
        hdSubmitEvidence: meta.hdSubmitEvidence,
        afterRevisiCheck: meta.afterRevisiCheck,
        hdCarryEvidence: meta.hdCarryEvidence,
        afterAnulirOk: wrapTxt.includes('Dianulir') && wrapTxt.includes('Dibatalkan dalam uji E2E Fase 5')
      };
    }, { pickerCallsOnForm, pickerCallsOnRev, valBeforeType, valAfterType, revDateBefore, revDateAfter, afterSubmitCheck, hdSubmitEvidence, afterRevisiCheck, hdCarryEvidence });
    console.log('[AUDIT] fase5-kegiatan-e2e:', JSON.stringify(fase5E2E));

    // ── 8. Notifikasi (Desktop) ──
    await page.evaluate(() => _routeTo('notifikasi'));
    await page.waitForSelector('#ntf-list .n-table', { timeout: 10000 });
    await page.waitForTimeout(300);
    const ntfState = await page.evaluate(() => {
      const sumEl = document.getElementById('ntf-summary-line');
      const kpiGridCount = document.querySelectorAll('#page-content .kpi-grid').length;
      const dots = document.querySelectorAll('#ntf-list .ntf-unread-dot').length;
      const rows = document.querySelectorAll('#ntf-list tbody tr').length;
      return {
        summaryText: sumEl ? sumEl.textContent.trim() : '',
        kpiGridCount,
        dots,
        rows
      };
    });
    console.log('[AUDIT] notifikasi-state:', JSON.stringify(ntfState));
    reports['notifikasi-desktop'] = await inspectPage(page, 'notifikasi-desktop');
    await page.screenshot({ path: path.join(OUT_DIR, '08-notifikasi-desktop.png'), fullPage: true });

    // ── 9. Admin Panel (Desktop — 4 Underline Tabs + Approval Queue + Users + Audit) ──
    await page.evaluate(() => {
      window.__auditSetUser({ role: 'SUPERADMIN' });
      APP.user.role = 'SUPERADMIN';
      _routeTo('kelola-akun');
    });
    await page.waitForSelector('#ka-approval-table-wrap .n-table', { timeout: 10000 });
    await page.waitForTimeout(350);
    const adminState = await page.evaluate(() => {
      const approvalRows = document.querySelectorAll('#ka-approval-table-wrap tbody tr').length;
      const visibleTabs = [...document.querySelectorAll('#adn-tabs .n-tab:not([hidden])')].map((t) => t.textContent.trim());
      return { approvalRows, visibleTabs };
    });
    reports['admin-desktop'] = await inspectPage(page, 'admin-desktop');
    await page.screenshot({ path: path.join(OUT_DIR, '09-admin-desktop.png'), fullPage: true });
    await page.click('#adn-tab-pengguna');
    await page.waitForSelector('#adn-users-wrap .n-table', { timeout: 10000 });
    await page.waitForTimeout(250);
    reports['admin-pengguna'] = await inspectPage(page, 'admin-pengguna');
    await page.click('#adn-tab-audit');
    await page.waitForSelector('#adn-audit-wrap .n-table', { timeout: 10000 });
    await page.waitForTimeout(250);
    const adminAuditText = await page.evaluate(() => (document.getElementById('adn-audit-wrap') || {}).textContent || '');
    reports['admin-audit'] = await inspectPage(page, 'admin-audit');
    await page.click('#adn-tab-reminder');
    await page.waitForTimeout(250);
    const reminderStatusText = await page.evaluate(() => (document.getElementById('adn-reminder-status') || {}).textContent || '');
    await page.click('#adn-tab-satelit');
    await page.waitForSelector('#adn-sat-wrap .n-table', { timeout: 10000 });
    await page.waitForTimeout(250);
    reports['admin-satelit'] = await inspectPage(page, 'admin-satelit');
    await page.screenshot({ path: path.join(OUT_DIR, '09b-admin-satelit-desktop.png'), fullPage: true });
    await page.click('#btn-adn-looker-sync');
    await page.waitForSelector('#adn-sat-msg.show', { timeout: 5000 });
    const satMsgText = await page.evaluate(() => (document.getElementById('adn-sat-msg') || {}).textContent || '');
    await page.evaluate(() => {
      window.__auditSetUser({ role: 'DIREKTUR' });
      APP.user.role = 'DIREKTUR';
    });
    console.log('[AUDIT] admin-state:', JSON.stringify(Object.assign({}, adminState, { hasAuditRows: !adminAuditText.includes('USR-'), reminderStatusText, satMsgText })));

    // ── 10. Master Data (Desktop — Kapal Classes + Kawasan + WPP + Opsi) ──
    await page.evaluate(() => _routeTo('master-data'));
    await page.waitForSelector('#md-kapal-wrap .n-table', { timeout: 10000 });
    await page.waitForTimeout(350);
    const mdState = await page.evaluate(() => {
      const txt = (document.getElementById('page-content') || {}).textContent || '';
      const summaryCells = document.querySelectorAll('#md-kapal-summary .sec-kpi-cell').length;
      const hulls = document.querySelectorAll('#md-kapal-wrap .md-class-cell .ship-hull').length;
      const rawToken = txt.match(/\b(?:KAPAL_PUSAT|KAPAL_UPT|HIU_MACAN|AKAR_BAHAR|PRD\s*§)\b/);
      return {
        summaryCells,
        hulls,
        hasPrd: /PRD\s*§/i.test(txt),
        rawToken: rawToken ? rawToken[0] : ''
      };
    });
    reports['master-data-desktop'] = await inspectPage(page, 'master-data-desktop');
    await page.screenshot({ path: path.join(OUT_DIR, '10-master-data-desktop.png'), fullPage: true });
    await page.click('#md-tabs [data-md-tab="opsi"]');
    await page.waitForSelector('#md-opsi-wrap .md-opsi-add-row', { timeout: 10000 });
    await page.waitForTimeout(250);
    const mdOpsiHasTypo = await page.evaluate(() => /\bnasab\b/i.test((document.getElementById('md-opsi-wrap') || {}).textContent || ''));
    reports['master-opsi'] = await inspectPage(page, 'master-opsi');
    console.log('[AUDIT] master-data-state:', JSON.stringify(Object.assign({}, mdState, { mdOpsiHasTypo })));

    // ── 11. Riwayat Transaksi Terfederasi (Desktop) ──
    await page.evaluate(() => _routeTo('riwayat'));
    await page.waitForSelector('#riw-history-wrap .n-table', { timeout: 10000 });
    await page.waitForTimeout(350);
    const riwState = await page.evaluate(() => {
      const txt = (document.getElementById('page-content') || {}).textContent || '';
      const stripCells = document.querySelectorAll('#riw-kpi-strip .sec-kpi-cell').length;
      const periodCell = document.querySelector('#riw-history-wrap tbody td.td-nowrap');
      const periodWs = periodCell ? getComputedStyle(periodCell).whiteSpace : '';
      return {
        hasCleanTitle: txt.includes('Riwayat Transaksi Terfederasi') && !/SUPERSEDED\s*&\s*VOID/i.test(txt),
        stripCells,
        hasFixedDitimpaSub: txt.includes('Digantikan revisi'),
        hasRawUserId: /\bUSR-[A-Z0-9_-]+\b/.test(txt),
        periodWs
      };
    });
    reports['riwayat-desktop'] = await inspectPage(page, 'riwayat-desktop');
    await page.screenshot({ path: path.join(OUT_DIR, '11-riwayat-desktop.png'), fullPage: true });
    console.log('[AUDIT] riwayat-state:', JSON.stringify(riwState));

    console.log('[CONSOLE ERRORS]:', consoleErrors.length, consoleErrors);
    console.log('[PAGE ERRORS]:', pageErrors.length, pageErrors);

    // Fase R2 + R3 + R4 automated quality gates
    const ov = reports['overview-desktop'];
    const failures = [];
    if (pageErrors.length !== 0) failures.push('pageErrors=' + pageErrors.length);
    if (toastCountOnPopover !== 0) failures.push('toastCountOnPopover=' + toastCountOnPopover);
    if (classOneCount !== 6) failures.push('classOneCount=' + classOneCount);
    if (overviewNavState.navBarHeight < 40) failures.push('navBarHeight=' + overviewNavState.navBarHeight);
    if (overviewNavState.dockDisplay !== 'none') failures.push('desktopDockDisplay=' + overviewNavState.dockDisplay);
    if (overviewNavState.hasNotifTab) failures.push('duplicateNotifTab=true');
    if (overviewNavState.kapalLabel !== 'Kapal Terbaik') failures.push('kapalLabel=' + overviewNavState.kapalLabel);
    if (!overviewNavState.singleRow) failures.push('navWrapped');
    if (overviewNavState.headerTop < overviewNavState.topbarBottom - 1) failures.push('headerOverlappedByTopbar=' + overviewNavState.headerTop + '<' + overviewNavState.topbarBottom);
    if (!(overviewNavState.indicatorWidth > 40) || overviewNavState.indicatorOpacity !== '1') failures.push('overviewNavState=' + JSON.stringify(overviewNavState));
    if (!(ktNavState.indicatorX > overviewNavState.indicatorX) || !(ktNavState.indicatorWidth > 80)) failures.push('ktNavState=' + JSON.stringify(ktNavState));
    if (ktNavState.twValue !== '2' || ktNavState.yrValue !== '2026') failures.push('ktFilterSync=' + ktNavState.twValue + '/' + ktNavState.yrValue);
    if (!ktNavState.findingText.includes('TW II') || ktNavState.findingText.includes('43.2') || /\.$/.test(ktNavState.findingText)) failures.push('ktFinding=' + ktNavState.findingText);
    if (ktNavState.hasGalanganInPodium) failures.push('galanganInPodium=true');
    if (ktNavState.podiumHulls !== 3 || ktNavState.tableHulls !== 34) failures.push('ktHulls=' + ktNavState.podiumHulls + '/' + ktNavState.tableHulls);
    if (ktNavState.rawToken) failures.push('ktRawToken=' + ktNavState.rawToken);
    if (pkState.h1Text !== 'KP. ORCA 01') failures.push('pkH1=' + pkState.h1Text);
    if (pkState.specCells !== 5) failures.push('pkSpecCells=' + pkState.specCells);
    if (!pkState.hasHumanEnum || !pkState.hasHumanDate) failures.push('pkHuman=' + JSON.stringify(pkState));
    if (pkState.rawToken) failures.push('pkRawToken=' + pkState.rawToken);
    if (!kgdState.hasTitle || kgdState.kpiCells !== 3 || kgdState.beforeSearch !== 4 || kgdState.afterSearch !== 1 || !kgdState.dateLockedForm || !kgdState.dateLockedRevisi || !headerRangeLocked || kgdState.hasRawUserId) {
      failures.push('kgdState=' + JSON.stringify(Object.assign({}, kgdState, { headerRangeLocked })));
    }
    if (!fase5E2E || !fase5E2E.pickerCalled || !fase5E2E.dateAntiTypeOk || !fase5E2E.afterSubmitCheck || !fase5E2E.hdSubmitEvidence.hasHumanSource || !fase5E2E.hdSubmitEvidence.hasFile || !fase5E2E.afterRevisiCheck || !fase5E2E.hdCarryEvidence || !fase5E2E.afterAnulirOk) {
      failures.push('fase5E2E=' + JSON.stringify(fase5E2E));
    }
    if (!ntfState.summaryText.includes('3 belum dibaca') || ntfState.kpiGridCount !== 0 || ntfState.dots < 1 || ntfState.rows !== 5) {
      failures.push('ntfState=' + JSON.stringify(ntfState));
    }
    if (adminState.approvalRows !== 2 || adminState.visibleTabs.length !== 5 || adminAuditText.includes('USR-') || !satMsgText.includes('Data Mart Looker Studio')) {
      failures.push('adminState=' + JSON.stringify(Object.assign({}, adminState, { satMsgText })));
    }
    if (mdState.summaryCells !== 3 || mdState.hulls < 10 || mdState.hasPrd || mdState.rawToken || mdOpsiHasTypo) {
      failures.push('mdState=' + JSON.stringify(Object.assign({}, mdState, { mdOpsiHasTypo })));
    }
    if (!riwState.hasCleanTitle || riwState.stripCells !== 4 || !riwState.hasFixedDitimpaSub || riwState.hasRawUserId || riwState.periodWs !== 'nowrap') {
      failures.push('riwState=' + JSON.stringify(riwState));
    }
    if (mobileDockState.navBarDisplay !== 'none' || mobileDockState.dockDisplay !== 'grid' || mobileDockState.dockLeft !== 0 || mobileDockState.dockRight !== 390 || mobileDockState.dockBorderRadius !== '0px') {
      failures.push('mobileDockState=' + JSON.stringify(mobileDockState));
    }
    [
      'login-desktop', 'login-mobile',
      'overview-desktop', 'overview-1024', 'overview-mobile',
      'kapal-terbaik-desktop', 'kapal-terbaik-mobile',
      'profil-kapal-desktop', 'profil-kapal-mobile',
      'kegiatan-desktop', 'notifikasi-desktop',
      'admin-desktop', 'admin-pengguna', 'admin-audit', 'admin-satelit',
      'master-data-desktop', 'master-opsi', 'riwayat-desktop'
    ].forEach((k) => {
      const r = reports[k];
      if (!r) { failures.push('missingReport:' + k); return; }
      if (r.overflowX !== 0) failures.push(k + ':overflowX=' + r.overflowX);
      if (r.brokenControlRows.length !== 0) failures.push(k + ':brokenControlRows=' + JSON.stringify(r.brokenControlRows));
      if (r.tinyTextCount !== 0) failures.push(k + ':tinyTextCount=' + r.tinyTextCount + ':' + JSON.stringify(r.tinyTextSamples));
      if (r.clippedCount !== 0) failures.push(k + ':clippedCount=' + r.clippedCount + ':' + JSON.stringify(r.clippedSamples));
      if (r.nonPublicSansCount !== 0) failures.push(k + ':nonPublicSansCount=' + r.nonPublicSansCount + ':' + JSON.stringify(r.nonPublicSansSamples));
    });
    if (ov) {
      if (ov.markerCount !== 34) failures.push('ov.markerCount=' + ov.markerCount);
      if (ov.markerOverlaps !== 0) failures.push('ov.markerOverlaps=' + ov.markerOverlaps);
      if (ov.distinctBg > 16) failures.push('ov.distinctBg=' + ov.distinctBg + ':' + JSON.stringify(ov.distinctBgList));
      if (ov.docHeight > 2100) failures.push('ov.docHeight=' + ov.docHeight);
    }
    [
      ['desktop', wppMapDesktop],
      ['1024', wppMapLaptop],
      ['mobile', wppMapMobile]
    ].forEach(([lbl, wm]) => {
      if (!wm || wm.wppPolygons !== 11 || wm.hasErrorNotice || !wm.hasLegend || wm.shipsInBounds !== 34) {
        failures.push(`wppMap-${lbl}=` + JSON.stringify(wm));
      }
      const r = reports[lbl === 'desktop' ? 'overview-desktop' : lbl === '1024' ? 'overview-1024' : 'overview-mobile'];
      if (r && r.markerOverlaps !== 0) failures.push(`overview-${lbl}.markerOverlaps=` + r.markerOverlaps);
    });
    if (failures.length) {
      console.error('[AUDIT GATES FAILED]:', failures.join(' | '));
      process.exitCode = 1;
    } else {
      console.log('[AUDIT GATES PASSED]: ALL 12 FASE R4 GATES GREEN');
    }
  } finally {
    await browser.close();
    server.close();
  }
})();
