// components/pegawai/dashboard/PresenceCamera.js (DENGAN MAP SATELIT - FIXED ZOOM OUT)

"use client";

import { useState, useRef, useEffect } from "react";
import { Camera } from "lucide-react";

export default function PresenceCamera({ 
  onCapture, 
  onClose, 
  isOpen, 
  type,
  isSubmitting = false,
  locationData,
  onConfirm,
  showConfirm = false
}) {
  const [stream, setStream] = useState(null);
  const [foto, setFoto] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const playPromiseRef = useRef(null);
  const isMounted = useRef(true);

  // Load Leaflet dan leaflet-image
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const loadLeaflet = async () => {
      try {
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        if (!window.L) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        if (!window.leafletImage) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet-image@0.4.0/leaflet-image.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        console.log('✅ Leaflet loaded');
      } catch (error) {
        console.error('❌ Error loading Leaflet:', error);
      }
    };

    loadLeaflet();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      stopCamera();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Hentikan kamera saat modal ditutup
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setFoto(null);
      setCameraError(null);
      setIsVideoReady(false);
      setIsMapReady(false);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    }
  }, [isOpen]);

  // Mulai kamera saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (isMounted.current) {
          startCamera();
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Inisialisasi peta saat lokasi tersedia dan Leaflet sudah load
  useEffect(() => {
    if (isOpen && locationData?.coords?.lat && locationData?.coords?.lon && window.L) {
      const timer = setTimeout(() => {
        if (isMounted.current) {
          initMap(locationData.coords.lat, locationData.coords.lon);
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, locationData?.coords?.lat, locationData?.coords?.lon]);

  const stopCamera = () => {
    try {
      if (playPromiseRef.current) {
        playPromiseRef.current.then(() => {}).catch(() => {});
        playPromiseRef.current = null;
      }

      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
        setStream(null);
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      
      setIsVideoReady(false);
    } catch (err) {
      console.warn("Gagal stop camera:", err);
    }
  };

  const playVideo = async (videoElement) => {
    if (!videoElement) return;
    
    try {
      if (playPromiseRef.current) {
        await playPromiseRef.current.catch(() => {});
        playPromiseRef.current = null;
      }

      const playPromise = videoElement.play();
      playPromiseRef.current = playPromise;
      
      await playPromise;
      
      if (isMounted.current) {
        setIsVideoReady(true);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error playing video:', error);
        if (isMounted.current) {
          setCameraError('Gagal memutar video kamera');
        }
      }
    }
  };

  const startCamera = async () => {
    try {
      if (!isMounted.current) return null;
      
      setIsLoading(true);
      setCameraError(null);
      setIsVideoReady(false);
      
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Browser tidak mendukung akses kamera.");
        setIsLoading(false);
        return null;
      }
      
      stopCamera();
      
      const constraints = {
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: { exact: "user" }
        },
        audio: false
      };
      
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (!isMounted.current) {
        newStream.getTracks().forEach(track => track.stop());
        return null;
      }
      
      setStream(newStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await playVideo(videoRef.current);
      }
      
      setIsLoading(false);
      return newStream;
      
    } catch (error) {
      console.error("Error mengakses kamera:", error);
      
      if (error.name === 'OverconstrainedError') {
        try {
          const fallbackConstraints = {
            video: { 
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: "user"
            },
            audio: false
          };
          
          const fallbackStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
          
          if (isMounted.current) {
            setStream(fallbackStream);
            if (videoRef.current) {
              videoRef.current.srcObject = fallbackStream;
              await playVideo(videoRef.current);
            }
            setIsLoading(false);
            return fallbackStream;
          }
        } catch (fallbackError) {
          console.error("Fallback gagal:", fallbackError);
          if (isMounted.current) {
            setCameraError("Tidak dapat mengakses kamera depan.");
          }
        }
      } else {
        if (isMounted.current) {
          setCameraError("Tidak dapat mengakses kamera.");
        }
      }
      
      setIsLoading(false);
      return null;
    }
  };

  const initMap = (lat, lon) => {
    if (!window.L || mapInstanceRef.current) return;
    
    try {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const oldContainer = document.getElementById('hidden-map-container');
      if (oldContainer) {
        oldContainer.remove();
      }
      
      const mapDiv = document.createElement('div');
      mapDiv.id = 'hidden-map-container';
      mapDiv.style.width = '300px';
      mapDiv.style.height = '300px';
      mapDiv.style.position = 'absolute';
      mapDiv.style.top = '-9999px';
      mapDiv.style.left = '-9999px';
      mapDiv.style.visibility = 'hidden';
      document.body.appendChild(mapDiv);
      
      const map = window.L.map(mapDiv, { 
        attributionControl: false, 
        zoomControl: false 
      }).setView([lat, lon], 17); // Zoom sedikit lebih jauh
      
      window.L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: 'Google Satellite'
      }).addTo(map);
      
      window.L.marker([lat, lon]).addTo(map);
      
      mapInstanceRef.current = map;
      
      setTimeout(() => {
        if (isMounted.current) {
          setIsMapReady(true);
          console.log('✅ Map ready');
        }
      }, 1500);
      
    } catch (error) {
      console.error('Error init map:', error);
      setIsMapReady(true);
    }
  };

  const renderMapToCanvas = () => {
    return new Promise((resolve) => {
      if (!mapInstanceRef.current || !window.leafletImage) {
        resolve(null);
        return;
      }
      
      try {
        window.leafletImage(mapInstanceRef.current, (err, mapCanvas) => {
          if (err) {
            console.error('Gagal render peta:', err);
            resolve(null);
          } else {
            resolve(mapCanvas);
          }
        });
      } catch (error) {
        console.error('Error rendering map:', error);
        resolve(null);
      }
    });
  };

  const extractLocationDetails = (alamatArray) => {
    if (!alamatArray || alamatArray.length === 0) {
      return {
        kecamatan: "-",
        kabupaten: "-",
        provinsi: "-",
        negara: "-",
        jalan: "-",
        koordinat: "-"
      };
    }

    let kecamatan = "-";
    let kabupaten = "-";
    let provinsi = "-";
    let negara = "-";
    let jalan = "-";
    let koordinat = "-";

    alamatArray.forEach(line => {
      if (line.includes("Kecamatan:")) {
        kecamatan = line.replace("Kecamatan:", "").trim();
      } else if (line.includes("Kabupaten:")) {
        kabupaten = line.replace("Kabupaten:", "").trim();
      } else if (line.includes("Provinsi:")) {
        provinsi = line.replace("Provinsi:", "").trim();
      } else if (line.includes("Negara:")) {
        negara = line.replace("Negara:", "").trim();
      } else if (line.includes("Jalan:")) {
        jalan = line.replace("Jalan:", "").trim();
      } else if (line.includes("Koordinat:")) {
        koordinat = line.replace("Koordinat:", "").trim();
      }
    });

    return { kecamatan, kabupaten, provinsi, negara, jalan, koordinat };
  };

  // Ambil foto dengan map satelit
  const ambilFotoDenganLokasi = async () => {
    if (!videoRef.current || !canvasRef.current) {
      alert("Kamera tidak tersedia");
      return;
    }
    
    if (!stream || !isVideoReady) {
      alert("Stream kamera belum siap");
      return;
    }

    if (!locationData?.coords) {
      alert("Data lokasi belum tersedia");
      return;
    }
    
    setIsCapturing(true);
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      
      // Ukuran canvas yang lebih proporsional - 4:3
      canvas.width = 480;
      canvas.height = 360;
      
      // Gambar video dengan ukuran yang sesuai
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Render peta (jika siap) - ukuran lebih kecil dan proporsional
      const mapCanvas = await renderMapToCanvas();
      
      if (mapCanvas && isMapReady) {
        // Ukuran peta lebih kecil agar tidak menutupi wajah
        const mapSize = 100;
        const rightMargin = 10;
        const bottomMargin = 10;
        
        ctx.drawImage(
          mapCanvas, 
          canvas.width - mapSize - rightMargin, 
          canvas.height - mapSize - bottomMargin, 
          mapSize, 
          mapSize
        );
        
        // Border putih tipis
        ctx.strokeStyle = "rgba(255,255,255,0.8)";
        ctx.lineWidth = 2;
        ctx.strokeRect(
          canvas.width - mapSize - rightMargin, 
          canvas.height - mapSize - bottomMargin, 
          mapSize, 
          mapSize
        );
      }

      // ===== OVERLAY TEKS DI KIRI BAWAH =====
      const locationDetails = locationData.alamat 
        ? extractLocationDetails(locationData.alamat)
        : { kecamatan: "-", kabupaten: "-", provinsi: "-", negara: "-", jalan: "-", koordinat: "-" };
      
      const now = new Date();
      const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      const dayName = days[now.getDay()];
      
      const date = now.getDate().toString().padStart(2, '0');
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const year = now.getFullYear();
      
      let hour = now.getHours();
      const minute = now.getMinutes().toString().padStart(2, '0');
      const second = now.getSeconds().toString().padStart(2, '0');
      const ampm = hour >= 12 ? 'PM' : 'AM';
      hour = hour % 12 || 12;
      
      // Background semi-transparan untuk teks
      const textBgHeight = 75;
      const textBgWidth = canvas.width - 20;
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.roundRect(10, canvas.height - textBgHeight - 10, textBgWidth, textBgHeight, 5);
      ctx.fill();
      
      // Teks di atas background
      const leftMargin = 20;
      let yPos = canvas.height - textBgHeight + 5;
      
      // Baris 1: Lokasi
      ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
      ctx.shadowBlur = 2;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      
      ctx.font = "bold 11px Arial, sans-serif";
      ctx.fillStyle = "#FFFFFF";
      
      let locationText = "";
      if (locationDetails.kecamatan !== "-") {
        locationText = `${locationDetails.kecamatan}, ${locationDetails.kabupaten}`;
      } else if (locationData.alamat && locationData.alamat.length > 0) {
        locationText = locationData.alamat[0]?.substring(0, 30) || "Indonesia";
      } else {
        locationText = `${locationData.coords.lat.toFixed(6)}°, ${locationData.coords.lon.toFixed(6)}°`;
      }
      ctx.fillText(locationText, leftMargin, yPos);
      
      // Baris 2: Koordinat
      yPos += 15;
      ctx.font = "9px Arial, sans-serif";
      ctx.fillStyle = "#FFD700";
      const coordText = `${locationData.coords.lat.toFixed(6)}°, ${locationData.coords.lon.toFixed(6)}°`;
      ctx.fillText(coordText, leftMargin, yPos);
      
      // Baris 3: Tanggal dan Waktu
      yPos += 14;
      ctx.font = "bold 9px Arial, sans-serif";
      ctx.fillStyle = "#4CAF50";
      const waktuFormat = `${dayName}, ${date}/${month}/${year} ${hour}:${minute}:${second} ${ampm}`;
      ctx.fillText(waktuFormat, leftMargin, yPos);
      
      // Baris 4: Status
      yPos += 14;
      ctx.font = "bold 10px Arial, sans-serif";
      ctx.fillStyle = type === "masuk" ? "#4CAF50" : "#FF9800";
      const statusText = `${type === "masuk" ? "CHECK IN" : "CHECK OUT"} - ${locationData.user?.nama || "Karyawan"}`;
      ctx.fillText(statusText, leftMargin, yPos);
      
      // Hapus shadow
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      
      // Konversi ke data URL dengan kualitas tinggi
      const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
      setFoto(dataUrl);
      
      if (onCapture) {
        onCapture(dataUrl);
      }
      
      stopCamera();
      
    } catch (error) {
      console.error("Error mengambil foto:", error);
      alert("Gagal mengambil foto. Silakan coba lagi.");
    } finally {
      setIsCapturing(false);
    }
  };

  // Polyfill roundRect untuk browser yang tidak support
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
      if (r > w/2) r = w/2;
      if (r > h/2) r = h/2;
      this.beginPath();
      this.moveTo(x + r, y);
      this.lineTo(x + w - r, y);
      this.quadraticCurveTo(x + w, y, x + w, y + r);
      this.lineTo(x + w, y + h - r);
      this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      this.lineTo(x + r, y + h);
      this.quadraticCurveTo(x, y + h, x, y + h - r);
      this.lineTo(x, y + r);
      this.quadraticCurveTo(x, y, x + r, y);
      this.closePath();
      return this;
    };
  }

  const handleRetake = () => {
    setFoto(null);
    setCameraError(null);
    setIsVideoReady(false);
    
    if (onCapture) {
      onCapture(null);
    }
    
    setTimeout(() => {
      if (isMounted.current) {
        startCamera();
      }
    }, 100);
  };

  const handleConfirm = () => {
    if (onConfirm && foto) {
      onConfirm();
    }
  };

  if (!isOpen) return null;

  const canTakePhoto = isVideoReady && !isLoading && !cameraError && locationData?.coords;

  return (
    <div className="bg-white rounded-xl p-3 w-full max-w-xs mx-auto">
      <div className="text-center mb-2">
        <h3 className="text-sm font-semibold text-slate-700">
          {type === "masuk" ? "Check In" : "Check Out"}
        </h3>
        <p className="text-[10px] text-slate-500">
          {new Date().toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
          })}
        </p>
        {locationData?.coords && (
          <p className="text-[9px] text-green-600 mt-0.5 flex items-center justify-center gap-1">
            <span>📍 Lokasi terverifikasi</span>
            {isMapReady && <span className="text-blue-500">· Peta siap</span>}
          </p>
        )}
      </div>

      {!foto ? (
        <>
          <div className="relative bg-slate-100 rounded-lg overflow-hidden" style={{ maxHeight: '320px' }}>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              className="w-full h-auto object-cover"
              style={{ maxHeight: '320px' }}
            />
            
            {(isLoading || !isVideoReady) && !cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto mb-1"></div>
                  <p className="text-[10px]">
                    {isLoading ? "Menyiapkan kamera..." : "Memuat video..."}
                  </p>
                </div>
              </div>
            )}
            
            {cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-white text-center p-3">
                  <p className="text-[10px] mb-1.5">{cameraError}</p>
                  <button
                    onClick={startCamera}
                    className="px-2.5 py-1 bg-blue-600 text-white text-[10px] rounded-lg"
                  >
                    Coba Lagi
                  </button>
                </div>
              </div>
            )}

            {locationData?.coords && !isMapReady && !cameraError && isVideoReady && (
              <div className="absolute bottom-1.5 right-1.5 bg-black/70 rounded px-1.5 py-0.5">
                <div className="animate-spin rounded-full h-1.5 w-1.5 border-b border-white inline-block mr-1"></div>
                <span className="text-white text-[8px]">Memuat peta...</span>
              </div>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />
          
          <div className="mt-2.5 flex justify-center">
            <button
              onClick={ambilFotoDenganLokasi}
              disabled={!canTakePhoto || isCapturing}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs text-white font-medium ${
                canTakePhoto && !isCapturing
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800" 
                  : "bg-slate-400 cursor-not-allowed"
              }`}
            >
              <Camera size={14} /> 
              {isCapturing ? "Memproses..." : "Ambil Foto"}
            </button>
          </div>

          {!isMapReady && locationData?.coords && isVideoReady && (
            <p className="text-[8px] text-center text-amber-600 mt-1">
              ⏳ Peta sedang dimuat, foto tetap bisa diambil
            </p>
          )}
        </>
      ) : (
        <>
          <div className="relative bg-slate-100 rounded-lg overflow-hidden" style={{ maxHeight: '320px' }}>
            <img 
              src={foto} 
              alt="Preview" 
              className="w-full h-auto object-cover"
              style={{ maxHeight: '320px' }}
            />
          </div>
          
          <p className="mt-1.5 text-[10px] text-center text-green-600">
            📍 Foto dengan peta berhasil diambil
          </p>
        </>
      )}

      <div className="mt-3 flex justify-between gap-2">
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="flex-1 px-2.5 py-1.5 text-[10px] bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium"
        >
          Batal
        </button>
        
        {foto && (
          <button
            onClick={handleRetake}
            disabled={isSubmitting}
            className="flex-1 px-2.5 py-1.5 text-[10px] bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium"
          >
            Ambil Ulang
          </button>
        )}
      </div>

      {/* Tombol Konfirmasi */}
      {showConfirm && foto && (
        <div className="mt-2.5">
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="w-full px-3 py-2 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                Memproses...
              </span>
            ) : (
              `Konfirmasi ${type === "masuk" ? "Check In" : "Check Out"}`
            )}
          </button>
        </div>
      )}
    </div>
  );
}