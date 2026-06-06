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