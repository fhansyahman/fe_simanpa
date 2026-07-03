"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Building2,
  Search,
  Filter,
  Users,
  MapPin,
  Download,
  Home,
  ClipboardCheck,
  FileText,
  User,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  RefreshCw,
  X,
  Clock,
  Briefcase,
  UserCheck,
  UserX,
  AlertCircle,
  Printer,
  FileSpreadsheet,
  BarChart3,
  ChevronDown,
  Check
} from "lucide-react";
import { usePresensiData } from "./hooks/rekapkehadiran/usePresensiData";
import { useFilters } from "./hooks/rekapkehadiran/useFilters";
import { useRekapProcessor } from "./hooks/rekapkehadiran/useRekapProcessor";
import { useAuth } from "@/context/AuthContext";
import * as XLSX from 'xlsx';

const WILAYAH_LIST = ["Cermee", "Prajekan", "Botolinggo", "Klabang", "Ijen"];

export default function RekapKehadiranBulanan() {
  const { user, loading: authLoading } = useAuth();
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showWilayahModal, setShowWilayahModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [tempFilters, setTempFilters] = useState({});
  
  const userWilayah = user?.wilayah_penugasan || user?.wilayah || null;
  const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('superadmin') || false;
  
  const { 
    presensiData, 
    loading, 
    error, 
    loadData,
    refreshData 
  } = usePresensiData();

  const {
    search,
    bulanFilter,
    tahunFilter,
    wilayahFilter,
    setSearch,
    setBulanFilter,
    setTahunFilter,
    setWilayahFilter,
    resetFilters,
    setToCurrentMonth,
    activeFilterCount,
    getBulanOptions,
    getTahunOptions,
    getBulanLabel
  } = useFilters();

  const {
    rekapBulanan,
    statistikBulanan,
    processing,
    processRekap,
    getDaysInMonth
  } = useRekapProcessor(presensiData, bulanFilter, tahunFilter, wilayahFilter, search);

  useEffect(() => {
    if (!isAdmin && userWilayah) {
      setWilayahFilter(userWilayah);
    }
  }, [userWilayah, isAdmin, setWilayahFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (presensiData.length > 0 && bulanFilter && tahunFilter) {
      processRekap();
    }
  }, [bulanFilter, tahunFilter, wilayahFilter, search, presensiData, processRekap]);

  useEffect(() => {
    setTempFilters({
      bulan: bulanFilter,
      tahun: tahunFilter,
      wilayah: wilayahFilter,
      search: search
    });
  }, [bulanFilter, tahunFilter, wilayahFilter, search]);

  const handleApplyFilters = () => {
    if (tempFilters.bulan) setBulanFilter(tempFilters.bulan);
    if (tempFilters.tahun) setTahunFilter(tempFilters.tahun);
    if (!isAdmin && userWilayah) {
      setWilayahFilter(userWilayah);
    } else {
      if (tempFilters.wilayah !== undefined) setWilayahFilter(tempFilters.wilayah);
    }
    if (tempFilters.search !== undefined) setSearch(tempFilters.search);
    setShowFilterModal(false);
  };

  const handleResetFilters = () => {
    const today = new Date();
    setTempFilters({
      bulan: (today.getMonth() + 1).toString().padStart(2, '0'),
      tahun: today.getFullYear().toString(),
      wilayah: isAdmin ? "" : userWilayah,
      search: ""
    });
    resetFilters();
    setShowFilterModal(false);
  };

  const getWilayahLabel = (wilayah) => {
    if (!wilayah || wilayah === "") return "Semua Wilayah";
    return wilayah;
  };

  const handleExportExcel = () => {
    if (rekapBulanan.length === 0) {
      alert("Tidak ada data untuk diexport");
      return;
    }

    const daysInMonth = getDaysInMonth(parseInt(tahunFilter), parseInt(bulanFilter));
    const bulanLabel = getBulanLabel(bulanFilter);
    const sheetName = `Rekap_${bulanLabel}_${tahunFilter}`;

    const headerRow1 = ["NAMA", "JABATAN"];
    for (let i = 1; i <= daysInMonth; i++) {
      headerRow1.push(`${i}`);
    }
    headerRow1.push("HADIR (H)", "TERLAMBAT (T)", "IZIN (I)", "TANPA KET (TK)");

    const headerRow2 = ["", ""];
    for (let i = 1; i <= daysInMonth; i++) {
      headerRow2.push("");
    }
    headerRow2.push("", "", "", "");

    const excelData = [headerRow1, headerRow2];

    rekapBulanan.forEach((pegawai) => {
      const row = [
        pegawai.nama,
        pegawai.jabatan,
        ...pegawai.presensiHarian.map(status => status || '-'),
        pegawai.totalHadir,
        pegawai.totalTerlambat,
        pegawai.totalIzin,
        pegawai.totalTanpaKeterangan
      ];
      excelData.push(row);
    });

    const totalRow = ["TOTAL", ""];
    for (let i = 1; i <= daysInMonth; i++) {
      totalRow.push("");
    }
    totalRow.push(
      statistikBulanan.totalHadir,
      statistikBulanan.totalTerlambat,
      statistikBulanan.totalIzin,
      statistikBulanan.totalTanpaKeterangan
    );
    excelData.push(totalRow);

    excelData.push([]);
    excelData.push(["KETERANGAN:"]);
    excelData.push(["H", "= Hadir (tepat waktu)"]);
    excelData.push(["T", "= Terlambat"]);
    excelData.push(["I", "= Izin"]);
    excelData.push(["TK", "= Tanpa Keterangan"]);

    const ws = XLSX.utils.aoa_to_sheet(excelData);
    ws['!cols'] = [
      {wch:25},
      {wch:20},
      ...Array(daysInMonth).fill({wch:4}),
      {wch:8}, {wch:8}, {wch:8}, {wch:8}
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const fileName = `rekap_kehadiran_${bulanLabel}_${tahunFilter}${wilayahFilter ? `_${wilayahFilter}` : ''}.xlsx`;
    XLSX.writeFile(wb, fileName);
    setShowExportModal(false);
  };

  const handlePrintCustom = () => {
    const printWindow = window.open('', '_blank');
    const daysInMonth = getDaysInMonth(parseInt(tahunFilter), parseInt(bulanFilter));
    const bulanLabel = getBulanLabel(bulanFilter);
    
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Rekap Kehadiran ${bulanLabel} ${tahunFilter}</title>
          <style>
            @page {
              size: landscape;
              margin: 10mm;
            }
            body { 
              font-family: 'Courier New', Courier, monospace;
              font-size: 10px;
              margin: 0;
              padding: 10px;
            }
            .print-header { 
              text-align: center; 
              margin-bottom: 15px;
            }
            .print-header h1 { 
              margin: 0; 
              font-size: 14px;
              font-weight: bold;
            }
            .print-header h2 { 
              margin: 5px 0; 
              font-size: 12px;
              font-weight: normal;
            }
            .print-header h3 {
              margin: 5px 0;
              font-size: 11px;
              font-weight: normal;
            }
            table { 
              border-collapse: collapse; 
              width: 100%; 
              font-size: 9px;
              margin-bottom: 15px;
            }
            th, td { 
              border: 1px solid
              padding: 4px 2px; 
              text-align: center;
              vertical-align: middle;
            }
            th { 
              background-color:
              font-weight: bold;
              font-size: 9px;
            }
            .header-row th {
              background-color:
            }
            td:first-child, th:first-child {
              font-weight: bold;
            }
            .footer {
              margin-top: 20px;
              font-size: 9px;
            }
            .keterangan {
              margin-top: 15px;
              border-top: 1px solid
              padding-top: 10px;
            }
            .keterangan h4 {
              margin: 5px 0;
              font-size: 10px;
            }
            .keterangan table {
              width: auto;
              margin-top: 5px;
            }
            .keterangan td {
              border: none;
              text-align: left;
              padding: 2px 5px;
            }
            .total-row {
              background-color:
              font-weight: bold;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
              th, td {
                border-color:
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1>REKAP KEHADIRAN PEGAWAI</h1>
            <h2>Bulan: ${bulanLabel} ${tahunFilter}</h2>
            ${wilayahFilter ? `<h3>Wilayah: ${wilayahFilter}</h3>` : ''}
          </div>
          
          <table>
            <thead>
              <tr>
                <th rowspan="2">NO</th>
                <th rowspan="2">NAMA</th>
                <th rowspan="2">JABATAN</th>
                <th colspan="${daysInMonth}">TANGGAL</th>
                <th colspan="4">JUMLAH</th>
              </tr>
              <tr>
                ${Array.from({ length: daysInMonth }, (_, i) => `<th>${i + 1}</th>`).join('')}
                <th>H</th>
                <th>T</th>
                <th>I</th>
                <th>TK</th>
              </tr>
            </thead>
            <tbody>
              ${rekapBulanan.map((pegawai, idx) => {
                const totalHadir = pegawai.totalHadir || 0;
                const totalTerlambat = pegawai.totalTerlambat || 0;
                const totalIzin = pegawai.totalIzin || 0;
                const totalTanpaKeterangan = pegawai.totalTanpaKeterangan || 0;
                
                return `
                  <tr>
                    <td>${idx + 1}</td>
                    <td style="text-align: left;">${pegawai.nama}</td>
                    <td style="text-align: left;">${pegawai.jabatan}</td>
                    ${pegawai.presensiHarian.map(status => {
                      let display = status || '-';
                      return `<td>${display}</td>`;
                    }).join('')}
                    <td>${totalHadir}</td>
                    <td>${totalTerlambat}</td>
                    <td>${totalIzin}</td>
                    <td>${totalTanpaKeterangan}</td>
                  </tr>
                `;
              }).join('')}
              <tr class="total-row">
                <td colspan="3" style="text-align: center; font-weight: bold;">TOTAL</td>
                ${Array.from({ length: daysInMonth }, () => `<td></td>`).join('')}
                <td style="font-weight: bold;">${statistikBulanan.totalHadir}</td>
                <td style="font-weight: bold;">${statistikBulanan.totalTerlambat}</td>
                <td style="font-weight: bold;">${statistikBulanan.totalIzin}</td>
                <td style="font-weight: bold;">${statistikBulanan.totalTanpaKeterangan}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="keterangan">
            <h4>Keterangan:</h4>
            <table>
              <tr><td style="width: 30px;"><strong>H</strong></td><td>:</td><td>Hadir</td><td style="width: 30px;"><strong>Hadir tepat waktu</strong></td></tr>
              <tr><td><strong>T</strong></td><td>:</td><td>Terlambat</td><td>Hadir terlambat</td></tr>
              <tr><td><strong>I</strong></td><td>:</td><td>Izin</td><td>Tidak hadir dengan izin</td></tr>
              <tr><td><strong>TK</strong></td><td>:</td><td>Tanpa Keterangan</td><td>Tidak hadir tanpa izin</td></tr>
            </table>
          </div>
          
          <div class="footer">
            <p>Dicetak pada: ${new Date().toLocaleDateString('id-ID', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })} ${new Date().toLocaleTimeString('id-ID')}</p>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center px-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-600 text-sm">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center px-4">
          <UserX className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-gray-600 text-sm">Silakan login terlebih dahulu</p>
          <Link href="/login">
            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
              Login
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-16">
      <div className="bg-gradient-to-b from-blue-900 to-blue-800 pt-4 pb-16">
        <div className="px-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 flex-1">
              <Link href="/atasan/dashboard" className="hover:opacity-80 transition-opacity">
                <ArrowLeft size={24} className="text-white" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">Rekap Kehadiran</h1>
                <p className="text-white text-xs mt-1">Rekap kehadiran bulanan pegawai</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowExportModal(true)}
                disabled={rekapBulanan.length === 0}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition disabled:opacity-50"
              >
                <Download size={18} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-12 text-black">
        <div className="bg-white rounded-xl shadow-lg p-3 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-xs">
              <Calendar size={14} className="text-gray-400" />
              <span className="font-medium text-gray-700">
                {getBulanLabel(bulanFilter)} {tahunFilter}
              </span>
            </div>
            
            <div className="flex gap-2">
              {isAdmin && (
                <button
                  onClick={() => {
                    setTempFilters({ bulan: bulanFilter, tahun: tahunFilter, wilayah: wilayahFilter, search: search });
                    setShowFilterModal(true);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg text-blue-600 text-xs font-medium"
                >
                  <Filter size={12} />
                  Filter
                </button>
              )}
              
              {isAdmin && (
                <button
                  onClick={() => setShowWilayahModal(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg text-gray-700 text-xs font-medium"
                >
                  <MapPin size={12} />
                  <span className="max-w-[100px] truncate">{getWilayahLabel(wilayahFilter)}</span>
                </button>
              )}

              {!isAdmin && userWilayah && (
                <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg text-gray-700 text-xs">
                  <MapPin size={12} />
                  <span>{userWilayah}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => {
                let currentBulan = parseInt(bulanFilter);
                let currentTahun = parseInt(tahunFilter);
                
                if (currentBulan === 1) {
                  setBulanFilter('12');
                  setTahunFilter((currentTahun - 1).toString());
                } else {
                  setBulanFilter((currentBulan - 1).toString().padStart(2, '0'));
                }
              }}
              className="flex-1 py-2 rounded-lg bg-gray-100 active:bg-gray-200 text-sm font-medium flex items-center justify-center gap-1"
            >
              <ChevronLeft size={16} />
              <span>Prev</span>
            </button>
            
            <button
              onClick={() => {
                const today = new Date();
                setBulanFilter((today.getMonth() + 1).toString().padStart(2, '0'));
                setTahunFilter(today.getFullYear().toString());
              }}
              className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium active:bg-blue-700"
            >
              Bulan Ini
            </button>
            
            <button
              onClick={() => {
                let currentBulan = parseInt(bulanFilter);
                let currentTahun = parseInt(tahunFilter);
                
                if (currentBulan === 12) {
                  setBulanFilter('01');
                  setTahunFilter((currentTahun + 1).toString());
                } else {
                  setBulanFilter((currentBulan + 1).toString().padStart(2, '0'));
                }
              }}
              className="flex-1 py-2 rounded-lg bg-gray-100 active:bg-gray-200 text-sm font-medium flex items-center justify-center gap-1"
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {isAdmin && wilayahFilter && wilayahFilter !== "" && (
          <div className="mb-4">
            <div className="bg-blue-50 rounded-lg p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <MapPin size={14} className="text-blue-600" />
                <span className="text-xs text-blue-800">
                  Menampilkan data untuk: <strong className="text-sm">{wilayahFilter}</strong>
                </span>
              </div>
              <button
                onClick={() => setWilayahFilter("")}
                className="text-xs text-blue-600 font-medium px-2 py-1 bg-blue-100 rounded-md"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-4">
          <div className="p-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 rounded-lg p-2 text-center">
                <p className="text-[10px] text-gray-500">Hadir</p>
                <p className="text-lg font-bold text-green-600">{statistikBulanan.totalHadir}</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-2 text-center">
                <p className="text-[10px] text-gray-500">Terlambat</p>
                <p className="text-lg font-bold text-amber-600">{statistikBulanan.totalTerlambat}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-2 text-center">
                <p className="text-[10px] text-gray-500">Izin</p>
                <p className="text-lg font-bold text-purple-600">{statistikBulanan.totalIzin}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-2 text-center">
                <p className="text-[10px] text-gray-500">Tanpa Ket</p>
                <p className="text-lg font-bold text-red-600">{statistikBulanan.totalTanpaKeterangan}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-3">
            {processing ? (
              <div className="text-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-gray-500 text-xs">Memproses data...</p>
              </div>
            ) : (
              <>
                {rekapBulanan.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText size={32} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Tidak ada data rekap</p>
                    <button
                      onClick={refreshData}
                      className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs"
                    >
                      Refresh Data
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3" id="rekap-table">
                    {rekapBulanan.map((pegawai, idx) => {
                      const totalKehadiran = pegawai.totalHadir + pegawai.totalTerlambat;
                      const persenKehadiran = (totalKehadiran / getDaysInMonth(parseInt(tahunFilter), parseInt(bulanFilter)) * 100).toFixed(1);
                      
                      return (
                        <div key={pegawai.id || idx} className="bg-gray-50 rounded-xl p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-sm text-gray-800">{pegawai.nama}</h3>
                              <p className="text-[10px] text-gray-500">{pegawai.jabatan}</p>
                              {pegawai.wilayah && (
                                <p className="text-[9px] text-blue-600 flex items-center gap-0.5 mt-0.5">
                                  <MapPin size={10} />
                                  {pegawai.wilayah}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-green-600">{persenKehadiran}%</p>
                              <p className="text-[9px] text-gray-500">Kehadiran</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-2 mb-3 text-center">
                            <div className="bg-green-50 rounded-lg p-1">
                              <p className="text-xs font-bold text-green-600">{pegawai.totalHadir}</p>
                              <p className="text-[8px] text-gray-500">Hadir</p>
                            </div>
                            <div className="bg-amber-50 rounded-lg p-1">
                              <p className="text-xs font-bold text-amber-600">{pegawai.totalTerlambat}</p>
                              <p className="text-[8px] text-gray-500">Terlambat</p>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-1">
                              <p className="text-xs font-bold text-purple-600">{pegawai.totalIzin}</p>
                              <p className="text-[8px] text-gray-500">Izin</p>
                            </div>
                            <div className="bg-red-50 rounded-lg p-1">
                              <p className="text-xs font-bold text-red-600">{pegawai.totalTanpaKeterangan}</p>
                              <p className="text-[8px] text-gray-500">Tanpa Ket</p>
                            </div>
                          </div>

                          <div className="overflow-x-auto no-scrollbar">
                            <div className="flex gap-1 min-w-max pb-1">
                              {pegawai.presensiHarian.map((status, dayIdx) => {
                                let bgColor = "bg-gray-100";
                                let textColor = "text-gray-600";
                                let label = dayIdx + 1;
                                
                                if (status === 'H') {
                                  bgColor = "bg-green-100";
                                  textColor = "text-green-700";
                                } else if (status === 'T') {
                                  bgColor = "bg-amber-100";
                                  textColor = "text-amber-700";
                                } else if (status === 'I') {
                                  bgColor = "bg-purple-100";
                                  textColor = "text-purple-700";
                                } else if (status === 'TK') {
                                  bgColor = "bg-red-100";
                                  textColor = "text-red-700";
                                }
                                
                                return (
                                  <div
                                    key={dayIdx}
                                    className={`w-8 h-8 rounded-lg ${bgColor} flex flex-col items-center justify-center flex-shrink-0`}
                                    title={`Hari ${label}: ${status || '-'}`}
                                  >
                                    <span className={`text-[9px] font-medium ${textColor}`}>{label}</span>
                                    <span className={`text-[8px] font-bold ${textColor}`}>{status || '-'}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="px-3 py-2 border-t border-gray-100 text-[9px] text-gray-400 text-center">
            {rekapBulanan.length} pegawai • {getDaysInMonth(parseInt(tahunFilter), parseInt(bulanFilter))} hari kerja
          </div>
        </div>
      </div>

      {showFilterModal && isAdmin && (
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
                  value={tempFilters.bulan || bulanFilter}
                  onChange={(e) => setTempFilters({ ...tempFilters, bulan: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  {getBulanOptions().map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
                <select
                  value={tempFilters.tahun || tahunFilter}
                  onChange={(e) => setTempFilters({ ...tempFilters, tahun: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  {getTahunOptions().map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Wilayah</label>
                <select
                  value={tempFilters.wilayah}
                  onChange={(e) => setTempFilters({ ...tempFilters, wilayah: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Semua Wilayah</option>
                  {WILAYAH_LIST.map(wilayah => (
                    <option key={wilayah} value={wilayah}>{wilayah}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cari Pegawai</label>
                <input
                  type="text"
                  placeholder="Nama pegawai..."
                  value={tempFilters.search}
                  onChange={(e) => setTempFilters({ ...tempFilters, search: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleResetFilters}
                  className="flex-1 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  Reset
                </button>
                <button
                  onClick={handleApplyFilters}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
                >
                  Terapkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showWilayahModal && isAdmin && (
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
                  setWilayahFilter("");
                  setShowWilayahModal(false);
                }}
                className={`w-full text-left p-3 rounded-lg flex items-center justify-between ${
                  !wilayahFilter ? "bg-blue-50" : "active:bg-gray-50"
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
                {!wilayahFilter && <Check size={16} className="text-blue-600" />}
              </button>

              <div className="h-px bg-gray-100 my-2" />

              {WILAYAH_LIST.map((wilayah) => (
                <button
                  key={wilayah}
                  onClick={() => {
                    setWilayahFilter(wilayah);
                    setShowWilayahModal(false);
                  }}
                  className={`w-full text-left p-3 rounded-lg flex items-center justify-between ${
                    wilayahFilter === wilayah ? "bg-blue-50" : "active:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <MapPin size={14} className="text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-800">{wilayah}</p>
                      <p className="text-[10px] text-gray-400">Filter data wilayah {wilayah}</p>
                    </div>
                  </div>
                  {wilayahFilter === wilayah && <Check size={16} className="text-blue-600" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-base text-black">Export Data</h3>
                <button onClick={() => setShowExportModal(false)} className="p-1">
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-3">
                <button
                  onClick={handleExportExcel}
                  className="w-full py-3 bg-green-600 text-white rounded-lg flex items-center justify-center gap-2 text-sm font-medium active:bg-green-700"
                >
                  <FileSpreadsheet size={18} />
                  Export ke Excel
                </button>
              </div>
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
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}