"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Menu,
  Download,
  Building2,
  Home,
  User,
  ClipboardCheck,
  Users,
  BarChart3,
  FileText,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  TrendingUp,
  X,
  Filter,
  Calendar as CalendarIcon,
  Check,
  MapPin,
  ArrowLeft,
} from "lucide-react";
import { usePresensiData } from "./hooks/dashboards/usePresensiData";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

const COLORS = {
  hadir: "#22c55e",
  terlambat: "#f59e0b",
  izin: "#a855f7",
  tanpaKeterangan: "#ef4444",
};

const PIE_COLORS = [COLORS.hadir, COLORS.terlambat, COLORS.izin, COLORS.tanpaKeterangan];

// Daftar wilayah sesuai data
const WILAYAH_LIST = [
  "Cermee",
  "Botolinggo",
  "Prajekan",
  "Klabang",
  "Ijen",
];

export default function PresensiPage() {
  const {
    selectedMonth,
    selectedYear,
    selectedWilayah,
    chartData,
    loading,
    periodeInfo,
    statistik,
    wilayahStatistik,
    rekapPerPegawai,
    handleMonthChange,
    handleYearChange,
    handleWilayahChange,
    goToPreviousMonth,
    goToNextMonth,
    goToCurrentMonth,
    handleExportChart,
    handleExportData,
    getStatistikDetail,
    getPersentase,
    bulanOptions,
    tahunOptions,
  } = usePresensiData();

  const [activeTab, setActiveTab] = useState("overview");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showWilayahModal, setShowWilayahModal] = useState(false);
  const [tempFilter, setTempFilter] = useState({
    month: selectedMonth,
    year: selectedYear,
    wilayah: selectedWilayah,
  });

  const pieData = [
    { name: "Hadir", value: statistik.totalHadir, color: COLORS.hadir },
    { name: "Terlambat", value: statistik.totalTerlambat, color: COLORS.terlambat },
    { name: "Izin", value: statistik.totalIzin, color: COLORS.izin },
    { name: "Tanpa Keterangan", value: statistik.totalTanpaKeterangan, color: COLORS.tanpaKeterangan },
  ].filter(item => item.value > 0);

  const statistikDetail = getStatistikDetail();

  // Filter data berdasarkan wilayah yang dipilih
  const filteredRekapPerPegawai = useMemo(() => {
    if (selectedWilayah === "all") return rekapPerPegawai;
    return rekapPerPegawai.filter(
      (pegawai) => pegawai.wilayah === selectedWilayah
    );
  }, [rekapPerPegawai, selectedWilayah]);

  const filteredWilayahStatistik = useMemo(() => {
    if (selectedWilayah === "all") return wilayahStatistik;
    return { [selectedWilayah]: wilayahStatistik[selectedWilayah] };
  }, [wilayahStatistik, selectedWilayah]);

  const wilayahTableData = useMemo(() => {
    const data = Object.entries(filteredWilayahStatistik)
      .filter(([_, stats]) => stats?.totalPresensi > 0)
      .map(([wilayah, stats]) => ({
        wilayah: wilayah.length > 15 ? wilayah.substring(0, 12) + "..." : wilayah,
        wilayahFull: wilayah,
        hadir: `${stats.totalHadir} (${stats.persenHadir}%)`,
        terlambat: `${stats.totalTerlambat} (${stats.persenTerlambat}%)`,
        izin: `${stats.totalIzin} (${stats.persenIzin}%)`,
        tanpaKeterangan: `${stats.totalTanpaKeterangan} (${stats.persenTanpaKeterangan}%)`,
        total: stats.totalPresensi,
        tingkatKehadiran: stats.persenHadir,
        status: stats.persenHadir >= 80 ? "Baik" : stats.persenHadir >= 60 ? "Cukup" : "Perlu Perhatian",
      }));
    return data;
  }, [filteredWilayahStatistik]);

  // Filter chart data berdasarkan wilayah
  const filteredChartData = useMemo(() => {
    if (!chartData || selectedWilayah === "all") return chartData;
    
    const wilayahIndex = chartData.labels.findIndex(
      (label) => label === selectedWilayah
    );
    
    if (wilayahIndex === -1) return null;
    
    return {
      labels: [chartData.labels[wilayahIndex]],
      datasets: chartData.datasets.map((dataset) => ({
        ...dataset,
        data: [dataset.data[wilayahIndex]],
      })),
    };
  }, [chartData, selectedWilayah]);

  const applyFilters = () => {
    if (tempFilter.month !== selectedMonth) handleMonthChange(tempFilter.month);
    if (tempFilter.year !== selectedYear) handleYearChange(tempFilter.year);
    if (tempFilter.wilayah !== selectedWilayah) handleWilayahChange(tempFilter.wilayah);
    setShowFilterModal(false);
  };

  const getWilayahLabel = (wilayah) => {
    if (wilayah === "all") return "Semua Wilayah";
    return wilayah;
  };

  const getWilayahBadgeColor = (status) => {
    if (status === "Baik") return "bg-green-100 text-green-700";
    if (status === "Cukup") return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  // Trend data dummy
  const trendData = [
    { bulan: "Jan", hadir: 85, terlambat: 8, izin: 5, tanpaKeterangan: 2 },
    { bulan: "Feb", hadir: 82, terlambat: 10, izin: 6, tanpaKeterangan: 2 },
    { bulan: "Mar", hadir: 88, terlambat: 6, izin: 4, tanpaKeterangan: 2 },
    { bulan: "Apr", hadir: 86, terlambat: 7, izin: 5, tanpaKeterangan: 2 },
    { bulan: "Mei", hadir: 84, terlambat: 9, izin: 5, tanpaKeterangan: 2 },
    { bulan: "Jun", hadir: 90, terlambat: 5, izin: 3, tanpaKeterangan: 2 },
  ];

  return (
    <div className="min-h-screen bg-slate-100 pb-16 text-black">
      {/* HEADER - Optimized untuk HP */}
<div className="bg-gradient-to-b from-blue-900 to-blue-800 pt-4 pb-16">
  <div className="px-4">
    <div className="flex items-center text-white mb-4">
      {/* Bagian kiri: Arrow + Judul */}
      <div className="flex items-center gap-x-2 flex-1">
        <Link href="/atasan/dashboard" className="hover:opacity-80 transition-opacity">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Rekap Kehadiran</h1>
          <p className="text-white text-xs mt-1">Monitoring kehadiran pegawai</p>
        </div>
      </div>

      {/* Tombol aksi di kanan */}
      <div className="flex gap-2">
        <button
          onClick={handleExportChart}
          disabled={loading || !chartData}
          className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition disabled:opacity-50"
        >
          <BarChart3 size={18} />
        </button>

      </div>
    </div>
  </div>
</div>

      <div className="px-4 -mt-12">
        {/* FILTER SECTION - Compact untuk HP */}
        <div className="bg-white rounded-xl shadow-lg p-3 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-xs">
              <CalendarIcon size={14} className="text-gray-400" />
              <span className="font-medium text-gray-700">
                {bulanOptions.find(b => b.value === selectedMonth.toString().padStart(2, '0'))?.label} {selectedYear}
              </span>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setTempFilter({ month: selectedMonth, year: selectedYear, wilayah: selectedWilayah });
                  setShowFilterModal(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg text-green-600 text-xs font-medium"
              >
                <Filter size={12} />
                Filter
              </button>
              
              <button
                onClick={() => setShowWilayahModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg text-gray-700 text-xs font-medium"
              >
                <MapPin size={12} />
                <span className="max-w-[100px] truncate">{getWilayahLabel(selectedWilayah)}</span>
              </button>
            </div>
          </div>

          {/* Navigasi Bulan - Compact */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={goToPreviousMonth}
              className="flex-1 py-2 rounded-lg bg-gray-100 active:bg-gray-200 text-sm font-medium flex items-center justify-center gap-1"
            >
              <ChevronLeft size={16} />
              <span>Prev</span>
            </button>
            <button
              onClick={goToCurrentMonth}
              className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium active:bg-green-700"
            >
              Bulan Ini
            </button>
            <button
              onClick={goToNextMonth}
              className="flex-1 py-2 rounded-lg bg-gray-100 active:bg-gray-200 text-sm font-medium flex items-center justify-center gap-1"
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>

          {periodeInfo && (
            <div className="mt-3 pt-2 border-t border-gray-100 text-xs text-gray-500 text-center">
              Hari kerja: {periodeInfo?.total_hari_kerja || "-"} hari
            </div>
          )}
        </div>

        {/* STATISTIK CARDS - Scroll Horizontal dengan ukuran lebih kecil */}
        <div className="mb-4 overflow-x-auto no-scrollbar -mx-1 px-1">
          <div className="flex gap-2">
            {statistikDetail.map((item) => (
              <div
                key={item.label}
                className="bg-white rounded-xl p-2.5 shadow-sm min-w-[100px] flex-shrink-0 border-l-3"
                style={{ borderLeftWidth: '3px', borderLeftColor: 
                  item.color === "green" ? "#22c55e" :
                  item.color === "orange" ? "#f59e0b" :
                  item.color === "purple" ? "#a855f7" :
                  item.color === "red" ? "#ef4444" : "#3b82f6"
                }}
              >
                <p className="text-gray-500 text-[10px]">{item.label}</p>
                <p className="text-lg font-bold mt-0.5">{item.value.toLocaleString()}</p>
                <p className="text-[9px] text-gray-400">{getPersentase(item.value)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* INFO WILAYAH */}
        {selectedWilayah !== "all" && (
          <div className="mb-4">
            <div className="bg-green-50 rounded-lg p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Building2 size={14} className="text-green-600" />
                <span className="text-xs text-green-800">
                  Data: <strong className="text-sm">{selectedWilayah}</strong>
                </span>
              </div>
              <button
                onClick={() => handleWilayahChange("all")}
                className="text-xs text-green-600 font-medium px-2 py-1 bg-green-100 rounded-md"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {/* TAB NAVIGATION */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="flex overflow-x-auto no-scrollbar border-b border-gray-100">
            {[
              { id: "overview", label: "Ringkasan", icon: <BarChart3 size={14} /> },
              { id: "wilayah", label: "Wilayah", icon: <Building2 size={14} /> },
              { id: "detail", label: "Pegawai", icon: <Users size={14} /> },
              { id: "trend", label: "Trend", icon: <TrendingUp size={14} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2.5 text-center font-medium text-xs flex items-center justify-center gap-1 transition-all ${
                  activeTab === tab.id
                    ? "border-b-2 border-green-600 text-green-600"
                    : "text-gray-500 border-b-2 border-transparent"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* CONTENT AREA */}
          <div className="p-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw size={24} className="animate-spin text-green-500" />
              </div>
            ) : (
              <>
                {/* TAB 1: RINGKASAN */}
                {activeTab === "overview" && (
                  <div className="space-y-3">
                    {/* Bar Chart */}
                    <div className="bg-gray-50 rounded-lg p-2.5">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-gray-700 text-xs flex items-center gap-1">
                          <BarChart3 size={12} />
                          Kehadiran per Wilayah
                        </h3>
                        {selectedWilayah !== "all" && (
                          <span className="text-[9px] text-green-600 bg-green-100 px-1.5 py-0.5 rounded">
                            {selectedWilayah}
                          </span>
                        )}
                      </div>
                      <div style={{ height: 240 }}>
                        {(selectedWilayah === "all" ? chartData : filteredChartData) && (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={(selectedWilayah === "all" ? chartData : filteredChartData)?.labels.map((label, idx) => {
                                const item = { wilayah: label.length > 8 ? label.substring(0, 6) + ".." : label };
                                const datasets = (selectedWilayah === "all" ? chartData : filteredChartData)?.datasets;
                                datasets?.forEach((dataset, dsIdx) => {
                                  item[dataset.label] = dataset.data[idx];
                                });
                                return item;
                              })}
                              margin={{ top: 5, right: 0, left: 0, bottom: 35 }}
                            >
                              <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                              <XAxis dataKey="wilayah" angle={-45} textAnchor="end" height={45} fontSize={9} tick={{ fill: '#6b7280' }} />
                              <YAxis fontSize={9} tick={{ fill: '#6b7280' }} width={30} />
                              <Tooltip contentStyle={{ fontSize: '11px', backgroundColor: 'white', border: 'none', borderRadius: '6px', padding: '6px' }} />
                              <Legend wrapperStyle={{ fontSize: 9 }} />
                              {(selectedWilayah === "all" ? chartData : filteredChartData)?.datasets.map((dataset, idx) => (
                                <Bar key={idx} dataKey={dataset.label} fill={dataset.backgroundColor.replace("0.8", "0.7")} radius={[2, 2, 0, 0]} />
                              ))}
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>

                    {/* Pie Chart */}
                    <div className="bg-gray-50 rounded-lg p-2.5">
                      <h3 className="font-semibold text-gray-700 text-xs mb-2 flex items-center gap-1">
                        Komposisi Kehadiran
                      </h3>
                      <div style={{ height: 200 }}>
                        {pieData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={65}
                                paddingAngle={2}
                                dataKey="value"
                                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                                labelLine={false}
                                fontSize={10}
                              >
                                {pieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => `${value} kejadian`} contentStyle={{ fontSize: '11px', backgroundColor: 'white', border: 'none', borderRadius: '6px', padding: '6px' }} />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                            Tidak ada data
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap justify-center gap-2 mt-2">
                        {pieData.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-1 text-[10px]">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[idx] }} />
                            <span>{item.name}</span>
                            <span className="font-medium">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Ringkasan */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3">
                      <h3 className="font-semibold text-gray-700 text-xs mb-2">📊 Ringkasan</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[10px] text-gray-500">Tingkat Kehadiran</p>
                          <p className={`text-base font-bold ${statistik.persenHadir >= 80 ? "text-green-600" : statistik.persenHadir >= 60 ? "text-yellow-600" : "text-red-600"}`}>
                            {statistik.persenHadir}%
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500">Total Pegawai</p>
                          <p className="text-base font-bold">{selectedWilayah !== "all" ? filteredRekapPerPegawai.length : statistik.totalPegawai}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500">Rata-rata Harian</p>
                          <p className="text-base font-bold">
                            {periodeInfo?.total_hari_kerja ? Math.round((statistik.totalHadir + statistik.totalTerlambat) / periodeInfo.total_hari_kerja) : "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500">Ketidakhadiran</p>
                          <p className="text-base font-bold text-red-600">
                            {statistik.totalIzin + statistik.totalTanpaKeterangan}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: PER WILAYAH */}
                {activeTab === "wilayah" && (
                  <div className="space-y-2">
                    {wilayahTableData.length > 0 ? (
                      wilayahTableData.map((row, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-2.5">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-1.5">
                              <Building2 size={12} className="text-gray-500" />
                              <h3 className="font-semibold text-gray-800 text-sm">{row.wilayahFull}</h3>
                            </div>
                            <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${getWilayahBadgeColor(row.status)}`}>
                              {row.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 text-[10px] mb-2">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Hadir:</span>
                              <span className="text-green-600 font-medium">{row.hadir}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Terlambat:</span>
                              <span className="text-orange-600 font-medium">{row.terlambat}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Izin:</span>
                              <span className="text-purple-600 font-medium">{row.izin}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Tanpa Ket.:</span>
                              <span className="text-red-600 font-medium">{row.tanpaKeterangan}</span>
                            </div>
                          </div>
                          <div className="mt-1 pt-1 border-t border-gray-200">
                            <div className="flex justify-between text-[10px] mb-1">
                              <span className="text-gray-500">Tingkat Kehadiran</span>
                              <span className="font-medium">{row.tingkatKehadiran}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1">
                              <div 
                                className="bg-green-500 h-1 rounded-full"
                                style={{ width: `${row.tingkatKehadiran}%` }}
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => handleWilayahChange(row.wilayahFull)}
                            className="mt-2 w-full py-1 text-[10px] text-green-600 bg-green-100 rounded-md active:bg-green-200"
                          >
                            Filter Wilayah Ini
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500 text-xs">
                        Tidak ada data wilayah
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: DETAIL PEGAWAI */}
                {activeTab === "detail" && (
                  <div className="space-y-2">
                    {filteredRekapPerPegawai.length > 0 ? (
                      <>
                        {selectedWilayah !== "all" && (
                          <div className="bg-blue-50 rounded-md p-1.5 text-center text-[10px] text-blue-700">
                            {filteredRekapPerPegawai.length} pegawai dari {selectedWilayah}
                          </div>
                        )}
                        {filteredRekapPerPegawai.slice(0, 20).map((pegawai, idx) => {
                          const totalPresensi = (pegawai.total_hadir || 0) + (pegawai.total_terlambat || 0) + 
                            (pegawai.total_izin || 0) + (pegawai.total_tanpa_keterangan || 0);
                          const persenHadir = totalPresensi > 0 ? Math.round(((pegawai.total_hadir || 0) / totalPresensi) * 100) : 0;
                          return (
                            <div key={idx} className="bg-gray-50 rounded-lg p-2.5">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h3 className="font-semibold text-gray-800 text-sm">{pegawai.nama_pegawai || pegawai.nama || "-"}</h3>
                                  <p className="text-[10px] text-gray-500 flex items-center gap-0.5 mt-0.5">
                                    <MapPin size={10} />
                                    {pegawai.wilayah || "-"}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold text-green-600">{persenHadir}%</p>
                                  <p className="text-[9px] text-gray-400">kehadiran</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
                                <div>
                                  <p className="text-green-600 font-semibold">{pegawai.total_hadir || 0}</p>
                                  <p className="text-gray-400">Hadir</p>
                                </div>
                                <div>
                                  <p className="text-orange-600 font-semibold">{pegawai.total_terlambat || 0}</p>
                                  <p className="text-gray-400">Terlambat</p>
                                </div>
                                <div>
                                  <p className="text-purple-600 font-semibold">{pegawai.total_izin || 0}</p>
                                  <p className="text-gray-400">Izin</p>
                                </div>
                                <div>
                                  <p className="text-red-600 font-semibold">{pegawai.total_tanpa_keterangan || 0}</p>
                                  <p className="text-gray-400">Tanpa Ket.</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {filteredRekapPerPegawai.length > 20 && (
                          <p className="text-center text-[9px] text-gray-400 py-2">
                            +{filteredRekapPerPegawai.length - 20} pegawai lainnya
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8 text-gray-500 text-xs">
                        Tidak ada data pegawai
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: TREND */}
                {activeTab === "trend" && (
                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded-lg p-2.5">
                      <h3 className="font-semibold text-gray-700 text-xs mb-2">Trend 6 Bulan</h3>
                      <div style={{ height: 220 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={trendData}>
                            <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                            <XAxis dataKey="bulan" fontSize={9} tick={{ fill: '#6b7280' }} />
                            <YAxis fontSize={9} tick={{ fill: '#6b7280' }} width={25} />
                            <Tooltip contentStyle={{ fontSize: '10px', backgroundColor: 'white', border: 'none', borderRadius: '6px', padding: '6px' }} />
                            <Legend wrapperStyle={{ fontSize: 9 }} />
                            <Line type="monotone" dataKey="hadir" stroke={COLORS.hadir} strokeWidth={1.5} dot={{ r: 2 }} />
                            <Line type="monotone" dataKey="terlambat" stroke={COLORS.terlambat} strokeWidth={1.5} dot={{ r: 2 }} />
                            <Line type="monotone" dataKey="izin" stroke={COLORS.izin} strokeWidth={1.5} dot={{ r: 2 }} />
                            <Line type="monotone" dataKey="tanpaKeterangan" stroke={COLORS.tanpaKeterangan} strokeWidth={1.5} dot={{ r: 2 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <h3 className="font-semibold text-blue-800 text-xs mb-1">💡 Insight</h3>
                      <ul className="space-y-0.5 text-[10px] text-blue-700">
                        <li>• Kehadiran tertinggi: Juni (90%)</li>
                        <li>• Keterlambatan terendah: Juni (5%)</li>
                        <li>• Rata-rata kehadiran: 85.8%</li>
                      </ul>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 border-t border-gray-100 text-[9px] text-gray-400 text-center">
            Update: {new Date().toLocaleDateString("id-ID")}
          </div>
        </div>
      </div>



      {/* FILTER MODAL - Optimized untuk HP */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white w-full rounded-t-xl max-h-[80vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center">
              <h3 className="font-semibold text-base">Filter Data</h3>
              <button onClick={() => setShowFilterModal(false)} className="p-1">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bulan</label>
                <select
                  value={tempFilter.month}
                  onChange={(e) => setTempFilter({ ...tempFilter, month: parseInt(e.target.value) })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  {bulanOptions.map((b) => (
                    <option key={b.value} value={parseInt(b.value)}>{b.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
                <select
                  value={tempFilter.year}
                  onChange={(e) => setTempFilter({ ...tempFilter, year: parseInt(e.target.value) })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  {tahunOptions.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={applyFilters}
                className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium active:bg-green-700"
              >
                Terapkan Filter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WILAYAH SELECTOR MODAL */}
      {showWilayahModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white w-full rounded-t-xl max-h-[80vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <MapPin size={16} />
                Pilih Wilayah
              </h3>
              <button onClick={() => setShowWilayahModal(false)} className="p-1">
                <X size={20} />
              </button>
            </div>
            <div className="p-2">
              <button
                onClick={() => {
                  handleWilayahChange("all");
                  setShowWilayahModal(false);
                }}
                className={`w-full text-left p-3 rounded-lg flex items-center justify-between ${
                  selectedWilayah === "all" ? "bg-green-50" : "active:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <Building2 size={14} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-800">Semua Wilayah</p>
                    <p className="text-[10px] text-gray-400">Tampilkan semua data</p>
                  </div>
                </div>
                {selectedWilayah === "all" && <Check size={16} className="text-green-600" />}
              </button>

              <div className="h-px bg-gray-100 my-2" />

              {WILAYAH_LIST.map((wilayah) => {
                const stats = wilayahStatistik[wilayah];
                return (
                  <button
                    key={wilayah}
                    onClick={() => {
                      handleWilayahChange(wilayah);
                      setShowWilayahModal(false);
                    }}
                    className={`w-full text-left p-3 rounded-lg flex items-center justify-between ${
                      selectedWilayah === wilayah ? "bg-green-50" : "active:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <MapPin size={14} className="text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-800">{wilayah}</p>
                        {stats && stats.totalPresensi > 0 ? (
                          <p className="text-[10px] text-gray-400">
                            {stats.totalPegawai} pegawai • {stats.persenHadir}% kehadiran
                          </p>
                        ) : (
                          <p className="text-[10px] text-gray-400">Belum ada data</p>
                        )}
                      </div>
                      {selectedWilayah === wilayah && <Check size={16} className="text-green-600" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

// KOMPONEN PENDUKUNG
function NavItem({ icon, label, href, active, badge }) {
  return (
    <Link
      href={href}
      className={`relative flex flex-col items-center py-1.5 transition-colors ${
        active ? "text-green-600" : "text-gray-500 hover:text-gray-700"
      }`}
    >
      {badge && (
        <span className="absolute -top-1 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
          {badge}
        </span>
      )}
      {icon}
      <span className="text-[9px] mt-0.5">{label}</span>
    </Link>
  );
}