"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { usersAPI, hariAPI, adminKinerjaAPI } from "@/lib/api";
import { TARGET_KR_HARIAN, TARGET_KN_HARIAN, WILAYAH_LIST } from "../../utils/dashboard/constants";
import Swal from "sweetalert2";

export function useKinerjaData() {
  const [state, setState] = useState({
    activeChart: 'bar',
    filterType: 'all',
    sortOrder: 'desc',
    selectedMonth: new Date().getMonth() + 1,
    selectedYear: new Date().getFullYear(),
    chartData: null,
    wilayahChartData: null,
    pegawaiList: [],
    kinerjaData: [],
    allKinerjaData: [],
    hariKerjaList: [],
    loading: false,
    statistikBulanan: {
      total_pegawai: 0,
      total_sudah_lapor: 0,
      total_belum_lapor: 0,
      total_tercapai_target: 0,
      total_hampir_tercapai: 0,
      total_sedang: 0,
      total_tidak_tercapai: 0,
      rata_kr: 0,
      rata_kn: 0,
      rata_panjang: 0,
      rata_pencapaian: 0,
      persen_sudah_lapor: 0,
      persen_tercapai_target: 0,
      hari_kerja: 0,
      target_bulanan: 0
    },
    statistikWilayah: []
  });

  const isMounted = useRef(true);
  const isProcessing = useRef(false);
  const lastParams = useRef({ bulan: null, tahun: null });

  const getNamaBulan = (month) => {
    const bulan = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return bulan[parseInt(month) - 1] || '';
  };

  const loadPegawaiData = useCallback(async () => {
    try {
      const response = await usersAPI.getAll();
      const usersData = response.data?.data || [];
      
      const pegawaiData = usersData.filter(user => 
        (user.jabatan?.toLowerCase() === 'pegawai' || user.role === 'pegawai') &&
        user.status?.toLowerCase() === 'aktif'
      );
      
      if (isMounted.current) {
        setState(prev => ({ ...prev, pegawaiList: pegawaiData }));
      }
      return pegawaiData;
    } catch (error) {
      console.error('Error loading pegawai:', error);
      return [];
    }
  }, []);

  const loadHariKerjaData = useCallback(async (bulan, tahun) => {
    try {
      const params = { bulan, tahun };
      const response = await hariAPI.getAllHariKerja(params);
      const hariKerjaData = response.data?.data || [];
      if (isMounted.current) {
        setState(prev => ({ ...prev, hariKerjaList: hariKerjaData }));
      }
      return hariKerjaData;
    } catch (error) {
      console.error('Error loading hari kerja:', error);
      return [];
    }
  }, []);

  const loadKinerjaData = useCallback(async (bulan, tahun) => {
    try {
      const params = { bulan: bulan, tahun: tahun };
      
      console.log('📡 Fetching kinerja data with params:', params);
      const response = await adminKinerjaAPI.getPerBulan(params);
      const data = response.data?.data || {};
      
      const allKinerja = data.all_kinerja || [];
      const pegawaiKinerja = data.pegawai_kinerja || [];
      const apiStatistik = data.statistik || {};
      const apiCharts = data.charts || {};
      const periode = data.periode || {};
      
      if (isMounted.current) {
        setState(prev => ({ 
          ...prev, 
          kinerjaData: pegawaiKinerja,
          allKinerjaData: allKinerja,
          statistikBulanan: {
            ...prev.statistikBulanan,
            total_pegawai: apiStatistik.total_pegawai || 0,
            total_sudah_lapor: apiStatistik.total_sudah_lapor || 0,
            total_belum_lapor: apiStatistik.total_belum_lapor || 0,
            total_tercapai_target: apiStatistik.status_counts?.tercapai_target || 0,
            total_hampir_tercapai: apiStatistik.status_counts?.hampir_tercapai || 0,
            total_sedang: apiStatistik.status_counts?.sedang || 0,
            total_tidak_tercapai: apiStatistik.status_counts?.tidak_tercapai || 0,
            rata_kr: apiStatistik.rata_kr || 0,
            rata_kn: apiStatistik.rata_kn || 0,
            rata_panjang: apiStatistik.rata_panjang || 0,
            rata_pencapaian: apiStatistik.rata_pencapaian || 0,
            persen_sudah_lapor: apiStatistik.persen_sudah_lapor || 0,
            hari_kerja: periode.total_hari_kerja || 0,
            target_bulanan: periode.target_bulanan || 0
          }
        }));
        
        if (apiCharts && apiCharts.labels && apiCharts.labels.length > 0) {
          setState(prev => ({
            ...prev,
            chartData: {
              labels: apiCharts.labels,
              pencapaian: apiCharts.datasets?.[0]?.data || [],
              pegawaiData: pegawaiKinerja.reduce((acc, p) => {
                acc[p.nama] = {
                  total_kr: p.total_kr,
                  total_kn: p.total_kn,
                  total_panjang: p.total_panjang,
                  pencapaian: p.pencapaian,
                  status: p.status,
                  total_hari_lapor: p.total_hari_lapor,
                  persen_kehadiran: p.persen_kehadiran,
                  target_bulanan: p.target_bulanan
                };
                return acc;
              }, {})
            }
          }));
        }
      }
      
      return { allKinerja, pegawaiKinerja, apiStatistik };
    } catch (error) {
      console.error('Error loading kinerja:', error);
      Swal.fire({
        icon: 'error',
        title: 'Gagal memuat data kinerja',
        text: error.response?.data?.message || 'Terjadi kesalahan saat memuat data kinerja',
        confirmButtonText: 'Coba Lagi',
        confirmButtonColor: '#EF4444',
      });
      return { allKinerja: [], pegawaiKinerja: [], apiStatistik: {} };
    }
  }, []);

  const processKinerjaChartData = useCallback(async () => {
    const bulan = state.selectedMonth;
    const tahun = state.selectedYear;
    
    if (isProcessing.current) {
      console.log('⏳ Already processing, skipping...');
      return null;
    }
    
    if (lastParams.current.bulan === bulan && lastParams.current.tahun === tahun && state.chartData) {
      console.log('📊 Data already loaded for this period, skipping...');
      return state.chartData;
    }
    
    console.log('📊 Memproses data kinerja untuk:', bulan, tahun);
    
    isProcessing.current = true;
    
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const [pegawaiData, hariKerjaData] = await Promise.all([
        loadPegawaiData(),
        loadHariKerjaData(bulan, tahun)
      ]);

      if (pegawaiData.length === 0) {
        console.warn('⚠️ Tidak ada data pegawai aktif');
        setState(prev => ({ ...prev, loading: false }));
        isProcessing.current = false;
        return null;
      }

      const { pegawaiKinerja, apiStatistik } = await loadKinerjaData(bulan, tahun);
      
      // Hitung target bulanan tunggal
      let hariKerja = apiStatistik.hari_kerja || 0;
      if (hariKerja === 0 && hariKerjaData.length > 0) {
        hariKerja = hariKerjaData.filter(h => {
          const date = new Date(h.tanggal);
          return date.getMonth() + 1 === bulan && date.getFullYear() === tahun;
        }).length;
      }
      if (hariKerja === 0) {
        // Fallback: hitung manual
        const daysInMonth = new Date(tahun, bulan, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(tahun, bulan - 1, day);
          const dayOfWeek = date.getDay();
          if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            hariKerja++;
          }
        }
      }
      
      const targetBulanan = 50 * hariKerja;
      
      let pegawaiBulanan = {};
      let statusCounts = {
        tercapai_target: 0,
        hampir_tercapai: 0,
        sedang: 0,
        tidak_tercapai: 0,
        tidak_ada_laporan: 0
      };

      if (pegawaiKinerja && pegawaiKinerja.length > 0) {
        pegawaiKinerja.forEach(pegawai => {
          // Pencapaian berdasarkan total panjang
          const pencapaian = pegawai.pencapaian !== undefined 
            ? pegawai.pencapaian 
            : (pegawai.total_panjang / targetBulanan) * 100 || 0;
          
          pegawaiBulanan[pegawai.nama] = {
            data: pegawai,
            total_hari_lapor: pegawai.total_hari_lapor || 0,
            total_kr: pegawai.total_kr || 0,
            total_kn: pegawai.total_kn || 0,
            total_panjang: pegawai.total_panjang || 0,
            rata_harian_kr: pegawai.rata_harian_kr || 0,
            rata_harian_kn: pegawai.rata_harian_kn || 0,
            persen_kehadiran: pegawai.persen_kehadiran || 0,
            pencapaian: parseFloat(pencapaian.toFixed(1)),
            target_bulanan: pegawai.target_bulanan || targetBulanan,
            status: pegawai.status || 'tidak_ada_laporan',
            wilayah: pegawai.wilayah || 'Tidak diketahui'
          };
          
          if (pegawai.status === 'tercapai_target') statusCounts.tercapai_target++;
          else if (pegawai.status === 'hampir_tercapai') statusCounts.hampir_tercapai++;
          else if (pegawai.status === 'sedang') statusCounts.sedang++;
          else if (pegawai.status === 'tidak_tercapai') statusCounts.tidak_tercapai++;
          else statusCounts.tidak_ada_laporan++;
        });
      } else {
        pegawaiData.forEach(pegawai => {
          pegawaiBulanan[pegawai.nama] = {
            data: pegawai,
            total_hari_lapor: 0,
            total_kr: 0,
            total_kn: 0,
            total_panjang: 0,
            rata_harian_kr: 0,
            rata_harian_kn: 0,
            persen_kehadiran: 0,
            pencapaian: 0,
            target_bulanan: targetBulanan,
            status: 'tidak_ada_laporan',
            wilayah: pegawai.wilayah_penugasan || 'Tidak diketahui'
          };
        });
        statusCounts.tidak_ada_laporan = pegawaiData.length;
      }

      const labels = Object.keys(pegawaiBulanan);
      const pencapaianArray = labels.map(nama => pegawaiBulanan[nama].pencapaian);
      const totalKRArray = labels.map(nama => pegawaiBulanan[nama].total_kr);
      const totalKNArray = labels.map(nama => pegawaiBulanan[nama].total_kn);
      const totalPanjangArray = labels.map(nama => pegawaiBulanan[nama].total_panjang);
      const statusArray = labels.map(nama => pegawaiBulanan[nama].status);
      const targetArray = labels.map(() => targetBulanan);

      const chartData = {
        labels,
        totalKR: totalKRArray,
        totalKN: totalKNArray,
        totalPanjang: totalPanjangArray,
        target: targetArray,
        pencapaian: pencapaianArray,
        status: statusArray,
        statusCounts,
        pegawaiData: pegawaiBulanan,
        bulan: `${getNamaBulan(bulan)} ${tahun}`,
        selectedMonth: bulan,
        selectedYear: tahun,
        totalPegawai: pegawaiData.length,
        rataPencapaian: apiStatistik.rata_pencapaian || 
          (pencapaianArray.reduce((a, b) => a + b, 0) / (pencapaianArray.length || 1)) || 0,
        totalPanjangAchieved: apiStatistik.total_panjang || 
          totalPanjangArray.reduce((a, b) => a + b, 0),
        totalTarget: targetBulanan * pegawaiData.length,
        hariKerja: hariKerja,
        targetBulanan: targetBulanan
      };

      // Proses statistik wilayah
      const wilayahMap = {};
      WILAYAH_LIST.forEach(wilayahItem => {
        wilayahMap[wilayahItem] = {
          wilayah: wilayahItem,
          totalPegawai: 0,
          totalSudahLapor: 0,
          totalKR: 0,
          totalKN: 0,
          totalPanjang: 0,
          target: 0,
          rataPencapaian: 0
        };
      });

      Object.values(pegawaiBulanan).forEach(pegawai => {
        const wilayahPegawai = pegawai.wilayah;
        if (wilayahMap[wilayahPegawai]) {
          wilayahMap[wilayahPegawai].totalPegawai++;
          wilayahMap[wilayahPegawai].target += pegawai.target_bulanan;
          
          if (pegawai.total_hari_lapor > 0) {
            wilayahMap[wilayahPegawai].totalSudahLapor++;
            wilayahMap[wilayahPegawai].totalKR += pegawai.total_kr;
            wilayahMap[wilayahPegawai].totalKN += pegawai.total_kn;
            wilayahMap[wilayahPegawai].totalPanjang += pegawai.total_panjang;
          }
        }
      });

      Object.values(wilayahMap).forEach(wilayahItem => {
        if (wilayahItem.totalSudahLapor > 0) {
          wilayahItem.rataPencapaian = wilayahItem.target > 0 
            ? (wilayahItem.totalPanjang / wilayahItem.target) * 100 
            : 0;
          wilayahItem.rataPencapaian = parseFloat(wilayahItem.rataPencapaian.toFixed(1));
        }
      });

      const wilayahWithData = Object.values(wilayahMap).filter(w => w.totalPegawai > 0);

      const wilayahChartData = {
        labels: wilayahWithData.map(w => w.wilayah),
        datasets: [
          {
            label: 'Total Panjang (KR+KN)',
            data: wilayahWithData.map(w => w.totalPanjang),
            backgroundColor: 'rgba(34, 197, 94, 0.9)',
            borderColor: 'rgb(34, 197, 94)',
            borderWidth: 2,
            borderRadius: 6,
            barPercentage: 0.7,
            categoryPercentage: 0.8
          },
          {
            label: 'Target Bulanan',
            data: wilayahWithData.map(w => w.target),
            backgroundColor: 'rgba(239, 68, 68, 0.9)',
            borderColor: 'rgb(239, 68, 68)',
            borderWidth: 2,
            borderRadius: 6,
            barPercentage: 0.7,
            categoryPercentage: 0.8
          }
        ]
      };

      const totalSudahLaporCount = statusCounts.tercapai_target + statusCounts.hampir_tercapai + statusCounts.sedang + statusCounts.tidak_tercapai;
      const persenSudahLapor = chartData.totalPegawai > 0 
        ? (totalSudahLaporCount / chartData.totalPegawai) * 100 
        : 0;

      if (isMounted.current) {
        setState(prev => ({
          ...prev,
          chartData,
          wilayahChartData,
          statistikWilayah: wilayahWithData,
          statistikBulanan: {
            total_pegawai: chartData.totalPegawai,
            total_sudah_lapor: totalSudahLaporCount,
            total_belum_lapor: statusCounts.tidak_ada_laporan,
            total_tercapai_target: statusCounts.tercapai_target,
            total_hampir_tercapai: statusCounts.hampir_tercapai,
            total_sedang: statusCounts.sedang,
            total_tidak_tercapai: statusCounts.tidak_tercapai,
            rata_kr: chartData.totalKR.reduce((a, b) => a + b, 0) / (totalSudahLaporCount || 1),
            rata_kn: chartData.totalKN.reduce((a, b) => a + b, 0) / (totalSudahLaporCount || 1),
            rata_panjang: chartData.totalPanjangAchieved / (totalSudahLaporCount || 1),
            rata_pencapaian: chartData.rataPencapaian,
            persen_sudah_lapor: parseFloat(persenSudahLapor.toFixed(1)),
            persen_tercapai_target: statusCounts.tercapai_target > 0 
              ? parseFloat(((statusCounts.tercapai_target / totalSudahLaporCount) * 100).toFixed(1)) 
              : 0,
            hari_kerja: chartData.hariKerja,
            target_bulanan: targetBulanan
          },
          loading: false
        }));
      }
      
      lastParams.current = { bulan, tahun };
      isProcessing.current = false;
      
      return chartData;

    } catch (error) {
      console.error('Error processing chart data:', error);
      if (isMounted.current) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal memproses data',
          text: error.message || 'Terjadi kesalahan saat memproses data',
          confirmButtonText: 'Tutup',
          confirmButtonColor: '#EF4444',
        });
        setState(prev => ({ ...prev, loading: false }));
      }
      isProcessing.current = false;
      return null;
    }
  }, [state.selectedMonth, state.selectedYear, state.chartData, loadPegawaiData, loadHariKerjaData, loadKinerjaData]);

  const handleMonthChange = useCallback((month) => {
    console.log('🔄 Mengubah bulan ke:', month);
    setState(prev => ({ 
      ...prev, 
      selectedMonth: month,
      chartData: null
    }));
  }, []);

  const handleYearChange = useCallback((year) => {
    console.log('🔄 Mengubah tahun ke:', year);
    setState(prev => ({ 
      ...prev, 
      selectedYear: year,
      chartData: null
    }));
  }, []);

  // ==================== EXPORT FUNCTIONS ====================

  const exportToCSV = useCallback((data, filename) => {
    if (!data || data.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Tidak ada data',
        text: 'Tidak ada data yang dapat diekspor',
        confirmButtonText: 'Tutup'
      });
      return false;
    }

    try {
      const headers = Object.keys(data[0]);
      const csvRows = [];
      csvRows.push(headers.join(','));
      
      for (const row of data) {
        const values = headers.map(header => {
          const value = row[header] || '';
          const escaped = String(value).replace(/"/g, '""');
          return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
      }
      
      const blob = new Blob(["\uFEFF" + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      return false;
    }
  }, []);

  const exportToExcel = useCallback((data, filename) => {
    if (!data || data.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Tidak ada data',
        text: 'Tidak ada data yang dapat diekspor',
        confirmButtonText: 'Tutup'
      });
      return false;
    }

    try {
      const headers = Object.keys(data[0]);
      let html = `
        <html>
          <head>
            <meta charset="UTF-8">
            <title>${filename}</title>
            <style>
              th { background-color: #4CAF50; color: white; padding: 8px; }
              td { padding: 6px; border: 1px solid #ddd; }
              table { border-collapse: collapse; width: 100%; }
            </style>
          </head>
          <body>
            <h3>${filename}</h3>
            <table>
              <thead>
                <tr>
                  ${headers.map(h => `<th>${h}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${data.map(row => `
                  <tr>
                    ${headers.map(h => `<td>${row[h] || ''}</td>`).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;
      
      const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.xls`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      return false;
    }
  }, []);

  const exportKinerjaPegawai = useCallback(async (format = 'csv') => {
    if (!state.chartData || !state.chartData.pegawaiData) {
      Swal.fire({
        icon: 'warning',
        title: 'Tidak ada data',
        text: 'Silakan muat data terlebih dahulu',
        confirmButtonText: 'Tutup'
      });
      return;
    }

    const exportData = [];
    const pegawaiData = state.chartData.pegawaiData;
    
    for (const [nama, data] of Object.entries(pegawaiData)) {
      exportData.push({
        'Nama Pegawai': nama,
        'Wilayah': data.wilayah || '-',
        'Status': data.status === 'tercapai_target' ? 'Tercapai Target' :
                  data.status === 'hampir_tercapai' ? 'Hampir Tercapai' :
                  data.status === 'sedang' ? 'Sedang' :
                  data.status === 'tidak_tercapai' ? 'Tidak Tercapai' : 'Tidak Ada Laporan',
        'Total Hari Lapor': data.total_hari_lapor || 0,
        'Persen Kehadiran': `${(data.persen_kehadiran || 0).toFixed(1)}%`,
        'Total KR (m)': (data.total_kr || 0).toFixed(2),
        'Total KN (m)': (data.total_kn || 0).toFixed(2),
        'Total Panjang (m)': (data.total_panjang || 0).toFixed(2),
        'Target Bulanan (m)': (data.target_bulanan || 0).toFixed(2),
        'Pencapaian': `${(data.pencapaian || 0).toFixed(1)}%`,
        'Rata-rata KR Harian': (data.rata_harian_kr || 0).toFixed(2),
        'Rata-rata KN Harian': (data.rata_harian_kn || 0).toFixed(2),
      });
    }
    
    const filename = `kinerja_pegawai_${getNamaBulan(state.selectedMonth)}_${state.selectedYear}`;
    
    let success = false;
    if (format === 'excel') {
      success = exportToExcel(exportData, filename);
    } else {
      success = exportToCSV(exportData, filename);
    }
    
    if (success) {
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: `Data berhasil diekspor ke ${filename}.${format === 'excel' ? 'xls' : 'csv'}`,
        timer: 2000,
        showConfirmButton: false
      });
    }
  }, [state.chartData, state.selectedMonth, state.selectedYear, exportToCSV, exportToExcel]);

  const exportStatistikWilayah = useCallback(async (format = 'csv') => {
    if (!state.statistikWilayah || state.statistikWilayah.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Tidak ada data',
        text: 'Tidak ada data statistik wilayah',
        confirmButtonText: 'Tutup'
      });
      return;
    }

    const exportData = state.statistikWilayah.map(wilayah => ({
      'Wilayah': wilayah.wilayah,
      'Total Pegawai': wilayah.totalPegawai,
      'Sudah Lapor': wilayah.totalSudahLapor,
      'Persen Kehadiran': `${wilayah.totalPegawai > 0 ? ((wilayah.totalSudahLapor / wilayah.totalPegawai) * 100).toFixed(1) : 0}%`,
      'Total KR (m)': (wilayah.totalKR || 0).toFixed(2),
      'Total KN (m)': (wilayah.totalKN || 0).toFixed(2),
      'Total Panjang (m)': (wilayah.totalPanjang || 0).toFixed(2),
      'Target Bulanan (m)': (wilayah.target || 0).toFixed(2),
      'Selisih (m)': ((wilayah.totalPanjang || 0) - (wilayah.target || 0)).toFixed(2),
      'Pencapaian': `${(wilayah.rataPencapaian || 0).toFixed(1)}%`,
    }));
    
    const filename = `statistik_wilayah_${getNamaBulan(state.selectedMonth)}_${state.selectedYear}`;
    
    let success = false;
    if (format === 'excel') {
      success = exportToExcel(exportData, filename);
    } else {
      success = exportToCSV(exportData, filename);
    }
    
    if (success) {
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: `Data berhasil diekspor ke ${filename}.${format === 'excel' ? 'xls' : 'csv'}`,
        timer: 2000,
        showConfirmButton: false
      });
    }
  }, [state.statistikWilayah, state.selectedMonth, state.selectedYear, exportToCSV, exportToExcel]);

  const exportRekapKinerja = useCallback(async (format = 'csv') => {
    if (!state.chartData) {
      Swal.fire({
        icon: 'warning',
        title: 'Tidak ada data',
        text: 'Silakan muat data terlebih dahulu',
        confirmButtonText: 'Tutup'
      });
      return;
    }

    const stat = state.statistikBulanan;
    const exportData = [{
      'Periode': `${getNamaBulan(state.selectedMonth)} ${state.selectedYear}`,
      'Hari Kerja': stat.hari_kerja || 0,
      'Target Bulanan (m)': (stat.target_bulanan || 0).toFixed(2),
      'Total Pegawai': stat.total_pegawai || 0,
      'Sudah Lapor': stat.total_sudah_lapor || 0,
      'Belum Lapor': stat.total_belum_lapor || 0,
      'Persen Kehadiran': `${(stat.persen_sudah_lapor || 0).toFixed(1)}%`,
      'Tercapai Target': stat.total_tercapai_target || 0,
      'Hampir Tercapai': stat.total_hampir_tercapai || 0,
      'Sedang': stat.total_sedang || 0,
      'Tidak Tercapai': stat.total_tidak_tercapai || 0,
      'Rata-rata KR (m)': (stat.rata_kr || 0).toFixed(2),
      'Rata-rata KN (m)': (stat.rata_kn || 0).toFixed(2),
      'Rata-rata Total (m)': (stat.rata_panjang || 0).toFixed(2),
      'Rata-rata Pencapaian': `${(stat.rata_pencapaian || 0).toFixed(1)}%`,
      'Total Panjang (m)': (state.chartData.totalPanjangAchieved || 0).toFixed(2),
      'Total Target (m)': (state.chartData.totalTarget || 0).toFixed(2),
    }];
    
    const filename = `rekap_kinerja_${getNamaBulan(state.selectedMonth)}_${state.selectedYear}`;
    
    let success = false;
    if (format === 'excel') {
      success = exportToExcel(exportData, filename);
    } else {
      success = exportToCSV(exportData, filename);
    }
    
    if (success) {
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: `Data berhasil diekspor ke ${filename}.${format === 'excel' ? 'xls' : 'csv'}`,
        timer: 2000,
        showConfirmButton: false
      });
    }
  }, [state.chartData, state.statistikBulanan, state.selectedMonth, state.selectedYear, exportToCSV, exportToExcel]);

  const exportAllData = useCallback(async (format = 'csv') => {
    Swal.fire({
      title: 'Mengekspor data...',
      text: 'Mohon tunggu sebentar',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const periode = `${getNamaBulan(state.selectedMonth)} ${state.selectedYear}`;
      
      const allData = [];
      
      if (state.chartData?.pegawaiData) {
        for (const [nama, data] of Object.entries(state.chartData.pegawaiData)) {
          allData.push({
            'Kategori': 'Kinerja Pegawai',
            'Periode': periode,
            'Nama/Wilayah': nama,
            'Status': data.status === 'tercapai_target' ? 'Tercapai Target' :
                      data.status === 'hampir_tercapai' ? 'Hampir Tercapai' :
                      data.status === 'sedang' ? 'Sedang' :
                      data.status === 'tidak_tercapai' ? 'Tidak Tercapai' : 'Tidak Ada Laporan',
            'Total KR (m)': (data.total_kr || 0).toFixed(2),
            'Total KN (m)': (data.total_kn || 0).toFixed(2),
            'Total Panjang (m)': (data.total_panjang || 0).toFixed(2),
            'Target Bulanan (m)': (data.target_bulanan || 0).toFixed(2),
            'Pencapaian': `${(data.pencapaian || 0).toFixed(1)}%`,
          });
        }
      }
      
      if (state.statistikWilayah && state.statistikWilayah.length > 0) {
        state.statistikWilayah.forEach(wilayah => {
          allData.push({
            'Kategori': 'Statistik Wilayah',
            'Periode': periode,
            'Nama/Wilayah': wilayah.wilayah,
            'Status': '-',
            'Total KR (m)': (wilayah.totalKR || 0).toFixed(2),
            'Total KN (m)': (wilayah.totalKN || 0).toFixed(2),
            'Total Panjang (m)': (wilayah.totalPanjang || 0).toFixed(2),
            'Target Bulanan (m)': (wilayah.target || 0).toFixed(2),
            'Pencapaian': `${(wilayah.rataPencapaian || 0).toFixed(1)}%`,
          });
        });
      }
      
      Swal.close();
      
      let success = false;
      if (format === 'excel') {
        success = exportToExcel(allData, `export_lengkap_${periode}`);
      } else {
        success = exportToCSV(allData, `export_lengkap_${periode}`);
      }
      
      if (success) {
        Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: `Semua data berhasil diekspor`,
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (error) {
      Swal.close();
      Swal.fire({
        icon: 'error',
        title: 'Gagal mengekspor data',
        text: error.message || 'Terjadi kesalahan saat mengekspor data',
        confirmButtonText: 'Tutup'
      });
    }
  }, [state.chartData, state.statistikWilayah, state.selectedMonth, state.selectedYear, exportToCSV, exportToExcel]);

  // ==================== EXPORT CHART IMAGE FUNCTIONS ====================

  const handleExportKinerjaChart = useCallback(() => {
    if (!state.chartData) {
      Swal.fire({
        icon: 'info',
        title: 'Tidak Ada Grafik',
        text: 'Tidak ada data grafik untuk diekspor',
        confirmButtonText: 'Oke'
      });
      return;
    }

    let chartContainer = document.getElementById('kinerjaChartContainer');
    
    if (!chartContainer) {
      chartContainer = document.querySelector('.kinerja-chart-container');
    }
    
    if (chartContainer) {
      const canvas = chartContainer.querySelector('canvas');
      if (canvas) {
        try {
          const link = document.createElement('a');
          const bulanLabel = getNamaBulan(state.selectedMonth);
          const fileName = `grafik-kinerja-${bulanLabel}-${state.selectedYear}.png`;
          
          link.download = fileName;
          link.href = canvas.toDataURL('image/png', 1.0);
          link.click();
          
          Swal.fire({
            icon: 'success',
            title: 'Berhasil!',
            text: `Grafik berhasil diekspor sebagai ${fileName}`,
            confirmButtonText: 'OK',
            confirmButtonColor: '#10B981',
            timer: 2000
          });
        } catch (error) {
          console.error('Error exporting chart:', error);
          Swal.fire({
            icon: 'error',
            title: 'Gagal Mengekspor',
            text: 'Terjadi kesalahan saat mengekspor grafik',
            confirmButtonText: 'Tutup'
          });
        }
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'Canvas Tidak Ditemukan',
          text: 'Tidak dapat menemukan canvas grafik untuk diekspor',
          confirmButtonText: 'Tutup'
        });
      }
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Container Tidak Ditemukan',
        text: 'Tidak dapat menemukan container grafik',
        confirmButtonText: 'Tutup'
      });
    }
  }, [state.chartData, state.selectedMonth, state.selectedYear]);

  const handleExportWilayahChart = useCallback(() => {
    if (!state.wilayahChartData) {
      Swal.fire({
        icon: 'info',
        title: 'Tidak Ada Grafik',
        text: 'Tidak ada data grafik wilayah untuk diekspor',
        confirmButtonText: 'Oke'
      });
      return;
    }

    let chartContainer = document.getElementById('wilayahChartContainer');
    
    if (!chartContainer) {
      chartContainer = document.querySelector('.wilayah-chart-container');
    }
    
    if (chartContainer) {
      const canvas = chartContainer.querySelector('canvas');
      if (canvas) {
        try {
          const link = document.createElement('a');
          const bulanLabel = getNamaBulan(state.selectedMonth);
          const fileName = `grafik-wilayah-${bulanLabel}-${state.selectedYear}.png`;
          
          link.download = fileName;
          link.href = canvas.toDataURL('image/png', 1.0);
          link.click();
          
          Swal.fire({
            icon: 'success',
            title: 'Berhasil!',
            text: `Grafik wilayah berhasil diekspor sebagai ${fileName}`,
            confirmButtonText: 'OK',
            confirmButtonColor: '#10B981',
            timer: 2000
          });
        } catch (error) {
          console.error('Error exporting wilayah chart:', error);
          Swal.fire({
            icon: 'error',
            title: 'Gagal Mengekspor',
            text: 'Terjadi kesalahan saat mengekspor grafik wilayah',
            confirmButtonText: 'Tutup'
          });
        }
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'Canvas Tidak Ditemukan',
          text: 'Tidak dapat menemukan canvas grafik untuk diekspor',
          confirmButtonText: 'Tutup'
        });
      }
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Container Tidak Ditemukan',
        text: 'Tidak dapat menemukan container grafik wilayah',
        confirmButtonText: 'Tutup'
      });
    }
  }, [state.wilayahChartData, state.selectedMonth, state.selectedYear]);

  useEffect(() => {
    if (!state.chartData) {
      console.log('📅 Memuat data untuk periode:', state.selectedMonth, state.selectedYear);
      processKinerjaChartData();
    }
  }, [state.selectedMonth, state.selectedYear, state.chartData, processKinerjaChartData]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      isProcessing.current = false;
    };
  }, []);

  return {
    // State
    activeChart: state.activeChart,
    filterType: state.filterType,
    sortOrder: state.sortOrder,
    selectedMonth: state.selectedMonth,
    selectedYear: state.selectedYear,
    chartData: state.chartData,
    wilayahChartData: state.wilayahChartData,
    pegawaiList: state.pegawaiList,
    kinerjaData: state.kinerjaData,
    allKinerjaData: state.allKinerjaData,
    hariKerjaList: state.hariKerjaList,
    loading: state.loading,
    statistikBulanan: state.statistikBulanan,
    statistikWilayah: state.statistikWilayah,
    
    // Functions
    setActiveChart: (chart) => setState(prev => ({ ...prev, activeChart: chart })),
    setFilterType: (type) => setState(prev => ({ ...prev, filterType: type })),
    setSortOrder: (order) => setState(prev => ({ ...prev, sortOrder: order })),
    handleMonthChange,
    handleYearChange,
    processKinerjaChartData,
    
    // Export Functions
    exportKinerjaPegawai,
    exportStatistikWilayah,
    exportRekapKinerja,
    exportAllData,
    exportToCSV,
    exportToExcel,
    
    // Export Chart Image Functions
    handleExportKinerjaChart,
    handleExportWilayahChart,
  };
}