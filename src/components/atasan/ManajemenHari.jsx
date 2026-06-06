"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Menu,
  Download,
  Building2,
  Users,
  FileText,
  ArrowLeft
} from "lucide-react";
import { KpiMobilityDashboard } from "./components/dashboard/KpiMobilityDashboard";

export default function GrafikKinerjaPage() {
  const [showExportMenu, setShowExportMenu] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 pb-16">
      {/* HEADER - Optimized untuk HP */}
      <div className="bg-gradient-to-b from-blue-900 to-blue-700 pt-4 pb-6">
        <div className="px-4">
          <div className="flex items-center text-white mb-2">
            {/* Bagian kiri: Arrow + Judul */}
            <div className="flex items-center gap-x-2 flex-1">
              <Link href="/atasan/dashboard" className="hover:opacity-80 transition-opacity">
                <ArrowLeft size={24} />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">Grafik Kinerja</h1>
                <p className="text-blue-100 text-xs mt-1">Pencapaian kinerja pekerja lapangan non-ASN</p>
              </div>
            </div>

            {/* Tombol aksi di kanan - Dropdown Export */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition flex items-center gap-1"
              >
                <Download size={18} />
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
                        // Export functionality will be handled inside KpiMobilityDashboard
                        setShowExportMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Users size={14} />
                      Export Data Pegawai
                    </button>
                    <button
                      onClick={() => {
                        setShowExportMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Building2 size={14} />
                      Export Statistik Wilayah
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={() => {
                        setShowExportMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <FileText size={14} />
                      Export Semua Data
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4">
        {/* KPI MOBILITY DASHBOARD */}
        <KpiMobilityDashboard />
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