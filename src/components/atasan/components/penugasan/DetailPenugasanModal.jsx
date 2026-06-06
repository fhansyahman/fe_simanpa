// components/penugasan/DetailPenugasanModal.jsx
'use client';
import { X, MapPin, Clock, Calendar, Users, Map, Navigation, Circle as LucideCircle, Loader, Maximize2 } from "lucide-react";
import { useState } from 'react';
import dynamic from 'next/dynamic';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

// Dynamic import untuk menghindari SSR issues dengan Leaflet
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

export const DetailPenugasanModal = ({ isOpen, onClose, penugasan, loading = false }) => {
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
        <div className="relative min-h-screen flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl p-8">
            <div className="flex flex-col items-center justify-center py-12">
              <Loader className="w-12 h-12 text-blue-500 animate-spin" />
              <p className="mt-4 text-gray-600">Memuat detail penugasan...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!penugasan) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    return timeString.substring(0, 5);
  };

  const getStatusBadge = () => {
    if (penugasan.status === 'aktif' && penugasan.is_active === 1) {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Aktif</span>;
    } else if (penugasan.status === 'selesai') {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Selesai</span>;
    } else if (penugasan.status === 'dibatalkan') {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800">Dibatalkan</span>;
    }
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Nonaktif</span>;
  };

  const getTipeBadge = () => {
    if (penugasan.tipe_penugasan === 'default') {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Default System</span>;
    }
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Khusus</span>;
  };

  // Komponen map view
  const MapView = ({ latitude, longitude, radius, locationName }) => {
    const [L, setL] = useState(null);
    const [defaultIcon, setDefaultIcon] = useState(null);

    useState(() => {
      import('leaflet').then((leaflet) => {
        setL(leaflet.default);
        setDefaultIcon(leaflet.default.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        }));
      });
    }, []);

    const center = [parseFloat(latitude), parseFloat(longitude)];
    const radiusInMeters = parseFloat(radius);

    if (!latitude || !longitude) {
      return (
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <Map size={48} className="text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">Koordinat lokasi tidak tersedia</p>
        </div>
      );
    }

    return (
      <div className="relative">
        <div style={{ height: isMapFullscreen ? '70vh' : '400px' }} className="rounded-lg overflow-hidden border border-gray-200">
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
              <LeafletCircle
                center={center}
                radius={radiusInMeters}
                pathOptions={{
                  color: '#3B82F6',
                  fillColor: '#60A5FA',
                  fillOpacity: 0.2,
                  weight: 2
                }}
              />
              <Marker
                position={center}
                icon={defaultIcon}
              >
                <Popup>
                  <div className="text-center">
                    <strong>{locationName || 'Lokasi Penugasan'}</strong>
                    <br />
                    Radius: {radiusInMeters} meter
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          )}
          {(!L || !defaultIcon) && (
            <div className="flex items-center justify-center h-full bg-gray-100">
              <Loader className="w-8 h-8 text-blue-500 animate-spin" />
              <span className="ml-2 text-gray-600">Memuat peta...</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setIsMapFullscreen(!isMapFullscreen)}
          className="absolute top-2 right-2 bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors z-10"
          title={isMapFullscreen ? "Kecilkan" : "Perbesar"}
        >
          <Maximize2 size={16} className="text-gray-600" />
        </button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className={`relative bg-white rounded-2xl shadow-xl w-full max-w-4xl transition-all duration-300 ${
          isMapFullscreen ? 'max-w-6xl' : ''
        } max-h-[90vh] overflow-y-auto`}>
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Detail Penugasan</h2>
              <p className="text-sm text-gray-500 mt-1">{penugasan.kode_penugasan}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Informasi Umum */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Nama Penugasan</h3>
                  <p className="text-gray-900 font-medium">{penugasan.nama_penugasan}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Tipe Penugasan</h3>
                  {getTipeBadge()}
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
                  {getStatusBadge()}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Waktu Kerja</h3>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock size={16} className="text-blue-500" />
                      <span>Jam Masuk: {formatTime(penugasan.jam_masuk)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock size={16} className="text-orange-500" />
                      <span>Jam Pulang: {formatTime(penugasan.jam_pulang)}</span>
                    </div>
                    {/* TAMBAHKAN BATAS AKHIR PULANG */}
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock size={16} className="text-red-500" />
                      <span>Batas Akhir Pulang: {formatTime(penugasan.batas_akhir_pulang)}</span>
                      <span className="text-xs text-red-400 ml-1">(TIDAK ADA TOLERANSI)</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock size={16} className="text-yellow-500" />
                      <span>Toleransi Masuk: {formatTime(penugasan.toleransi_keterlambatan)}</span>
                    </div>
                    {penugasan.batas_terlambat && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Clock size={16} className="text-red-500" />
                        <span>Batas Terlambat Masuk: {formatTime(penugasan.batas_terlambat)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Informasi Khusus (hanya untuk penugasan khusus) */}
            {penugasan.tipe_penugasan === 'khusus' && (
              <>
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Calendar size={18} className="text-blue-500" />
                    Periode Penugasan
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Tanggal Mulai</p>
                        <p className="text-gray-800 font-medium">{formatDate(penugasan.tanggal_mulai)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Tanggal Selesai</p>
                        <p className="text-gray-800 font-medium">{formatDate(penugasan.tanggal_selesai)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lokasi dengan Map View */}
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <MapPin size={18} className="text-red-500" />
                    Lokasi Penugasan
                  </h3>
                  
                  {/* Map View */}
                  <div className="mb-4">
                    <MapView 
                      latitude={penugasan.latitude}
                      longitude={penugasan.longitude}
                      radius={penugasan.radius}
                      locationName={penugasan.nama_penugasan}
                    />
                  </div>

                  {/* Detail Lokasi */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Alamat</p>
                      <p className="text-gray-800">{penugasan.alamat || '-'}</p>
                    </div>
                    
                    {penugasan.maps_link && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Google Maps Link</p>
                        <a 
                          href={penugasan.maps_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                        >
                          <Map size={14} />
                          Buka di Google Maps
                        </a>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm text-gray-500">Latitude</p>
                        <p className="text-gray-800 font-mono text-sm">{penugasan.latitude || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Longitude</p>
                        <p className="text-gray-800 font-mono text-sm">{penugasan.longitude || '-'}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <LucideCircle size={12} className="text-green-500" />
                        Radius Absensi
                      </p>
                      <p className="text-gray-800">{penugasan.radius} meter</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Penugasan Default Info */}
            {penugasan.tipe_penugasan === 'default' && (
              <div className="border-t border-gray-200 pt-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-800">Penugasan Default System</p>
                      <p className="text-sm text-blue-600 mt-1">
                        Penugasan ini akan digunakan sebagai standar untuk seluruh pegawai jika tidak ada penugasan khusus yang aktif.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* User Assignment */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Users size={18} className="text-purple-500" />
                Pekerja yang Ditugaskan
              </h3>
              
              {(() => {
                const assignedUsers = penugasan.assigned_users || 
                                     penugasan.data?.assigned_users || 
                                     [];
                
                if (assignedUsers && assignedUsers.length > 0) {
                  return (
                    <div className="bg-gray-50 rounded-lg divide-y divide-gray-200">
                      {assignedUsers.map((user) => (
                        <div key={user.id} className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-800">{user.nama}</p>
                              <div className="flex flex-wrap gap-2 mt-1">
                                <span className="text-xs text-gray-500">{user.jabatan || 'Pegawai'}</span>
                                {user.wilayah_penugasan && (
                                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                    {user.wilayah_penugasan}
                                  </span>
                                )}
                                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                                  {user.tipe_assign === 'individu' ? 'Penugasan Individu' : 'Penugasan Wilayah'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                } else {
                  return (
                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                      <Users size={40} className="text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">Tidak ada pekerja yang ditugaskan</p>
                      {penugasan.user_ids && (
                        <p className="text-xs text-gray-400 mt-2">
                          ID User: {penugasan.user_ids} | Wilayah: {penugasan.wilayah_names}
                        </p>
                      )}
                    </div>
                  );
                }
              })()}
            </div>

            {/* Metadata */}
            <div className="border-t border-gray-200 pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Dibuat pada</p>
                  <p className="text-gray-700">{new Date(penugasan.created_at).toLocaleString('id-ID')}</p>
                </div>
                <div>
                  <p className="text-gray-500">Terakhir diupdate</p>
                  <p className="text-gray-700">{new Date(penugasan.updated_at).toLocaleString('id-ID')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};