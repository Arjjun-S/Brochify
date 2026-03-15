"use client";

import React from 'react';

const availableLogos = [
  { id: 'srm', name: 'SRM', src: '/logos/srm.svg' },
  { id: 'ieee', name: 'IEEE', src: '/logos/ieee.svg' },
  { id: 'ctech', name: 'CTECH', src: '/logos/ctech.svg' },
  { id: 'naac', name: 'NAAC', src: '/logos/naac.svg' },
];

interface LogoSelectorProps {
  selectedLogos: string[];
  onToggle: (id: string) => void;
}

export default function LogoSelector({ selectedLogos, onToggle }: LogoSelectorProps) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border">
      <h3 className="text-sm font-bold mb-3 text-gray-700 uppercase tracking-wider">Select Institution Logos</h3>
      <div className="flex gap-4">
        {availableLogos.map((logo) => (
          <button
            key={logo.id}
            onClick={() => onToggle(logo.id)}
            className={cn(
              "p-2 rounded-lg border-2 transition-all hover:bg-gray-50 flex flex-col items-center",
              selectedLogos.includes(logo.id) ? "border-[#0047AB] bg-blue-50" : "border-gray-100"
            )}
          >
            <img src={logo.src} alt={logo.name} className="h-8 w-auto mb-1 object-contain" />
            <span className="text-[10px] block font-bold">{logo.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

import { cn } from '@/lib/utils';
