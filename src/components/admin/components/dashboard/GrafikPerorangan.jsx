"use client";

import { useState } from "react";
import { Bar, Line, Pie } from 'react-chartjs-2';
import { 
  BarChart3, LineChart, PieChart, Filter, 
  TrendingUp, TrendingDown, Download
} from "lucide-react";
import { LoadingSpinner } from "./LoadingSpinner";
import { EmptyState } from "./EmptyState";
import { ExportButton } from "./ExportButton";
import { getNamaBulan } from "../../utils/dashboard/constants";

export function GrafikPerorangan({
  loading,
  chartData,
  activeChart,
  filterType,
  sortOrder,
  selectedMonth,
  selectedYear,
  onChartChange,
  onFilterTypeChange,
  onSortOrderChange,
  onRefresh,
  onExport,
  onExportImage
}) {
  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'top', 
        labels: { usePointStyle: true, padding: 20, font: { size: 12 }, color: '#374151' } 
      },
      title: {
        display: true,
        text: `Total Kinerja vs Target - ${getNamaBulan(selectedMonth)} ${selectedYear}`,
        font: { size: 16, weight: 'bold' },
        padding: { bottom: 30, top: 10 },
        color: '#111827'
      },
      tooltip: {
        mode: 'index', intersect: false,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#111827', bodyColor: '#374151',
        borderColor: '#E5E7EB', borderWidth: 1,
        boxPadding: 10, usePointStyle: true,
        callbacks: { 
          label: (context) => `${context.dataset.label || ''}: ${context.parsed.y.toLocaleString('id-ID')}m` 
        }
      }
    },
    scales: {
      x: { 
        grid: { display: false }, 
        ticks: { maxRotation: 45, minRotation: 45, font: { size: 11 } } 
      },
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Panjang (meter)' },
        ticks: { callback: (value) => `${value.toLocaleString('id-ID')}m` }
      }
    }
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { usePointStyle: true, padding: 20, font: { size: 12 } } },
      title: {
        display: true,
        text: `Persentase Pencapaian Target - ${getNamaBulan(selectedMonth)} ${selectedYear}`,
        font: { size: 16, weight: 'bold' },
        padding: { bottom: 30, top: 10 }
      },
      tooltip: {
        mode: 'index', intersect: false,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#111827', bodyColor: '#374151',
        borderColor: '#E5E7EB', borderWidth: 1,
        boxPadding: 10, usePointStyle: true,
        callbacks: { 
          label: (context) => `${context.dataset.label || ''}: ${context.parsed.y.toFixed(1)}%` 
        }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { maxRotation: 45, minRotation: 45, font: { size: 11 } } },
      y: {
        beginAtZero: true, min: 0, max: 120,
        title: { display: true, text: 'Persentase Pencapaian (%)' },
        ticks: { callback: (value) => `${value}%` }
      }
    }
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'right', 
        labels: { usePointStyle: true, padding: 20, font: { size: 12 } } 
      },
      title: {
        display: true,
        text: `Distribusi Status Pencapaian - ${getNamaBulan(selectedMonth)} ${selectedYear}`,
        font: { size: 16, weight: 'bold' },
        padding: { bottom: 30, top: 10 }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#111827', bodyColor: '#374151',
        borderColor: '#E5E7EB', borderWidth: 1,
        boxPadding: 10, usePointStyle: true,
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} pegawai (${percentage}%)`;
          }
        }
      }
    }
  };

  const renderChart = () => {
    if (!chartData) return null;

    switch (activeChart) {
      case 'bar':
        return <Bar data={processBarChartData()} options={barChartOptions} />;
      case 'line':
        return <Line data={processLineChartData()} options={lineChartOptions} />;
      case 'pie':
        return <Pie data={processPieChartData()} options={pieChartOptions} />;
      default:
        return <Bar data={processBarChartData()} options={barChartOptions} />;
    }
  };

  // PERUBAHAN: Bar chart hanya menampilkan total panjang vs target
  const processBarChartData = () => {
    const { labels, totalPanjang, target } = chartData;
    
    const indices = getSortedIndices();
    const sortedLabels = indices.map(i => labels[i]);
    const sortedTotalPanjang = indices.map(i => totalPanjang[i]);
    const sortedTarget = indices.map(i => target[i]);

    return {
      labels: sortedLabels,
      datasets: [
        {
          type: 'bar',
          label: 'Total Panjang (KR+KN)',
          data: sortedTotalPanjang,
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgb(34, 197, 94)',
          borderWidth: 2,
          borderRadius: 6,
          order: 1,
        },
        {
          type: 'line',
          label: 'Target Bulanan',
          data: sortedTarget,
          borderColor: 'rgb(239, 68, 68)',
          borderWidth: 3,
          borderDash: [8, 4],
          pointRadius: 6,
          pointBackgroundColor: 'rgb(239, 68, 68)',
          pointBorderColor: 'white',
          pointBorderWidth: 2,
          order: 0,
          tension: 0.3,
          fill: false,
        }
      ]
    };
  };

  // PERUBAHAN: Line chart hanya menampilkan pencapaian total
  const processLineChartData = () => {
    const { labels, pencapaian } = chartData;
    
    const indices = getSortedIndices();
    const sortedLabels = indices.map(i => labels[i]);
    const sortedPencapaian = indices.map(i => pencapaian[i]);

    return {
      labels: sortedLabels,
      datasets: [
        {
          label: 'Pencapaian Total (%)',
          data: sortedPencapaian,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointRadius: 6,
          pointBackgroundColor: 'rgb(34, 197, 94)',
          pointBorderColor: 'white',
          pointBorderWidth: 2,
        }
      ]
    };
  };

  const processPieChartData = () => {
    const { statusCounts } = chartData;
    const labels = ['Tercapai Target', 'Hampir Tercapai', 'Sedang', 'Tidak Tercapai', 'Tidak Ada Laporan'];
    const data = [
      statusCounts.tercapai_target || 0,
      statusCounts.hampir_tercapai || 0,
      statusCounts.sedang || 0,
      statusCounts.tidak_tercapai || 0,
      statusCounts.tidak_ada_laporan || 0
    ];

    const backgroundColors = [
      'rgba(34, 197, 94, 0.8)',
      'rgba(132, 204, 22, 0.8)',
      'rgba(234, 179, 8, 0.8)',
      'rgba(239, 68, 68, 0.8)',
      'rgba(156, 163, 175, 0.8)'
    ];

    return {
      labels,
      datasets: [{
        data,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map(c => c.replace('0.8', '1')),
        borderWidth: 2,
        hoverOffset: 15
      }]
    };
  };

  const getSortedIndices = () => {
    const { labels, totalPanjang, pencapaian } = chartData;
    const indices = Array.from({ length: labels.length }, (_, i) => i);
    
    indices.sort((a, b) => {
      if (activeChart === 'pie') return 0;
      
      const getValueA = () => {
        if (activeChart === 'bar') return totalPanjang[a];
        return pencapaian[a];
      };
      
      const getValueB = () => {
        if (activeChart === 'bar') return totalPanjang[b];
        return pencapaian[b];
      };
      
      return sortOrder === 'desc' 
        ? getValueB() - getValueA() 
        : getValueA() - getValueB();
    });
    
    return indices;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden mb-8 text-black">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {activeChart === 'bar' && 'Grafik Batang: Total Kinerja vs Target per Pegawai'}
              {activeChart === 'line' && 'Grafik Garis: Persentase Pencapaian per Pegawai'}
              {activeChart === 'pie' && 'Grafik Pie: Distribusi Status Pencapaian'}
            </h2>
            <p className="text-sm text-gray-600">
              {activeChart === 'bar' && 'Perbandingan total kinerja (KR+KN) dengan target bulanan per pegawai'}
              {activeChart === 'line' && 'Trend persentase pencapaian target total per pegawai'}
              {activeChart === 'pie' && 'Distribusi status pencapaian target seluruh pegawai'}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => onChartChange('bar')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeChart === 'bar' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
                disabled={loading}
              >
                <BarChart3 size={14} />
                <span>Batang</span>
              </button>
              <button
                onClick={() => onChartChange('line')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeChart === 'line' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
                disabled={loading}
              >
                <LineChart size={14} />
                <span>Garis</span>
              </button>
              <button
                onClick={() => onChartChange('pie')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeChart === 'pie' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
                disabled={loading}
              >
                <PieChart size={14} />
                <span>Pie</span>
              </button>
            </div>
            
            {activeChart !== 'pie' && (
              <div className="flex gap-3">
                <div className="flex items-center gap-2">
                  <Filter size={14} className="text-gray-500" />
                  <select
                    value={filterType}
                    onChange={(e) => onFilterTypeChange(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={loading}
                  >
                    <option value="all">Semua Data</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 whitespace-nowrap">Urutkan:</span>
                  <select
                    value={sortOrder}
                    onChange={(e) => onSortOrderChange(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={loading}
                  >
                    <option value="desc">Terbesar ke Terkecil</option>
                    <option value="asc">Terkecil ke Terbesar</option>
                  </select>
                </div>

                <ExportButton onClick={onExport} disabled={!chartData} label="Export Data" />
                
                <button
                  onClick={onExportImage}
                  disabled={loading || !chartData}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
                  title="Export sebagai gambar"
                >
                  <Download size={14} className="text-blue-600" />
                  <span className="text-sm">Export Grafik</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 h-[500px] kinerja-chart-container" id="kinerjaChartContainer">
        {loading ? (
          <LoadingSpinner size="lg" text="Memuat data grafik..." />
        ) : chartData && chartData.labels && chartData.labels.length > 0 ? (
          renderChart()
        ) : (
          <EmptyState 
            icon={BarChart3}
            title="Tidak ada data untuk periode ini"
            message={`Tidak ada data kinerja untuk ${getNamaBulan(selectedMonth)} ${selectedYear}`}
            onRefresh={onRefresh}
          />
        )}
      </div>
    </div>
  );
}