import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Printer, Barcode, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import JsBarcode from 'jsbarcode';
import { API_BASE_URL } from '@/utils/constants';

interface OrderBarcodeProps {
  barcode: string;
  imageUrl?: string;
}

export const OrderBarcode: React.FC<OrderBarcodeProps> = ({ barcode, imageUrl }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const backendUrl = (API_BASE_URL || '').replace(/\/api\/?$/, '');

  const barcodeValue = useMemo(() => (barcode || '').trim(), [barcode]);

  const fullImageUrl = useMemo(() => {
    if (!imageUrl) {
      return '';
    }

    if (imageUrl.startsWith('http') || imageUrl.startsWith('data:image/')) {
      return imageUrl;
    }

    const looksLikeRawBase64 = /^[A-Za-z0-9+/=\s]+$/.test(imageUrl) && !imageUrl.includes('/');
    if (looksLikeRawBase64) {
      return `data:image/png;base64,${imageUrl.replace(/\s+/g, '')}`;
    }

    if (imageUrl.startsWith('/')) {
      return `${backendUrl}${imageUrl}`;
    }

    return `${backendUrl}/${imageUrl}`;
  }, [backendUrl, imageUrl]);

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl, barcodeValue]);

  useEffect(() => {
    if (!svgRef.current || !barcodeValue) {
      return;
    }

    JsBarcode(svgRef.current, barcodeValue, {
      format: 'CODE128',
      displayValue: false,
      lineColor: '#111827',
      width: 1.8,
      height: 64,
      margin: 0,
      background: '#ffffff'
    });
  }, [barcodeValue]);

  const handleDownload = () => {
    if (!fullImageUrl) {
      return;
    }

    const link = document.createElement('a');
    link.href = fullImageUrl;
    link.download = `barcode-${barcode}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Barcode - ${barcode}</title>
            <style>
              body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; }
              img { max-width: 100%; height: auto; margin-bottom: 20px; }
              .text { font-size: 24px; font-weight: bold; letter-spacing: 2px; }
            </style>
          </head>
          <body>
            <img src="${fullImageUrl}" />
            <div class="text">${barcode}</div>
            <script>window.onload = () => { window.print(); window.close(); }</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none max-w-sm w-full mx-auto">
      <div className="flex flex-col items-center text-center space-y-6">
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Barcode Generated</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Shipment Identifier</p>
        </div>

        {/* Barcode Display */}
        <div className="relative group w-full">
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2rem] opacity-5 blur-2xl group-hover:opacity-10 transition-opacity" />
          
          <div className="relative bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-sm">
              {fullImageUrl && !imageFailed ? (
                <img
                  src={fullImageUrl}
                  alt={`Barcode for ${barcode}`}
                  className="h-20 w-auto object-contain mix-blend-multiply dark:mix-blend-normal"
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <svg
                  ref={svgRef}
                  className="h-20 w-[220px]"
                  role="img"
                  aria-label={`Generated barcode for ${barcode}`}
                />
              )}
            </div>
            
            <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-100 dark:border-slate-700">
              <Barcode className="w-4 h-4 text-indigo-600" />
              <span className="text-[10px] font-black tracking-[0.3em] text-slate-700 dark:text-slate-200">{barcode}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 w-full pt-4">
          <Button 
            onClick={handleDownload}
            variant="outline"
            className="rounded-2xl h-14 border-slate-200 dark:border-slate-700 font-black uppercase text-[10px] tracking-widest gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            Save
          </Button>
          <Button 
            onClick={handlePrint}
            className="rounded-2xl h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-black uppercase text-[10px] tracking-widest gap-2 transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            Print
          </Button>
        </div>
      </div>
    </div>
  );
};
