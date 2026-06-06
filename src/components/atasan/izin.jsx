"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Calendar,
  Building2,
  Search,
  FileText,
  Clock3,
  CheckCircle,
  XCircle,
  CalendarDays,
  ChevronRight,
  Check,
  X,
  Home,
  UserCheck,
  ClipboardCheck,
  User,
  Download,
  Loader2,
  Eye,
  Image as ImageIcon,
  File,
  Paperclip,
  ArrowLeft
} from "lucide-react";
import { useIzinData } from "./hooks/izin/useIzinData";
import { useAuth } from "@/context/AuthContext";
import { DateTime } from "luxon";
import Swal from "sweetalert2";
import Link from "next/link";

export default function PersetujuanIzinPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("pending");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIzin, setSelectedIzin] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const itemsPerPage = 5;

  const {
    izinList,
    statistik,
    loading,
    filteredIzin,
    selectedDate,
    selectedStatus,
    selectedJenis,
    tanggalInfo,
    setSelectedDate,
    setSelectedStatus,
    setSelectedJenis,
    setSearch,
    handleUpdateStatus,
    resetFilters,
    goToPreviousDay,
    goToNextDay,
    goToToday
  } = useIzinData();

  // Navigasi kembali ke dashboard
  const goBackToDashboard = () => {
    router.push("/atasan/dashboard");
  };

  // FUNGSI DOWNLOAD DOKUMEN
  const handleDownloadDokumen = async (filename, jenis) => {
    if (!filename) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal!',
        text: 'Nama file tidak ditemukan'
      });
      return;
    }

    try {
      const fileUrl = `https://sikopnas.web.id/uploads/izin/${filename}`;
      const response = await fetch(fileUrl, { method: 'HEAD' });
      
      if (response.ok) {
        window.open(fileUrl, '_blank');
        Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: `${jenis || 'Dokumen'} sedang diunduh`,
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        throw new Error('File tidak ditemukan');
      }
      
    } catch (error) {
      console.error('Download error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Gagal!',
        text: `Gagal mengunduh ${jenis || 'dokumen'}. File mungkin tidak tersedia.`,
        confirmButtonText: 'Tutup',
        confirmButtonColor: '#EF4444'
      });
    }
  };

  // Filter data berdasarkan tab
  const getFilteredByTab = () => {
    if (activeTab === "pending") {
      return izinList.filter(item => item.status === "Pending");
    }
    if (activeTab === "approved") {
      return izinList.filter(item => item.status === "Disetujui");
    }
    if (activeTab === "rejected") {
      return izinList.filter(item => item.status === "Ditolak");
    }
    return izinList;
  };

  const filteredByTab = getFilteredByTab();

  // Pagination
  const totalPages = Math.ceil(filteredByTab.length / itemsPerPage);
  const paginatedData = filteredByTab.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle date change
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setShowDatePicker(false);
  };

  // Format tanggal
  const formatDate = (dateString) => {
    if (!dateString) return "5 Juni 2026";
    const date = new Date(dateString);
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) + 
           ", " + date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + " WIB";
  };

  const getBadge = (jenis) => {
    const colors = {
      "Sakit": "bg-red-100 text-red-700",
      "Izin": "bg-blue-100 text-blue-700",
      "Izin Pribadi": "bg-blue-100 text-blue-700",
      "Cuti Tahunan": "bg-purple-100 text-purple-700",
      "Dinas Luar": "bg-green-100 text-green-700"
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[jenis] || "bg-gray-100 text-gray-700"}`}>
        {jenis}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const colors = {
      "Pending": "bg-yellow-100 text-yellow-700",
      "Disetujui": "bg-green-100 text-green-700",
      "Ditolak": "bg-red-100 text-red-700",
      "Dibatalkan": "bg-gray-100 text-gray-700"
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-700"}`}>
        {status}
      </span>
    );
  };

  // Get lampiran dari izin
  const getLampiran = (izin) => {
    const attachments = [];
    
    if (izin.lampiran) attachments.push({ file: izin.lampiran, jenis: "Lampiran" });
    if (izin.foto) attachments.push({ file: izin.foto, jenis: "Foto" });
    if (izin.dokumen) attachments.push({ file: izin.dokumen, jenis: "Dokumen" });
    if (izin.surat_dokter) attachments.push({ file: izin.surat_dokter, jenis: "Surat Dokter" });
    if (izin.bukti) attachments.push({ file: izin.bukti, jenis: "Bukti" });
    if (izin.dokumen_pendukung) attachments.push({ file: izin.dokumen_pendukung, jenis: "Dokumen Pendukung" });
    
    if (izin.attachments && Array.isArray(izin.attachments)) {
      izin.attachments.forEach(att => {
        attachments.push({ file: att, jenis: "Lampiran" });
      });
    }
    
    return attachments;
  };

  const hasLampiran = (izin) => {
    return getLampiran(izin).length > 0;
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      {/* HEADER */}
      <div className="bg-gradient-to-b from-blue-900 to-blue-800 pb-20">
        <div className="max-w-7xl mx-auto px-4 pt-6">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <button 
                onClick={goBackToDashboard}
                className="hover:opacity-80 transition-opacity cursor-pointer"
              >
                <ArrowLeft size={22} className="text-white" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Persetujuan Izin
                </h1>
                <p className="text-blue-100 text-sm">
                  Tinjau dan setujui pengajuan izin pegawai
                </p>
              </div>
            </div>
          </div>

          {/* FILTER */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
            <div className="relative">
              <div 
                className="border border-white/30 rounded-xl px-3 h-10 flex items-center text-white cursor-pointer hover:bg-white/10 transition text-sm"
                onClick={() => setShowDatePicker(!showDatePicker)}
              >
                <Calendar size={16} className="text-white mr-2" />
                <button onClick={(e) => { e.stopPropagation(); goToPreviousDay(); }} className="px-1 text-white hover:text-blue-200 text-sm">◀</button>
                <span className="flex-1 text-center text-white text-sm">{formatDate(selectedDate)}</span>
                <button onClick={(e) => { e.stopPropagation(); goToNextDay(); }} className="px-1 text-white hover:text-blue-200 text-sm">▶</button>
              </div>
              
              {showDatePicker && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 p-3 z-20">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 text-sm"
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => { goToToday(); setShowDatePicker(false); }}
                      className="flex-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      Hari Ini
                    </button>
                    <button
                      onClick={() => setShowDatePicker(false)}
                      className="flex-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              )}
            </div>

            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-white/30 rounded-xl px-3 h-10 bg-transparent text-white outline-none text-sm"
            >
              <option value="" className="text-gray-800">Semua Status</option>
              <option value="Pending" className="text-gray-800">Pending</option>
              <option value="Disetujui" className="text-gray-800">Disetujui</option>
              <option value="Ditolak" className="text-gray-800">Ditolak</option>
            </select>

            <div className="border border-white/30 rounded-xl px-3 flex items-center h-10">
              <Search size={16} className="text-white mr-2" />
              <input
                placeholder="Cari pegawai..."
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent outline-none text-white placeholder:text-white/60 w-full text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-12">
        {/* STATISTIC */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-4">
            <StatCard
              icon={<FileText className="text-blue-600" />}
              value={statistik.total_pengajuan || 0}
              title="Total Pengajuan"
              color="text-blue-600"
            />
            <StatCard
              icon={<Clock3 className="text-yellow-600" />}
              value={statistik.pending || 0}
              title="Menunggu"
              color="text-yellow-600"
            />
            <StatCard
              icon={<CheckCircle className="text-green-600" />}
              value={statistik.disetujui || 0}
              title="Disetujui"
              color="text-green-600"
            />
            <StatCard
              icon={<XCircle className="text-red-600" />}
              value={statistik.ditolak || 0}
              title="Ditolak"
              color="text-red-600"
            />
          </div>
        </div>

        {/* TAB */}
        <div className="bg-white rounded-2xl shadow-lg mt-4 overflow-hidden">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            <TabButton
              active={activeTab === "pending"}
              label={`Menunggu (${statistik.pending || 0})`}
              onClick={() => { setActiveTab("pending"); setCurrentPage(1); }}
            />
            <TabButton
              active={activeTab === "approved"}
              label={`Disetujui (${statistik.disetujui || 0})`}
              onClick={() => { setActiveTab("approved"); setCurrentPage(1); }}
            />
            <TabButton
              active={activeTab === "rejected"}
              label={`Ditolak (${statistik.ditolak || 0})`}
              onClick={() => { setActiveTab("rejected"); setCurrentPage(1); }}
            />
          </div>

          {/* LOADING STATE */}
          {loading && (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
              <p className="text-gray-500">Memuat data izin...</p>
            </div>
          )}

          {/* LIST */}
          {!loading && (
            <div>
              {paginatedData.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Tidak ada data pengajuan izin</p>
                </div>
              ) : (
                paginatedData.map((item) => (
                  <div 
                    key={item.id} 
                    className="border-b border-gray-100 p-4 hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => {
                      setSelectedIzin(item);
                      setShowDetailModal(true);
                    }}
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* USER */}
                      <div className="flex gap-3 flex-1">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <User className="text-blue-600" size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-base text-gray-800 truncate">
                            {item.nama_pegawai || item.nama || "Pegawai"}
                          </h3>
                          <p className="text-gray-500 text-xs truncate">
                            {item.jabatan || "Staff"}
                          </p>
                          <div className="mt-1">
                            {getBadge(item.jenis)}
                          </div>
                        </div>
                      </div>

                      {/* TANGGAL & ALASAN */}
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-gray-800">
                          {item.tanggal_mulai && item.tanggal_selesai ? 
                            `${formatDate(item.tanggal_mulai)} - ${formatDate(item.tanggal_selesai)}` : 
                            formatDate(item.tanggal_mulai)
                          }
                        </p>
                        <p className="text-gray-500 text-xs">
                          {item.durasi || `${item.jumlah_hari || 1} Hari`}
                        </p>
                        <p className="text-gray-500 text-xs mt-1 line-clamp-1">
                          {item.keterangan || item.alasan || "-"}
                        </p>
                      </div>

                      {/* DIAJUKAN & STATUS */}
                      <div className="flex items-center justify-between md:block">
                        <div>
                          <p className="text-xs text-gray-500 hidden md:block">Diajukan</p>
                          <p className="text-xs text-gray-600">
                            {formatDateTime(item.created_at)}
                          </p>
                          <div className="mt-1">
                            {getStatusBadge(item.status)}
                          </div>
                        </div>
                      </div>

                      {/* ACTION Buttons */}
                      {item.status === "Pending" && (
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateStatus(item.id, "Disetujui");
                            }}
                            className="flex-1 border border-green-300 text-green-600 rounded-lg py-2 px-3 text-sm font-medium flex items-center justify-center gap-1 hover:bg-green-50 transition"
                          >
                            <Check size={14} />
                            Setujui
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateStatus(item.id, "Ditolak");
                            }}
                            className="flex-1 border border-red-300 text-red-600 rounded-lg py-2 px-3 text-sm font-medium flex items-center justify-center gap-1 hover:bg-red-50 transition"
                          >
                            <X size={14} />
                            Tolak
                          </button>
                        </div>
                      )}

                      {(item.status === "Disetujui" || item.status === "Ditolak") && (
                        <div className="text-right md:text-left">
                          <span className={`text-xs font-medium ${item.status === "Disetujui" ? "text-green-600" : "text-red-600"}`}>
                            {item.status === "Disetujui" ? "✓ Disetujui" : "✗ Ditolak"}
                          </span>
                        </div>
                      )}

                      <ChevronRight size={16} className="text-gray-400 flex-shrink-0 hidden md:block" />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="p-4 flex flex-wrap gap-3 justify-between items-center border-t border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-xs">Halaman</span>
                <div className="flex gap-1">
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="w-8 h-8 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition text-gray-700 text-sm"
                  >
                    &lt;
                  </button>
                  {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-lg transition text-sm ${
                          currentPage === pageNum
                            ? "bg-blue-600 text-white"
                            : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="w-8 h-8 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition text-gray-700 text-sm"
                  >
                    &gt;
                  </button>
                </div>
              </div>
              <button className="border border-green-300 rounded-xl px-3 py-2 flex items-center gap-2 text-green-700 hover:bg-green-50 transition text-sm">
                <Download size={14} />
                Export Excel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* DETAIL MODAL */}
      {showDetailModal && selectedIzin && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header Modal - dengan status badge di kanan */}
            <div className="flex justify-between items-center p-5 border-b border-gray-100 sticky top-0 bg-white">
              <div>
                <h2 className="font-bold text-lg text-gray-800">
                  Detail Pengajuan Izin
                </h2>
                <p className="text-xs text-gray-500">
                  {selectedIzin.nama_pegawai || selectedIzin.nama || "Pegawai"}
                </p>
              </div>
              
              {/* Container untuk Status Badge dan Tombol Close */}
              <div className="flex items-center gap-3">
                {/* Status Badge di sini */}
                <div>
                  {getStatusBadge(selectedIzin.status)}
                </div>
                
                {/* Tombol Close */}
                <button 
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedIzin(null);
                  }} 
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <X size={18} className="text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Informasi Pegawai */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-800 mb-3 text-sm flex items-center gap-2">
                  <User size={14} /> Informasi Pegawai
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-gray-500">Nama Lengkap</p>
                    <p className="font-medium text-gray-800">{selectedIzin.nama_pegawai || selectedIzin.nama || "-"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Jabatan</p>
                    <p className="text-gray-800">{selectedIzin.jabatan || "-"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Wilayah</p>
                    <p className="text-gray-800">{selectedIzin.wilayah_penugasan || "-"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Jenis Izin</p>
                    <div>{getBadge(selectedIzin.jenis)}</div>
                  </div>
                </div>
              </div>

              {/* Detail Izin */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-800 mb-3 text-sm flex items-center gap-2">
                  <Calendar size={14} /> Detail Izin
                </h3>
                <div className="space-y-2 text-xs">
                  <div>
                    <p className="text-gray-500">Tanggal Izin</p>
                    <p className="font-medium text-gray-800 text-sm">
                      {selectedIzin.tanggal_mulai && selectedIzin.tanggal_selesai ? 
                        `${formatDate(selectedIzin.tanggal_mulai)} - ${formatDate(selectedIzin.tanggal_selesai)}` : 
                        formatDate(selectedIzin.tanggal_mulai)
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Durasi</p>
                    <p className="text-gray-800">{selectedIzin.durasi || `${selectedIzin.jumlah_hari || 1} Hari`}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Alasan / Keterangan</p>
                    <p className="text-gray-800 bg-white p-3 rounded-lg mt-1 text-xs border border-gray-100">
                      {selectedIzin.keterangan || selectedIzin.alasan || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Tanggal Pengajuan</p>
                    <p className="text-gray-800 text-xs">{formatDateTime(selectedIzin.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Lampiran */}
              {hasLampiran(selectedIzin) && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-800 mb-3 text-sm flex items-center gap-2">
                    <Paperclip size={14} /> Lampiran ({getLampiran(selectedIzin).length})
                  </h3>
                  <div className="space-y-2">
                    {getLampiran(selectedIzin).map((lampiran, idx) => {
                      const isImage = lampiran.file.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
                      return (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                          <div className="flex items-center gap-2">
                            {isImage ? 
                              <ImageIcon size={16} className="text-blue-500" /> : 
                              <File size={16} className="text-gray-500" />
                            }
                            <span className="text-xs text-gray-700">
                              {lampiran.jenis || (isImage ? `Foto ${idx + 1}` : `Dokumen ${idx + 1}`)}
                            </span>
                          </div>
                          {isImage ? (
                            <button 
                              onClick={() => setSelectedImage(lampiran.file)} 
                              className="px-2 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-1"
                            >
                              <Eye size={12} /> Lihat
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleDownloadDokumen(lampiran.file, lampiran.jenis)} 
                              className="px-2 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-1"
                            >
                              <Download size={12} /> Download
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tombol Aksi untuk Pending */}
              {selectedIzin.status === "Pending" && (
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button 
                    onClick={() => {
                      handleUpdateStatus(selectedIzin.id, "Disetujui");
                      setShowDetailModal(false);
                    }} 
                    className="flex-1 bg-green-600 text-white py-2.5 rounded-xl font-medium hover:bg-green-700 transition flex items-center justify-center gap-2 text-sm"
                  >
                    <Check size={16} /> Setujui Izin
                  </button>
                  <button 
                    onClick={() => {
                      handleUpdateStatus(selectedIzin.id, "Ditolak");
                      setShowDetailModal(false);
                    }} 
                    className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-medium hover:bg-red-700 transition flex items-center justify-center gap-2 text-sm"
                  >
                    <X size={16} /> Tolak Izin
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* IMAGE VIEWER MODAL */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full">
            <button onClick={() => setSelectedImage(null)} className="absolute -top-10 right-0 text-white hover:text-gray-300 transition">
              <X size={24} className="text-white" />
            </button>
            <img src={selectedImage} alt="Lampiran Izin" className="w-full h-auto rounded-lg max-h-[70vh] object-contain" />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
              <a href={selectedImage} download className="px-3 py-2 bg-blue-600 text-white rounded-xl flex items-center gap-2 hover:bg-blue-700 transition text-sm">
                <Download size={14} /> Download Gambar
              </a>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}

function StatCard({ icon, value, title, color }) {
  return (
    <div className="p-4 text-center border-r border-gray-100 last:border-r-0">
      <div className="w-12 h-12 rounded-full bg-gray-100 mx-auto flex items-center justify-center mb-2">
        {icon}
      </div>
      <h2 className={`text-2xl font-bold ${color}`}>{value}</h2>
      <p className="text-gray-500 mt-1 text-xs">{title}</p>
    </div>
  );
}

function TabButton({ active, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 whitespace-nowrap font-medium transition text-sm ${
        active ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-700 border-b-2 border-transparent"
      }`}
    >
      {label}
    </button>
  );
}

// Komponen NavItem yang diperbaiki
function NavItem({ icon, label, href, active, badge }) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center py-3 relative transition ${
        active ? "text-blue-600" : "text-gray-500 hover:text-blue-500"
      }`}
    >
      {badge > 0 && (
        <span className="absolute top-1 right-6 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
          {badge}
        </span>
      )}
      {icon}
      <span className="text-xs mt-1">{label}</span>
    </Link>
  );
}