import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
  hideOverlay?: boolean;
}

const QRScanner = ({ isOpen, onClose, onScan, hideOverlay = false }: QRScannerProps) => {
  const [error, setError] = useState<string | null>(null);

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.15);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.2);
    } catch (e) {
      console.warn('Audio beep failed', e);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true },
      false
    );

    scanner.render(
      (decodedText) => {
        playBeep();
        scanner.clear();
        onScan(decodedText);
        if (!hideOverlay) onClose();
      },
      (err) => {}
    );

    return () => {
      scanner.clear().catch(e => console.error('Failed to clear scanner', e));
    };
  }, [isOpen, onScan, onClose, hideOverlay]);

  if (!isOpen) return null;

  const content = (
    <div className={hideOverlay ? "w-full h-full flex flex-col" : "w-full max-w-sm flex flex-col items-center"}>
      {!hideOverlay && (
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
             <QrCode className="w-8 h-8 text-blue-500" />
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-widest">Scanner le Ticket</h2>
          <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-2">Placez le QR Code dans le cadre</p>
        </div>
      )}
      
      <div className={hideOverlay ? "w-full h-full" : "w-full bg-white/5 p-4 rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl"}>
        <div id="qr-reader" className={`w-full overflow-hidden bg-black ${hideOverlay ? "h-full" : "rounded-[1.5rem]"}`}></div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        #qr-reader { border: none !important; }
        #qr-reader__scan_region { min-height: 250px; }
        #qr-reader img { display: none !important; }
        #qr-reader__dashboard_section_csr button {
          background: #3b82f6 !important;
          color: white !important;
          border: none !important;
          padding: 12px 24px !important;
          border-radius: 14px !important;
          font-weight: 900 !important;
          text-transform: uppercase !important;
          font-size: 10px !important;
          letter-spacing: 2px !important;
          margin-top: 15px !important;
          box-shadow: 0 10px 20px rgba(59, 130, 246, 0.2) !important;
        }
        #qr-reader__dashboard_section_swaplink { color: #60a5fa !important; text-decoration: none !important; margin-top: 15px !important; display: block; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; }
      `}} />
    </div>
  );

  if (hideOverlay) return content;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm p-6"
    >
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/20 text-white"
      >
        <X className="w-6 h-6" />
      </button>
      {content}
    </motion.div>
  );
};

export default QRScanner;
