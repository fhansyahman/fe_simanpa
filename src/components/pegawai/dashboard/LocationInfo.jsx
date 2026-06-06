// components/pegawai/dashboard/LocationInfo.js (update)
'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { LocationRadiusChecker } from './LocationRadiusChecker';

export const useLocationWithRadius = (penugasan, onLocationValid, onLocationInvalid) => {
  const [coords, setCoords] = useState(null);
  const [alamat, setAlamat] = useState([]);
  const [status, setStatus] = useState("Mengambil lokasi...");
  const [isLoading, setIsLoading] = useState(false);
  const [isInRadius, setIsInRadius] = useState(null);
  const [distance, setDistance] = useState(null);
  
  const isMounted = useRef(true);
  const watchIdRef = useRef(null);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c * 1000;
  };

  const reverseGeocode = async (lat, lon) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`
      );
      const data = await res.json();
      
      if (!isMounted.current) return;
      
      const addr = data.address || {};
      const alamatList = [
        `📍 Jalan: ${addr.road || addr.residential || addr.footway || addr.path || "(jalan tidak tersedia)"}`,
        `🏘️ Desa: ${addr.village || addr.suburb || ""}`,
        `🏢 Kecamatan: ${addr.subdistrict || addr.city_district || addr.town || addr.village || "(kecamatan tidak tersedia)"}`,
        `🏛️ Kabupaten: ${addr.city || addr.county || ""}`,
        `🗺️ Provinsi: ${addr.state || ""}`,
        `🌏 Negara: ${addr.country || ""}`,
        `📌 Koordinat: ${lat.toFixed(6)}, ${lon.toFixed(6)}`,
        `⏰ Waktu: ${new Date().toLocaleString("id-ID", { dateStyle: "full", timeStyle: "medium" })}`,
      ].filter(line => line && !line.includes(": "));
      
      setAlamat(alamatList);
    } catch (err) {
      console.warn("Reverse geocode gagal:", err);
      setAlamat([`📌 Koordinat: ${lat.toFixed(6)}, ${lon.toFixed(6)}`]);
    }
  };

  const checkRadius = (lat, lon) => {
    if (penugasan && penugasan.latitude && penugasan.longitude) {
      const dist = calculateDistance(
        lat, lon,
        parseFloat(penugasan.latitude),
        parseFloat(penugasan.longitude)
      );
      const radius = penugasan.radius || 100;
      const valid = dist <= radius;
      setDistance(Math.round(dist));
      setIsInRadius(valid);
      
      if (valid && onLocationValid) {
        onLocationValid({ distance: Math.round(dist), radius });
      } else if (!valid && onLocationInvalid) {
        onLocationInvalid({ distance: Math.round(dist), radius });
      }
      
      return valid;
    }
    return true;
  };

  const ambilLokasi = () => {
    if (!navigator.geolocation) {
      setStatus("❌ Geolocation tidak didukung browser");
      return Promise.resolve(null);
    }

    // Stop existing watch if any
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    return new Promise((resolve) => {
      setIsLoading(true);
      setStatus("📡 Mengambil lokasi...");
      
      // Get current position
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          if (!isMounted.current) {
            resolve(null);
            return;
          }
          
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const locationData = { lat, lon };
          
          setCoords(locationData);
          
          const isValid = checkRadius(lat, lon);
          
          if (isValid) {
            setStatus("✅ Lokasi valid, dalam radius absensi");
          } else {
            setStatus("⚠️ Lokasi di luar radius absensi");
          }
          
          setIsLoading(false);
          await reverseGeocode(lat, lon);
          resolve(locationData);
        },
        (err) => {
          if (!isMounted.current) {
            resolve(null);
            return;
          }
          
          console.error("Gagal mengambil lokasi:", err);
          let errorMessage = "❌ Gagal mengambil lokasi. ";
          
          switch(err.code) {
            case err.PERMISSION_DENIED:
              errorMessage += "Izin lokasi ditolak.";
              break;
            case err.POSITION_UNAVAILABLE:
              errorMessage += "Lokasi tidak tersedia.";
              break;
            case err.TIMEOUT:
              errorMessage += "Waktu habis.";
              break;
            default:
              errorMessage += "Terjadi kesalahan.";
          }
          
          setStatus(errorMessage);
          setIsLoading(false);
          resolve(null);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
      );

      // Start watching position for real-time updates
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          if (!isMounted.current) return;
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const locationData = { lat, lon };
          setCoords(locationData);
          const isValid = checkRadius(lat, lon);
          
          if (isValid) {
            setStatus("✅ Lokasi valid, dalam radius absensi");
          } else {
            setStatus("⚠️ Lokasi di luar radius absensi");
          }
        },
        (err) => {
          console.warn("Watch position error:", err);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    coords,
    alamat,
    status,
    isLoading,
    isInRadius,
    distance,
    setCoords,
    setAlamat,
    setStatus,
    ambilLokasi,
    reverseGeocode,
    checkRadius
  };
};

export default function LocationInfo({ 
  onLocationChange, 
  onAlamatChange, 
  onStatusChange,
  penugasan,
  onRadiusValid,
  onRadiusInvalid
}) {
  const { 
    coords, 
    alamat, 
    status, 
    isLoading, 
    isInRadius,
    distance,
    ambilLokasi 
  } = useLocationWithRadius(penugasan, onRadiusValid, onRadiusInvalid);

  useEffect(() => {
    if (coords && onLocationChange) onLocationChange(coords);
  }, [coords, onLocationChange]);

  useEffect(() => {
    if (alamat && onAlamatChange) onAlamatChange(alamat);
  }, [alamat, onAlamatChange]);

  useEffect(() => {
    if (status && onStatusChange) onStatusChange(status);
  }, [status, onStatusChange]);

  useEffect(() => {
    ambilLokasi();
  }, []);

  const getStatusIcon = () => {
    if (isLoading) return <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
    if (isInRadius === true) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (isInRadius === false) return <AlertCircle className="w-5 h-5 text-red-600" />;
    return <MapPin className="w-5 h-5 text-gray-500" />;
  };

  const getStatusColor = () => {
    if (isInRadius === true) return 'text-green-700 bg-green-50 border-green-200';
    if (isInRadius === false) return 'text-red-700 bg-red-50 border-red-200';
    return 'text-gray-700 bg-gray-50 border-gray-200';
  };

  return (
    <div className="space-y-3">
      {/* Status message */}
      <div className={`p-3 rounded-lg border ${getStatusColor()}`}>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm">{status}</span>
        </div>
        {isInRadius === false && (
          <p className="text-xs text-red-600 mt-2 pl-7">
            Silakan bergerak ke dalam radius {penugasan?.radius || 100}m dari lokasi penugasan.
          </p>
        )}
      </div>

      {/* Tampilkan peta jika ada penugasan dengan radius */}
      {penugasan && penugasan.latitude && (
        <LocationRadiusChecker
          penugasan={penugasan}
          userLocation={coords}
          onLocationValid={onRadiusValid}
          onLocationInvalid={onRadiusInvalid}
        />
      )}

      {/* Alamat detail */}
      {alamat.length > 0 && !penugasan?.latitude && (
        <div className="bg-gray-50 rounded-lg p-3 space-y-1">
          <p className="text-xs font-medium text-gray-700 mb-2">Detail Lokasi:</p>
          {alamat.map((line, idx) => (
            <p key={idx} className="text-xs text-gray-600">{line}</p>
          ))}
        </div>
      )}

      {/* Tombol refresh lokasi */}
      <button
        onClick={ambilLokasi}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm disabled:opacity-50"
      >
        <Navigation size={16} />
        Refresh Lokasi
      </button>
    </div>
  );
}