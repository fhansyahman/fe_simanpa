// components/pegawai/dashboard/LocationRadiusChecker.js
'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Circle as LucideCircle, Navigation, AlertCircle, CheckCircle } from 'lucide-react';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

// Dynamic import untuk Leaflet components
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const LeafletCircle = dynamic(
  () => import('react-leaflet').then((mod) => mod.Circle),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

export const LocationRadiusChecker = ({ 
  penugasan, 
  userLocation, 
  onLocationValid,
  onLocationInvalid 
}) => {
  const [L, setL] = useState(null);
  const [defaultIcon, setDefaultIcon] = useState(null);
  const [userIcon, setUserIcon] = useState(null);
  const [isInRadius, setIsInRadius] = useState(null);
  const [distance, setDistance] = useState(null);

  // Hitung jarak antara user dan lokasi penugasan
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

  useEffect(() => {
    // Import Leaflet untuk icon
    import('leaflet').then((leaflet) => {
      setL(leaflet.default);
      
      // Icon untuk lokasi penugasan
      setDefaultIcon(leaflet.default.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      }));

      // Icon untuk lokasi user (warna biru)
      setUserIcon(leaflet.default.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      }));
    });
  }, []);

  // Cek radius ketika userLocation berubah
  useEffect(() => {
    if (userLocation && penugasan && penugasan.latitude && penugasan.longitude) {
      const dist = calculateDistance(
        userLocation.lat,
        userLocation.lon,
        parseFloat(penugasan.latitude),
        parseFloat(penugasan.longitude)
      );
      setDistance(Math.round(dist));
      
      const radius = penugasan.radius || 100;
      const valid = dist <= radius;
      setIsInRadius(valid);
      
      if (valid && onLocationValid) {
        onLocationValid({ distance: Math.round(dist), radius });
      } else if (!valid && onLocationInvalid) {
        onLocationInvalid({ distance: Math.round(dist), radius });
      }
    }
  }, [userLocation, penugasan]);

  if (!penugasan || !penugasan.latitude || !penugasan.longitude) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <p className="text-sm text-yellow-700">
            Tidak ada batasan radius untuk penugasan ini.
          </p>
        </div>
      </div>
    );
  }

  const center = [parseFloat(penugasan.latitude), parseFloat(penugasan.longitude)];
  const radiusInMeters = penugasan.radius || 100;

  // Tentukan warna berdasarkan status
  const getStatusColor = () => {
    if (isInRadius === null) return 'text-gray-500';
    return isInRadius ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = () => {
    if (isInRadius === null) return <AlertCircle className="w-5 h-5" />;
    return isInRadius ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />;
  };

  const getStatusMessage = () => {
    if (isInRadius === null) return 'Menunggu lokasi...';
    if (isInRadius) return `✓ Anda dalam radius (${distance}m dari lokasi)`;
    return `✗ Di luar radius! Jarak: ${distance}m, Maksimal: ${radiusInMeters}m`;
  };

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <div className={`rounded-lg p-4 border ${isInRadius === null ? 'bg-gray-50 border-gray-200' : isInRadius ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-center gap-3">
          <div className={getStatusColor()}>
            {getStatusIcon()}
          </div>
          <div>
            <p className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusMessage()}
            </p>
            {isInRadius === false && (
              <p className="text-xs text-red-600 mt-1">
                Anda harus berada dalam radius {radiusInMeters}m untuk dapat melakukan absen.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Map View */}
      <div className="relative">
        <div style={{ height: '350px' }} className="rounded-lg overflow-hidden border border-gray-200">
          {typeof window !== 'undefined' && L && defaultIcon && (
            <MapContainer
              center={center}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Lingkaran radius */}
              <LeafletCircle
                center={center}
                radius={radiusInMeters}
                pathOptions={{
                  color: isInRadius === false ? '#EF4444' : '#3B82F6',
                  fillColor: isInRadius === false ? '#FCA5A5' : '#60A5FA',
                  fillOpacity: 0.2,
                  weight: 2
                }}
              />
              
              {/* Marker lokasi penugasan */}
              <Marker
                position={center}
                icon={defaultIcon}
              >
                <Popup>
                  <div className="text-center">
                    <strong>{penugasan.nama_penugasan}</strong>
                    <br />
                    Radius: {radiusInMeters} meter
                    {penugasan.alamat && (
                      <>
                        <br />
                        <span className="text-xs text-gray-500">{penugasan.alamat}</span>
                      </>
                    )}
                  </div>
                </Popup>
              </Marker>

              {/* Marker lokasi user */}
              {userLocation && (
                <Marker
                  position={[userLocation.lat, userLocation.lon]}
                  icon={userIcon || defaultIcon}
                >
                  <Popup>
                    <div className="text-center">
                      <strong>Lokasi Anda</strong>
                      <br />
                      <span className="text-xs">
                        Jarak: {distance} meter dari lokasi penugasan
                      </span>
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          )}
          {(!L || !defaultIcon) && (
            <div className="flex items-center justify-center h-full bg-gray-100">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Memuat peta...</span>
            </div>
          )}
        </div>
      </div>

      {/* Informasi detail */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <MapPin size={16} className="text-red-500" />
          Detail Lokasi Penugasan
        </h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-gray-500">Nama Penugasan</p>
            <p className="font-medium text-gray-700">{penugasan.nama_penugasan}</p>
          </div>
          {penugasan.alamat && (
            <div>
              <p className="text-gray-500">Alamat</p>
              <p className="font-medium text-gray-700 truncate">{penugasan.alamat}</p>
            </div>
          )}
          <div>
            <p className="text-gray-500">Latitude</p>
            <p className="font-mono text-gray-700">{penugasan.latitude}</p>
          </div>
          <div>
            <p className="text-gray-500">Longitude</p>
            <p className="font-mono text-gray-700">{penugasan.longitude}</p>
          </div>
          <div className="col-span-2">
            <p className="text-gray-500 flex items-center gap-1">
              <LucideCircle size={12} className="text-blue-500" />
              Radius Absensi
            </p>
            <p className="font-medium text-gray-700">{radiusInMeters} meter</p>
          </div>
        </div>
      </div>
    </div>
  );
};