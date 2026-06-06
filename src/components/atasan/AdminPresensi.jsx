"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  Camera,
  Eye,
  Loader2,
  RefreshCw,
  Navigation,
  X,
  Clock,
  Briefcase,
  UserCheck,
  UserX,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { usePresensiData } from "./hooks/presensi/usePresensiData";
import { useFilters } from "./hooks/presensi/useFilters";
import { useModal } from "./hooks/presensi/useModal";
import { adminPresensiAPI } from "@/lib/api";
import Swal from "sweetalert2";

// Komponen Peta Presensi - Compact untuk HP
function MapPresensiContent({ tanggal, userWilayah, onOpenDetailModal }) {
  const [presensiList, setPresensiList] = useState([]);
  const [allPresensiData, setAllPresensiData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPresensi, setSelectedPresensi] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterWilayah, setFilterWilayah] = useState(userWilayah || "");
  const [filterTanggal, setFilterTanggal] = useState(tanggal);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapCenter] = useState([-7.919021, 113.820801]);
  const [mapZoom] = useState(11);
  const [showSidebar, setShowSidebar] = useState(false);
  
  const mapRef = useRef(null);
  const markerLayerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const leafletRef = useRef(null);

  const [stats, setStats] = useState({
    total: 0,
    denganLokasiMasuk: 0,
    denganLokasiPulang: 0,
    hadir: 0,
    terlambat: 0,
    izin: 0,
    tanpaKeterangan: 0
  });

  // Fungsi untuk membuka Google Maps langsung ke aplikasi
  const openGoogleMaps = (lat, lng) => {
    if (!lat || !lng) return;
    
    // Deteksi user agent
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    const isAndroid = /Android/.test(userAgent);
    
    // URL koordinat
    const coordinates = `${lat},${lng}`;
    
    if (isIOS) {
      // iOS: Coba buka Google Maps app dulu, fallback ke Apple Maps
      const googleMapsApp = `comgooglemaps://?q=${coordinates}&center=${coordinates}&zoom=15`;
      const appleMaps = `http://maps.apple.com/?q=${coordinates}`;
      const webMaps = `https://www.google.com/maps?q=${coordinates}`;
      
      // Coba buka Google Maps app
      window.location.href = googleMapsApp;
      
      // Set timeout untuk fallback jika Google Maps tidak terinstall
      setTimeout(() => {
        // Cek apakah masih di halaman yang sama (berarti Google Maps app tidak terbuka)
        if (document.hasFocus()) {
          window.location.href = appleMaps;
        }
      }, 500);
      
      // Fallback kedua setelah Apple Maps
      setTimeout(() => {
        if (document.hasFocus()) {
          window.location.href = webMaps;
        }
      }, 1000);
      
    } else if (isAndroid) {
      // Android: Gunakan intent URL untuk langsung buka Google Maps app
      const intentUrl = `intent://maps.google.com/maps?q=${coordinates}&api=1#Intent;scheme=https;package=com.google.android.apps.maps;end`;
      const webMaps = `https://www.google.com/maps?q=${coordinates}`;
      
      // Coba buka dengan intent
      window.location.href = intentUrl;
      
      // Fallback ke web jika intent gagal
      setTimeout(() => {
        if (document.hasFocus()) {
          window.location.href = webMaps;
        }
      }, 500);
      
    } else {
      // Desktop: Buka di browser
      window.open(`https://www.google.com/maps?q=${coordinates}`, '_blank');
    }
  };

  // Fungsi alternatif yang lebih sederhana (coba ini jika yang di atas tidak bekerja)
  const openGoogleMapsSimple = (lat, lng) => {
    // URL dengan parameter api=1 akan otomatis membuka app jika terinstall
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
  };

  const getShortName = (nama) => {
    if (!nama) return '?';
    if (nama.length <= 3) return nama.toUpperCase();
    return nama.substring(0, 3).toUpperCase();
  };

  // Load Leaflet
  useEffect(() => {
    const loadLeaflet = async () => {
      try {
        const L = (await import('leaflet')).default;
        await import('leaflet/dist/leaflet.css');
        
        leafletRef.current = L;
        
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        });
        
        setIsMapReady(true);
      } catch (error) {
        console.error('Error loading Leaflet:', error);
      }
    };
    
    loadLeaflet();
  }, []);

  // Update tanggal ketika props berubah
  useEffect(() => {
    setFilterTanggal(tanggal);
  }, [tanggal]);

  // Update filter wilayah ketika userWilayah berubah
  useEffect(() => {
    if (userWilayah) {
      setFilterWilayah(userWilayah);
    }
  }, [userWilayah]);

  // Fetch data presensi
  const fetchPresensiData = useCallback(async (tgl) => {
    try {
      setLoading(true);
      setError(null);

      console.log(`📅 Mengambil data presensi untuk tanggal: ${tgl} - Wilayah: ${userWilayah || 'Semua'}`);
      
      const response = await adminPresensiAPI.getAll({ tanggal: tgl });
      
      if (response.data?.success) {
        let allData = response.data.data || [];
        
        if (userWilayah) {
          allData = allData.filter(item => item.wilayah_penugasan === userWilayah);
          console.log(`📍 Filter wilayah: ${userWilayah}, data tersisa: ${allData.length}`);
        }
        
        setAllPresensiData(allData);
        
        const dataWithLocation = allData.filter(item => {
          const hasLatMasuk = item.latitude_masuk && item.latitude_masuk !== 0;
          const hasLngMasuk = item.longitude_masuk && item.longitude_masuk !== 0;
          const hasLatPulang = item.latitude_pulang && item.latitude_pulang !== 0;
          const hasLngPulang = item.longitude_pulang && item.longitude_pulang !== 0;
          
          return (hasLatMasuk && hasLngMasuk) || (hasLatPulang && hasLngPulang);
        });

        const formattedData = [];
        const lokasiYangDigunakan = new Set();
        
        dataWithLocation.forEach(item => {
          if (item.latitude_masuk && item.longitude_masuk) {
            const key = `${item.user_id}-${item.tanggal}-masuk`;
            if (!lokasiYangDigunakan.has(key)) {
              formattedData.push({
                id: `${item.id}-masuk`,
                presensi_id: item.id,
                user_id: item.user_id,
                nama: item.nama,
                jabatan: item.jabatan,
                wilayah_penugasan: item.wilayah_penugasan,
                tanggal: item.tanggal,
                jam: item.jam_masuk,
                status: item.status_masuk,
                jenis: 'masuk',
                lat: parseFloat(item.latitude_masuk),
                lng: parseFloat(item.longitude_masuk),
                is_lembur: item.is_lembur,
                izin_id: item.izin_id,
                foto_masuk: item.foto_masuk,
                foto_pulang: item.foto_pulang,
                jam_pulang: item.jam_pulang,
                catatan: item.catatan
              });
              lokasiYangDigunakan.add(key);
            }
          }
          
          if (item.latitude_pulang && item.longitude_pulang) {
            const key = `${item.user_id}-${item.tanggal}-pulang`;
            if (!lokasiYangDigunakan.has(key)) {
              formattedData.push({
                id: `${item.id}-pulang`,
                presensi_id: item.id,
                user_id: item.user_id,
                nama: item.nama,
                jabatan: item.jabatan,
                wilayah_penugasan: item.wilayah_penugasan,
                tanggal: item.tanggal,
                jam: item.jam_pulang,
                status: item.status_pulang,
                jenis: 'pulang',
                lat: parseFloat(item.latitude_pulang),
                lng: parseFloat(item.longitude_pulang),
                is_lembur: item.is_lembur,
                izin_id: item.izin_id,
                foto_masuk: item.foto_masuk,
                foto_pulang: item.foto_pulang,
                jam_masuk: item.jam_masuk,
                catatan: item.catatan
              });
              lokasiYangDigunakan.add(key);
            }
          }
        });

        setPresensiList(formattedData);
        
        const hadir = allData.filter(p => p.status_masuk === 'Tepat Waktu').length;
        const terlambat = allData.filter(p => p.status_masuk === 'Terlambat').length;
        const izin = allData.filter(p => p.izin_id !== null).length;
        const tanpaKeterangan = allData.filter(p => 
          p.izin_id === null && !p.jam_masuk
        ).length;
        
        const denganLokasiMasuk = allData.filter(p => 
          p.latitude_masuk && p.longitude_masuk
        ).length;
        
        const denganLokasiPulang = allData.filter(p => 
          p.latitude_pulang && p.longitude_pulang
        ).length;

        setStats({
          total: allData.length,
          denganLokasiMasuk,
          denganLokasiPulang,
          hadir,
          terlambat,
          izin,
          tanpaKeterangan
        });
        
      } else {
        throw new Error(response.data?.message || 'Gagal mengambil data');
      }
    } catch (err) {
      console.error('Error fetching presensi:', err);
      setError(err.message || 'Gagal memuat data presensi');
      setPresensiList([]);
      setAllPresensiData([]);
      setStats({
        total: 0,
        denganLokasiMasuk: 0,
        denganLokasiPulang: 0,
        hadir: 0,
        terlambat: 0,
        izin: 0,
        tanpaKeterangan: 0
      });
    } finally {
      setLoading(false);
    }
  }, [userWilayah]);

  // Fetch data ketika tanggal berubah
  useEffect(() => {
    if (filterTanggal) {
      fetchPresensiData(filterTanggal);
    }
  }, [filterTanggal, fetchPresensiData]);

  // Inisialisasi map
  useEffect(() => {
    if (!isMapReady || !mapRef.current || mapInstanceRef.current || !leafletRef.current) return;

    const L = leafletRef.current;

    const map = L.map(mapRef.current).setView(mapCenter, mapZoom);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    mapInstanceRef.current = map;
    markerLayerRef.current = L.layerGroup().addTo(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isMapReady, mapCenter, mapZoom]);

  // Update markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = leafletRef.current;
    
    if (!map || !markerLayerRef.current || !L || !isMapReady) return;

    markerLayerRef.current.clearLayers();

    const filteredData = presensiList.filter(item => {
      const matchesSearch = searchTerm === '' || 
        item.nama?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });

    if (filteredData.length === 0) {
      const defaultIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div class="marker-pin bg-gray-400"><span class="marker-text">📍</span></div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
      });

      L.marker([-7.919021, 113.820801], { icon: defaultIcon })
        .bindPopup('Pusat Wilayah')
        .addTo(markerLayerRef.current);
      return;
    }

    filteredData.forEach(item => {
      if (!item.lat || !item.lng) return;

      const markerColor = getMarkerColor(item);
      const displayText = getShortName(item.nama);
      
      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div class="marker-pin ${markerColor}" style="position: relative;">
            <span class="marker-text" style="font-size: 10px; font-weight: bold;">${displayText}</span>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36]
      });

      const marker = L.marker([item.lat, item.lng], { icon: customIcon })
        .on('click', () => {
          setSelectedPresensi({
            ...item,
            lat: item.lat,
            lng: item.lng
          });
          setShowSidebar(true);
        });

      markerLayerRef.current.addLayer(marker);
    });
  }, [presensiList, searchTerm, isMapReady]);

  const getMarkerColor = (item) => {
    if (item.jenis === 'masuk') {
      return item.status === 'Terlambat' ? 'bg-yellow-500' : 'bg-blue-500';
    } else {
      return item.is_lembur ? 'bg-purple-500' : 'bg-green-500';
    }
  };

  const getStatusText = (item) => {
    if (item.izin_id) return 'Izin';
    if (!item.jam) return 'Belum Presensi';
    if (item.status === 'Terlambat') return 'Terlambat';
    if (item.status === 'Tepat Waktu') return 'Tepat Waktu';
    return item.status || 'Presensi';
  };

  const handlePrevDay = () => {
    if (!filterTanggal) return;
    const date = new Date(filterTanggal);
    date.setDate(date.getDate() - 1);
    setFilterTanggal(date.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    if (!filterTanggal) return;
    const date = new Date(filterTanggal);
    date.setDate(date.getDate() + 1);
    setFilterTanggal(date.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setFilterTanggal(today);
  };

  const resetView = () => {
    const map = mapInstanceRef.current;
    if (map) {
      map.setView([-7.919021, 113.820801], 11);
    }
    setSelectedPresensi(null);
    setShowSidebar(false);
  };

  const filteredPresensi = presensiList.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.nama?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const wilayahInfo = userWilayah ? `Wilayah: ${userWilayah}` : 'Semua Wilayah';

  return (
    <div className="space-y-3 text-black">
      {/* Filter Bar - Compact untuk HP */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
        {/* Baris 1: Tanggal */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <Calendar size={14} className="text-gray-500" />
            <button onClick={handlePrevDay} className="p-1 hover:bg-gray-100 rounded">
              <ChevronLeft size={14} />
            </button>
            <input
              type="date"
              value={filterTanggal}
              onChange={(e) => setFilterTanggal(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded-lg text-xs w-32"
            />
            <button onClick={handleNextDay} className="p-1 hover:bg-gray-100 rounded">
              <ChevronRight size={14} />
            </button>
            <button onClick={handleToday} className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] hover:bg-blue-100 ml-1">
              Hari Ini
            </button>
          </div>

          <div className="flex gap-1">
            <button onClick={resetView} className="p-1.5 bg-gray-100 rounded-lg" title="Reset Peta">
              <Home size={14} />
            </button>
            <button onClick={() => fetchPresensiData(filterTanggal)} className="p-1.5 bg-blue-600 text-white rounded-lg" title="Refresh">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Baris 2: Search */}
        <div className="relative mb-2">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={12} />
          <input
            type="text"
            placeholder="Cari pegawai..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-7 pr-2 py-1.5 border border-gray-300 rounded-lg text-xs"
          />
        </div>

        {/* Statistik - Scroll horizontal untuk HP */}
        <div className="overflow-x-auto no-scrollbar -mx-1 px-1">
          <div className="flex gap-2 min-w-max">
            <span className="text-[10px] text-gray-600 flex items-center gap-1 px-2 py-0.5 bg-gray-50 rounded-full">
              <MapPin size={10} className="text-blue-500" />
              {wilayahInfo}
            </span>
            <span className="text-[10px] text-gray-600 flex items-center gap-1 px-2 py-0.5 bg-gray-50 rounded-full">
              <Users size={10} /> Total: {stats.total}
            </span>
            <span className="text-[10px] text-green-600 flex items-center gap-1 px-2 py-0.5 bg-green-50 rounded-full">
              <UserCheck size={10} /> Hadir: {stats.hadir}
            </span>
            <span className="text-[10px] text-yellow-600 flex items-center gap-1 px-2 py-0.5 bg-yellow-50 rounded-full">
              <Clock size={10} /> Terlambat: {stats.terlambat}
            </span>
            <span className="text-[10px] text-purple-600 flex items-center gap-1 px-2 py-0.5 bg-purple-50 rounded-full">
              <Briefcase size={10} /> Izin: {stats.izin}
            </span>
            <span className="text-[10px] text-red-600 flex items-center gap-1 px-2 py-0.5 bg-red-50 rounded-full">
              <UserX size={10} /> Alpha: {stats.tanpaKeterangan}
            </span>
          </div>
        </div>

        {/* Info wilayah */}
        <div className="mt-1 pt-1 border-t border-gray-100">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[9px] text-gray-500">Menampilkan:</span>
            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[9px] font-medium">
              {userWilayah || "Semua Wilayah"}
            </span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative" style={{ zIndex: 1 }}>
        {!isMapReady ? (
          <div className="h-[400px] flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-600" size={24} />
          </div>
        ) : (
          <div className="relative h-[400px]">
            <div ref={mapRef} className="w-full h-full" style={{ zIndex: 1 }} />

            {/* Info Panel */}
            <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-1.5 px-2" style={{ zIndex: 10 }}>
              <p className="text-[10px] font-medium">{filteredPresensi.length} Lokasi</p>
            </div>

            {/* Legend - Compact */}
            <div className="absolute bottom-2 left-2 bg-white rounded-lg shadow-lg p-1.5" style={{ zIndex: 10 }}>
              <div className="flex flex-wrap gap-1.5 text-[9px]">
                <div className="flex items-center gap-0.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div><span>Masuk</span></div>
                <div className="flex items-center gap-0.5"><div className="w-2 h-2 rounded-full bg-green-500"></div><span>Pulang</span></div>
                <div className="flex items-center gap-0.5"><div className="w-2 h-2 rounded-full bg-yellow-500"></div><span>Terlambat</span></div>
                <div className="flex items-center gap-0.5"><div className="w-2 h-2 rounded-full bg-purple-500"></div><span>Lembur</span></div>
              </div>
            </div>

            {/* Selected Info Panel - Slide from bottom untuk HP */}
            {selectedPresensi && showSidebar && (
              <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl shadow-xl p-3 animate-slide-up" style={{ zIndex: 15 }}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      selectedPresensi.jenis === 'masuk' ? 'bg-blue-500' : 'bg-green-500'
                    }`}>
                      {selectedPresensi.jenis === 'masuk' ? 'M' : 'P'}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-gray-800">{selectedPresensi.nama}</h3>
                      <p className="text-[10px] text-gray-500">{selectedPresensi.jabatan}</p>
                    </div>
                  </div>
                  <button onClick={() => { setSelectedPresensi(null); setShowSidebar(false); }} className="text-gray-400">
                    <X size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <p><span className="text-gray-500">Wilayah:</span> {selectedPresensi.wilayah_penugasan}</p>
                  <p><span className="text-gray-500">Waktu:</span> {selectedPresensi.jam?.substring(0,5)}</p>
                  <p><span className="text-gray-500">Status:</span> {getStatusText(selectedPresensi)}</p>
                  <p><span className="text-gray-500">Tipe:</span> {selectedPresensi.jenis === 'masuk' ? 'Check In' : 'Check Out'}</p>
                </div>
                <div className="pt-2 mt-2 border-t border-gray-100 flex gap-3">
                  {/* Tombol Google Maps - LANGSUNG BUKA APLIKASI */}
                  <button
                    onClick={() => openGoogleMaps(selectedPresensi.lat, selectedPresensi.lng)}
                    className="flex-1 inline-flex items-center justify-center gap-1 text-blue-600 text-xs font-medium py-1.5 bg-blue-50 rounded-lg"
                  >
                    <MapPin size={12} />
                    Google Maps
                  </button>
                  <button
                    onClick={() => {
                      const presensiFull = allPresensiData.find(p => p.id == selectedPresensi.presensi_id);
                      if (presensiFull && onOpenDetailModal) {
                        onOpenDetailModal(presensiFull);
                        setSelectedPresensi(null);
                        setShowSidebar(false);
                      }
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1 text-green-600 text-xs font-medium py-1.5 bg-green-50 rounded-lg"
                  >
                    <Eye size={12} />
                    Detail
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .custom-marker {
          background: transparent;
          border: none;
        }
        .marker-pin {
          width: 36px;
          height: 36px;
          border-radius: 50% 50% 50% 0;
          position: relative;
          transform: rotate(-45deg);
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .marker-pin.bg-blue-500 { background: #3b82f6; }
        .marker-pin.bg-green-500 { background: #10b981; }
        .marker-pin.bg-yellow-500 { background: #f59e0b; }
        .marker-pin.bg-purple-500 { background: #8b5cf6; }
        .marker-pin.bg-gray-400 { background: #9ca3af; }
        .marker-text {
          transform: rotate(45deg);
          color: white;
          font-weight: bold;
          font-size: 10px;
          text-shadow: 0 1px 1px rgba(0,0,0,0.2);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 40px;
        }
        
        .leaflet-container {
          z-index: 1 !important;
        }
        .leaflet-control-container {
          z-index: 5 !important;
        }
      `}</style>
    </div>
  );
}

// Komponen Utama - Compact untuk HP
export default function MonitoringKehadiran() {
  const { filters, updateFilter, resetFilters, activeFilterCount, user } = useFilters();
  const {
    filteredPresensi,
    statistik,
    loading,
    handleGenerateHariIni,
  } = usePresensiData(filters);
  
  const {
    modalState,
    selectedPresensi,
    selectedFoto,
    openDetailModal,
    closeDetailModal,
    openFotoModal,
    closeFotoModal,
  } = useModal();

  const [showFilterSidebar, setShowFilterSidebar] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search);

  const formatJam = (jam) => {
    if (!jam) return "-";
    if (jam.includes(":")) return jam.substring(0, 5);
    return jam;
  };

  const formatTanggal = (tanggal) => {
    if (!tanggal) return "-";
    const date = new Date(tanggal);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatHari = (tanggal) => {
    if (!tanggal) return "-";
    const date = new Date(tanggal);
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[date.getDay()];
  };

  const handleSearchSubmit = () => {
    updateFilter("search", searchInput);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-600 mx-auto mb-3" size={32} />
          <p className="text-gray-600 text-sm">Memuat data presensi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-16 text-black">
      {/* HEADER - Compact untuk HP */}
      <div className="bg-gradient-to-b from-blue-900 to-blue-700 pt-4 pb-8">
        <div className="px-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Link href="/atasan/dashboard" className="p-1 -ml-1">
                <ArrowLeft size={20} className="text-white" />
              </Link>
              <div>
                <h1 className="text-base font-bold text-white">Monitoring Kehadiran</h1>
                <p className="text-blue-100 text-[10px]">Pantau kehadiran pegawai</p>
              </div>
            </div>

          </div>

          {/* Filter Baris - Stack untuk HP */}
          <div className="space-y-2">
            <div className="bg-white/10 border border-white/20 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-white" />
                <input
                  type="date"
                  value={filters.tanggal}
                  onChange={(e) => updateFilter("tanggal", e.target.value)}
                  className="bg-transparent outline-none text-white text-xs w-full"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </div>

            <div className="bg-white/10 border border-white/20 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <Building2 size={14} className="text-white" />
                <span className="text-white text-xs">{user?.wilayah_penugasan || "Semua Wilayah"}</span>
                {user?.wilayah_penugasan && <span className="text-[9px] text-blue-200 ml-auto">(Wilayah Anda)</span>}
              </div>
            </div>

            <div className="bg-white/10 border border-white/20 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <Search size={14} className="text-white" />
                <input
                  placeholder="Cari pegawai..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
                  className="bg-transparent outline-none w-full text-white placeholder:text-white/60 text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 pb-4">
        {/* PETA PRESENSI */}
        <MapPresensiContent 
          tanggal={filters.tanggal} 
          userWilayah={user?.wilayah_penugasan}
          onOpenDetailModal={openDetailModal}
        />

        {/* TAB - Daftar Pegawai */}
        <div className="bg-white rounded-xl shadow-lg mt-4 overflow-hidden">
          <div className="border-b border-gray-100 px-4 py-2">
            <button className="text-sm font-medium border-b-2 border-blue-600 text-blue-600 pb-2">
              Daftar Pegawai
            </button>
          </div>

          {/* LIST - Card view untuk HP, bukan tabel */}
          <div className="divide-y divide-gray-100">
            {filteredPresensi && filteredPresensi.length > 0 ? (
              filteredPresensi.map((presensi) => (
                <div key={presensi.id} className="p-3 hover:bg-gray-50 transition-colors">
                  {/* Header Card */}
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <User size={14} className="text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-gray-900">{presensi.nama || "-"}</h3>
                        <p className="text-[10px] text-gray-500">{presensi.jabatan || "-"}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-medium ${
                      presensi.izin_id ? 'bg-purple-100 text-purple-700' :
                      presensi.status_masuk === 'Terlambat' ? 'bg-yellow-100 text-yellow-700' :
                      presensi.jam_masuk ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      ● {presensi.izin_id ? 'Izin' : presensi.status_masuk === 'Terlambat' ? 'Terlambat' : presensi.jam_masuk ? 'Hadir' : 'Tidak Hadir'}
                    </span>
                  </div>

                  {/* Info Row */}
                  <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                    <div>
                      <p className="text-[9px] text-gray-500">Tanggal</p>
                      <p className="text-xs font-medium">{formatTanggal(presensi.tanggal)}</p>
                      <p className="text-[9px] text-gray-400">{formatHari(presensi.tanggal)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-500">Wilayah</p>
                      <p className="text-xs flex items-center gap-1">
                        <MapPin size={10} className="text-gray-400" />
                        {presensi.wilayah_penugasan || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-500">Check In</p>
                      <p className="text-base font-bold">{formatJam(presensi.jam_masuk)}</p>
                      <p className="text-[9px] text-green-600">{presensi.jam_masuk ? 'Hadir' : 'Belum Absen'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-500">Check Out</p>
                      <p className="text-base font-bold">{formatJam(presensi.jam_pulang)}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100">
                    {presensi.foto_masuk && (
                      <button onClick={() => openFotoModal(presensi.foto_masuk, "Masuk", presensi)} className="flex-1 py-1.5 bg-blue-50 rounded-lg text-[10px] text-blue-600 flex items-center justify-center gap-1">
                        <Camera size={10} /> Foto In
                      </button>
                    )}
                    {presensi.foto_pulang && (
                      <button onClick={() => openFotoModal(presensi.foto_pulang, "Pulang", presensi)} className="flex-1 py-1.5 bg-green-50 rounded-lg text-[10px] text-green-600 flex items-center justify-center gap-1">
                        <Camera size={10} /> Foto Out
                      </button>
                    )}
                    <button onClick={() => openDetailModal(presensi)} className="flex-1 py-1.5 bg-gray-100 rounded-lg text-[10px] text-gray-600 flex items-center justify-center gap-1">
                      <Eye size={10} /> Detail
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">Tidak ada data presensi</p>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="p-3 flex flex-wrap gap-2 justify-between items-center border-t border-gray-100">
            <div className="text-[10px] text-gray-500">Menampilkan {filteredPresensi?.length || 0} data</div>
          </div>
        </div>
      </div>

      {/* FILTER SIDEBAR MODAL untuk HP */}
      {showFilterSidebar && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white w-full rounded-t-xl max-h-[80vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center">
              <h3 className="font-semibold text-base">Filter Data</h3>
              <button onClick={() => setShowFilterSidebar(false)} className="p-1">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                <input
                  type="date"
                  value={filters.tanggal}
                  onChange={(e) => updateFilter("tanggal", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Wilayah</label>
                <div className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-600">
                  {user?.wilayah_penugasan || "Semua Wilayah"} <span className="text-xs text-gray-400">(Sesuai akun)</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cari Pegawai</label>
                <input
                  type="text"
                  placeholder="Nama pegawai..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    resetFilters();
                    setSearchInput("");
                    setShowFilterSidebar(false);
                  }}
                  className="flex-1 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  Reset
                </button>
                <button
                  onClick={() => {
                    updateFilter("search", searchInput);
                    setShowFilterSidebar(false);
                  }}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm"
                >
                  Terapkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal - Compact untuk HP */}
      {modalState.detail && selectedPresensi && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white w-full rounded-t-xl max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-sm text-gray-900">Detail Presensi</h2>
                <p className="text-[10px] text-blue-600">{selectedPresensi.nama}</p>
              </div>
              <button onClick={closeDetailModal} className="p-1">
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-gray-500 text-[10px]">Tanggal</label>
                  <p className="font-semibold text-sm text-gray-900">{formatTanggal(selectedPresensi.tanggal)}</p>
                  <p className="text-[9px] text-gray-500">{formatHari(selectedPresensi.tanggal)}</p>
                </div>
                <div>
                  <label className="text-gray-500 text-[10px]">Wilayah</label>
                  <p className="font-semibold text-sm text-gray-900">{selectedPresensi.wilayah_penugasan || "-"}</p>
                </div>
                <div>
                  <label className="text-gray-500 text-[10px]">Jabatan</label>
                  <p className="font-semibold text-sm text-gray-900">{selectedPresensi.jabatan || "-"}</p>
                </div>
                <div>
                  <label className="text-gray-500 text-[10px]">Status</label>
                  <p className="font-semibold text-sm">{selectedPresensi.izin_id ? 'Izin' : selectedPresensi.jam_masuk ? 'Hadir' : 'Tidak Hadir'}</p>
                </div>
                <div>
                  <label className="text-gray-500 text-[10px]">Jam Masuk</label>
                  <p className="font-bold text-xl text-gray-900">{formatJam(selectedPresensi.jam_masuk)}</p>
                  <p className="text-[9px] text-gray-500">{selectedPresensi.status_masuk || '-'}</p>
                </div>
                <div>
                  <label className="text-gray-500 text-[10px]">Jam Pulang</label>
                  <p className="font-bold text-xl text-gray-900">{formatJam(selectedPresensi.jam_pulang)}</p>
                </div>
              </div>

              {(selectedPresensi.foto_masuk || selectedPresensi.foto_pulang) && (
                <div className="border-t border-gray-100 pt-4">
                  <h3 className="font-semibold text-sm text-gray-900 mb-3 flex items-center gap-1">
                    <Camera size={14} className="text-blue-500" />
                    Dokumentasi
                  </h3>
                  <div className="space-y-3">
                    {selectedPresensi.foto_masuk && (
                      <div>
                        <p className="text-[10px] text-gray-500 mb-1">Foto Check In</p>
                        <img
                          src={selectedPresensi.foto_masuk}
                          alt="Foto Check In"
                          className="w-full h-40 object-cover rounded-lg cursor-pointer"
                          onClick={() => openFotoModal(selectedPresensi.foto_masuk, "Masuk", selectedPresensi)}
                        />
                      </div>
                    )}
                    {selectedPresensi.foto_pulang && (
                      <div>
                        <p className="text-[10px] text-gray-500 mb-1">Foto Check Out</p>
                        <img
                          src={selectedPresensi.foto_pulang}
                          alt="Foto Check Out"
                          className="w-full h-40 object-cover rounded-lg cursor-pointer"
                          onClick={() => openFotoModal(selectedPresensi.foto_pulang, "Pulang", selectedPresensi)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedPresensi.catatan && (
                <div className="border-t border-gray-100 pt-4 mt-2">
                  <label className="text-gray-500 text-[10px]">Catatan</label>
                  <p className="text-xs text-gray-700 mt-1">{selectedPresensi.catatan}</p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-3">
              <button onClick={closeDetailModal} className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Foto Modal - Compact */}
      {modalState.foto && selectedFoto && selectedFoto.src && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4">
          <div className="relative max-w-lg w-full">
            <button onClick={closeFotoModal} className="absolute -top-10 right-0 text-white text-sm">
              Tutup
            </button>
            <div className="bg-white rounded-xl p-3">
              <h3 className="font-semibold text-sm mb-2">Foto Check {selectedFoto.jenis} - {selectedPresensi?.nama}</h3>
              <img src={selectedFoto.src} alt={`Foto Check ${selectedFoto.jenis}`} className="w-full h-auto rounded-lg" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}