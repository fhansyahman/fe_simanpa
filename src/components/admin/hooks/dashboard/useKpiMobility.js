"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { adminKinerjaAPI, hariAPI, usersAPI } from "@/lib/api";
import Swal from "sweetalert2";

const getNamaBulan = (month) => {
  const bulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return bulan[month - 1] || '';
};

const countWorkDaysManual = (tahun, bulan) => {
  const daysInMonth = new Date(tahun, bulan, 0).getDate();
  let kerjaCount = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(tahun, bulan - 1, day);
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) kerjaCount++;
  }
  return kerjaCount;
};

export function useKpiMobility(initialMonth, initialYear) {
  const [selectedMonth, setSelectedMonth] = useState(initialMonth || new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(initialYear || new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [kpiData, setKpiData] = useState({
    bulan: null,
    tahun: null,
    hariKerja: 0,
    targetPerPegawai: 0,
    targetKolektif: 0,
    
    totalPanjang: 0,
    totalPegawai: 0,
    totalSudahLapor: 0,
    totalBelumLapor: 0,
    persenKehadiran: 0,
    
    statusCounts: {
      tercapai_target: 0,
      hampir_tercapai: 0,
      sedang: 0,
      tidak_tercapai: 0,
      tidak_ada_laporan: 0
    },
    
    rataPencapaian: 0,
    rataPanjang: 0,
    rataKR: 0,
    rataKN: 0,
    
    pegawaiDetails: [],
    statistikWilayah: []
  });
  
  const [simulationMode, setSimulationMode] = useState(false);
  const [simulatedDays, setSimulatedDays] = useState(0);
  const [originalData, setOriginalData] = useState(null);
  
  const isMounted = useRef(true);
  const isProcessing = useRef(false);
  const lastParams = useRef({ bulan: null, tahun: null });

  
  /**
   * Proses raw data dari API menjadi format KPI dashboard
   */
  const processRawData = useCallback((rawKinerja, rawHariKerja, rawPegawai, hariKerjaFromApi, targetFromApi) => {
    let hariKerja = hariKerjaFromApi;
    if (!hariKerja || hariKerja === 0) {
      if (rawHariKerja && rawHariKerja.length > 0) {
        hariKerja = rawHariKerja.length;
      } else {
        hariKerja = countWorkDaysManual(selectedYear, selectedMonth);
      }
    }
    
    const targetPerPegawai = targetFromApi || (50 * hariKerja);
    
    const aktifPegawai = rawPegawai.filter(user => 
      (user.jabatan?.toLowerCase() === 'pegawai' || user.role === 'pegawai') &&
      user.status?.toLowerCase() === 'aktif'
    );
    
    const kinerjaMap = new Map();
    rawKinerja.forEach(kinerja => {
      kinerjaMap.set(kinerja.user_id || kinerja.id || kinerja.nama, kinerja);
    });
    
    let totalPanjang = 0;
    let totalKR = 0;
    let totalKN = 0;
    let totalSudahLapor = 0;
    let statusCounts = {
      tercapai_target: 0,
      hampir_tercapai: 0,
      sedang: 0,
      tidak_tercapai: 0,
      tidak_ada_laporan: 0
    };
    
    const pegawaiDetails = [];
    const processedNames = new Set();
    
    rawKinerja.forEach(kinerja => {
      const nama = kinerja.nama;
      processedNames.add(nama);
      
      const panjang = kinerja.total_panjang || 0;
      const kr = kinerja.total_kr || 0;
      const kn = kinerja.total_kn || 0;
      const hadir = kinerja.total_hari_lapor || 0;
      const target = kinerja.target_bulanan || targetPerPegawai;
      let pencapaian = target > 0 ? (panjang / target) * 100 : 0;
      let status = kinerja.status;
      
      if (!status) {
        if (pencapaian >= 100) status = 'tercapai_target';
        else if (pencapaian >= 80) status = 'hampir_tercapai';
        else if (pencapaian >= 50) status = 'sedang';
        else if (pencapaian > 0) status = 'tidak_tercapai';
        else status = 'tidak_ada_laporan';
      }
      
      totalPanjang += panjang;
      totalKR += kr;
      totalKN += kn;
      if (hadir > 0) totalSudahLapor++;
      
      if (status === 'tercapai_target') statusCounts.tercapai_target++;
      else if (status === 'hampir_tercapai') statusCounts.hampir_tercapai++;
      else if (status === 'sedang') statusCounts.sedang++;
      else if (status === 'tidak_tercapai') statusCounts.tidak_tercapai++;
      else statusCounts.tidak_ada_laporan++;
      
      pegawaiDetails.push({
        id: kinerja.user_id || kinerja.id,
        nama: nama,
        wilayah: kinerja.wilayah || 'Tidak diketahui',
        hadir: hadir,
        totalPanjang: panjang,
        totalKR: kr,
        totalKN: kn,
        target: target,
        pencapaian: Math.min(pencapaian, 200),
        status: status,
        rataHarianKR: kinerja.rata_harian_kr || 0,
        rataHarianKN: kinerja.rata_harian_kn || 0,
        persenKehadiran: kinerja.persen_kehadiran || (hadir / hariKerja) * 100 || 0
      });
    });
    
    aktifPegawai.forEach(pegawai => {
      if (!processedNames.has(pegawai.nama)) {
        pegawaiDetails.push({
          id: pegawai.id,
          nama: pegawai.nama,
          wilayah: pegawai.wilayah_penugasan || 'Tidak diketahui',
          hadir: 0,
          totalPanjang: 0,
          totalKR: 0,
          totalKN: 0,
          target: targetPerPegawai,
          pencapaian: 0,
          status: 'tidak_ada_laporan',
          rataHarianKR: 0,
          rataHarianKN: 0,
          persenKehadiran: 0
        });
        statusCounts.tidak_ada_laporan++;
      }
    });
    
    const totalPegawai = pegawaiDetails.length;
    const totalBelumLapor = totalPegawai - totalSudahLapor;
    const rataPencapaian = totalSudahLapor > 0 
      ? pegawaiDetails.filter(p => p.hadir > 0).reduce((sum, p) => sum + p.pencapaian, 0) / totalSudahLapor 
      : 0;
    const rataPanjang = totalSudahLapor > 0 ? totalPanjang / totalSudahLapor : 0;
    const rataKRPerPegawai = totalSudahLapor > 0 ? totalKR / totalSudahLapor : 0;
    const rataKNPerPegawai = totalSudahLapor > 0 ? totalKN / totalSudahLapor : 0;
    const persenKehadiran = totalPegawai > 0 ? (totalSudahLapor / totalPegawai) * 100 : 0;
    
    const wilayahMap = new Map();
    pegawaiDetails.forEach(pegawai => {
      const wilayah = pegawai.wilayah;
      if (!wilayahMap.has(wilayah)) {
        wilayahMap.set(wilayah, {
          wilayah: wilayah,
          totalPegawai: 0,
          totalSudahLapor: 0,
          totalPanjang: 0,
          totalKR: 0,
          totalKN: 0,
          targetKolektif: 0,
          tercapaiTarget: 0
        });
      }
      const w = wilayahMap.get(wilayah);
      w.totalPegawai++;
      if (pegawai.hadir > 0) {
        w.totalSudahLapor++;
        w.totalPanjang += pegawai.totalPanjang;
        w.totalKR += pegawai.totalKR;
        w.totalKN += pegawai.totalKN;
        w.targetKolektif += pegawai.target;
        if (pegawai.pencapaian >= 100) w.tercapaiTarget++;
      }
    });
    
    const statistikWilayah = Array.from(wilayahMap.values()).map(w => ({
      ...w,
      rataPencapaian: w.targetKolektif > 0 ? (w.totalPanjang / w.targetKolektif) * 100 : 0,
      persenKehadiran: w.totalPegawai > 0 ? (w.totalSudahLapor / w.totalPegawai) * 100 : 0
    }));
    
    return {
      periode: {
        bulan: selectedMonth,
        tahun: selectedYear,
        hariKerja: hariKerja,
        targetPerPegawai: targetPerPegawai,
        targetKolektif: targetPerPegawai * totalPegawai
      },
      realisasi: {
        totalPanjang: totalPanjang,
        totalPegawai: totalPegawai,
        totalSudahLapor: totalSudahLapor,
        totalBelumLapor: totalBelumLapor,
        persenKehadiran: persenKehadiran
      },
      statusCounts: statusCounts,
      rataRata: {
        pencapaian: rataPencapaian,
        panjang: rataPanjang,
        kr: rataKRPerPegawai,
        kn: rataKNPerPegawai
      },
      pegawaiDetails: pegawaiDetails,
      statistikWilayah: statistikWilayah
    };
  }, [selectedMonth, selectedYear]);
  
  /**
   * Load data dari API
   */
  const loadKpiData = useCallback(async () => {
    const bulan = selectedMonth;
    const tahun = selectedYear;
    
    if (isProcessing.current) {
      console.log('⏳ Already processing KPI data...');
      return;
    }
    
    if (lastParams.current.bulan === bulan && lastParams.current.tahun === tahun && kpiData.pegawaiDetails.length > 0) {
      console.log('📊 KPI data already loaded for this period');
      return;
    }
    
    isProcessing.current = true;
    setLoading(true);
    setError(null);
    
    try {
      console.log('📡 Loading KPI data for:', bulan, tahun);
      
      const [hariRes, kinerjaRes, usersRes] = await Promise.all([
        hariAPI.getAllHariKerja({ bulan, tahun }),
        adminKinerjaAPI.getPerBulan({ bulan, tahun }),
        usersAPI.getAll()
      ]);
      
      const hariKerjaData = hariRes.data?.data || [];
      const apiData = kinerjaRes.data?.data || {};
      const pegawaiKinerja = apiData.pegawai_kinerja || [];
      const periodeInfo = apiData.periode || {};
      const allUsers = usersRes.data?.data || [];
      
      const hariKerjaFromApi = periodeInfo.total_hari_kerja || 0;
      const targetFromApi = periodeInfo.target_bulanan || 0;
      
      const processed = processRawData(
        pegawaiKinerja,
        hariKerjaData,
        allUsers,
        hariKerjaFromApi,
        targetFromApi
      );
      
      if (isMounted.current) {
        setKpiData({
          bulan: processed.periode.bulan,
          tahun: processed.periode.tahun,
          hariKerja: processed.periode.hariKerja,
          targetPerPegawai: processed.periode.targetPerPegawai,
          targetKolektif: processed.periode.targetKolektif,
          totalPanjang: processed.realisasi.totalPanjang,
          totalPegawai: processed.realisasi.totalPegawai,
          totalSudahLapor: processed.realisasi.totalSudahLapor,
          totalBelumLapor: processed.realisasi.totalBelumLapor,
          persenKehadiran: processed.realisasi.persenKehadiran,
          statusCounts: processed.statusCounts,
          rataPencapaian: processed.rataRata.pencapaian,
          rataPanjang: processed.rataRata.panjang,
          rataKR: processed.rataRata.kr,
          rataKN: processed.rataRata.kn,
          pegawaiDetails: processed.pegawaiDetails,
          statistikWilayah: processed.statistikWilayah
        });
        
        setOriginalData(processed);
        lastParams.current = { bulan, tahun };
      }
      
    } catch (err) {
      console.error('Error loading KPI data:', err);
      setError(err.message || 'Gagal memuat data KPI');
      Swal.fire({
        icon: 'error',
        title: 'Gagal memuat data KPI',
        text: err.response?.data?.message || err.message || 'Terjadi kesalahan',
      });
    } finally {
      setLoading(false);
      isProcessing.current = false;
    }
  }, [selectedMonth, selectedYear, kpiData.pegawaiDetails.length, processRawData]);
  
  /**
   * Refresh data (force reload)
   */
  const refreshData = useCallback(() => {
    lastParams.current = { bulan: null, tahun: null };
    setSimulationMode(false);
    setSimulatedDays(0);
    loadKpiData();
  }, [loadKpiData]);
  
  
  /**
   * Simulasi progresif per hari (untuk demo/presentasi)
   */
  const simulateDay = useCallback(() => {
    if (!originalData) {
      Swal.fire('Info', 'Tidak ada data untuk disimulasi', 'info');
      return;
    }
    
    if (simulatedDays >= originalData.periode.hariKerja) {
      Swal.fire('Info', `Sudah mencapai ${originalData.periode.hariKerja} hari kerja`, 'info');
      return;
    }
    
    setSimulationMode(true);
    const newDays = simulatedDays + 1;
    setSimulatedDays(newDays);
    
    const progressFactor = newDays / originalData.periode.hariKerja;
    
    const simulatedPegawai = originalData.pegawaiDetails.map(pegawai => ({
      ...pegawai,
      hadir: Math.min(Math.floor(pegawai.hadir * progressFactor), pegawai.hadir),
      totalPanjang: pegawai.totalPanjang * progressFactor,
      totalKR: pegawai.totalKR * progressFactor,
      totalKN: pegawai.totalKN * progressFactor,
      pencapaian: pegawai.pencapaian * progressFactor
    }));
    
    const simulatedTotalPanjang = simulatedPegawai.reduce((sum, p) => sum + p.totalPanjang, 0);
    const simulatedSudahLapor = simulatedPegawai.filter(p => p.hadir > 0).length;
    const simulatedPencapaian = simulatedSudahLapor > 0 
      ? simulatedPegawai.filter(p => p.hadir > 0).reduce((sum, p) => sum + p.pencapaian, 0) / simulatedSudahLapor 
      : 0;
    
    setKpiData(prev => ({
      ...prev,
      totalPanjang: simulatedTotalPanjang,
      totalSudahLapor: simulatedSudahLapor,
      totalBelumLapor: prev.totalPegawai - simulatedSudahLapor,
      rataPencapaian: simulatedPencapaian,
      pegawaiDetails: simulatedPegawai
    }));
  }, [originalData, simulatedDays]);
  
  /**
   * Reset simulasi ke data asli
   */
  const resetSimulation = useCallback(() => {
    if (!originalData) return;
    
    setSimulationMode(false);
    setSimulatedDays(0);
    
    setKpiData({
      bulan: originalData.periode.bulan,
      tahun: originalData.periode.tahun,
      hariKerja: originalData.periode.hariKerja,
      targetPerPegawai: originalData.periode.targetPerPegawai,
      targetKolektif: originalData.periode.targetKolektif,
      totalPanjang: originalData.realisasi.totalPanjang,
      totalPegawai: originalData.realisasi.totalPegawai,
      totalSudahLapor: originalData.realisasi.totalSudahLapor,
      totalBelumLapor: originalData.realisasi.totalBelumLapor,
      persenKehadiran: originalData.realisasi.persenKehadiran,
      statusCounts: originalData.statusCounts,
      rataPencapaian: originalData.rataRata.pencapaian,
      rataPanjang: originalData.rataRata.panjang,
      rataKR: originalData.rataRata.kr,
      rataKN: originalData.rataRata.kn,
      pegawaiDetails: originalData.pegawaiDetails,
      statistikWilayah: originalData.statistikWilayah
    });
  }, [originalData]);
  
  
  /**
   * Filter pegawai berdasarkan status
   */
  const filterPegawaiByStatus = useCallback((status) => {
    if (status === 'all') return kpiData.pegawaiDetails;
    return kpiData.pegawaiDetails.filter(p => p.status === status);
  }, [kpiData.pegawaiDetails]);
  
  /**
   * Sort pegawai berdasarkan field tertentu
   */
  const sortPegawai = useCallback((field, order = 'desc') => {
    const sorted = [...kpiData.pegawaiDetails];
    sorted.sort((a, b) => {
      let valA = a[field];
      let valB = b[field];
      if (typeof valA === 'string') {
        return order === 'desc' ? valB.localeCompare(valA) : valA.localeCompare(valB);
      }
      return order === 'desc' ? valB - valA : valA - valB;
    });
    return sorted;
  }, [kpiData.pegawaiDetails]);
  
  
  /**
   * Export data ke CSV
   */
  const exportToCSV = useCallback((data, filename) => {
    if (!data || data.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Tidak ada data', text: 'Tidak ada data yang dapat diekspor' });
      return false;
    }
    
    try {
      const headers = Object.keys(data[0]);
      const csvRows = [headers.join(',')];
      
      for (const row of data) {
        const values = headers.map(header => {
          const value = row[header] || '';
          return `"${String(value).replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(','));
      }
      
      const blob = new Blob(["\uFEFF" + csvRows.join('\n')], { type: 'text/csv;charset=utf-8' });
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
      console.error('Export error:', error);
      return false;
    }
  }, []);
  
  /**
   * Export data pegawai
   */
  const exportPegawaiData = useCallback((format = 'csv') => {
    const exportData = kpiData.pegawaiDetails.map(p => ({
      'Nama Pegawai': p.nama,
      'Wilayah': p.wilayah,
      'Hadir (hari)': `${p.hadir}/${kpiData.hariKerja}`,
      'Total KR (m)': p.totalKR.toFixed(2),
      'Total KN (m)': p.totalKN.toFixed(2),
      'Total Panjang (m)': p.totalPanjang.toFixed(2),
      'Target (m)': p.target.toFixed(2),
      'Pencapaian': `${p.pencapaian.toFixed(1)}%`,
      'Status': p.status === 'tercapai_target' ? 'Tercapai Target' :
                p.status === 'hampir_tercapai' ? 'Hampir Tercapai' :
                p.status === 'sedang' ? 'Sedang' :
                p.status === 'tidak_tercapai' ? 'Tidak Tercapai' : 'Belum Lapor'
    }));
    
    const filename = `kpi_pegawai_${getNamaBulan(selectedMonth)}_${selectedYear}`;
    return exportToCSV(exportData, filename);
  }, [kpiData, selectedMonth, selectedYear, exportToCSV]);
  
  /**
   * Export data statistik wilayah
   */
  const exportWilayahData = useCallback(() => {
    const exportData = kpiData.statistikWilayah.map(w => ({
      'Wilayah': w.wilayah,
      'Total Pegawai': w.totalPegawai,
      'Sudah Lapor': w.totalSudahLapor,
      'Persen Kehadiran': `${w.persenKehadiran.toFixed(1)}%`,
      'Total Panjang (m)': w.totalPanjang.toFixed(2),
      'Target Kolektif (m)': w.targetKolektif.toFixed(2),
      'Pencapaian': `${w.rataPencapaian.toFixed(1)}%`,
      'Tercapai Target': w.tercapaiTarget
    }));
    
    const filename = `kpi_wilayah_${getNamaBulan(selectedMonth)}_${selectedYear}`;
    return exportToCSV(exportData, filename);
  }, [kpiData, selectedMonth, selectedYear, exportToCSV]);
  
  
  const formatNumber = useCallback((num) => {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
  }, []);
  
  const getStatusLabel = useCallback((status) => {
    const labels = {
      'tercapai_target': 'Tercapai Target ✅',
      'hampir_tercapai': 'Hampir Tercapai 📈',
      'sedang': 'Sedang ⚠️',
      'tidak_tercapai': 'Tidak Tercapai ❌',
      'tidak_ada_laporan': 'Belum Lapor ⏳'
    };
    return labels[status] || status;
  }, []);
  
  const getStatusColor = useCallback((status) => {
    const colors = {
      'tercapai_target': 'bg-emerald-100 text-emerald-700',
      'hampir_tercapai': 'bg-green-100 text-green-700',
      'sedang': 'bg-yellow-100 text-yellow-700',
      'tidak_tercapai': 'bg-red-100 text-red-700',
      'tidak_ada_laporan': 'bg-gray-100 text-gray-500'
    };
    return colors[status] || 'bg-gray-100 text-gray-500';
  }, []);
  
  
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      isProcessing.current = false;
    };
  }, []);
  
  useEffect(() => {
    loadKpiData();
  }, [selectedMonth, selectedYear, loadKpiData]);
  
  return {
    loading,
    error,
    kpiData,
    selectedMonth,
    selectedYear,
    simulationMode,
    simulatedDays,
    
    setSelectedMonth,
    setSelectedYear,
    
    refreshData,
    loadKpiData,
    
    simulateDay,
    resetSimulation,
    
    filterPegawaiByStatus,
    sortPegawai,
    
    exportPegawaiData,
    exportWilayahData,
    exportToCSV,
    
    formatNumber,
    getStatusLabel,
    getStatusColor,
    getNamaBulan: () => getNamaBulan(selectedMonth)
  };
}