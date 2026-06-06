"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Menu,
  Download,
  Calendar,
  Building2,
  Filter,
  Home,
  User,
  ClipboardCheck,
  Users,
  BarChart3,
  FileText,
  ArrowLeft,ChevronDown 
} from "lucide-react";
import { useKinerjaData } from "./hooks/dashboards/useKinerjaDatas";
import { FilterKinerja } from "./components/dashboards/FilterKinerja";
import { StatistikKinerja } from "./components/dashboards/StatistikKinerja";
import { GrafikWilayahKinerja } from "./components/dashboards/GrafikWilayahKinerja";
import { GrafikPerorangan } from "./components/dashboards/GrafikPerorangan";
import { TabelWilayahKinerja } from "./components/dashboards/TabelWilayahKinerja";
import { TabelPegawaiKinerja } from "./components/dashboards/TabelPegawaiKinerja";
import { AnalisisKinerja } from "./components/dashboards/AnalisisKinerja";
import { ExportButtonGroup } from "./components/dashboards/ExportButton";

export default function GrafikKinerjaPage() {
  const {
    // State
    activeChart,
    filterType,
    sortOrder,
    selectedMonth,
    selectedYear,
    chartData,
    wilayahChartData,
    statistikBulanan,
    statistikWilayah,
    loading,
    
    // Functions
    setActiveChart,
    setFilterType,
    setSortOrder,
    handleMonthChange,
    handleYearChange,
    processKinerjaChartData,
    handleExportKinerjaChart,
    handleExportWilayahChart,
    exportKinerjaPegawai,
    exportStatistikWilayah,
    exportRekapKinerja,
    exportAllData,
  } = useKinerjaData();

  const [activeTab, setActiveTab] = useState("kinerja");

  const getNamaBulan = (month) => {
    const bulan = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return bulan[parseInt(month) - 1] || '';
  };

  const bulanLabel = getNamaBulan(selectedMonth);
const [showExportMenu, setShowExportMenu] = useState(false);
  return (
    <div className="min-h-screen bg-slate-100 pb-16">
      {/* HEADER - Optimized untuk HP */}
<div className="bg-gradient-to-b from-blue-900 to-blue-700 pt-4 pb-16">
  <div className="px-4">
    <div className="flex items-center text-white mb-4">
      {/* Bagian kiri: Arrow + Judul */}
      <div className="flex items-center gap-x-2 flex-1">
        <Link href="/atasan/dashboard" className="hover:opacity-80 transition-opacity">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Grafik Kinerja</h1>
          <p className="text-blue-100 text-xs mt-1">Pencapaian kinerja (KR/KN) pegawai</p>
        </div>
      </div>

      {/* Tombol aksi di kanan - Dropdown Export */}
      <div className="relative">
        <button
          onClick={() => setShowExportMenu(!showExportMenu)}
          disabled={loading}
          className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition disabled:opacity-50 flex items-center gap-1"
        >
          <Download size={18} />
          <ChevronDown size={14} />
        </button>
        
        {showExportMenu && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setShowExportMenu(false)}
            />
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-20 py-1">
              <button
                onClick={() => {
                  exportKinerjaPegawai?.('csv');
                  setShowExportMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Users size={14} />
                Export Data Pegawai
              </button>
              <button
                onClick={() => {
                  exportStatistikWilayah?.('csv');
                  setShowExportMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Building2 size={14} />
                Export Statistik Wilayah
              </button>
              <button
                onClick={() => {
                  exportRekapKinerja?.('csv');
                  setShowExportMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <FileText size={14} />
                Export Rekap Kinerja
              </button>
              <hr className="my-1" />
              <button
                onClick={() => {
                  exportAllData?.('csv');
                  setShowExportMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Menu size={14} />
                Export Semua Data
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  </div>
</div>

      <div className="px-4 -mt-12">
        {/* Filter Kinerja - Compact untuk HP */}
        <div className="mb-4">
          <FilterKinerja
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            loading={loading}
            onMonthChange={handleMonthChange}
            onYearChange={handleYearChange}
            onRefresh={processKinerjaChartData}
          />
        </div>

        {/* Statistik Cards - Compact untuk HP */}
        <div className="mb-4">
          <StatistikKinerja 
            statistik={statistikBulanan} 
            chartData={chartData}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
          />
        </div>

        {/* Analisis Performa - Compact */}
        {chartData && (
          <div className="mb-4">
            <AnalisisKinerja
              statistik={statistikBulanan}
              chartData={chartData}
            />
          </div>
        )}

        {/* TAB NAVIGATION - Compact untuk HP */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="flex overflow-x-auto no-scrollbar border-b border-gray-100">
            {[
              { id: "kinerja", label: "Kinerja", icon: <BarChart3 size={14} /> },
              { id: "wilayah", label: "Wilayah", icon: <Building2 size={14} /> },
              { id: "detail", label: "Pegawai", icon: <Users size={14} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2.5 text-center font-medium text-xs flex items-center justify-center gap-1 transition-all ${
                  activeTab === tab.id
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-500 border-b-2 border-transparent"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* TAB 1: GRAFIK KINERJA */}
          {activeTab === "kinerja" && (
            <div className="p-3">
              <GrafikPerorangan
                loading={loading}
                chartData={chartData}
                activeChart={activeChart}
                filterType={filterType}
                sortOrder={sortOrder}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                onChartChange={setActiveChart}
                onFilterTypeChange={setFilterType}
                onSortOrderChange={setSortOrder}
                onRefresh={processKinerjaChartData}
                onExport={() => exportKinerjaPegawai?.('csv')}
                onExportImage={handleExportKinerjaChart}
              />
            </div>
          )}

          {/* TAB 2: PERBANDINGAN WILAYAH */}
          {activeTab === "wilayah" && (
            <div className="p-3">
              <GrafikWilayahKinerja
                loading={loading}
                wilayahChartData={wilayahChartData}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                onRefresh={processKinerjaChartData}
                onExportImage={handleExportWilayahChart}
              />

              {statistikWilayah && statistikWilayah.length > 0 && (
                <div className="mt-4">
                  <TabelWilayahKinerja statistikWilayah={statistikWilayah} />
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DETAIL PEGAWAI */}
          {activeTab === "detail" && (
            <div className="p-3">
              {chartData?.labels && chartData.labels.length > 0 ? (
                <TabelPegawaiKinerja
                  chartData={chartData}
                  onExport={() => exportKinerjaPegawai?.('csv')}
                />
              ) : (
                <div className="text-center py-8 text-gray-500 text-xs">
                  <p>Tidak ada data pegawai untuk periode ini</p>
                </div>
              )}
            </div>
          )}

          {/* FOOTER CARDS - Compact untuk HP */}
          <div className="grid grid-cols-2 gap-2 p-3 border-t border-gray-100">
            <MiniCardCompact
              title="Rata-rata KR Harian"
              value={(statistikBulanan.rata_kr / (statistikBulanan.hari_kerja || 1)).toFixed(2)}
              sub="meter/hari"
            />
            <MiniCardCompact
              title="Rata-rata KN Harian"
              value={(statistikBulanan.rata_kn / (statistikBulanan.hari_kerja || 1)).toFixed(2)}
              sub="meter/hari"
            />
            <MiniCardCompact
              title="Total Kinerja"
              value={((chartData?.totalKRAchieved || 0) + (chartData?.totalKNAchieved || 0)).toFixed(2)}
              sub="meter (KR+KN)"
            />
            <MiniCardCompact
              title="Pegawai Tercapai"
              value={statistikBulanan.total_tercapai_target || 0}
              sub="dari total"
            />
          </div>

          {/* Footer Info */}
          <div className="px-3 py-2 border-t border-gray-100 text-[9px] text-gray-400 text-center">
            Update: {new Date().toLocaleDateString("id-ID")} • {new Date().toLocaleTimeString("id-ID")}
          </div>
        </div>
      </div>

      {/* BOTTOM NAV - Compact untuk HP */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="flex justify-around py-1.5">
          <NavItemCompact icon={<Home size={18} />} label="Beranda" href="/" />
          <NavItemCompact icon={<Users size={18} />} label="Kehadiran" href="/presensi" />
          <NavItemCompact icon={<ClipboardCheck size={18} />} label="Setuju" href="/approval" badge={6} />
          <NavItemCompact icon={<BarChart3 size={18} />} label="Grafik" href="/kinerja" active />
          <NavItemCompact icon={<User size={18} />} label="Akun" href="/profile" />
        </div>
      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

// ==================== KOMPONEN PENDUKUNG COMPACT UNTUK HP ====================

function MiniCardCompact({ title, value, sub }) {
  return (
    <div className="bg-gray-50 rounded-lg p-2.5">
      <p className="text-gray-500 text-[10px]">{title}</p>
      <h3 className="text-base font-bold mt-0.5 text-gray-800">{value}</h3>
      <p className="text-gray-400 text-[9px] mt-0.5">{sub}</p>
    </div>
  );
}

function NavItemCompact({ icon, label, href, active, badge }) {
  return (
    <Link
      href={href}
      className={`relative flex flex-col items-center py-1.5 transition-colors ${
        active ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
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