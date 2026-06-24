import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { Package, Truck, MapPin, Phone, Calendar, ShieldCheck, Zap, Scissors, Printer, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShippingLabelProps {
  order: any;
  isPrintMode?: boolean;
}

const ShippingLabel = ({ order, isPrintMode = true }: ShippingLabelProps) => {
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (barcodeRef.current && order?.trackingNumber) {
      JsBarcode(barcodeRef.current, order.trackingNumber, {
        format: 'CODE128',
        width: 2.5,
        height: 70,
        displayValue: true,
        fontSize: 18,
        fontOptions: 'bold',
        margin: 0,
        background: '#ffffff'
      });
    }
  }, [order?.trackingNumber]);

  if (!order) return null;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(order.trackingNumber || order.id)}&bgcolor=ffffff`;

  const handleManualPrint = () => {
    window.print();
  };

  return (
    <div className={cn(
      "shipping-label-root bg-white text-black font-sans relative select-none",
      isPrintMode ? "print-mode" : "preview-mode p-4 bg-slate-900/50 rounded-[2rem] border border-white/5 backdrop-blur-xl"
    )}>
      {/* Floating Print Button - Only visible in preview mode, hidden in print */}
      {!isPrintMode && (
        <div className="absolute top-4 right-4 z-20 flex gap-2">
           <button 
             onClick={handleManualPrint}
             className="bg-primary text-white p-3 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all"
           >
              <Printer className="w-5 h-5" />
           </button>
        </div>
      )}

      {/* Actual Label Area */}
      <div className={cn(
        "label-canvas bg-white text-black p-[5mm] box-border mx-auto flex flex-col",
        "w-[101.6mm] h-[152.4mm] min-w-[101.6mm] min-h-[152.4mm]"
      )}>
        
        <div className="border-[3pt] border-black h-full flex flex-col bg-white overflow-hidden">
          
          {/* Header Area */}
          <div className="flex border-b-[3pt] border-black h-[25mm]">
            <div className="w-[30%] border-r-[3pt] border-black flex flex-col items-center justify-center bg-black text-white p-1">
              <Zap className="w-8 h-8 mb-1 fill-primary text-primary" />
              <span className="text-[8pt] font-black uppercase tracking-widest italic">CargoLink</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
               <h1 className="text-[18pt] font-black uppercase tracking-[0.2em] leading-none mb-1">EXPRESS</h1>
               <div className="flex items-center gap-2">
                  <div className="h-[1pt] w-4 bg-black" />
                  <p className="text-[7pt] font-black uppercase tracking-widest">Courier Network</p>
                  <div className="h-[1pt] w-4 bg-black" />
               </div>
            </div>
            <div className="w-[20%] border-l-[3pt] border-black flex flex-col items-center justify-center">
               <p className="text-[6pt] font-black uppercase mb-1">Route</p>
               <h2 className="text-[22pt] font-black leading-none">A1</h2>
            </div>
          </div>

          {/* Large Zone Identifier */}
          <div className="flex border-b-[3pt] border-black h-[22mm]">
             <div className="w-[70%] p-4 flex flex-col justify-center">
                <span className="text-[8pt] font-bold text-gray-400 uppercase">Secteur / Sector</span>
                <h2 className="text-[24pt] font-black uppercase leading-none tracking-tighter">
                   {order.receiverCity ? order.receiverCity.toUpperCase() : 'DESTINATION'}
                </h2>
             </div>
             <div className="w-[30%] border-l-[3pt] border-black bg-gray-100 flex items-center justify-center">
                <p className="text-[32pt] font-black italic">{(order.receiverCity || 'X')[0].toUpperCase()}</p>
             </div>
          </div>

          {/* Info Grid */}
          <div className="flex border-b-[3pt] border-black h-[15mm] text-[8pt]">
             <div className="w-1/2 border-r-[3pt] border-black p-3 flex flex-col justify-center">
                <p className="font-bold text-gray-400 uppercase text-[6pt]">Date d'émission</p>
                <p className="font-black italic">{new Date().toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}</p>
             </div>
             <div className="w-1/2 p-3 flex flex-col justify-center text-right">
                <p className="font-bold text-gray-400 uppercase text-[6pt]">Service Level</p>
                <p className="font-black italic">SAMEDAY-EXPRESS</p>
             </div>
          </div>

          {/* Addresses Section */}
          <div className="flex-1 flex flex-col border-b-[3pt] border-black">
             {/* Sender (Compact) */}
             <div className="p-3 border-b-[1pt] border-dashed border-black bg-gray-50 flex justify-between items-center">
                <div className="min-w-0">
                   <p className="text-[6pt] font-black text-gray-400 uppercase">DE / FROM</p>
                   <p className="text-[9pt] font-black uppercase truncate">{order.senderName || 'CL-HUB-01'}</p>
                </div>
                <p className="text-[9pt] font-bold shrink-0">{order.senderPhone || '06 00 00 00 00'}</p>
             </div>

             {/* Receiver (Giant Highlight) */}
             <div className="p-4 flex-1 flex flex-col justify-center">
                <p className="text-[7pt] font-black text-gray-400 uppercase mb-2">À / TO (DESTINATAIRE)</p>
                <h3 className="text-[18pt] font-black leading-none mb-1 uppercase tracking-tight">{order.receiverName}</h3>
                <p className="text-[16pt] font-black mb-4 tracking-widest">{order.receiverPhone}</p>
                
                <div className="p-4 border-[2pt] border-black bg-white">
                   <p className="text-[11pt] font-black uppercase leading-tight">
                      {order.deliveryAddress || order.receiverAddress}
                   </p>
                   <p className="text-[14pt] font-black mt-2 bg-black text-white inline-block px-3 py-1">
                      {order.receiverCity?.toUpperCase()}
                   </p>
                </div>

                {order.notes && (
                  <div className="mt-3 flex gap-2 items-start opacity-70">
                     <Scissors className="w-3 h-3 shrink-0 rotate-90 mt-0.5" />
                     <p className="text-[8pt] font-bold uppercase italic leading-tight">
                        <span className="text-gray-400 mr-2">Instructions:</span> {order.notes}
                     </p>
                  </div>
                )}
             </div>
          </div>

          {/* COD & QR SECTION — ULTRA HIGH CONTRAST */}
          <div className="flex h-[45mm]">
             <div className="w-[60%] border-r-[3pt] border-black p-4 flex flex-col justify-between">
                <div>
                   <p className="text-[9pt] font-black text-gray-400 uppercase leading-none mb-2">Montant à percevoir (COD)</p>
                   <div className="flex items-baseline gap-2">
                      <span className="text-[36pt] font-black leading-none tracking-tighter">
                         {(order.codAmount || 0).toFixed(0)}
                      </span>
                      <span className="text-[14pt] font-black">MAD</span>
                   </div>
                </div>
                
                <div className="bg-black text-white p-2 text-center rounded-sm">
                   <p className="text-[10pt] font-black uppercase italic tracking-widest" dir="rtl">يسمح بفتح الطلبية</p>
                </div>
             </div>
             <div className="w-[40%] p-3 flex flex-col items-center justify-center bg-white">
                <div className="w-full h-full relative border-[1pt] border-black/10 p-1">
                   <img src={qrCodeUrl} alt="QR" className="w-full h-full object-contain" />
                   <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                      <ShieldCheck className="w-12 h-12 text-black" />
                   </div>
                </div>
                <p className="text-[5pt] font-bold uppercase mt-1 opacity-40">Scan to Verify</p>
             </div>
          </div>

          {/* Footer Barcode */}
          <div className="h-[30mm] border-t-[3pt] border-black flex flex-col items-center justify-center p-2 bg-white">
             <svg ref={barcodeRef} className="max-w-full"></svg>
             <div className="flex justify-between w-full px-4 mt-1 opacity-30 text-[6pt] font-bold uppercase">
                <span>Certified CargoLink E-Ticket</span>
                <span>System ID: {order.id?.substring(0,8)}</span>
             </div>
          </div>

        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media screen {
          .preview-mode {
             transform: scale(1);
             transition: transform 0.3s ease;
          }
        }
        
        @media print {
          @page { 
            size: 101.6mm 152.4mm; 
            margin: 0 !important; 
          }
          
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: 152.4mm !important;
            width: 101.6mm !important;
            background: white !important;
          }

          /* Hide EVERYTHING in the DOM */
          body > * {
            display: none !important;
          }

          /* Show only the root label container and make it cover the page */
          .shipping-label-root.print-mode {
            display: block !important;
            visibility: visible !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 101.6mm !important;
            height: 152.4mm !important;
            margin: 0 !important;
            padding: 0 !important;
            z-index: 9999999 !important;
            background: white !important;
          }

          .label-canvas {
            width: 101.6mm !important;
            height: 152.4mm !important;
            margin: 0 !important;
            padding: 5mm !important; /* Safety margin for printer bleed */
            display: flex !important;
            flex-direction: column !important;
            visibility: visible !important;
          }

          .label-canvas * {
            visibility: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .no-print {
            display: none !important;
          }
        }
      `}} />
    </div>
  );
};

export default ShippingLabel;
