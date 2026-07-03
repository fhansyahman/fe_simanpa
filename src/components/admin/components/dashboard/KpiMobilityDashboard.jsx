"use client";

import { useState, useMemo } from "react";
import { useKpiMobility } from "../../hooks/dashboard/useKpiMobility";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, RadialBarChart, RadialBar, ComposedChart, Line
} from 'recharts';
import {MapPin, TrendingUp, Users, Target, Activity,Download, Filter, RefreshCw} from 'lucide-react';

const getNamaBulan = (month) => {
  const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return bulan[month - 1] || '';
};

const COLORS = {
  tercapai_target: '#10b981',
  hampir_tercapai: '#84cc16',
  sedang: '#eab308',
  tidak_tercapai: '#ef4444',
  tidak_ada_laporan: '#9ca3af'
};

const STATUS_LABELS = {
  tercapai_target: 'Tercapai Target (≥100%)',
  hampir_tercapai: 'Hampir Tercapai (80-99%)',
  sedang: 'Sedang (50-79%)',
  tidak_tercapai: 'Tidak Tercapai (<50%)',
  tidak_ada_laporan: 'Belum Lapor'
};

export function KpiMobilityDashboard() {
  const [selectedWilayah, setSelectedWilayah] = useState('all');
  
  const {
    loading,
    kpiData,
    selectedMonth,
    selectedYear,
    setSelectedMonth,
    setSelectedYear,
    refreshData,
    exportPegawaiData,
    formatNumber,
    getStatusLabel,
    getStatusColor
  } = useKpiMobility();

  const wilayahList = useMemo(() => {
    const wilayahSet = new Set();
    kpiData.pegawaiDetails?.forEach(pegawai => {
      if (pegawai.wilayah && pegawai.wilayah !== 'Tidak diketahui') {
        wilayahSet.add(pegawai.wilayah);
      }
    });
    return ['all', ...Array.from(wilayahSet).sort()];
  }, [kpiData.pegawaiDetails]);

  const filteredPegawai = useMemo(() => {
    if (selectedWilayah === 'all') {
      return kpiData.pegawaiDetails || [];
    }
    return (kpiData.pegawaiDetails || []).filter(
      pegawai => pegawai.wilayah === selectedWilayah
    );
  }, [kpiData.pegawaiDetails, selectedWilayah]);

  const chartStats = useMemo(() => {
    const totalPegawai = filteredPegawai.length;
    const totalSudahLapor = filteredPegawai.filter(p => p.hadir > 0).length;
    const totalPanjang = filteredPegawai.reduce((sum, p) => sum + p.totalPanjang, 0);
    const totalTarget = filteredPegawai.reduce((sum, p) => sum + p.target, 0);
    const rataPencapaian = totalSudahLapor > 0 
      ? filteredPegawai.filter(p => p.hadir > 0).reduce((sum, p) => sum + p.pencapaian, 0) / totalSudahLapor 
      : 0;
    
    const statusCounts = {
      tercapai_target: filteredPegawai.filter(p => p.status === 'tercapai_target').length,
      hampir_tercapai: filteredPegawai.filter(p => p.status === 'hampir_tercapai').length,
      sedang: filteredPegawai.filter(p => p.status === 'sedang').length,
      tidak_tercapai: filteredPegawai.filter(p => p.status === 'tidak_tercapai').length,
      tidak_ada_laporan: filteredPegawai.filter(p => p.status === 'tidak_ada_laporan').length
    };
    
    return {
      totalPegawai,
      totalSudahLapor,
      totalBelumLapor: totalPegawai - totalSudahLapor,
      totalPanjang,
      totalTarget,
      rataPencapaian,
      statusCounts
    };
  }, [filteredPegawai]);

  const topPegawaiData = useMemo(() => {
    return [...filteredPegawai]
      .filter(p => p.hadir > 0)
      .sort((a, b) => b.pencapaian - a.pencapaian)
      .slice(0, 10)
      .map(p => ({
        name: p.nama.length > 15 ? p.nama.substring(0, 12) + '...' : p.nama,
        pencapaian: p.pencapaian,
        totalPanjang: p.totalPanjang,
        target: p.target
      }));
  }, [filteredPegawai]);

  const pieData = useMemo(() => {
    return Object.entries(chartStats.statusCounts)
      .filter(([_, value]) => value > 0)
      .map(([key, value]) => ({
        name: STATUS_LABELS[key],
        value: value,
        status: key
      }));
  }, [chartStats.statusCounts]);

  const allPegawaiData = useMemo(() => {
    return [...filteredPegawai]
      .sort((a, b) => b.pencapaian - a.pencapaian)
      .map(p => ({
        name: p.nama.length > 20 ? p.nama.substring(0, 17) + '...' : p.nama,
        pencapaian: p.pencapaian,
        totalPanjang: p.totalPanjang,
        target: p.target,
        hadir: p.hadir,
        status: p.status
      }));
  }, [filteredPegawai]);

  const wilayahStats = useMemo(() => {
    const stats = [];
    const wilayahMap = new Map();
    
    kpiData.pegawaiDetails?.forEach(pegawai => {
      const wilayah = pegawai.wilayah;
      if (!wilayahMap.has(wilayah)) {
        wilayahMap.set(wilayah, {
          wilayah,
          totalPegawai: 0,
          totalSudahLapor: 0,
          totalPanjang: 0,
          totalTarget: 0,
          tercapaiTarget: 0
        });
      }
      const w = wilayahMap.get(wilayah);
      w.totalPegawai++;
      if (pegawai.hadir > 0) {
        w.totalSudahLapor++;
        w.totalPanjang += pegawai.totalPanjang;
        w.totalTarget += pegawai.target;
        if (pegawai.pencapaian >= 100) w.tercapaiTarget++;
      }
    });
    
    wilayahMap.forEach(w => {
      stats.push({
        ...w,
        rataPencapaian: w.totalTarget > 0 ? (w.totalPanjang / w.totalTarget) * 100 : 0,
        persenKehadiran: w.totalPegawai > 0 ? (w.totalSudahLapor / w.totalPegawai) * 100 : 0
      });
    });
    
    return stats.sort((a, b) => b.rataPencapaian - a.rataPencapaian);
  }, [kpiData.pegawaiDetails]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-800">{label}</p>
          <p className="text-sm text-emerald-600">
            Pencapaian: {payload[0]?.value?.toFixed(1)}%
          </p>
          {payload[0]?.payload?.totalPanjang && (
            <p className="text-xs text-gray-500">
              Total: {formatNumber(payload[0].payload.totalPanjang)} m
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Memuat data KPI...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-black">
      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5 shadow-sm">
  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
    <div>
      <h3 className="text-lg font-semibold text-gray-900">Grafik Kinerja Pekerja Lapangan Non-ASN</h3>
      <p className="text-sm text-gray-600">Pilih periode dan wilayah untuk analisis kinerja</p>
    </div>
    
    
  </div>
  
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Bulan</label>
      <select
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        disabled={loading}
      >
        {[1,2,3,4,5,6,7,8,9,10,11,12].map(month => (
          <option key={month} value={month}>{getNamaBulan(month)}</option>
        ))}
      </select>
    </div>
    
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Tahun</label>
      <select
        value={selectedYear}
        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        disabled={loading}
      >
        {[2024, 2025, 2026].map(year => (
          <option key={year} value={year}>{year}</option>
        ))}
      </select>
    </div>
    
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Wilayah</label>
      <select
        value={selectedWilayah}
        onChange={(e) => setSelectedWilayah(e.target.value)}
        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        disabled={loading}
      >
        <option value="all">Semua Wilayah</option>
        {wilayahList.filter(w => w !== 'all').map(wilayah => (
          <option key={wilayah} value={wilayah}>{wilayah}</option>
        ))}
      </select>
    </div>
    
    <div className="flex items-end">
      <button
        onClick={refreshData}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50"
      >
        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        <span>Refresh</span>
      </button>
    </div>
  </div>
  
  <div className="mt-4 pt-3 border-t border-gray-100">
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
      <span>
        Menampilkan data periode: <strong>{getNamaBulan(selectedMonth)} {selectedYear}</strong>
        {selectedWilayah !== 'all' && ` · Wilayah: ${selectedWilayah}`}
        {kpiData.hariKerja > 0 && ` · Target per pegawai: ${formatNumber(kpiData.targetPerPegawai)} m (50m × ${kpiData.hariKerja} hari)`}
      </span>
    </div>
  </div>
</div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <Users size={20} />
            <span className="text-sm font-medium">Pegawai</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">
            {chartStats.totalSudahLapor}/{chartStats.totalPegawai}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {chartStats.totalBelumLapor} belum lapor
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-emerald-600 mb-2">
            <Target size={20} />
            <span className="text-sm font-medium">Total Jarak</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">
            {formatNumber(chartStats.totalPanjang)} m
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Target: {formatNumber(chartStats.totalTarget)} m
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-purple-600 mb-2">
            <TrendingUp size={20} />
            <span className="text-sm font-medium">Rata Pencapaian</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">
            {chartStats.rataPencapaian.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            dari {chartStats.totalSudahLapor} pegawai lapor
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-orange-600 mb-2">
            <Activity size={20} />
            <span className="text-sm font-medium">Tercapai Target</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">
            {chartStats.statusCounts.tercapai_target}
          </div>
          <div className="text-xs text-gray-500 mt-1">
             ≥100% pencapaian
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>📈 Progress Capaian Tim</span>
          <span>{chartStats.rataPencapaian.toFixed(1)}%</span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(chartStats.rataPencapaian, 100)}%` }}
          />
        </div>
        <div className="grid grid-cols-5 gap-2 mt-4 text-center text-xs">
          <div>
            <span className="text-emerald-600 font-bold">{chartStats.statusCounts.tercapai_target}</span>
            <span className="text-gray-500 block text-xs">Tercapai</span>
          </div>
          <div>
            <span className="text-lime-600 font-bold">{chartStats.statusCounts.hampir_tercapai}</span>
            <span className="text-gray-500 block text-xs">Hampir</span>
          </div>
          <div>
            <span className="text-yellow-600 font-bold">{chartStats.statusCounts.sedang}</span>
            <span className="text-gray-500 block text-xs">Sedang</span>
          </div>
          <div>
            <span className="text-red-600 font-bold">{chartStats.statusCounts.tidak_tercapai}</span>
            <span className="text-gray-500 block text-xs">Kurang</span>
          </div>
          <div>
            <span className="text-gray-500 font-bold">{chartStats.statusCounts.tidak_ada_laporan}</span>
            <span className="text-gray-500 block text-xs">Belum Lapor</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">🏆 Top 10 Pegawai Terbaik</h3>
          <p className="text-sm text-gray-500">Berdasarkan persentase pencapaian target</p>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={topPegawaiData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={60}
                tick={{ fontSize: 11, fill: '#6b7280' }}
              />
              <YAxis 
                label={{ value: 'Pencapaian (%)', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6b7280' } }}
                domain={[0, 120]}
                tick={{ fontSize: 11, fill: '#6b7280' }}
              />
              <Tooltip content={CustomTooltip} />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey="pencapaian" name="Pencapaian (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Line 
                type="monotone" 
                dataKey="pencapaian" 
                stroke="#ef4444" 
                strokeDasharray="5 5" 
                dot={false}
                name="Garis Referensi"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">📊 Distribusi Status Pencapaian</h3>
          <p className="text-sm text-gray-500">Status pencapaian target per pegawai</p>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.status] || '#9ca3af'} />
                ))}
              </Pie>
              <Tooltip content={CustomTooltip} />
              <Legend 
                verticalAlign="bottom" 
                align="center"
                layout="horizontal"
                formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center flex-wrap gap-3">
          <div>
            <h3 className="font-semibold text-gray-800">📋 Detail Kinerja Pegawai</h3>
            <p className="text-sm text-gray-500">
              {selectedWilayah === 'all' ? 'Semua Wilayah' : `Wilayah: ${selectedWilayah}`} · 
              {filteredPegawai.length} pegawai
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedWilayah('all')}
              className={`px-3 py-1.5 rounded-lg text-sm transition ${
                selectedWilayah === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Semua
            </button>
            {wilayahList.filter(w => w !== 'all').slice(0, 5).map(wilayah => (
              <button
                key={wilayah}
                onClick={() => setSelectedWilayah(wilayah)}
                className={`px-3 py-1.5 rounded-lg text-sm transition ${
                  selectedWilayah === wilayah 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {wilayah}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Pegawai</th>
                <th className="px-4 py-3 text-left">Wilayah</th>
                <th className="px-4 py-3 text-center">Hadir</th>
                <th className="px-4 py-3 text-right">Total Jarak</th>
                <th className="px-4 py-3 text-right">Target</th>
                <th className="px-4 py-3 text-right">Pencapaian</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {allPegawaiData.map((pegawai, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{pegawai.name}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {filteredPegawai[idx]?.wilayah || '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {pegawai.hadir}/{kpiData.hariKerja}
                  </td>
                  <td className="px-4 py-3 text-right">{formatNumber(pegawai.totalPanjang)} m</td>
                  <td className="px-4 py-3 text-right text-gray-500">{formatNumber(pegawai.target)} m</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    <span className={
                      pegawai.pencapaian >= 100 ? 'text-emerald-600' : 
                      pegawai.pencapaian >= 80 ? 'text-green-600' : 
                      pegawai.pencapaian >= 50 ? 'text-yellow-600' : 'text-red-600'
                    }>
                      {pegawai.pencapaian.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(filteredPegawai[idx]?.status)}`}>
                      {getStatusLabel(filteredPegawai[idx]?.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {wilayahStats.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">🗺️ Statistik per Wilayah</h3>
            <p className="text-sm text-gray-500">Perbandingan kinerja antar wilayah kerja</p>
          </div>
      {wilayahStats.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

          <div className="p-6">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={wilayahStats}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="wilayah" 
                  angle={-45} 
                  textAnchor="end" 
                  height={70}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <YAxis 
                  yAxisId="left"
                  label={{ value: 'Jarak (meter)', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6b7280' } }}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickFormatter={(value) => formatNumber(value)}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  label={{ value: 'Pencapaian (%)', angle: 90, position: 'insideRight', style: { fontSize: 12, fill: '#6b7280' } }}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'Pencapaian') return `${value.toFixed(1)}%`;
                    if (name === 'Total Jarak' || name === 'Target') return `${formatNumber(value)} m`;
                    if (name === 'Pegawai Lapor') return `${value} orang`;
                    return value;
                  }}
                  contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Legend verticalAlign="top" height={36} />
                <Bar 
                  yAxisId="left"
                  dataKey="totalPanjang" 
                  name="Total Jarak (m)" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
                <Bar 
                  yAxisId="left"
                  dataKey="totalTarget" 
                  name="Target (m)" 
                  fill="#f59e0b" 
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="rataPencapaian"
                  name="Pencapaian (%)"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={{ r: 6, fill: '#ef4444' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">Wilayah</th>
                  <th className="px-4 py-3 text-center">Pegawai</th>
                  <th className="px-4 py-3 text-center">Sudah Lapor</th>
                  <th className="px-4 py-3 text-right">Total Jarak</th>
                  <th className="px-4 py-3 text-right">Target</th>
                  <th className="px-4 py-3 text-right">Pencapaian</th>
                  <th className="px-4 py-3 text-center">Tercapai Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {wilayahStats.map((wilayah, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-blue-500" />
                        {wilayah.wilayah}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">{wilayah.totalPegawai}</td>
                    <td className="px-4 py-3 text-center">
                      {wilayah.totalSudahLapor}
                      <span className="text-xs text-gray-400 ml-1">
                        ({wilayah.persenKehadiran.toFixed(0)}%)
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">{formatNumber(wilayah.totalPanjang)} m</td>
                    <td className="px-4 py-3 text-right text-gray-500">{formatNumber(wilayah.totalTarget)} m</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      <span className={
                        wilayah.rataPencapaian >= 100 ? 'text-emerald-600' :
                        wilayah.rataPencapaian >= 80 ? 'text-green-600' :
                        wilayah.rataPencapaian >= 50 ? 'text-yellow-600' : 'text-red-600'
                      }>
                        {wilayah.rataPencapaian.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                        {wilayah.tercapaiTarget}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-blue-50 rounded-xl p-5 border-l-4 border-blue-500">
        <p className="text-sm text-blue-800">
          <strong>Insight:</strong> Target 50m/hari × {kpiData.hariKerja} hari = {formatNumber(kpiData.targetPerPegawai)} m/bulan per pegawai.
          Total target kolektif: {formatNumber(kpiData.targetKolektif)} m dari {kpiData.totalPegawai} pegawai.
          {chartStats.rataPencapaian < 80 && ' Rata-rata capaian masih di bawah target 80%, perlu evaluasi.'}
          {selectedWilayah !== 'all' && ` Untuk wilayah ${selectedWilayah}, capaian: ${chartStats.rataPencapaian.toFixed(1)}%.`}
        </p>
      </div>
    </div>
  );
}