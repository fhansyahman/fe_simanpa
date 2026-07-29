
"use client";

import { useState, useRef, useEffect } from "react";
import { Camera } from "lucide-react";

export default function PresenceCamera({ 
  onCapture, 
  onClose, 
  isOpen, 
  type,
  isSubmitting = false,
  locationData 
}) {
  const [stream, setStream] = useState(null);
  const [foto, setFoto] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [fotoOriginalSize, setFotoOriginalSize] = useState(null); // State untuk ukuran asli
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const playPromiseRef = useRef(null);
  const isMounted = useRef(true);

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

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setFoto(null);
      setFotoOriginalSize(null);
      setCameraError(null);
      setIsVideoReady(false);
      setIsMapReady(false);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    }
  }, [isOpen]);

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
          width: { ideal: 1280 },
          height: { ideal: 720 },
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
              width: { ideal: 1280 },
              height: { ideal: 720 },
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
      }).setView([lat, lon], 18);
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
        console.log('Map or leafletImage not ready, skipping map overlay');
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
      const videoWidth = video.videoWidth || 640;
      const videoHeight = video.videoHeight || 480;
      setFotoOriginalSize({ width: videoWidth, height: videoHeight });
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const mapCanvas = await renderMapToCanvas();
      if (mapCanvas && isMapReady) {
        const mapSize = Math.min(140, Math.floor(videoWidth * 0.15));
        const rightMargin = 15;
        const bottomMargin = 15;
        ctx.drawImage(
          mapCanvas, 
          canvas.width - mapSize - rightMargin, 
          canvas.height - mapSize - bottomMargin, 
          mapSize, 
          mapSize
        );
        ctx.strokeStyle = "white";
        ctx.lineWidth = 3;
        ctx.strokeRect(
          canvas.width - mapSize - rightMargin, 
          canvas.height - mapSize - bottomMargin, 
          mapSize, 
          mapSize
        );
      }
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
      ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      const leftMargin = 15;
      let yPos = canvas.height - 85;
      ctx.font = "bold 13px Arial, sans-serif";
      ctx.fillStyle = "#FFFFFF";
      
      let locationText = "";
      if (locationDetails.kecamatan !== "-") {
        locationText = `${locationDetails.kecamatan}, ${locationDetails.kabupaten}`;
      } else if (locationData.alamat && locationData.alamat.length > 0) {
        locationText = locationData.alamat[0]?.substring(0, 40) || "Indonesia";
      } else {
        locationText = `${locationData.coords.lat.toFixed(6)}°, ${locationData.coords.lon.toFixed(6)}°`;
      }
      ctx.fillText(locationText, leftMargin, yPos);
      yPos += 18;
      ctx.font = "11px Arial, sans-serif";
      ctx.fillStyle = "#FFD700";
      const coordText = `${locationData.coords.lat.toFixed(6)}°, ${locationData.coords.lon.toFixed(6)}°`;
      ctx.fillText(coordText, leftMargin, yPos);
      yPos += 18;
      ctx.font = "bold 11px Arial, sans-serif";
      ctx.fillStyle = "#4CAF50";
      const waktuFormat = `${dayName}, ${date}/${month}/${year} ${hour}:${minute}:${second} ${ampm}`;
      ctx.fillText(waktuFormat, leftMargin, yPos);
      yPos += 18;
      ctx.font = "bold 12px Arial, sans-serif";
      ctx.fillStyle = type === "masuk" ? "#4CAF50" : "#FF9800";
      const statusText = `${type === "masuk" ? "CHECK IN" : "CHECK OUT"} - ${locationData.user?.nama || "Karyawan"}`;
      ctx.fillText(statusText, leftMargin, yPos);
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
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

  const handleRetake = () => {
    setFoto(null);
    setFotoOriginalSize(null);
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

  if (!isOpen) return null;

  const canTakePhoto = isVideoReady && !isLoading && !cameraError && locationData?.coords;

  return (
    <div className="bg-white rounded-xl p-6 w-full max-w-md">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-slate-700">
          {type === "masuk" ? "Check In" : "Check Out"}
        </h3>
        <p className="text-sm text-slate-500">
          {new Date().toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
          })}
        </p>
        {locationData?.coords && (
          <p className="text-xs text-green-600 mt-1 flex items-center justify-center gap-1">
            <span>✅ Lokasi terverifikasi</span>
            {isMapReady && <span className="text-blue-500">• Peta siap</span>}
          </p>
        )}
      </div>

      {!foto ? (
        <>
          <div className="text-center mb-3">
            <div className="text-sm text-slate-600 bg-blue-50 inline-block px-3 py-1 rounded-full">
              Foto Selfie
            </div>
          </div>

          <div className="relative bg-slate-100 rounded-lg overflow-hidden">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              className="w-full aspect-[3/4] object-cover"
            />
            
            {(isLoading || !isVideoReady) && !cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p className="text-sm">
                    {isLoading ? "Menyiapkan kamera..." : "Memuat video..."}
                  </p>
                </div>
              </div>
            )}
            
            {cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-white text-center p-4">
                  <p className="text-sm mb-2">{cameraError}</p>
                  <button
                    onClick={startCamera}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg"
                  >
                    Coba Lagi
                  </button>
                </div>
              </div>
            )}

            {locationData?.coords && !isMapReady && !cameraError && isVideoReady && (
              <div className="absolute bottom-2 right-2 bg-black/70 rounded-lg px-2 py-1">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white inline-block mr-1"></div>
                <span className="text-white text-xs">Memuat peta...</span>
              </div>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />
          
          <div className="mt-4 flex justify-center">
            <button
              onClick={ambilFotoDenganLokasi}
              disabled={!canTakePhoto || isCapturing}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm text-white font-medium ${
                canTakePhoto && !isCapturing
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800" 
                  : "bg-slate-400 cursor-not-allowed"
              }`}
            >
              <Camera size={18} /> 
              {isCapturing ? "Memproses..." : "Ambil Foto"}
            </button>
          </div>

          {!isMapReady && locationData?.coords && isVideoReady && (
            <p className="text-xs text-center text-amber-600 mt-2">
              ⏳ Peta sedang dimuat, foto akan tetap bisa diambil
            </p>
          )}
        </>
      ) : (
        <>
          <div className="relative bg-slate-100 rounded-lg overflow-hidden">
            <img 
              src={foto} 
              alt="Preview" 
              className="w-full aspect-[3/4] object-contain bg-black" 
              style={{ maxHeight: '400px' }}
            />

          </div>
          
          <p className="mt-2 text-xs text-center text-green-600">
            ✅ Foto dengan lokasi berhasil diambil 
          </p>
        </>
      )}

      <div className="mt-6 flex justify-between gap-3">
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium"
        >
          Batal
        </button>
        
        {foto && (
          <button
            onClick={handleRetake}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium"
          >
            Ambil Ulang
          </button>
        )}
      </div>
    </div>
  );
}