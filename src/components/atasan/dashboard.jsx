"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Home,
  Calendar,
  FileText,
  User,
  Users,
  Eye,
  ClipboardList,
  BarChart3,
  TrendingUp,
  ChevronRight,
  Bell,
  Clock,
  UserX,
  LogIn,
  CircleX,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Stethoscope,
  Umbrella,
  Briefcase,
  ArrowLeft,
  Menu,
  LogOut,
  Settings,
  HelpCircle,
  ChevronDown,
  LayoutDashboard,
  History,
  FileCheck,
  PieChart,
  Mail,
  Phone,
  MapPin,
  Award,
  Clock as ClockIcon,
  Calendar as CalendarIcon
} from "lucide-react";
import { useMonitoringData } from "./hooks/dashboard/useMonitoringData";
import { useKinerjaData } from "./hooks/dashboards/useKinerjaData";
import { useAuth } from "@/context/AuthContext";

export default function DashboardAtasanPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("beranda");
  const [showAllBelumAbsen, setShowAllBelumAbsen] = useState(false);
  const [showAllIzin, setShowAllIzin] = useState(false);
  const [showAllSakit, setShowAllSakit] = useState(false);
  const [showAllCuti, setShowAllCuti] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Ambil data user dari AuthContext
  const { user, loading: authLoading, logout } = useAuth();
  
  // Gunakan hooks untuk data riil
  const {
    selectedDate,
    stats,
    loading: monitoringLoading,
    lastUpdated,
    filteredByWilayah,
    userWilayah,
    isAtasan,
    isAdmin,
    dataBelumAbsen,
    dataBelumLapor,
    dataIzin,
    dataSakit,
    dataCuti,
    handleDateChange,
    refreshData,
    handleExportData
  } = useMonitoringData();
  
  // Gunakan hook untuk data kinerja (laporan terbaru)
  const {
    kinerjaList,
    loading: kinerjaLoading,
    selectedDate: kinerjaDate,
    setSelectedDate: setKinerjaDate
  } = useKinerjaData();

  // Sinkronkan tanggal antara monitoring dan kinerja
  useEffect(() => {
    if (selectedDate !== kinerjaDate) {
      setKinerjaDate(selectedDate);
    }
  }, [selectedDate, kinerjaDate, setKinerjaDate]);

  // Format tanggal manual
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    
    const date = new Date(dateString);
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${dayName}, ${day} ${month} ${year}`;
  };

  // Format waktu
  const formatTime = (timeString) => {
    if (!timeString) return "";
    const date = new Date(timeString);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  // Ambil nama user yang login dari context
  const getUserName = () => {
    if (!user) return "User";
    return user.nama_lengkap || user.nama || user.fullName || user.username || "User";
  };

  // Ambil role user yang login
  const getUserRole = () => {
    if (!user) return "";
    
    const roles = user.roles || [];
    
    if (roles.includes('atasan') || roles.includes('supervisor')) {
      return `Atasan${filteredByWilayah ? ` - ${userWilayah}` : ''}`;
    }
    if (roles.includes('admin') || roles.includes('superadmin')) {
      return "Administrator";
    }
    
    return user.jabatan || user.role || "Pegawai";
  };

  // Ambil inisial untuk avatar
  const getUserInitial = () => {
    const name = getUserName();
    if (name === "User") return "U";
    return name.charAt(0).toUpperCase();
  };

  // Ambil email user
  const getUserEmail = () => {
    if (!user) return "email@example.com";
    return user.email || user.username || "user@example.com";
  };

  // Ambil wilayah user
  const getUserWilayah = () => {
    if (filteredByWilayah && userWilayah) return userWilayah;
    return user?.wilayah_penugasan || "Semua Wilayah";
  };

  // Fungsi Logout
  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("❌ Error saat logout:", error);
      localStorage.clear();
      sessionStorage.clear();
      router.push("/login");
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  // Data untuk menu utama dengan href
  const menuUtama = [
    {
      icon: Eye,
      title: "Monitoring Kehadiran",
      desc: "Pantau kehadiran pegawai",
      color: "bg-blue-500",
      href: "/atasan/riwayatkehadiran"
    },
    {
      icon: ClipboardList,
      title: "Rekap Kehadiran",
      desc: "List kehadiran pegawai",
      color: "bg-yellow-500",
      href: "/atasan/rekapkehadiran"
    },
    {
      icon: ClipboardList,
      title: "Persetujuan Perizinan",
      desc: "Tinjau pengajuan izin",
      color: "bg-purple-500",
      href: "/atasan/izinataucuti"
    },
    {
      icon: FileText,
      title: "Laporan Kerja",
      desc: "Review laporan harian",
      color: "bg-green-500",
      href: "/atasan/riwayathasilkerja"
    },
    {
      icon: BarChart3,
      title: "Grafik Kehadiran",
      desc: "Lihat Grafik kehadiran",
      color: "bg-orange-500",
      href: "/atasan/grafikkehadiran"
    },
    {
      icon: BarChart3,
      title: "Grafik Kinerja",
      desc: "Lihat Grafik Kinerja",
      color: "bg-pink-500",
      href: "/atasan/grafikkinerja"
    },
  ];

  // Ambil 3 laporan terbaru dari data kinerja
  const laporanTerbaru = kinerjaList.slice(0, 3).map(item => ({
    id: item.id,
    nama: item.nama || item.pegawai_nama || "Pegawai",
    tanggal: formatDate(item.tanggal || selectedDate),
    status: item.status || (item.panjang_kr || item.panjang_kn ? "Sudah Dikirim" : "Menunggu Review"),
    waktu: formatTime(item.created_at || item.updated_at),
    kegiatan: item.kegiatan || "-",
    ruas_jalan: item.ruas_jalan || "-"
  }));

  // Tampilkan data belum absen (limit 5 jika tidak show all)
  const displayedBelumAbsen = showAllBelumAbsen ? dataBelumAbsen : dataBelumAbsen.slice(0, 3);
  
  // Tampilkan data izin (limit 5 jika tidak show all)
  const displayedIzin = showAllIzin ? dataIzin : dataIzin.slice(0, 3);
  
  // Tampilkan data sakit (limit 5 jika tidak show all)
  const displayedSakit = showAllSakit ? dataSakit : dataSakit.slice(0, 3);
  
  // Tampilkan data cuti (limit 5 jika tidak show all)
  const displayedCuti = showAllCuti ? dataCuti : dataCuti.slice(0, 3);

  // Loading state
  if (authLoading || (monitoringLoading.data && !stats.totalPegawai)) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center px-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-600 text-sm">Memuat data dashboard...</p>
        </div>
      </div>
    );
  }

  // Jika belum login, redirect atau tampilkan pesan
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center px-4">
          <UserX className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-gray-600 text-sm">Silakan login terlebih dahulu</p>
        </div>
      </div>
    );
  }

  // Konten untuk tab Akun
  const renderAkunContent = () => (
    <div className="min-h-screen bg-gray-100 pb-20">
      {/* Header Profil */}
      <div className="bg-gradient-to-b from-blue-900 to-blue-800 text-white px-4 pt-8 pb-12">
        <div className="text-center">
          {/* Avatar besar */}
          <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg mx-auto mb-4 border-4 border-white/30">
            <span className="text-white text-3xl font-bold">
              {getUserInitial()}
            </span>
          </div>
          
          <h1 className="text-xl font-bold text-white">
            {getUserName()}
          </h1>
          <p className="text-blue-100 text-sm mt-1">
            {getUserRole()}
          </p>
          {filteredByWilayah && userWilayah && (
            <p className="text-blue-200 text-xs mt-1">
              Wilayah: {userWilayah}
            </p>
          )}
        </div>
      </div>

      {/* Informasi Detail Profil */}
      <div className="px-4 -mt-6">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Informasi Kontak */}
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
              <Mail size={16} className="text-blue-500" />
              Informasi Kontak
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm text-gray-800">{getUserEmail()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">No. Telepon</p>
                  <p className="text-sm text-gray-800">{user?.no_telepon || user?.phone || "-"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Wilayah Penugasan</p>
                  <p className="text-sm text-gray-800">{getUserWilayah()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Statistik Singkat */}
          <div className="p-4 border-b border-gray-100 bg-blue-50/30">
            <h2 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
              <Award size={16} className="text-yellow-500" />
              Statistik Singkat
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="bg-green-100 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-1">
                  <Users size={16} className="text-green-600" />
                </div>
                <p className="text-lg font-bold text-gray-800">{stats.totalPegawai || 0}</p>
                <p className="text-[10px] text-gray-500">Total Pegawai</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-1">
                  <CalendarIcon size={16} className="text-blue-600" />
                </div>
                <p className="text-lg font-bold text-gray-800">{stats.hadir || 0}</p>
                <p className="text-[10px] text-gray-500">Hadir Hari Ini</p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-1">
                  <FileText size={16} className="text-purple-600" />
                </div>
                <p className="text-lg font-bold text-gray-800">{kinerjaList.length || 0}</p>
                <p className="text-[10px] text-gray-500">Laporan Bulan Ini</p>
              </div>
            </div>
          </div>

          {/* Menu Aplikasi */}
          <div className="p-4">
            <h2 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
              <LayoutDashboard size={16} className="text-gray-500" />
              Menu Aplikasi
            </h2>
            <div className="space-y-1">
              {menuUtama.slice(0, 4).map((item, index) => (
                <Link href={item.href} key={index}>
                  <div className="flex items-center justify-between py-2.5 px-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center`}>
                        <item.icon size={14} className="text-white" />
                      </div>
                      <span className="text-sm text-gray-700">{item.title}</span>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Tombol Logout */}
          <div className="p-4 pt-0 pb-6">
            <button
              onClick={() => setShowLogoutModal(true)}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut size={18} />
              Logout
            </button>
            
            <p className="text-center text-[10px] text-gray-400 mt-4">
              Versi Aplikasi 1.0.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Konten untuk tab Beranda
  const renderBerandaContent = () => (
    <>
      {/* RINGKASAN - Compact untuk HP */}
      <div className="px-4 -mt-12 relative z-10">
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm text-gray-800">
              Ringkasan Kehadiran Hari Ini
            </h2>
            {monitoringLoading.stats && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />}
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div className="text-center bg-green-50 rounded-lg py-2 px-1">
              <Users size={18} className="mx-auto text-green-600 mb-1" />
              <p className="text-xl font-bold text-green-600">{stats.hadir || 0}</p>
              <p className="text-[10px] font-medium text-green-700">Hadir</p>
            </div>

            <div className="text-center bg-purple-50 rounded-lg py-2 px-1">
              <User size={18} className="mx-auto text-purple-600 mb-1" />
              <p className="text-xl font-bold text-purple-600">{stats.izin || 0}</p>
              <p className="text-[10px] font-medium text-purple-700">Izin</p>
            </div>

            <div className="text-center bg-yellow-50 rounded-lg py-2 px-1">
              <LogIn size={18} className="mx-auto text-yellow-600 mb-1" />
              <p className="text-xl font-bold text-yellow-600">{stats.belumAbsen || 0}</p>
              <p className="text-[10px] font-medium text-yellow-700">Belum Absen</p>
            </div>

            <div className="text-center bg-red-50 rounded-lg py-2 px-1">
              <CircleX size={18} className="mx-auto text-red-600 mb-1" />
              <p className="text-xl font-bold text-red-600">{stats.belumLapor || 0}</p>
              <p className="text-[10px] font-medium text-red-700">Belum Lapor</p>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-gray-100 text-center">
            <p className="text-[11px] text-gray-500">
              Total Pegawai: <span className="font-semibold text-gray-800">{stats.totalPegawai || 0}</span>
              {stats.tanpaKeterangan > 0 && (
                <span className="ml-2 text-red-500">⚠️ Tanpa Ket: {stats.tanpaKeterangan}</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* MENU UTAMA */}
      <div className="px-4 mt-4">
        <div className="grid grid-cols-2 gap-3">
          {menuUtama.map((item, index) => (
            <Link href={item.href} key={index}>
              <div className="bg-white rounded-xl p-3 shadow-sm active:scale-[0.98] transition-all cursor-pointer">
                <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center mb-2`}>
                  <item.icon className="text-white w-5 h-5" />
                </div>
                <h3 className="font-bold text-xs text-gray-800">{item.title}</h3>
                <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">{item.desc}</p>
                <div className="flex justify-end mt-2">
                  <ChevronRight size={14} className="text-gray-400" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* DAFTAR PEGAWAI BELUM ABSEN */}
      {dataBelumAbsen.length > 0 && (
        <div className="px-4 mt-4">
          <div className="bg-white rounded-xl shadow-sm p-3">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-1.5">
                <AlertCircle size={14} className="text-orange-500" />
                <h2 className="font-bold text-sm text-gray-800">Belum Absen ({dataBelumAbsen.length})</h2>
              </div>
              {dataBelumAbsen.length > 3 && (
                <button onClick={() => setShowAllBelumAbsen(!showAllBelumAbsen)} className="text-blue-600 text-[10px] font-medium">
                  {showAllBelumAbsen ? "Sembunyikan" : "Lihat Semua"}
                </button>
              )}
            </div>
            <div className="space-y-2">
              {displayedBelumAbsen.map((pegawai, index) => (
                <div key={pegawai.id || index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <div className="flex gap-2 flex-1">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User size={14} className="text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-xs text-gray-800 truncate">{pegawai.nama || "Pegawai"}</h4>
                      <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                        <span className="text-[9px] text-gray-500 truncate max-w-[100px]">{pegawai.jabatan || "-"}</span>
                        {pegawai.wilayah_penugasan && (
                          <span className="text-[8px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{pegawai.wilayah_penugasan}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">Belum Absen</span>
                    <Link href="/atasan/riwayatkehadiran"><ChevronRight size={14} className="text-blue-500" /></Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* LAPORAN TERBARU */}
      <div className="px-4 mt-4 mb-4">
        <div className="bg-white rounded-xl shadow-sm p-3">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-1.5">
              <FileText size={14} className="text-green-500" />
              <h2 className="font-bold text-sm text-gray-800">Laporan Terbaru</h2>
            </div>
            <Link href="/atasan/riwayathasilkerja">
              <span className="text-blue-600 text-[10px] font-medium">Lihat Semua</span>
            </Link>
          </div>

          {kinerjaLoading ? (
            <div className="text-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
              <p className="text-gray-500 text-[10px] mt-1">Memuat laporan...</p>
            </div>
          ) : laporanTerbaru.length > 0 ? (
            <div className="space-y-2">
              {laporanTerbaru.map((item, index) => (
                <Link href="/atasan/riwayathasilkerja" key={item.id || index}>
                  <div className={`flex justify-between items-center py-2 ${index !== laporanTerbaru.length - 1 ? "border-b border-gray-100" : ""}`}>
                    <div className="flex gap-2 flex-1 min-w-0">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <FileText size={14} className="text-green-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 flex-wrap">
                          <h4 className="font-semibold text-xs text-gray-800 truncate">{item.nama}</h4>
                          {item.waktu && <span className="text-[9px] text-gray-500">{item.waktu}</span>}
                        </div>
                        <p className="text-[10px] text-gray-500">Laporan - {item.tanggal}</p>
                        {item.kegiatan !== "-" && <p className="text-[9px] text-gray-500 mt-0.5 truncate">{item.kegiatan}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${item.status === "Sudah Dikirim" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {item.status === "Sudah Dikirim" ? "Dikirim" : "Review"}
                      </span>
                      <ChevronRight size={14} className="text-gray-400" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <FileText size={24} className="mx-auto mb-1 text-gray-300" />
              <p className="text-[10px] text-gray-500">Belum ada laporan</p>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* HEADER - Hanya tampil di tab Beranda */}
      {activeTab === "beranda" && (
        <div className="bg-gradient-to-b from-blue-900 to-blue-800 text-white px-4 pt-4 pb-16">
          <div className="flex justify-between items-start mb-3">
            <div className="flex gap-3 items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-lg font-bold">
                  {getUserInitial()}
                </span>
              </div>

              <div>
                <p className="text-white text-xs opacity-90">Selamat datang,</p>
                <h1 className="text-base font-bold text-white">
                  {getUserName()}
                </h1>
                <p className="text-blue-100 text-[10px]">
                  {getUserRole()}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-2">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-white" />
              <span className="text-white text-xs">{formatDate(selectedDate)}</span>
            </div>

            <div className="flex gap-1.5">
              <button 
                onClick={refreshData}
                className="border border-white/30 px-2.5 py-1 rounded-lg text-[10px] text-white active:bg-white/10"
                disabled={monitoringLoading.data}
              >
                {monitoringLoading.data ? "..." : "Refresh"}
              </button>
              <button 
                onClick={() => handleDateChange({ target: { value: new Date().toISOString().split('T')[0] } })}
                className="border border-white/30 px-2.5 py-1 rounded-lg text-[10px] text-white active:bg-white/10"
              >
                Hari Ini
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Konten Utama */}
      {activeTab === "beranda" ? renderBerandaContent() : renderAkunContent()}

      {/* BOTTOM NAVIGATION - Hanya 2 menu: Beranda dan Akun */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="flex justify-around items-center px-4 py-2">
          {/* Beranda */}
          <button
            onClick={() => setActiveTab("beranda")}
            className={`flex flex-col items-center py-2 px-6 rounded-lg transition-colors flex-1 ${
              activeTab === "beranda" ? "text-blue-600 bg-blue-50" : "text-gray-500"
            }`}
          >
            <Home size={22} />
            <span className="text-[11px] mt-1 font-medium">Beranda</span>
          </button>

          {/* Akun */}
          <button
            onClick={() => setActiveTab("akun")}
            className={`flex flex-col items-center py-2 px-6 rounded-lg transition-colors flex-1 ${
              activeTab === "akun" ? "text-blue-600 bg-blue-50" : "text-gray-500"
            }`}
          >
            <User size={22} />
            <span className="text-[11px] mt-1 font-medium">Akun</span>
          </button>
        </div>
      </nav>

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full animate-slide-up">
            <div className="p-5">
              <div className="flex items-center justify-center mb-4">
                <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
                  <LogOut size={28} className="text-red-600" />
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-center text-gray-800 mb-2">
                Konfirmasi Logout
              </h3>
              
              <p className="text-sm text-gray-500 text-center mb-6">
                Apakah Anda yakin ingin keluar dari aplikasi?
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 active:bg-gray-50"
                  disabled={isLoggingOut}
                >
                  Batal
                </button>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium active:bg-red-700 flex items-center justify-center gap-2"
                >
                  {isLoggingOut ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Logout...
                    </>
                  ) : (
                    <>
                      <LogOut size={16} />
                      Logout
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}