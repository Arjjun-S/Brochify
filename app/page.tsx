"use client";

import React, { useState, useEffect } from 'react';
import AIChat from '@/components/Editor/AIChat';
import PageOne from '@/components/Brochure/PageOne';
import PageTwo from '@/components/Brochure/PageTwo';
import LogoSelector from '@/components/Editor/LogoSelector';
import LoadingOverlay from '@/components/Layout/LoadingOverlay';
import DevLogs from '@/components/Editor/DevLogs';
import { cn } from '@/lib/utils';
import { Download, Sparkles, Layout, Database, FileText, ChevronRight, Activity } from 'lucide-react';
// Dynamically import browser-only libraries


export default function Dashboard() {
  const [brochureData, setBrochureData] = useState<any>(null);
  const [selectedLogos, setSelectedLogos] = useState<string[]>(['srm', 'ieee', 'ctech']);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [mounted, setMounted] = useState(false);
  const [showDevLogs, setShowDevLogs] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDownload = async () => {
    console.log("PDF download triggered via Puppeteer API...");
    const element = document.getElementById('brochure-preview');
    if (!element) {
      console.error("Preview element not found!");
      return;
    }

    setIsLoading(true);
    setLoadingMessage("Materializing High-Fidelity PDF...");

    try {
      // Get all styles from the document
      let styles = '';
      const styleSheets = Array.from(document.styleSheets);
      for (const sheet of styleSheets) {
        try {
          const rules = Array.from(sheet.cssRules);
          for (const rule of rules) {
            styles += rule.cssText;
          }
        } catch (e) {
          console.warn("Could not read stylesheet rules (likely CORS):", e);
        }
      }

      // Get the HTML content, isolating just the pages
      const pages = element.querySelectorAll('.brochure-page');
      let pagesHtml = '';
      pages.forEach(p => pagesHtml += p.outerHTML);

      const html = `
        <html>
        <head>
          <style>
            ${styles}
            /* Override preview styles specifically for printing */
            .brochure-page {
                box-shadow: none !important;
                transform: none !important;
                margin: 0 !important;
                border: none !important;
            }
          </style>
        </head>
        <body style="background: white; margin: 0; padding: 0;">
          <div style="display: flex; flex-direction: column;">
            ${pagesHtml}
          </div>
        </body>
        </html>
      `;

      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ html, css: styles }), // Still send styles separately just in case the backend uses it for @page
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `brochure-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log("PDF download completed.");
    } catch (err: any) {
      console.error("PDF download failed:", err);
      alert(`Error generating PDF: ${err.message}`);
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const toggleLogo = (id: string) => {
    setSelectedLogos(prev => 
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    );
  };

  if (!mounted) return null;

  return (
    <main className="h-screen bg-[#F8FAFC] flex flex-col font-sans overflow-hidden">
      {/* Cinematic Header */}
      <header className="h-20 bg-white border-b border-slate-200 px-10 flex items-center justify-between shrink-0 z-[100] shadow-sm">
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 group cursor-pointer">
                <div className="w-12 h-12 bg-primary rounded-[18px] flex items-center justify-center shadow-[0_8px_20px_-6px_rgba(0,71,171,0.5)] transition-transform group-hover:rotate-6">
                    <Layout className="text-white w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tighter italic">BROCHIFY<span className="text-primary not-italic">.</span></h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">AI Layout Engine</p>
                </div>
            </div>
            <div className="h-8 w-px bg-slate-200 mx-4" />
            <nav className="flex items-center gap-8">
                {['Architect', 'Gallery', 'Presets'].map(item => (
                    <button key={item} className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">{item}</button>
                ))}
            </nav>
        </div>
        
        <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowDevLogs(!showDevLogs)}
              className={cn(
                "p-3 rounded-xl transition-all border",
                showDevLogs ? "bg-primary/10 border-primary text-primary" : "bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300"
              )}
              title="Inspect Telemetry"
            >
              <Activity className="w-5 h-5" />
            </button>

            {brochureData && (
                 <button 
                  onClick={handleDownload}
                  className="flex items-center gap-3 bg-slate-900 hover:bg-black text-white px-8 py-3.5 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Download className="w-4 h-4" />
                  Materialize PDF
                </button>
            )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Dev Logs Panel (Drawer) */}
        {showDevLogs && (
            <div className="absolute right-0 top-0 bottom-0 w-1/3 z-[200] animate-in slide-in-from-right duration-500 shadow-[-20px_0_50px_rgba(0,0,0,0.1)]">
                <DevLogs />
                <button 
                    onClick={() => setShowDevLogs(false)}
                    className="absolute left-0 top-1/2 -translate-x-full bg-slate-900 border border-white/10 p-2 rounded-l-lg text-white/50 hover:text-white"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        )}

        {/* Left Side: Modular Controls (Independent Scroll) */}
        <div className="w-[30%] border-r border-slate-200 bg-slate-900 p-0 overflow-hidden flex flex-col h-full">
            <AIChat 
                onDataGenerated={(data) => setBrochureData(data)} 
                onLoading={(loading, msg) => {
                    setIsLoading(loading);
                    if (msg) setLoadingMessage(msg);
                }}
                selectedLogos={selectedLogos}
                onToggleLogo={toggleLogo}
            />
        </div>

        {/* Right Side: Production Canvas (Independent Scroll) */}
        <div className="flex-1 bg-[#F0F4F8] p-4 overflow-y-auto h-full flex flex-col items-center relative group scroll-smooth">
            {/* Background Texture - Grid Style */}
            <div className="absolute inset-0 opacity-[0.2] pointer-events-none bg-[radial-gradient(#0047AB_1px,transparent_1px)] [background-size:20px_20px]"></div>
            
            {brochureData ? (
                <div className="w-full flex flex-col items-center gap-10 py-6 relative z-10">
                    <div id="brochure-preview" className="transform scale-[0.85] origin-top transition-all duration-700 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] hover:scale-[0.88] cursor-zoom-in">
                        <PageOne data={brochureData} selectedLogos={selectedLogos} />
                        <div className="h-6" />
                        <PageTwo data={brochureData} selectedLogos={selectedLogos} />
                    </div>
                </div>
            ) : (
                <div className="mt-36 text-center animate-in fade-in zoom-in-95 duration-1000 relative z-10">
                    <div className="w-28 h-28 bg-white rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center justify-center mx-auto mb-10 transform rotate-6 hover:rotate-0 transition-transform cursor-pointer border border-white ring-[12px] ring-white/30">
                        <Database className="text-primary w-12 h-12 animate-pulse" />
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter italic">Waiting for Command</h2>
                    <p className="text-slate-400 text-xs font-black uppercase tracking-[0.4em] max-w-sm mx-auto leading-relaxed border-t border-slate-200 pt-6 opacity-60">
                        Neural Draftsman is currently dormant. <br/>Initiate event description to bootstrap production.
                    </p>
                    <div className="mt-12 flex items-center justify-center gap-3 text-primary animate-bounce">
                        <ChevronRight className="w-4 h-4 rotate-90" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Begin Protocol</span>
                        <ChevronRight className="w-4 h-4 rotate-90" />
                    </div>
                </div>
            )}
        </div>
      </div>

      <LoadingOverlay isVisible={isLoading} message={loadingMessage} />
    </main>
  );
}
