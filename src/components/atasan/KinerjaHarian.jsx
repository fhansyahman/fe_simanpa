"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Filter,
  Search,
  Calendar,
  Building2,
  FileText,
  CheckCircle,
  ChevronRight,
  Check,
  Download,
  Home,
  ClipboardCheck,
  UserCheck,
  User,
  Loader2,
  X,
  Eye,
  ChevronLeft,
  FileOutput,
  Ruler,
  MapPin,
  Activity
} from "lucide-react";
import { useKinerjaData } from "./hooks/kinerjaharian/useKinerjaData";
import { useAuth } from "@/context/AuthContext";
import { useDownloadHandler } from "./hooks/kinerjaharian/useDownloadHandler";
import { DownloadModal } from "./hooks/kinerjaharian/downloadModal";

export default function LaporanKerjaPegawai() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLaporan, setSelectedLaporan] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentImageList, setCurrentImageList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [selectedDownloadType, setSelectedDownloadType] = useState(null);
  const [selectedKinerjaForDownload, setSelectedKinerjaForDownload] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const itemsPerPage = 5;

  const {
    kinerjaList,
    loading,
    selectedDate,
    setSelectedDate
  } = useKinerjaData();

  const {
    isGeneratingPDF,
    generatingProgress,
    handleDownloadAllPerorangan,
    handleShowDownloadRekap,
    handleShowDownloadPerorangan
  } = useDownloadHandler(kinerjaList, setShowDownloadModal, setSelectedDownloadType, setSelectedKinerjaForDownload);

  const formatDateShort = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return "-";
    }
  };

  const getImageList = (kinerja) => {
    const images = [];
    if (kinerja?.sket_image) images.push(kinerja.sket_image);
    if (kinerja?.foto_0) images.push(kinerja.foto_0);
    if (kinerja?.foto_50) images.push(kinerja.foto_50);
    if (kinerja?.foto_100) images.push(kinerja.foto_100);
    return images;
  };

  const openImageViewer = (imageUrl, images, index) => {
    setSelectedImage(imageUrl);
    setCurrentImageIndex(index);
    setCurrentImageList(images);
  };

  const closeImageViewer = () => {
    setSelectedImage(null);
    setCurrentImageList([]);
  };

  const nextImage = () => {
    if (currentImageList.length > 0) {
      const nextIndex = (currentImageIndex + 1) % currentImageList.length;
      setSelectedImage(currentImageList[nextIndex]);
      setCurrentImageIndex(nextIndex);
    }
  };

  const prevImage = () => {
    if (currentImageList.length > 0) {
      const prevIndex = (currentImageIndex - 1 + currentImageList.length) % currentImageList.length;
      setSelectedImage(currentImageList[prevIndex]);
      setCurrentImageIndex(prevIndex);
    }
  };

  const downloadImage = async (imageUrl) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dokumentasi-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Gagal mendownload gambar');
    }
  };

  const filteredData = kinerjaList.filter(item => {
    if (searchQuery && !item.nama?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const statsLaporan = {
    total: kinerjaList.length,
    sudah: kinerjaList.filter(i => i.kegiatan || i.panjang_kr || i.panjang_kn || i.created_at).length
  };

  const formatDate = (dateString) => {
    if (!dateString) return "5 Juni 2026";
    const date = new Date(dateString);
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${date.getHours().toString().padStart(2, '0')}.${date.getMinutes().toString().padStart(2, '0')} WIB`;
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setShowDatePicker(false);
  };

  const goToPreviousDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const goToNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const goBackToDashboard = () => {
    router.push("/atasan/dashboard");
  };

  const StatusBadge = ({ item }) => {
    const isSudahMelapor = item.kegiatan || item.panjang_kr || item.panjang_kn || item.created_at;
    return (
      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
        isSudahMelapor ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
      }`}>
        {isSudahMelapor ? "Sudah Melapor" : "Belum Melapor"}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-24" style={{ backgroundColor: "#f3f4f6" }}>
      <div className="bg-gradient-to-b from-blue-900 to-blue-800 pb-24">
        <div className="max-w-7xl mx-auto px-6 pt-6">
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
                  Laporan Kerja Pegawai
                </h1>
                <p className="text-blue-100 text-sm">
                  Review dan pantau laporan kerja harian pegawai Anda
                </p>
              </div>
            </div>

          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-8">
            <div className="relative">
              <div 
                className="bg-white/10 border border-white/20 rounded-xl h-12 flex items-center px-4 text-white cursor-pointer hover:bg-white/20 transition"
                onClick={() => setShowDatePicker(!showDatePicker)}
              >
                <Calendar size={18} className="text-white mr-2" />
                <button onClick={goToPreviousDay} className="px-2 text-white hover:text-blue-200">◀</button>
                <span className="flex-1 text-center font-medium text-white">{formatDate(selectedDate)}</span>
                <button onClick={goToNextDay} className="px-2 text-white hover:text-blue-200">▶</button>
              </div>
              
              {showDatePicker && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 p-3 z-20">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => {
                        const today = new Date().toISOString().split('T')[0];
                        setSelectedDate(today);
                        setShowDatePicker(false);
                      }}
                      className="flex-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      Hari Ini
                    </button>
                    <button
                      onClick={() => setShowDatePicker(false)}
                      className="flex-1 px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white/10 border border-white/20 rounded-xl h-12 flex items-center px-4">
              <Search size={18} className="text-white mr-2" />
              <input
                placeholder="Cari nama pegawai..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent outline-none text-white placeholder:text-white/60 w-full"
              />
            </div>

            <button 
              onClick={handleShowDownloadRekap}
              disabled={kinerjaList.length === 0}
              className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl h-12 flex items-center justify-center gap-2 text-white hover:from-green-700 hover:to-emerald-700 transition disabled:opacity-50 shadow-md"
            >
              <FileOutput size={18} className="text-white" />
              Download Rekap PDF
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-16">
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-2">
            <StatCard
              icon={<FileText className="text-blue-600" />}
              value={statsLaporan.total}
              label="Total Laporan"
              color="text-blue-600"
            />
            <StatCard
              icon={<CheckCircle className="text-green-600" />}
              value={statsLaporan.sudah}
              label="Sudah Melapor"
              color="text-green-600"
            />
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg mt-6">
          {loading && (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
              <p className="text-gray-500">Memuat laporan...</p>
            </div>
          )}

          {!loading && (
            <div>
              {paginatedData.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Tidak ada laporan</p>
                </div>
              ) : (
                paginatedData.map((pegawai) => (
                  <div
                    key={pegawai.id}
                    onClick={() => setSelectedLaporan(pegawai)}
                    className="flex items-center justify-between p-5 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="text-blue-600" />
                      </div>

                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {pegawai.nama || "Pegawai"}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {pegawai.jabatan || "Staff"}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(pegawai.tanggal || selectedDate)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <StatusBadge item={pegawai} />
                      {(pegawai.kegiatan || pegawai.panjang_kr || pegawai.panjang_kn) && pegawai.created_at && (
                        <p className="text-sm text-gray-500 mt-2">
                          Dikirim {formatTime(pegawai.created_at)}
                        </p>
                      )}
                      {!pegawai.kegiatan && !pegawai.panjang_kr && !pegawai.panjang_kn && (
                        <p className="text-sm text-red-500 mt-2">
                          Belum ada laporan
                        </p>
                      )}
                    </div>

                    <ChevronRight className="text-gray-400" />
                  </div>
                ))
              )}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between p-5 border-t border-gray-100">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-xl disabled:opacity-50 hover:bg-gray-50 transition text-gray-700"
              >
                Sebelumnya
              </button>
              <span className="text-gray-500">
                Halaman {currentPage} dari {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl disabled:opacity-50 hover:bg-blue-700 transition"
              >
                Selanjutnya
              </button>
            </div>
          )}
        </div>

        {selectedLaporan && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white">
                <div>
                  <h2 className="font-bold text-lg text-gray-800">
                    Laporan {selectedLaporan.nama}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {formatDate(selectedLaporan.tanggal || selectedDate)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge item={selectedLaporan} />
                  <button 
                    onClick={() => setSelectedLaporan(null)}
                    className="p-2 hover:bg-gray-100 rounded-full transition"
                  >
                    <X size={20} className="text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-6 bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <h3 className="font-semibold text-gray-800">Informasi Lokasi</h3>
                  </div>
                  <p className="text-gray-700">
                    <span className="font-medium">Ruas Jalan:</span> {selectedLaporan.ruas_jalan || "-"}
                  </p>
                  {selectedLaporan.wilayah_penugasan && (
                    <p className="text-gray-700 mt-1">
                      <span className="font-medium">Wilayah:</span> {selectedLaporan.wilayah_penugasan}
                    </p>
                  )}
                </div>

                <div className="mb-6 bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-4 h-4 text-green-600" />
                    <h3 className="font-semibold text-gray-800">Ringkasan Pekerjaan</h3>
                  </div>
                  {selectedLaporan.kegiatan ? (
                    <ul className="space-y-2 text-gray-700">
                      {selectedLaporan.kegiatan.split('\n').map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-green-500">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 italic">Tidak ada kegiatan yang dilaporkan</p>
                  )}
                </div>

                {(selectedLaporan.panjang_kr > 0 || selectedLaporan.panjang_kn > 0) && (
                  <div className="mb-6 bg-amber-50 rounded-xl p-4 border border-amber-100">
                    <div className="flex items-center gap-2 mb-3">
                      <Ruler className="w-4 h-4 text-amber-600" />
                      <h3 className="font-semibold text-gray-800">Hasil Pengukuran</h3>
                    </div>
                    <div className="flex gap-6">
                      {selectedLaporan.panjang_kr > 0 && (
                        <div>
                          <span className="text-sm text-gray-500">Panjang KR</span>
                          <p className="text-lg font-semibold text-blue-600">{selectedLaporan.panjang_kr} km</p>
                        </div>
                      )}
                      {selectedLaporan.panjang_kn > 0 && (
                        <div>
                          <span className="text-sm text-gray-500">Panjang KN</span>
                          <p className="text-lg font-semibold text-orange-600">{selectedLaporan.panjang_kn} km</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(() => {
                  const images = getImageList(selectedLaporan);
                  if (images.length > 0) {
                    return (
                      <div className="mb-6">
                        <h3 className="font-semibold mb-3 text-lg text-gray-800">
                          Lampiran ({images.length})
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {images.map((img, idx) => (
                            <div
                              key={idx}
                              onClick={() => openImageViewer(img, images, idx)}
                              className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition group"
                            >
                              <img
                                src={img}
                                alt={`Dokumentasi ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                                <Eye className="text-white opacity-0 group-hover:opacity-100 transition" size={24} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                <div className="mt-6 pt-4 border-t border-gray-100">
                  <button 
                    onClick={() => {
                      setSelectedLaporan(null);
                      handleShowDownloadPerorangan(selectedLaporan);
                    }}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl py-3 flex justify-center gap-2 hover:from-green-700 hover:to-emerald-700 transition shadow-md"
                  >
                    Download Laporan Perorangan (PDF)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center">
          <div className="relative max-w-5xl w-full mx-4">
            <button
              onClick={closeImageViewer}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition"
            >
              <X size={28} className="text-white" />
            </button>

            <img
              src={selectedImage}
              alt="Preview"
              className="w-full h-auto rounded-lg max-h-[80vh] object-contain"
            />

            {currentImageList.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
                >
                  <ChevronLeft size={24} className="text-white" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
                >
                  <ChevronRight size={24} className="text-white" />
                </button>
              </>
            )}

            {currentImageList.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                {currentImageIndex + 1} / {currentImageList.length}
              </div>
            )}

            <button
              onClick={() => downloadImage(selectedImage)}
              className="absolute -bottom-12 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition"
            >
              <Download size={18} className="text-white" />
              Download Gambar
            </button>
          </div>
        </div>
      )}

      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        type={selectedDownloadType}
        data={selectedDownloadType === 'perorangan' ? selectedKinerjaForDownload : kinerjaList}
        wilayah={user?.wilayah_penugasan}
        tanggal={selectedDate}
        formatDateShort={formatDateShort}
      />


    </div>
  );
}

function StatCard({ icon, value, label, color }) {
  return (
    <div className="p-6 flex items-center gap-4">
      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h3 className={`text-3xl font-bold ${color}`}>
          {value}
        </h3>
        <p className="text-sm text-gray-500">
          {label}
        </p>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active }) {
  return (
    <button
      className={`flex flex-col items-center py-3 transition ${
        active ? "text-blue-600" : "text-gray-500"
      }`}
    >
      {icon}
      <span className="text-xs mt-1">
        {label}
      </span>
    </button>
  );
}