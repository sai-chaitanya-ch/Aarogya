import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, X, Check, Image as ImageIcon, Sparkles } from 'lucide-react';

interface LiveCameraScannerProps {
  onCapture: (imageBlob: Blob, previewUrl: string) => void;
  onCancel: () => void;
  onSelectFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const LiveCameraScanner: React.FC<LiveCameraScannerProps> = ({
  onCapture,
  onCancel,
  onSelectFile
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const startCamera = async () => {
    try {
      setCameraError(null);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      setCameraError(err.name === 'NotAllowedError' 
        ? 'Camera permission denied. Please allow camera access in your browser settings or upload a file.' 
        : 'Unable to start camera. You can upload an image or PDF instead.');
      setCameraActive(false);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  const handleCaptureSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    canvas.toBlob((blob) => {
      if (blob) {
        setCapturedBlob(blob);
        setCapturedUrl(dataUrl);
      }
    }, 'image/jpeg', 0.92);
  };

  const handleConfirm = () => {
    if (capturedBlob && capturedUrl) {
      onCapture(capturedBlob, capturedUrl);
    }
  };

  const handleRetake = () => {
    setCapturedBlob(null);
    setCapturedUrl(null);
    startCamera();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between text-white p-4">
      {/* Top Header */}
      <div className="flex items-center justify-between z-10 pt-2">
        <button
          onClick={onCancel}
          className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <span className="font-extrabold text-xs uppercase tracking-wider bg-black/40 px-3 py-1 rounded-full backdrop-blur-md">
          {capturedUrl ? 'Review Document Photo' : 'Align Medical Document'}
        </span>
        <button
          onClick={() => setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')}
          className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white transition-colors"
          title="Flip camera"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Main Viewfinder / Photo Preview */}
      <div className="relative flex-1 my-4 rounded-3xl overflow-hidden bg-slate-900 flex items-center justify-center">
        {capturedUrl ? (
          <img src={capturedUrl} alt="Captured" className="w-full h-full object-contain" />
        ) : cameraActive ? (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Guide overlay box for prescriptions */}
            <div className="absolute inset-8 border-2 border-dashed border-teal-400/80 rounded-2xl pointer-events-none flex flex-col justify-between p-3">
              <span className="text-[10px] font-bold text-teal-300 bg-black/60 px-2 py-0.5 rounded self-start">
                Align edges of prescription / report
              </span>
              <span className="text-[10px] font-bold text-teal-300 bg-black/60 px-2 py-0.5 rounded self-end">
                Hold steady & capture
              </span>
            </div>
          </>
        ) : (
          <div className="p-6 text-center space-y-3 max-w-xs">
            <Camera className="w-12 h-12 text-slate-500 mx-auto" />
            <p className="text-xs text-slate-300">
              {cameraError || 'Initializing device camera...'}
            </p>
            <label className="inline-block px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold text-xs cursor-pointer shadow-md">
              <span>Choose File / PDF Instead</span>
              <input type="file" accept="image/*,application/pdf" onChange={onSelectFile} className="hidden" />
            </label>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Bottom Control Bar */}
      <div className="pb-4 flex items-center justify-around z-10">
        {capturedUrl ? (
          <div className="flex items-center gap-4 w-full justify-center">
            <button
              onClick={handleRetake}
              className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-2xl font-bold text-xs backdrop-blur-md"
            >
              Retake Photo
            </button>
            <button
              onClick={handleConfirm}
              className="px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black text-xs shadow-lg flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Use This Photo</span>
            </button>
          </div>
        ) : (
          <>
            {/* Gallery Upload Button */}
            <label className="p-3.5 bg-white/20 hover:bg-white/30 rounded-full cursor-pointer backdrop-blur-md transition-colors" title="Upload from files">
              <ImageIcon className="w-5 h-5 text-white" />
              <input type="file" accept="image/*,application/pdf" onChange={onSelectFile} className="hidden" />
            </label>

            {/* Shutter Button */}
            <button
              onClick={handleCaptureSnapshot}
              disabled={!cameraActive}
              className="w-18 h-18 rounded-full border-4 border-white flex items-center justify-center p-1 active:scale-90 transition-transform disabled:opacity-40"
            >
              <div className="w-full h-full bg-teal-500 rounded-full shadow-inner" />
            </button>

            {/* AI helper pill */}
            <div className="flex items-center gap-1 text-[11px] font-bold text-teal-300 bg-white/10 px-3 py-2 rounded-full backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Auto OCR</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
