// components/pegawai/dashboard/LocationCheckModal.js
'use client';

import { useState, useEffect } from 'react';
import { X, MapPin, Navigation, AlertCircle, CheckCircle, Camera, Loader } from 'lucide-react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

// Dynamic imports for Leaflet
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });
const Circle = dynamic(() => import('react-leaflet').then((mod) => mod.Circle), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });

export const LocationCheckModal = ({ 
  isOpen, 
  onClose, 
  onLocationValid, 
  penugasan,
  type 
}) => {
  const [locationStatus, setLocationStatus] = useState('checking'); // checking, valid, invalid
  const [distance, setDistance] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [L, setL] = useState(null);
  const [markerIcon, setMarkerIcon] = useState(null);
  const [userMarkerIcon, setUserMarkerIcon] = useState(null);
  const [watchId, setWatchId] = useState(null);
  const [hasValidated, setHasValidated] = useState(false); // ✅ Tambah state untuk cek manual

  useEffect(() => {
    // Load Leaflet icons
    import('leaflet').then((leaflet) => {
      setL(leaflet.default);
      setMarkerIcon(leaflet.default.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      }));
      setUserMarkerIcon(leaflet.default.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      }));
    });

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

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
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      const addr = data.address || {};
      const locationName = [
        addr.road || addr.residential || addr.footway,
        addr.village || addr.suburb,
        addr.city || addr.county,
        addr.state
      ].filter(Boolean).join(', ');
      setAddress(locationName || `${lat.toFixed(6)}, ${lon.toFixed(6)}`);
    } catch (error) {
      setAddress(`${lat.toFixed(6)}, ${lon.toFixed(6)}`);
    }
  };

  const checkLocation = (lat, lon) => {
    if (!penugasan || !penugasan.latitude || !penugasan.longitude) {
      setLocationStatus('valid');
      setDistance(null);
      return true;
    }

    const dist = calculateDistance(
      lat, lon,
      parseFloat(penugasan.latitude),
      parseFloat(penugasan.longitude)
    );
    const radius = penugasan.radius || 100;
    const isValid = dist <= radius;
    
    setDistance(Math.round(dist));
    setLocationStatus(isValid ? 'valid' : 'invalid');
    
    return isValid;
  };

  const startLocationTracking = () => {
    setIsLoading(true);
    setLocationStatus('checking');
    setHasValidated(false); // ✅ Reset status manual saat refresh

    if (!navigator.geolocation) {
      setLocationStatus('invalid');
      setIsLoading(false);
      return;
    }

    // Get current position
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const location = { lat, lon };
        setUserLocation(location);
        await reverseGeocode(lat, lon);
        checkLocation(lat, lon);
        setIsLoading(false);
        
        // ❌ HAPUS auto-call onLocationValid di sini
        // if (isValid) {
        //   onLocationValid?.(location);
        // }
      },
      (error) => {
        console.error('Location error:', error);
        setLocationStatus('invalid');
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );

    // Watch position for real-time updates
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
    }
    
    const watch = navigator.geolocation.watchPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const location = { lat, lon };
        setUserLocation(location);
        checkLocation(lat, lon);
      },
      (error) => {
        console.warn('Watch position error:', error);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );
    
    setWatchId(watch);
  };

  useEffect(() => {
    if (isOpen) {
      startLocationTracking();
    }
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isOpen]);

  // ✅ Fungsi manual untuk lanjut ke kamera
  const handleManualContinue = () => {
    if (locationStatus === 'valid' && userLocation && !hasValidated) {
      setHasValidated(true);
      onLocationValid?.(userLocation);
      onClose();
    }
  };

  if (!isOpen) return null;

  const hasRadiusRestriction = penugasan && penugasan.latitude && penugasan.longitude;
  const center = hasRadiusRestriction 
    ? [parseFloat(penugasan.latitude), parseFloat(penugasan.longitude)]
    : (userLocation ? [userLocation.lat, userLocation.lon] : [0, 0]);

  const getStatusColor = () => {
    switch (locationStatus) {
      case 'valid': return 'border-green-500 bg-green-50';
      case 'invalid': return 'border-red-500 bg-red-50';
      default: return 'border-yellow-500 bg-yellow-50';
    }
  };

  const getStatusIcon = () => {
    switch (locationStatus) {
      case 'valid': return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'invalid': return <AlertCircle className="w-6 h-6 text-red-600" />;
      default: return <Loader className="w-6 h-6 text-yellow-600 animate-spin" />;
    }
  };

  const getStatusTitle = () => {
    switch (locationStatus) {
      case 'valid': return 'Lokasi Valid';
      case 'invalid': return 'Lokasi Tidak Valid';
      default: return 'Memeriksa Lokasi...';
    }
  };

  const getStatusMessage = () => {
    if (locationStatus === 'checking') {
      return 'Sedang mengambil lokasi Anda...';
    }
    if (locationStatus === 'valid') {
      if (distance !== null) {
        return `✓ Anda berada dalam radius ${distance}m dari lokasi penugasan`;
      }
      return '✓ Lokasi Anda valid untuk melakukan absen';
    }
    if (distance !== null) {
      return `✗ Anda berada di luar radius! Jarak: ${distance}m dari lokasi (maksimal ${penugasan?.radius || 100}m)`;
    }
    return '✗ Gagal mendapatkan lokasi. Pastikan GPS aktif dan izinkan akses lokasi.';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto text-black">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  {type === 'masuk' ? 'Check In' : 'Check Out'}
                </h2>
                <p className="text-sm text-gray-500">Verifikasi lokasi kehadiran</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {/* Status Card */}
            <div className={`rounded-xl border-2 p-4 ${getStatusColor()}`}>
              <div className="flex items-center gap-3">
                {getStatusIcon()}
                <div className="flex-1">
                  <h3 className={`font-semibold ${locationStatus === 'valid' ? 'text-green-800' : locationStatus === 'invalid' ? 'text-red-800' : 'text-yellow-800'}`}>
                    {getStatusTitle()}
                  </h3>
                  <p className="text-sm mt-1 text-gray-600">
                    {getStatusMessage()}
                  </p>
                  {address && (
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <MapPin size={12} />
                      {address}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Map View */}
            <div className="rounded-xl overflow-hidden border border-gray-200">
              <div style={{ height: '300px' }} className="relative">
                {typeof window !== 'undefined' && L && markerIcon && (
                  <MapContainer
                    center={center}
                    zoom={hasRadiusRestriction ? 16 : 15}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={true}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    
                    {/* Radius Circle */}
                    {hasRadiusRestriction && (
                      <Circle
                        center={[parseFloat(penugasan.latitude), parseFloat(penugasan.longitude)]}
                        radius={penugasan.radius || 100}
                        pathOptions={{
                          color: locationStatus === 'valid' ? '#22C55E' : '#EF4444',
                          fillColor: locationStatus === 'valid' ? '#86EFAC' : '#FCA5A5',
                          fillOpacity: 0.2,
                          weight: 2
                        }}
                      />
                    )}
                    
                    {/* Location Marker */}
                    {hasRadiusRestriction && (
                      <Marker
                        position={[parseFloat(penugasan.latitude), parseFloat(penugasan.longitude)]}
                        icon={markerIcon}
                      >
                        <Popup>
                          <div className="text-center">
                            <strong>{penugasan.nama_penugasan}</strong>
                            <br />
                            Radius: {penugasan.radius || 100}m
                          </div>
                        </Popup>
                      </Marker>
                    )}
                    
                    {/* User Location Marker */}
                    {userLocation && (
                      <Marker
                        position={[userLocation.lat, userLocation.lon]}
                        icon={userMarkerIcon || markerIcon}
                      >
                        <Popup>
                          <div className="text-center">
                            <strong>Lokasi Anda</strong>
                            <br />
                            {distance !== null && `Jarak: ${distance}m dari lokasi penugasan`}
                          </div>
                        </Popup>
                      </Marker>
                    )}
                  </MapContainer>
                )}
                {(!L || !markerIcon) && (
                  <div className="flex items-center justify-center h-full bg-gray-100">
                    <Loader className="w-8 h-8 text-blue-500 animate-spin" />
                    <span className="ml-2 text-gray-600">Memuat peta...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Info Penugasan */}
            {penugasan && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Informasi Penugasan</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-500">Nama:</span> {penugasan.nama_penugasan}</p>
                  {penugasan.tipe_penugasan === 'khusus' && (
                    <>
                      <p><span className="text-gray-500">Jam Masuk:</span> {penugasan.jam_masuk?.substring(0,5)}</p>
                      <p><span className="text-gray-500">Jam Pulang:</span> {penugasan.jam_pulang?.substring(0,5)}</p>
                      {hasRadiusRestriction && (
                        <p><span className="text-gray-500">Radius Absensi:</span> {penugasan.radius || 100} meter</p>
                      )}
                    </>
                  )}
                  {penugasan.tipe_penugasan === 'default' && (
                    <p className="text-blue-600 text-xs">Penugasan default (tanpa batasan lokasi)</p>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Footer - Button MANUAL sekarang */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleManualContinue} // ✅ Panggil fungsi manual
              disabled={locationStatus !== 'valid' || hasValidated} // ✅ Disable jika sudah divalidasi
              className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                locationStatus === 'valid' && !hasValidated
                  ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 cursor-pointer'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Camera size={18} />
              {hasValidated ? 'Memproses...' : 'Lanjutkan ke Kamera'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};