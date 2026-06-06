"use client";

import { useState, useEffect } from "react";
import {
  LogIn,
  LogOut,
  ClipboardList,
  Calendar,
  BookOpen,
  Clock,
  MapPin,
  BarChart3
} from "lucide-react";
import { useRouter } from "next/navigation";

// Components
import UserHeader from "@/components/pegawai/dashboard/UserHeader";
import PresenceCamera from "@/components/pegawai/dashboard/PresenceCamera";
import ActionButton from "@/components/pegawai/dashboard/ActionButton";
import StatusBadge from "@/components/pegawai/dashboard/StatusBadge";
import BottomNavigation from "@/components/pegawai/dashboard/BottomNavigation";
import { LocationCheckModal } from "@/components/pegawai/dashboard/LocationCheckModal";

// Hooks
import { useUser } from "@/components/pegawai/dashboard/hooks/useUser";
import { usePresensi } from "@/components/pegawai/dashboard/hooks/usePresensi";

// Utils
import { formatDate, formatTime } from "@/components/pegawai/dashboard/utils/date";

export default function PresensiPage() {
  const router = useRouter();
  
  // Custom hooks
  const { user, loading: loadingUser } = useUser();
  const { 
    presensiHariIni, 
    penugasanAktif, 
    submitPresensi, 
    getStatusKehadiran, 
    refreshPresensi 
  } = usePresensi(user);
  
  // Local state
  const [currentTime, setCurrentTime] = useState("");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [currentType, setCurrentType] = useState(null);
  const [verifiedLocation, setVerifiedLocation] = useState(null);
  const [foto, setFoto] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Waktu realtime
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(formatTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenCamera = (type) => {
    if (!user) {
      alert("User tidak ditemukan. Silakan login kembali.");
      router.push('/login');
      return;
    }
    
    setCurrentType(type);
    setVerifiedLocation(null);
    setShowLocationModal(true);
  };

  const handleLocationValid = (location) => {
    setVerifiedLocation(location);
    setShowLocationModal(false);
    setShowCamera(true);
  };

  const handleCapture = (capturedFoto) => {
    setFoto(capturedFoto);
  };

  const handleSubmit = async () => {
    if (!foto) {
      alert("Foto belum diambil!");
      return;
    }

    if (!verifiedLocation) {
      alert("Lokasi belum diverifikasi!");
      return;
    }

    if (!user) {
      alert("User tidak ditemukan!");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        [`foto_${currentType}`]: foto,
        [`latitude_${currentType}`]: verifiedLocation.lat,
        [`longitude_${currentType}`]: verifiedLocation.lon,
      };

      const result = await submitPresensi(currentType, payload);
      
      if (result.success) {
        alert(`Absen ${currentType === "masuk" ? "masuk" : "pulang"} berhasil`);
        setShowCamera(false);
        setFoto(null);
        setVerifiedLocation(null);
        await refreshPresensi();
      } else {
        alert(`Gagal absen: ${result.error}`);
      }
    } catch (error) {
      console.error("Error submit presensi:", error);
      alert("Terjadi kesalahan saat melakukan absen");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseCamera = () => {
    setShowCamera(false);
    setFoto(null);
    setCurrentType(null);
    setVerifiedLocation(null);
  };

  // Loading state
  if (loadingUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">User tidak ditemukan</p>
          <button 
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Login Kembali
          </button>
        </div>
      </div>
    );
  }

  const today = formatDate();
  const statusKehadiran = getStatusKehadiran();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center font-sans relative pb-20">
      <UserHeader user={user} />

      {/* Card Presensi */}
      <div className="bg-white shadow-lg rounded-xl p-6 w-[90%] absolute top-36 border border-slate-200">
        <div className="text-center mb-4">
          <h3 className="text-slate-700 font-semibold text-lg">{today}</h3>
          <p className="text-sm text-slate-500">{currentTime} WIB</p>
        </div>

        <div className="flex justify-between bg-slate-50 rounded-lg px-6 py-4 border border-slate-200">
          <div className="flex flex-col items-center w-1/2 border-r border-slate-300">
            <span className="text-sm text-slate-500 mb-1">Check In</span>
            <span className="font-bold text-xl text-blue-600">
              {presensiHariIni.masuk || "-- : --"}
            </span>
          </div>
          <div className="flex flex-col items-center w-1/2">
            <span className="text-sm text-slate-500 mb-1">Check Out</span>
            <span className="font-bold text-xl text-green-600">
              {presensiHariIni.pulang || "-- : --"}
            </span>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <StatusBadge status={statusKehadiran} />
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="mt-48 w-[90%] mb-8">
        <h3 className="text-slate-700 font-semibold text-lg mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4">
          <ActionButton
            onClick={() => handleOpenCamera("masuk")}
            icon={<LogIn className="w-5 h-5" />}
            label="Check In"
            color="from-blue-500 to-blue-600"
            disabled={!!presensiHariIni.masuk}
          />
          <ActionButton
            onClick={() => handleOpenCamera("pulang")}
            icon={<LogOut className="w-5 h-5" />}
            label="Check Out"
            color="from-green-500 to-green-600"
            disabled={!presensiHariIni.masuk || !!presensiHariIni.pulang}
          />
          <ActionButton
            onClick={() => router.push("/pegawai/perizinan")}
            icon={<ClipboardList className="w-5 h-5" />}
            label="Perizinan"
            color="from-purple-500 to-purple-600"
          />
          <ActionButton
            onClick={() => router.push("/pegawai/detailpresensi")}
            icon={<Calendar className="w-5 h-5" />}
            label="Riwayat Kehadiran"
            color="from-indigo-500 to-indigo-600"
          />
          <ActionButton
            onClick={() => router.push("/pegawai/pekerjaanharian")}
            icon={<BookOpen className="w-5 h-5" />}
            label="Laporan Kerja Harian"
            color="from-teal-500 to-teal-600"
          />
          <ActionButton
            onClick={() => router.push("/pegawai/rekap")}
            icon={<BarChart3 className="w-5 h-5" />}
            label="Rekap Pegawai"
            color="from-orange-500 to-orange-600"
          />
        </div>
      </div>

      {/* Today's Summary */}
      <div className="w-[90%] mb-4">
        <h4 className="text-slate-700 font-semibold mb-3">Ringkasan Hari Ini</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-xs text-slate-500">Status</div>
                <div className="font-semibold text-slate-700 text-sm">
                  {statusKehadiran}
                </div>
              </div>
            </div>
          </div>
          
          {/* Lokasi terakhir jika sudah absen */}
          {presensiHariIni.masuk && (
            <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-xs text-slate-500">Lokasi Absen</div>
                  <div className="font-semibold text-slate-700 text-xs truncate max-w-[120px]">
                    {presensiHariIni.lokasi_masuk || "Tersimpan"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <BottomNavigation />

      {/* Location Check Modal - Info Penugasan ada di dalam modal ini */}
      <LocationCheckModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationValid={handleLocationValid}
        penugasan={penugasanAktif}
        type={currentType}
      />

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md relative">
            <PresenceCamera
              isOpen={showCamera}
              onCapture={handleCapture}
              onClose={handleCloseCamera}
              type={currentType}
              isSubmitting={isSubmitting}
              locationData={{
                user: user,
                coords: verifiedLocation
              }}
            />
            
            {foto && verifiedLocation && (
              <div className="px-6 pb-6">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg text-sm font-medium shadow-md transition-all disabled:from-slate-400 disabled:to-slate-500"
                >
                  {isSubmitting ? "Memproses..." : `Konfirmasi ${currentType === "masuk" ? "Check In" : "Check Out"}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}