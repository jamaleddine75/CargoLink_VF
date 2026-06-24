import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Card } from "@/components/ui/card";
import { Maximize, Zap, ZapOff } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  fps?: number;
  qrbox?: number;
  aspectRatio?: number;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ 
  onScan, 
  fps = 10, 
  qrbox = 250,
  aspectRatio = 1.0
}) => {
  const [isActive, setIsActive] = React.useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (!isActive) return;

    // Optimization to avoid multiple initializations
    if (!scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        { 
          fps, 
          qrbox: { width: qrbox, height: qrbox },
          aspectRatio,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13,
          ]
        },
        /* verbose= */ false
      );

      scannerRef.current.render(
        (decodedText) => {
          onScan(decodedText);
          if (navigator.vibrate) navigator.vibrate(100);
        },
        (error) => {
          // Silent for scan failures
        }
      );
    }

    return () => {
      if (scannerRef.current) {
        try {
          const scanner = scannerRef.current;
          scanner.clear().then(() => {
             console.log("Scanner cleared successfully");
          }).catch(err => {
             console.warn("Failed to clear scanner during unmount", err);
          });
        } catch (err) {
          console.error("Error during scanner cleanup", err);
        }
        scannerRef.current = null;
      }
    };
  }, [isActive, onScan, fps, qrbox, aspectRatio]);

  return (
    <div className="relative w-full max-w-md mx-auto overflow-hidden rounded-[32px] border-4 border-primary/20 bg-zinc-950 shadow-2xl min-h-[300px] flex items-center justify-center">
      {!isActive ? (
        <div className="text-center p-8 space-y-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto border-2 border-primary/20">
            <Maximize className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight">Scanner Barcode</h3>
            <p className="text-xs text-zinc-400 mt-2">Cliquez pour activer la caméra et scanner vos colis</p>
          </div>
          <Button 
            onClick={() => setIsActive(true)}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-black uppercase text-xs tracking-widest rounded-2xl"
          >
            Activer le Scanner
          </Button>
        </div>
      ) : (
        <>
          {/* Scanner Container */}
          <div id="qr-reader" className="w-full" />
          
          {/* Premium Overlay */}
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
            <div 
              className="border-2 border-primary rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"
              style={{ width: qrbox, height: qrbox }}
            />
            <div className="mt-4 px-4 py-2 bg-primary/90 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-sm shadow-lg">
              Alignez le code dans le cadre
            </div>
          </div>

          <Button 
            onClick={() => setIsActive(false)}
            variant="ghost"
            className="absolute top-4 right-4 h-8 w-8 p-0 rounded-full bg-black/50 text-white hover:bg-black/70"
          >
            <ZapOff className="w-4 h-4" />
          </Button>

          {/* Decorative corners */}
          <div className="absolute top-8 left-8 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl opacity-50" />
          <div className="absolute top-8 right-8 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl opacity-50" />
          <div className="absolute bottom-8 left-8 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl opacity-50" />
          <div className="absolute bottom-8 right-8 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl opacity-50" />
        </>
      )}
    </div>
  );
};

export default BarcodeScanner;
