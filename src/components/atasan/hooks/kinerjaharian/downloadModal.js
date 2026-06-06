'use client';

import { X } from 'lucide-react';
import LaporanGenerator from './LaporanGenerator';
import LaporanGeneratorRekap from './LaporanGeneratorRekap';

export function DownloadModal({ isOpen, onClose, type, data, wilayah, tanggal, formatDateShort }) {
  if (!isOpen) return null;

  const getTitle = () => {
    if (type === 'rekap') {
      return `Download Rekap Wilayah ${wilayah || 'Semua'}`;
    }
    return 'Download PDF Perorangan';
  };

  const getSubtitle = () => {
    if (type === 'rekap') {
      return `Tanggal: ${formatDateShort(tanggal)} • ${data?.length || 0} data`;
    }
    return `${data?.nama} • ${formatDateShort(data?.tanggal)}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b rounded-t-2xl p-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{getTitle()}</h2>
            <p className="text-sm text-gray-500 mt-1">{getSubtitle()}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {type === 'rekap' ? (
            <LaporanGeneratorRekap
              data={data || []}
              wilayah={wilayah || 'Semua Wilayah'}
              tanggal={tanggal}
              isLoading={false}
            />
          ) : (
            <LaporanGenerator
              data={data}
              isLoading={false}
            />
          )}
        </div>
      </div>
    </div>
  );
}