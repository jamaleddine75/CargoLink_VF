import React from 'react';
import { createRoot } from 'react-dom/client';
import ShippingLabel from '@/components/orders/ShippingLabel';

export interface PrintOptions {
  width?: string;
  height?: string;
}

/**
 * Creates a hidden iframe, copies parent styles, mounts the ShippingLabel,
 * and triggers the print dialog. This ensures a clean print environment
 * free of global CSS resets or layout traps from the main application.
 */
export const printShippingLabel = (order: any, options: PrintOptions = {}) => {
  // Industry standard for thermal labels is 100x150mm (4x6 inches)
  const { width = '100mm', height = '150mm' } = options;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.top = '-1000px';
  iframe.style.left = '-1000px';
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  iframe.style.border = 'none';
  iframe.style.zIndex = '-1';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    console.error('Failed to access iframe document for printing');
    return;
  }

  doc.open();
  doc.write('<!DOCTYPE html><html><head><title>Print Label</title></head><body><div id="print-root"></div></body></html>');
  doc.close();

  // Clone all styles from the parent window so Tailwind works inside the iframe
  const head = doc.head;
  Array.from(document.head.querySelectorAll('style, link[rel="stylesheet"]')).forEach((node) => {
    head.appendChild(node.cloneNode(true));
  });

  // Inject specific page sizes and resets for the iframe print environment
  const style = doc.createElement('style');
  style.innerHTML = `
    @page {
      size: ${width} ${height};
      margin: 0 !important;
    }
    
    html, body {
      width: ${width} !important;
      height: ${height} !important;
      margin: 0 !important;
      padding: 0 !important;
      background: white !important;
      /* Disable scrollbars in the iframe */
      overflow: hidden;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    #print-root {
      width: 100%;
      height: 100%;
      display: flex;
    }
    
    /* Ensure no margins when printing */
    @media print {
      body {
        margin: 0 !important;
      }
    }
  `;
  head.appendChild(style);

  const printRoot = doc.getElementById('print-root');
  if (!printRoot) return;

  const root = createRoot(printRoot);

  // Render the label Component
  root.render(<ShippingLabel order={order} isPrintMode={true} />);

  // Wait for the component to render and JsBarcode to draw the SVG barcode
  setTimeout(() => {
    if (iframe.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      
      // Cleanup after printing (using a timeout so the print dialog doesn't break)
      setTimeout(() => {
        root.unmount();
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 5000); 
    }
  }, 500); 
};
