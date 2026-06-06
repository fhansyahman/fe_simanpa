"use client";

import { MapPin, TrendingUp, TrendingDown, Target, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { formatNumber } from "../../utils/dashboard/formatters";

export function TabelWilayahKinerja({ statistikWilayah }) {
  const getStatusColor = (pencapaian) => {
    if (pencapaian >= 100) return 'text-emerald-600 font-bold';
    if (pencapaian >= 80) return 'text-green-600';
    if (pencapaian >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressBarColor = (pencapaian) => {
    if (pencapaian >= 100) return 'bg-emerald-500';
    if (pencapaian >= 80) return 'bg-green-500';
    if (pencapaian >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusIcon = (pencapaian) => {
    if (pencapaian >= 100) return <CheckCircle size={14} className="text-emerald-600" />;
    if (pencapaian >= 80) return <TrendingUp size={14} className="text-green-600" />;
    if (pencapaian >= 60) return <AlertCircle size={14} className="text-yellow-600" />;
    return <XCircle size={14} className="text-red-600" />;
  };

  const getStatusLabel = (pencapaian) => {
    if (pencapaian >= 100) return 'Tercapai';
    if (pencapaian >= 80) return 'Hampir Tercapai';
    if (pencapaian >= 60) return 'Sedang';
    return 'Kurang';
  };

  if (!statistikWilayah || statistikWilayah.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <MapPin className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-gray-500">Tidak ada data wilayah</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm mb-8 text-black">
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-green-50">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Target size={18} className="text-red-600" />
          Statistik Kinerja per Wilayah
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Perbandingan realisasi total (KR+KN) vs target per wilayah (Merah = Target, Hijau = Realisasi)
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-700">Wilayah</th>
              <th className="py-3 px-4 text-right text-xs font-semibold text-gray-700">Total Pegawai</th>
              <th className="py-3 px-4 text-right text-xs font-semibold text-gray-700">Sudah Lapor</th>
              <th className="py-3 px-4 text-right text-xs font-semibold text-gray-700" colSpan="2">Total Panjang (KR+KN)</th>
              <th className="py-3 px-4 text-right text-xs font-semibold text-gray-700">Pencapaian</th>
              <th className="py-3 px-4 text-center text-xs font-semibold text-gray-700">Status</th>
            </tr>
            <tr className="bg-gray-50 text-xs text-gray-500">
              <th></th>
              <th></th>
              <th></th>
              <th className="py-1 px-4 text-right text-green-600 font-medium">Realisasi</th>
              <th className="py-1 px-4 text-right text-red-600 font-medium">Target</th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {statistikWilayah.map((wilayah, idx) => {
              const totalPanjang = (wilayah.totalKR || 0) + (wilayah.totalKN || 0);
              const target = wilayah.target || 0;
              const selisih = totalPanjang - target;
              const persenPencapaian = target > 0 ? (totalPanjang / target) * 100 : 0;
              
              return (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  {/* Wilayah */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-blue-600" />
                      <span className="font-medium text-gray-900">{wilayah.wilayah}</span>
                    </div>
                  </td>

                  {/* Total Pegawai */}
                  <td className="py-3 px-4 text-right font-medium">{wilayah.totalPegawai}</td>

                  {/* Sudah Lapor */}
                  <td className="py-3 px-4 text-right">
                    <span className="font-medium text-gray-900">{wilayah.totalSudahLapor}</span>
                    <span className="text-xs text-gray-500 ml-1">
                      ({wilayah.totalPegawai > 0 ? Math.round((wilayah.totalSudahLapor / wilayah.totalPegawai) * 100) : 0}%)
                    </span>
                  </td>

                  {/* Total Panjang Realisasi */}
                  <td className="py-3 px-4 text-right">
                    <span className="font-semibold text-green-600">{formatNumber(totalPanjang)}</span>
                  </td>

                  {/* Target */}
                  <td className="py-3 px-4 text-right">
                    <span className="font-semibold text-red-600">{formatNumber(target)}</span>
                    <div className="text-xs mt-1">
                      <span className={selisih >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {selisih >= 0 ? '+' : ''}{formatNumber(selisih)}
                      </span>
                    </div>
                  </td>

                  {/* Pencapaian */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className={getStatusColor(persenPencapaian)}>
                        {persenPencapaian.toFixed(1)}%
                      </span>
                      <div className="w-16 bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full ${getProgressBarColor(persenPencapaian)}`}
                          style={{ width: `${Math.min(persenPencapaian, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {getStatusIcon(persenPencapaian)}
                      <span className={`text-xs font-medium ${
                        persenPencapaian >= 80 ? 'text-green-600' :
                        persenPencapaian >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {getStatusLabel(persenPencapaian)}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Footer dengan total */}
          <tfoot className="bg-gray-50 border-t border-gray-200 text-black">
            <tr>
              <td className="py-3 px-4 font-bold" colSpan="3">TOTAL KESELURUHAN</td>
              <td className="py-3 px-4 text-right font-bold text-green-600">
                {formatNumber(statistikWilayah.reduce((acc, w) => acc + (w.totalKR || 0) + (w.totalKN || 0), 0))}
              </td>
              <td className="py-3 px-4 text-right font-bold text-red-600">
                {formatNumber(statistikWilayah.reduce((acc, w) => acc + (w.target || 0), 0))}
              </td>
              <td className="py-3 px-4 text-right" colSpan="2">
                <span className="font-bold text-blue-600">
                  {(() => {
                    const totalPanjang = statistikWilayah.reduce((acc, w) => acc + (w.totalKR || 0) + (w.totalKN || 0), 0);
                    const totalTarget = statistikWilayah.reduce((acc, w) => acc + (w.target || 0), 0);
                    return totalTarget > 0 ? ((totalPanjang / totalTarget) * 100).toFixed(1) : 0;
                  })()}%
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Legend */}
      <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-gray-600">Realisasi Total (KR+KN)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-gray-600">Target Bulanan</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle size={14} className="text-emerald-600" />
          <span className="text-gray-600">Tercapai (≥100%)</span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-green-600" />
          <span className="text-gray-600">Hampir Tercapai (80-99%)</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertCircle size={14} className="text-yellow-600" />
          <span className="text-gray-600">Sedang (60-79%)</span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle size={14} className="text-red-600" />
          <span className="text-gray-600">Kurang (&lt;60%)</span>
        </div>
      </div>
    </div>
  );
}