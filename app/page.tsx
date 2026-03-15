"use client";

import React, { useState } from 'react';
import AIChat from '@/components/Editor/AIChat';
import PageOne from '@/components/Brochure/PageOne';
import PageTwo from '@/components/Brochure/PageTwo';
import LogoSelector from '@/components/Editor/LogoSelector';
import { Download, Edit3, Type, Image as ImageIcon } from 'lucide-react';
// html2pdf imported dynamically in handler

export default function Dashboard() {
  const [brochureData, setBrochureData] = useState<any>(null);
  const [selectedLogos, setSelectedLogos] = useState<string[]>(['srm', 'ieee', 'ctech']);

  const handleDownload = async () => {
    // @ts-ignore
    const html2pdf = (await import('html2pdf.js')).default;
    const element = document.getElementById('brochure-export-container');
    if (!element) return;
    
    const opt = {
      margin: 0,
      filename: `brochure-${brochureData?.eventTitle || 'event'}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'landscape' as const }
    };
    html2pdf().from(element).set(opt).save();
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-8 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Type className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-black text-slate-800">BROCHIFY</h1>
        </div>
        
        {brochureData && (
            <button 
                onClick={handleDownload}
                className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-6 py-2 rounded-full font-bold transition-all shadow-lg active:scale-95"
            >
                <Download className="w-4 h-4" />
                Download PDF
            </button>
        )}
      </header>

      <div className="flex-1 grid grid-cols-12 gap-0">
        {/* Left Side: Editor */}
        <div className="col-span-4 border-r bg-white p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-73px)]">
          <AIChat onDataGenerated={setBrochureData} />
          
          <LogoSelector 
            selectedLogos={selectedLogos} 
            onToggle={(id) => setSelectedLogos(prev => 
                prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
            )} 
          />

          <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-gray-300">
             <div className="flex items-center gap-2 text-gray-500 mb-2">
                <Edit3 className="w-4 h-4" />
                <span className="text-sm font-bold">Manual Overrides</span>
             </div>
             <p className="text-xs text-gray-400">Content on the right is directly editable. Just click and type.</p>
          </div>
        </div>

        {/* Right Side: Preview */}
        <div className="col-span-8 bg-slate-200 p-12 overflow-y-auto max-h-[calc(100vh-73px)] flex flex-col items-center gap-12">
          {!brochureData ? (
            <div className="mt-24 text-center">
                <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-6 transform rotate-12 transition-transform hover:rotate-0 cursor-pointer">
                    <ImageIcon className="text-primary w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">Start your Brochure</h2>
                <p className="text-slate-500 max-w-xs mx-auto">Use the AI chat on the left to provide event details. I'll handle the design.</p>
            </div>
          ) : (
            <div id="brochure-export-container" className="flex flex-col gap-0 shadow-2xl">
                <PageOne data={brochureData} />
                <PageTwo data={brochureData} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
