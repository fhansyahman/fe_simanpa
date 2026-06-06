// components/pegawai/dashboard/hooks/usePresensi.js
'use client';

import { useState, useEffect } from "react";
import { presensiAPI, penugasanAPI } from "@/lib/api";
import { useRouter } from "next/navigation";

export function usePresensi(user) {
  const [presensiHariIni, setPresensiHariIni] = useState({
    masuk: null,
    pulang: null,
    lokasi_masuk: null,
    lokasi_pulang: null
  });
  const [penugasanAktif, setPenugasanAktif] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    fetchPresensiHariIni();
    fetchPenugasanAktif();
  }, [user]);

  const fetchPenugasanAktif = async () => {
    try {
      const response = await penugasanAPI.getPenugasanAktif();
      if (response.data?.success && response.data?.data) {
        setPenugasanAktif(response.data.data);
      }
    } catch (err) {
      console.error("Error fetch penugasan aktif:", err);
      setPenugasanAktif(null);
    }
  };

  const fetchPresensiHariIni = async () => {
    try {
      const response = await presensiAPI.getHariIni();
      
      if (response.data?.data) {
        const data = response.data.data;
        setPresensiHariIni({
          masuk: data.jam_masuk || data.masuk,
          pulang: data.jam_pulang || data.pulang,
          lokasi_masuk: data.lokasi_masuk || data.latitude_masuk,
          lokasi_pulang: data.lokasi_pulang || data.latitude_pulang
        });
      }
    } catch (err) {
      console.error("Error fetch presensi:", err);
      await fetchPresensiFromRiwayat();
    }
  };

  const fetchPresensiFromRiwayat = async () => {
    try {
      const today = new Date();
      const bulan = today.getMonth() + 1;
      const tahun = today.getFullYear();
      
      const response = await presensiAPI.getRiwayat(bulan, tahun);
      const data = response.data?.data || response.data;
      
      if (Array.isArray(data)) {
        const todayStr = today.toISOString().split('T')[0];
        const todayPresensi = data.find(p => 
          p.tanggal?.split('T')[0] === todayStr
        );
        
        if (todayPresensi) {
          setPresensiHariIni({
            masuk: todayPresensi.jam_masuk,
            pulang: todayPresensi.jam_pulang,
            lokasi_masuk: todayPresensi.latitude_masuk,
            lokasi_pulang: todayPresensi.latitude_pulang
          });
        }
      }
    } catch (error) {
      console.error("Fallback presensi gagal:", error);
    }
  };

  // Fungsi untuk menghitung jarak antara dua titik (Haversine formula) - dalam meter
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius bumi dalam km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c * 1000; // Konversi ke meter
  };

  // Fungsi untuk cek lokasi user dalam radius penugasan
  const checkLocationInRadius = (userLat, userLon, penugasan) => {
    if (!penugasan || !penugasan.latitude || !penugasan.longitude) {
      return { isValid: true, message: "Tidak ada batasan radius" };
    }

    const distance = calculateDistance(
      userLat, userLon,
      parseFloat(penugasan.latitude),
      parseFloat(penugasan.longitude)
    );

    const radius = penugasan.radius || 100;
    const isValid = distance <= radius;

    return {
      isValid,
      distance: Math.round(distance),
      radius,
      message: isValid 
        ? `Anda berada dalam radius absensi (${Math.round(distance)}m dari lokasi)`
        : `Anda berada di luar radius absensi (${Math.round(distance)}m dari lokasi, maksimal ${radius}m)`
    };
  };

  const submitPresensi = async (type, data) => {
    setIsLoading(true);
    try {
      const payload = {
        user_id: user.id,
        ...data
      };

      // Validasi lokasi dengan radius sebelum submit
      if (payload[`latitude_${type}`] && penugasanAktif && penugasanAktif.latitude) {
        const locationCheck = checkLocationInRadius(
          payload[`latitude_${type}`],
          payload[`longitude_${type}`],
          penugasanAktif
        );

        if (!locationCheck.isValid) {
          return { 
            success: false, 
            error: locationCheck.message,
            distance: locationCheck.distance,
            maxRadius: locationCheck.radius
          };
        }
      }

      let response;
      if (type === "masuk") {
        response = await presensiAPI.masuk(payload);
      } else {
        response = await presensiAPI.pulang(payload);
      }

      await fetchPresensiHariIni();
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Gagal absen:", error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusKehadiran = () => {
    if (!presensiHariIni.masuk) return "Belum Absen";
    if (!presensiHariIni.pulang) return "Sedang Bekerja";
    return "Selesai Bekerja";
  };

  return {
    presensiHariIni,
    penugasanAktif,
    isLoading,
    submitPresensi,
    getStatusKehadiran,
    refreshPresensi: fetchPresensiHariIni,
    checkLocationInRadius,
    calculateDistance
  };
}