import api from '@/lib/api';

export const dashboardService = {
  getKehadiranByDate: (tanggal) => 
    api.get(`/admin/dashboard/kehadiran`, { params: { tanggal } }),
  
  getPegawaiBelumAbsenByDate: (tanggal) => 
    api.get(`/admin/dashboard/pegawai-belum-absen-filter`, { params: { tanggal } }),
  
  getPresensiByDate: (tanggal) =>
    api.get(`/admin/presensi`, { params: { tanggal } }),
  
  getKinerjaByDate: (tanggal) => 
    api.get(`/admin/dashboard/kinerja`, { params: { tanggal } }),
  
  getGrafikHadirBulanan: (params) =>
    api.get(`/admin/dashboard/kehadiran-bulanan`, { params }),
  
  getGrafikKinerjaBulanan: (params) =>
    api.get(`/admin/dashboard/kinerja-bulanan`, { params }),
  
  getRekapKinerjaBulanan: (bulan, tahun) =>
    api.get(`/admin/kinerja/rekap-bulanan`, { params: { bulan, tahun } }),
  
  getStatistikKinerja: (bulan, tahun) =>
    api.get(`/admin/kinerja/statistik`, { params: { bulan, tahun } }),
  
  getDaftarWilayah: () =>
    api.get(`/admin/dashboard/daftar-wilayah`),
  
  getKehadiranHariIni: (tanggal) => 
    api.get(`/admin/dashboard/kehadiran`, { params: { tanggal } }),
  
  getKinerjaHariIni: (tanggal) => 
    api.get(`/admin/dashboard/kinerja`, { params: { tanggal } }),
  
  getPegawaiBelumAbsen: (tanggal) => 
    api.get(`/admin/dashboard/pegawai-belum-absen-filter`, { params: { tanggal } }),
  getPegawaiIzinByDate: (tanggal) => 
    api.get(`/admin/dashboard/pegawai-izin`, { params: { tanggal } }),
  getPresensiHarian: (tanggal) =>
    api.get(`/admin/presensi?tanggal=${tanggal}`),
};