import React, { useState, useEffect } from 'react';
import { SketchDoc, SketchCoffee } from './SketchIcons';

export default function QRPrintModal({ isOpen, onClose, cafeId = 'demo-cafe', cafeName = 'Forkcast Artisan Café', onLaunchTable }) {
  const [tableCount, setTableCount] = useState(10);
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState('');

  const fetchQRCodes = async (count) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/qr/tables/${cafeId}?table_count=${count}&cafe_name=${encodeURIComponent(cafeName)}`);
      if (res.ok) {
        const data = await res.json();
        setQrData(data);
      }
    } catch (e) {
      console.error('Failed to fetch QR codes:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchQRCodes(tableCount);
    }
  }, [isOpen, tableCount, cafeId, cafeName]);

  if (!isOpen) return null;

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(label);
    setTimeout(() => setCopiedLink(''), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Print Stylesheet injection for clean A4 printing */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-qr-section, #printable-qr-section * {
            visibility: visible !important;
          }
          #printable-qr-section {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
            padding: 10px !important;
          }
          .no-print {
            display: none !important;
          }
          .qr-print-card {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            border: 2px dashed #444 !important;
            background: white !important;
            color: black !important;
            margin-bottom: 20px !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-[#430000] border-2 border-white/80 sketch-card shadow-2xl rounded-2xl overflow-hidden font-tech text-white">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/20 bg-[#5b0000]/90 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono px-2 py-0.5 bg-amber-400/20 text-amber-200 border border-amber-400/40 rounded font-bold">
                Feature O-5: Asset Generator
              </span>
              <span className="text-xs text-white/70 font-mono">
                {cafeName}
              </span>
            </div>
            <h2 className="font-brand font-bold text-xl sm:text-2xl text-white tracking-wide mt-1">
              Printable Table QR Cards & Staff Links
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-white/40 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors text-sm font-bold no-print"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Action Controls & Fast Links (Hidden in Print) */}
        <div className="px-4 sm:px-6 py-3 bg-[#500000]/80 border-b border-white/15 space-y-3 no-print shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            
            {/* Table Count Selector */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-white/80 font-bold">Number of Tables:</span>
              <div className="flex items-center gap-1">
                {[5, 10, 15, 20, 25].map((count) => (
                  <button
                    key={count}
                    onClick={() => setTableCount(count)}
                    className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                      tableCount === count
                        ? 'bg-white text-[#430000] shadow'
                        : 'bg-white/10 text-white/80 hover:bg-white/20'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            {/* Print Action Button */}
            <button
              onClick={handlePrint}
              className="sketch-btn-white px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-lg"
            >
              <span>🖨️</span>
              <span>Print All Table Cards (A4 / PDF)</span>
            </button>
          </div>

          {/* Quick Share Links */}
          {qrData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 text-xs">
              <div className="flex items-center justify-between bg-white/10 border border-white/20 px-3 py-1.5 rounded-lg">
                <span className="text-white/80 font-mono truncate mr-2">
                  📱 Customer Menu: <span className="text-amber-200">{qrData.customer_menu_url}</span>
                </span>
                <button
                  onClick={() => handleCopy(qrData.customer_menu_url, 'menu')}
                  className="px-2 py-0.5 rounded bg-white/15 hover:bg-white/25 text-[11px] font-bold shrink-0"
                >
                  {copiedLink === 'menu' ? '✓ Copied!' : 'Copy Link'}
                </button>
              </div>

              <div className="flex items-center justify-between bg-white/10 border border-white/20 px-3 py-1.5 rounded-lg">
                <span className="text-white/80 font-mono truncate mr-2">
                  👨‍🍳 Kitchen Live Board: <span className="text-emerald-200">{qrData.staff_kitchen_url}</span>
                </span>
                <button
                  onClick={() => handleCopy(qrData.staff_kitchen_url, 'kitchen')}
                  className="px-2 py-0.5 rounded bg-white/15 hover:bg-white/25 text-[11px] font-bold shrink-0"
                >
                  {copiedLink === 'kitchen' ? '✓ Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Printable Cards Grid */}
        <div id="printable-qr-section" className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="p-12 text-center space-y-3">
              <div className="inline-block w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <p className="text-xs text-white/80 font-mono">Generating high-resolution table QR codes...</p>
            </div>
          ) : qrData && qrData.tables ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {qrData.tables.map((table) => (
                <div
                  key={table.table_number}
                  className="qr-print-card bg-white rounded-xl p-4 text-[#430000] border-2 border-dashed border-[#5b0000]/40 flex flex-col items-center justify-between text-center shadow-md relative group hover:border-[#5b0000] transition-colors"
                >
                  {/* Card Brand Header */}
                  <div className="w-full pb-2 border-b border-neutral-200 flex items-center justify-between">
                    <span className="font-brand font-bold text-sm tracking-wide text-[#5b0000]">
                      FORKCAST
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500 uppercase">
                      {cafeName}
                    </span>
                  </div>

                  {/* QR Image */}
                  <div className="my-3 p-2 bg-neutral-50 rounded-lg border border-neutral-200 shadow-inner">
                    <img
                      src={table.qr_data_url}
                      alt={table.table_label}
                      className="w-36 h-36 object-contain"
                    />
                  </div>

                  {/* Table Identifier */}
                  <div className="space-y-0.5">
                    <h3 className="font-brand font-bold text-2xl text-[#430000] tracking-wider uppercase">
                      {table.table_label}
                    </h3>
                    <p className="text-[11px] text-neutral-600 font-medium">
                      Scan to join table room & order with AI
                    </p>
                    <p className="text-[9px] font-mono text-neutral-400 truncate max-w-[200px] pt-0.5">
                      {table.table_url.replace(/^https?:\/\//, '')}
                    </p>
                  </div>

                  {/* Test & Action Buttons (Hidden when printing) */}
                  <div className="w-full pt-3 mt-3 border-t border-neutral-200 flex items-center justify-center gap-2 no-print">
                    <button
                      onClick={() => {
                        if (onLaunchTable) {
                          onLaunchTable(table.table_number);
                          onClose();
                        } else {
                          window.open(table.table_url, '_blank');
                        }
                      }}
                      className="px-3 py-1 bg-[#430000] hover:bg-[#5b0000] text-white rounded text-xs font-bold transition-colors"
                      title="Simulate diner scanning this table"
                    >
                      Test Table Room →
                    </button>
                    <a
                      href={table.qr_data_url}
                      download={`${cafeId}_${table.table_label.toLowerCase().replace(' ', '_')}.png`}
                      className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded text-xs font-medium"
                      title="Download single image"
                    >
                      💾
                    </a>
                  </div>

                  {/* Cut guide corners for real printing */}
                  <div className="absolute -top-1.5 -left-1.5 text-[8px] text-neutral-400 font-mono">✂</div>
                  <div className="absolute -bottom-1.5 -right-1.5 text-[8px] text-neutral-400 font-mono">✂</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-white/70 text-xs">
              No QR data available. Please check backend connection.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-2.5 bg-[#5b0000]/80 border-t border-white/20 flex items-center justify-between text-xs text-white/70 no-print">
          <span>Ready to print for acrylic table standees or laminated cards.</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-xs"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
