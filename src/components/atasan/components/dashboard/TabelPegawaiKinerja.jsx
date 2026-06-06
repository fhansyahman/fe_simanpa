"use client";

import { Download } from "lucide-react";
import { formatNumber } from "../../utils/dashboard/formatters";
import { getStatusLabelKinerja, getStatusColorKinerja, getStatusIconKinerja } from "../../utils/dashboard/chartHelpers";

export function TabelPegawaiKinerja({ chartData, onExport }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm text-black">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Detail Data Pegawai</h3>
            <p className="text-sm text-gray-600">Rincian kinerja per pegawai untuk bulan ini</p>
          </div>
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg hover:from-emerald-600 hover:to-green-700 transition-all shadow-sm"
          >
            <Download size={16} />
            <span>Export Data</span>
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Pegawai</th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Wilayah</th>
              <th className="py-3 px-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Total KR</th>
              <th className="py-3 px-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Total KN</th>
              <th className="py-3 px-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Total Panjang</th>
              <th className="py-3 px-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Target Bulanan</th>
              <th className="py-3 px-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Pencapaian</th>
              <th className="py-3 px-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {chartData.labels?.map((label, index) => {
              const pegawaiData = chartData.pegawaiData[label];
              return (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-900">{label}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm text-gray-600">{pegawaiData?.wilayah || '-'}</p>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="font-semibold text-emerald-600">
                      {formatNumber(pegawaiData?.total_kr || 0)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="font-semibold text-purple-600">
                      {formatNumber(pegawaiData?.total_kn || 0)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="font-semibold text-blue-600">
                      {formatNumber(pegawaiData?.total_panjang || 0)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600">
                    {formatNumber(pegawaiData?.target_bulanan || 0)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className={`font-medium ${
                        (pegawaiData?.pencapaian || 0) >= 100 ? 'text-emerald-600' :
                        (pegawaiData?.pencapaian || 0) >= 80 ? 'text-green-600' :
                        (pegawaiData?.pencapaian || 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {(pegawaiData?.pencapaian || 0).toFixed(1)}%
                      </span>
                      <div className="w-16 bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full ${
                            (pegawaiData?.pencapaian || 0) >= 100 ? 'bg-emerald-500' :
                            (pegawaiData?.pencapaian || 0) >= 80 ? 'bg-green-500' :
                            (pegawaiData?.pencapaian || 0) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(pegawaiData?.pencapaian || 0, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${
                      getStatusColorKinerja(pegawaiData?.status)
                    }`}>
                      {getStatusIconKinerja(pegawaiData?.status)}
                      {getStatusLabelKinerja(pegawaiData?.status)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}