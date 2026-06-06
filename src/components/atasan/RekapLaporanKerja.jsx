"use client";

import { useState } from "react";
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

  return (
    <div className="min-h-screen bg-slate-100">
      {/* HEADER */}
      <div className="bg-gradient-to-b from-blue-900 to-blue-700 pb-24">
        <div className="max-w-7xl mx-auto px-6 pt-6">
          <div className="flex justify-between items-center text-white">
            <div className="flex gap-4 items-center">
              <Menu size={28} />
              <div>
                <h1 className="text-3xl font-bold">Grafik Kinerja Pegawai</h1>
                <p className="text-blue-100">
                  Lihat pencapaian kinerja (KR/KN) pegawai per bulan
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <ExportButtonGroup
                onExportPegawai={() => exportKinerjaPegawai?.('csv')}
                onExportWilayah={() => exportStatistikWilayah?.('csv')}
                onExportRekap={() => exportRekapKinerja?.('csv')}
                onExportAll={() => exportAllData?.('csv')}
                disabled={loading}
              />
            </div>
          </div>

          {/* FILTER & NAVIGASI - Style seperti halaman rekap */}

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-16">
        {/* Filter Kinerja */}
        <div className="mb-6">
          <FilterKinerja
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            loading={loading}
            onMonthChange={handleMonthChange}
            onYearChange={handleYearChange}
            onRefresh={processKinerjaChartData}
          />
        </div>

        {/* Statistik Cards */}
        <StatistikKinerja 
          statistik={statistikBulanan} 
          chartData={chartData}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
        />

        {/* Analisis Performa */}
        {chartData && (
          <AnalisisKinerja
            statistik={statistikBulanan}
            chartData={chartData}
          />
        )}

        {/* TAB NAVIGATION */}
        <div className="bg-white rounded-3xl shadow-lg mt-6">
          <div className="flex overflow-x-auto border-b">
            {[
              { id: "kinerja", label: "Grafik Kinerja", icon: <BarChart3 size={18} /> },
              { id: "wilayah", label: "Perbandingan Wilayah", icon: <Building2 size={18} /> },
              { id: "detail", label: "Detail Pegawai", icon: <Users size={18} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 whitespace-nowrap font-medium flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: GRAFIK KINERJA */}
          {activeTab === "kinerja" && (
            <div className="p-6">
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
            <div className="p-6">
              <GrafikWilayahKinerja
                loading={loading}
                wilayahChartData={wilayahChartData}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                onRefresh={processKinerjaChartData}
                onExportImage={handleExportWilayahChart}
              />

              {statistikWilayah && statistikWilayah.length > 0 && (
                <div className="mt-6">
                  <TabelWilayahKinerja statistikWilayah={statistikWilayah} />
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DETAIL PEGAWAI */}
          {activeTab === "detail" && (
            <div className="p-6">
              {chartData?.labels && chartData.labels.length > 0 ? (
                <TabelPegawaiKinerja
                  chartData={chartData}
                  onExport={() => exportKinerjaPegawai?.('csv')}
                />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>Tidak ada data pegawai untuk periode ini</p>
                </div>
              )}
            </div>
          )}

          {/* FOOTER CARDS - Style seperti halaman rekap */}
          <div className="grid md:grid-cols-4 gap-6 p-6 pt-0">
            <MiniCard
              title="Rata-rata KR Harian"
              value={(statistikBulanan.rata_kr / (statistikBulanan.hari_kerja || 1)).toFixed(2)}
              sub="meter/hari"
            />
            <MiniCard
              title="Rata-rata KN Harian"
              value={(statistikBulanan.rata_kn / (statistikBulanan.hari_kerja || 1)).toFixed(2)}
              sub="meter/hari"
            />
            <MiniCard
              title="Total Kinerja"
              value={((chartData?.totalKRAchieved || 0) + (chartData?.totalKNAchieved || 0)).toFixed(2)}
              sub="meter (KR+KN)"
            />
            <MiniCard
              title="Pegawai Tercapai Target"
              value={statistikBulanan.total_tercapai_target || 0}
              sub="dari total pegawai"
            />
          </div>

          <div className="px-6 pb-6 text-gray-500 text-sm">
            Data diperbarui terakhir pada {new Date().toLocaleDateString("id-ID")}, {new Date().toLocaleTimeString("id-ID")}
          </div>
        </div>
      </div>

      {/* BOTTOM NAV */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t">
        <div className="max-w-7xl mx-auto grid grid-cols-5">
          <NavItem icon={<Home />} label="Beranda" />
          <NavItem icon={<Users />} label="Kehadiran" />
          <NavItem icon={<ClipboardCheck />} label="Persetujuan" badge={6} />
          <NavItem icon={<BarChart3 />} label="Grafik" active />
          <NavItem icon={<User />} label="Akun" />
        </div>
      </div>
    </div>
  );
}

// ==================== KOMPONEN PENDUKUNG (Style seperti halaman rekap) ====================

function FilterBox({ children, icon }) {
  return (
    <div className="border border-white/30 rounded-xl h-12 px-4 flex items-center text-white">
      {icon}
      <span className="ml-2">{children}</span>
    </div>
  );
}

function MiniCard({ title, value, sub }) {
  return (
    <div className="bg-white border rounded-2xl p-5 shadow-sm">
      <p className="text-gray-500 text-sm">{title}</p>
      <h3 className="text-3xl font-bold mt-2 text-gray-800">{value}</h3>
      <p className="text-gray-400 text-sm mt-1">{sub}</p>
    </div>
  );
}

function NavItem({ icon, label, active, badge }) {
  return (
    <button
      className={`relative flex flex-col items-center py-3 ${
        active ? "text-blue-600" : "text-gray-500"
      }`}
    >
      {badge && (
        <span className="absolute top-1 right-8 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
          {badge}
        </span>
      )}
      {icon}
      <span className="text-xs mt-1">{label}</span>
    </button>
  );
}