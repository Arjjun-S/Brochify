"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, ShieldCheck, Sparkles, Building2, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';

const availableLogos = [
  { id: 'srm', name: 'SRM Institute of Tech', src: '/logos/srm.svg', tag: 'Primary Partner' },
  { id: 'ieee', name: 'IEEE Student Branch', src: '/logos/ieee.svg', tag: 'Technical Society' },
  { id: 'ctech', name: 'Dept. of C. Tech', src: '/logos/ctech.svg', tag: 'Core Organizers' },
  { id: 'naac', name: 'NAAC Accredited', src: '/logos/naac.svg', tag: 'Quality Standard' },
];

interface LogoSelectorProps {
  selectedLogos: string[];
  onToggle: (id: string) => void;
}

export default function LogoSelector({ selectedLogos, onToggle }: LogoSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-4" ref={dropdownRef}>
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                <ShieldCheck className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-600">Branding Kit</h3>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span className="text-[9px] font-black text-slate-500 uppercase">{selectedLogos.length} ACTIVE</span>
        </div>
      </div>

      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full flex items-center justify-between bg-white border border-slate-200 p-5 rounded-[24px] transition-all shadow-sm group hover:border-primary/50 relative overflow-hidden",
            isOpen && "border-primary shadow-xl ring-8 ring-primary/5"
          )}
        >
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          
          <div className="flex -space-x-2 overflow-hidden items-center relative z-10">
            {selectedLogos.length > 0 ? (
                selectedLogos.map(id => {
                    const logo = availableLogos.find(l => l.id === id);
                    return logo ? (
                        <div key={id} className="inline-block h-10 w-10 rounded-2xl ring-4 ring-white bg-white p-2 flex items-center justify-center border border-slate-100 shadow-md transform transition-transform group-hover:scale-110 group-hover:-rotate-3">
                            <img src={logo.src} alt={logo.name} className="max-w-full max-h-full object-contain" />
                        </div>
                    ) : null;
                })
            ) : (
                <div className="flex items-center gap-3 pl-2">
                    <LayoutGrid className="w-5 h-5 text-slate-300" />
                    <span className="text-sm font-bold text-slate-400">Initialize event branding...</span>
                </div>
            )}
          </div>

          <div className="flex items-center gap-4 relative z-10">
            <div className="h-8 w-px bg-slate-100" />
            <div className={cn(
                "w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200 transition-all duration-300",
                isOpen && "bg-primary border-primary text-white"
            )}>
                <ChevronDown className={cn("w-4 h-4 transition-transform duration-500", isOpen && "rotate-180")} />
            </div>
          </div>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-4 bg-white border border-slate-200 rounded-[32px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] z-[100] overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-300">
            <div className="p-4 bg-slate-50/50 border-b border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Institutional Hierarchy</p>
            </div>
            <div className="p-3 max-h-[350px] overflow-y-auto scrollbar-hide">
                <div className="grid grid-cols-1 gap-2">
                    {availableLogos.map((logo) => {
                      const isSelected = selectedLogos.includes(logo.id);
                      return (
                        <button
                          key={logo.id}
                          onClick={() => onToggle(logo.id)}
                          className={cn(
                            "w-full flex items-center justify-between p-4 rounded-[20px] transition-all border-2",
                            isSelected 
                              ? "bg-primary/5 border-primary text-primary shadow-sm scale-[1.02]" 
                              : "bg-transparent border-transparent hover:bg-slate-50 text-slate-600 hover:border-slate-200"
                          )}
                        >
                          <div className="flex items-center gap-5">
                            <div className={cn(
                                "w-14 h-14 rounded-2xl border p-2.5 flex items-center justify-center transition-all bg-white shadow-sm",
                                isSelected ? "border-primary/30" : "border-slate-100 group-hover:border-slate-200"
                            )}>
                              <img src={logo.src} alt={logo.name} className="max-w-full max-h-full object-contain" />
                            </div>
                            <div className="text-left">
                                <span className="text-[13px] font-black block leading-tight mb-1">{logo.name}</span>
                                <div className="flex items-center gap-2">
                                    <Building2 className="w-3 h-3 opacity-50" />
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{logo.tag}</span>
                                </div>
                            </div>
                          </div>
                          <div className={cn(
                            "w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all",
                            isSelected ? "bg-primary border-primary scale-110 shadow-[0_0_15px_rgba(0,71,171,0.3)]" : "border-slate-200 bg-white"
                          )}>
                            {isSelected && <Check className="w-4 h-4 text-white stroke-[3.5px]" />}
                          </div>
                        </button>
                      );
                    })}
                </div>
            </div>
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-center">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 opacity-60">Compliance Verified</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
