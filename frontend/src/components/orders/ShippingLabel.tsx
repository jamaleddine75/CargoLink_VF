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
          width: 2,
          height: 35,
          displayValue: true,
          fontSize: 14,
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
      isPrintMode 
        ? "w-full h-full" 
        : "w-[100mm] h-[150mm] preview-mode p-4 bg-slate-900/50 rounded-[2rem] border border-white/5 backdrop-blur-xl shrink-0"
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
        "label-canvas bg-white text-black p-[3mm] box-border mx-auto flex flex-col h-full w-full"
      )}>
        
        <div className="border-[2pt] border-black h-full flex flex-col bg-white overflow-hidden">
          
          {/* Header Area */}
          <div className="flex border-b-[2pt] border-black h-[15mm]">
            <div className="w-[30%] border-r-[2pt] border-black flex flex-col items-center justify-center bg-black text-white p-1">
              <Zap className="w-5 h-5 mb-0.5 fill-primary text-primary" />
              <span className="text-[6pt] font-black uppercase tracking-widest italic">CargoLink</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center text-center px-1">
               <h1 className="text-[14pt] font-black uppercase tracking-[0.2em] leading-none mb-0.5">{order.urgent ? 'EXPRESS' : 'STANDARD'}</h1>
               <div className="flex items-center gap-1">
                  <div className="h-[1pt] w-2 bg-black" />
                  <p className="text-[5pt] font-black uppercase tracking-widest">Courier Network</p>
                  <div className="h-[1pt] w-2 bg-black" />
               </div>
            </div>
            <div className="w-[20%] border-l-[2pt] border-black flex flex-col items-center justify-center">
               <p className="text-[5pt] font-black uppercase mb-0.5">Route</p>
               <h2 className="text-[16pt] font-black leading-none">A1</h2>
            </div>
          </div>

          {/* Large Zone Identifier */}
          <div className="flex border-b-[2pt] border-black h-[12mm]">
             <div className="w-[70%] px-2 flex flex-col justify-center">
                <span className="text-[6pt] font-bold text-gray-400 uppercase">Secteur / Sector</span>
                <h2 className="text-[16pt] font-black uppercase leading-none tracking-tighter">
                   {order.receiverCity ? order.receiverCity.toUpperCase() : 'DESTINATION'}
                </h2>
             </div>
             <div className="w-[30%] border-l-[2pt] border-black bg-gray-100 flex items-center justify-center">
                <p className="text-[20pt] font-black italic">{(order.receiverCity || 'X')[0].toUpperCase()}</p>
             </div>
          </div>

          {/* Info Grid */}
          <div className="flex border-b-[2pt] border-black h-[10mm] text-[6pt]">
             <div className="w-1/2 border-r-[2pt] border-black px-2 flex flex-col justify-center">
                <p className="font-bold text-gray-400 uppercase text-[5pt]">Date d'émission</p>
                <p className="font-black italic">{new Date().toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}</p>
             </div>
             <div className="w-1/2 px-2 flex flex-col justify-center text-right">
                <p className="font-bold text-gray-400 uppercase text-[5pt]">Service Level</p>
                <p className="font-black italic">{order.urgent ? 'SAMEDAY-EXPRESS' : 'STANDARD-DELIVERY'}</p>
             </div>
          </div>

          {/* Addresses Section */}
          <div className="flex-1 flex flex-col border-b-[2pt] border-black">
             {/* Sender (Compact) */}
             <div className="px-2 py-1 border-b-[1pt] border-dashed border-black bg-gray-50 flex justify-between items-center">
                <div className="min-w-0">
                   <p className="text-[5pt] font-black text-gray-400 uppercase">DE / FROM</p>
                   <p className="text-[7pt] font-black uppercase truncate">{order.senderName || order.pickupContactName || 'CL-HUB-01'}</p>
                </div>
                <p className="text-[7pt] font-bold shrink-0">{order.senderPhone || order.pickupContactPhone || '06 00 00 00 00'}</p>
             </div>

             {/* Receiver (Giant Highlight) */}
             <div className="px-2 py-1 flex-1 flex flex-col justify-center">
                <p className="text-[5pt] font-black text-gray-400 uppercase mb-0.5">À / TO (DESTINATAIRE)</p>
                <h3 className="text-[12pt] font-black leading-none mb-0.5 uppercase tracking-tight">{order.receiverName || 'DESTINATAIRE'}</h3>
                <p className="text-[10pt] font-black mb-1 tracking-widest">{order.receiverPhone || 'XX XX XX XX XX'}</p>
                
                <div className="px-2 py-1 border-[1pt] border-black bg-white">
                   <p className="text-[8pt] font-black uppercase leading-tight">
                      {order.deliveryAddress || order.receiverAddress || 'N/A'}
                   </p>
                   <p className="text-[10pt] font-black mt-1 bg-black text-white inline-block px-2 py-0.5">
                      {order.receiverCity?.toUpperCase() || 'VILLE'}
                   </p>
                </div>

                {order.notes && (
                  <div className="mt-1 flex gap-1 items-start opacity-70">
                     <Scissors className="w-2 h-2 shrink-0 rotate-90 mt-0.5" />
                     <p className="text-[6pt] font-bold uppercase italic leading-tight">
                        <span className="text-gray-400 mr-1">Instructions:</span> {order.notes}
                     </p>
                  </div>
                )}
             </div>
          </div>

          {/* COD & QR SECTION — ULTRA HIGH CONTRAST */}
          <div className="flex h-[25mm]">
             <div className="w-[65%] border-r-[2pt] border-black p-2 flex flex-col justify-between">
                <div>
                   <p className="text-[6pt] font-black text-gray-400 uppercase leading-none mb-1">Montant à percevoir (COD)</p>
                   <div className="flex items-baseline gap-1">
                      <span className="text-[20pt] font-black leading-none tracking-tighter">
                         {(order.codAmount || 0).toFixed(0)}
                      </span>
                      <span className="text-[8pt] font-black">MAD</span>
                   </div>
                </div>
                
                <div className="bg-black text-white px-1 py-0.5 text-center rounded-sm">
                   <p className="text-[7pt] font-black uppercase italic tracking-widest" dir="rtl">يسمح بفتح الطلبية</p>
                </div>
             </div>
             <div className="w-[35%] p-1 flex flex-col items-center justify-center bg-white">
                <div className="w-[18mm] h-[18mm] relative border-[1pt] border-black/10 p-0.5">
                   <img src={qrCodeUrl} alt="QR" className="w-full h-full object-contain" />
                   <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                      <ShieldCheck className="w-6 h-6 text-black" />
                   </div>
                </div>
                <p className="text-[4pt] font-bold uppercase mt-0.5 opacity-40">Scan to Verify</p>
             </div>
          </div>

          {/* Footer Barcode */}
          <div className="h-[15mm] border-t-[2pt] border-black flex flex-col items-center justify-center p-1 bg-white">
             <svg ref={barcodeRef} className="max-w-full"></svg>
             <div className="flex justify-between w-full px-2 mt-0.5 opacity-30 text-[5pt] font-bold uppercase">
                <span>Certified CargoLink E-Ticket</span>
                <span>System ID: {order.id?.substring(0,8) || order.trackingNumber?.substring(0,8) || 'N/A'}</span>
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
        .label-canvas * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      `}} />
    </div>
  );
};

export default ShippingLabel;
