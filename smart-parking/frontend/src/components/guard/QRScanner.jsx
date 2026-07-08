import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, FlipHorizontal } from 'lucide-react';

export default function QRScanner({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const [error, setError] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [currentCamera, setCurrentCamera] = useState(null);
  const [started, setStarted] = useState(false);
  const html5QrRef = useRef(null);

  useEffect(() => {
    // Get available cameras
    Html5Qrcode.getCameras()
      .then(devices => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back camera
          const back = devices.find(d =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('environment')
          );
          setCurrentCamera(back?.id || devices[devices.length - 1].id);
        } else {
          setError('No camera found on this device');
        }
      })
      .catch(() => setError('Camera permission denied. Please allow camera access.'));

    return () => {
      // Cleanup on unmount
      if (html5QrRef.current) {
        html5QrRef.current.stop().catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    if (!currentCamera || started) return;
    startScanner(currentCamera);
  }, [currentCamera]);

  const startScanner = async (cameraId) => {
    if (html5QrRef.current) {
      try { await html5QrRef.current.stop(); } catch {}
    }

    const html5Qr = new Html5Qrcode('qr-reader');
    html5QrRef.current = html5Qr;

    try {
      await html5Qr.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // QR scanned successfully
          html5Qr.stop().catch(() => {});
          onScan(decodedText);
        },
        () => {} // ignore scan errors (happens every frame until found)
      );
      setStarted(true);
      setError(null);
    } catch (err) {
      setError('Could not start camera: ' + err);
    }
  };

  const switchCamera = async () => {
    if (cameras.length < 2) return;
    const otherCamera = cameras.find(c => c.id !== currentCamera);
    if (otherCamera) {
      setStarted(false);
      setCurrentCamera(otherCamera.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900">
        <div>
          <p className="text-white font-semibold text-sm">Scan Owner's QR Code</p>
          <p className="text-gray-400 text-xs">Point camera at owner's phone screen</p>
        </div>
        <div className="flex items-center gap-2">
          {cameras.length > 1 && (
            <button
              onClick={switchCamera}
              className="p-2 bg-gray-700 rounded-lg text-white"
            >
              <FlipHorizontal size={18} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 bg-gray-700 rounded-lg text-white"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Scanner area */}
      <div className="flex-1 flex flex-col items-center justify-center bg-black">
        {error ? (
          <div className="text-center px-6">
            <Camera size={48} className="text-gray-600 mx-auto mb-3" />
            <p className="text-red-400 text-sm mb-4">{error}</p>
            <button
              onClick={onClose}
              className="bg-amber-500 text-black px-6 py-2 rounded-lg font-medium text-sm"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="w-full max-w-sm px-4">
            {/* QR Reader container */}
            <div
              id="qr-reader"
              className="w-full rounded-2xl overflow-hidden"
              style={{ minHeight: '300px' }}
            />

            {/* Guide text */}
            <div className="mt-4 text-center">
              <p className="text-gray-400 text-xs">
                Align the QR code within the frame
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Ask the vehicle owner to open their parking SMS link
              </p>
            </div>

            {/* Manual entry option */}
            <div className="mt-6 text-center">
              <p className="text-gray-600 text-xs mb-2">Can't scan?</p>
              <button
                onClick={() => {
                  const token = prompt('Enter session token manually:');
                  if (token) onScan(`${window.location.origin}/guard/verify/${token}`);
                }}
                className="text-amber-400 text-xs underline"
              >
                Enter token manually
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom hint */}
      <div className="bg-gray-900 px-4 py-3 text-center">
        <p className="text-gray-500 text-xs">
          Scanner will automatically detect the QR code
        </p>
      </div>
    </div>
  );
}