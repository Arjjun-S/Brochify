"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface PageTwoProps {
  data: any;
  selectedLogos: string[];
  onEdit?: (path: string, value: any) => void;
}

import { truncateWords, LIMITS } from '@/lib/limits';

export default function PageTwo({ data, selectedLogos, onEdit }: PageTwoProps) {
  return (
    <div id="brochure-page-2" className="brochure-page border border-gray-200" style={{ backgroundColor: '#ffffff' }}>
      {/* Column 1: About Sections (Blue) */}
      <div className="column column-blue text-[9px] flex flex-col gap-4 !p-4" style={{ backgroundColor: '#0047AB', color: '#ffffff' }}>
        <div>
            <h3 className="text-sm font-black mb-2 uppercase tracking-tighter" style={{ borderBottom: '1px solid rgba(255,255,255,0.3)' }}>About SRM</h3>
            <p className="leading-tight text-justify" style={{ color: 'rgba(255,255,255,0.9)' }}>{data.aboutCollege}</p>
        </div>
        <div>
            <h3 className="text-[11px] font-black mb-2 uppercase tracking-tighter" style={{ borderBottom: '1px solid rgba(255,255,255,0.3)' }}>About the School</h3>
            <p className="leading-tight text-justify" style={{ color: 'rgba(255,255,255,0.9)' }}>{data.aboutSchool}</p>
        </div>
      </div>

      {/* Column 2: About Dept & FDP (White) */}
      <div className="column column-white text-[9px] border-x flex flex-col gap-4 !p-4" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
         <div>
            <h3 className="text-[11px] font-black mb-2 uppercase tracking-tighter" style={{ color: '#0047AB', borderBottom: '1px solid rgba(0,71,171,0.2)' }}>About Department</h3>
            <p className="leading-tight text-justify" style={{ color: '#334155' }}>{data.aboutDepartment}</p>
        </div>
        <div>
            <h3 className="text-[11px] font-black mb-2 uppercase tracking-tighter" style={{ color: '#0047AB', borderBottom: '1px solid rgba(0,71,171,0.2)' }}>About the FDP</h3>
            <p className="leading-tight text-justify" style={{ color: '#334155' }}>{data.aboutFdp}</p>
        </div>
        
        <div className="mt-2 p-2 border rounded-lg" style={{ backgroundColor: '#f8fafc', borderColor: '#f1f5f9' }}>
            <p className="text-[8px] font-black uppercase mb-1 underline" style={{ color: '#0047AB' }}>Program Highlights:</p>
            <ul className="text-[8px] space-y-0.5" style={{ color: '#475569' }}>
                {data.topics?.slice(0, 5).map((t: any, i: number) => (
                    <li key={i}>• Day {i+1}: {t.forenoon}</li>
                ))}
            </ul>
        </div>
      </div>

      {/* Column 3: Topics & Speakers (Blue) */}
      <div className="column column-blue flex flex-col !p-4" style={{ backgroundColor: '#0047AB', color: '#ffffff' }}>
        <h3 className="text-[11px] font-black text-center mb-3 pb-1 uppercase tracking-widest" style={{ borderBottom: '1px solid rgba(255,255,255,0.3)', color: '#fde047' }}>Topics to be covered</h3>
        
        <div className="overflow-hidden rounded-md border mb-4" style={{ borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.05)' }}>
            <table className="w-full text-[7.5px] border-collapse">
                <thead className="uppercase font-black" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#ffffff' }}>
                    <tr>
                        <th className="p-1 text-center w-10" style={{ borderRight: '1px solid rgba(255,255,255,0.3)' }}>Date</th>
                        <th className="p-1 text-left">Forenoon / Afternoon Session</th>
                    </tr>
                </thead>
                <tbody style={{ color: 'rgba(255,255,255,0.9)' }}>
                    {data.topics?.slice(0, 5).map((t: any, i: number) => (
                        <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.3)' }}>
                            <td className="p-1.5 text-center font-bold" style={{ borderRight: '1px solid rgba(255,255,255,0.3)' }}>{t.date}</td>
                            <td className="p-1.5">
                                <div className="font-bold" style={{ color: '#fef9c3' }}>{t.forenoon}</div>
                                <div className="italic" style={{ opacity: 0.7 }}>{t.afternoon}</div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        <h3 className="text-[11px] font-black text-center mb-3 pb-1 uppercase tracking-widest" style={{ borderBottom: '1px solid rgba(255,255,255,0.3)', color: '#fde047' }}>Eminent Speakers</h3>
        <div className="grid grid-cols-2 gap-2 flex-1">
            {data.speakers?.slice(0, 8).map((s: any, i: number) => (
                <div key={i} className="p-1.5 rounded border flex flex-col justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}>
                    <p className="font-black text-[8.5px] leading-none mb-0.5" style={{ color: '#fde047' }}>{s.name}</p>
                    <p className="text-[7.5px] italic leading-tight truncate" style={{ color: 'rgba(255,255,255,0.7)' }}>{s.role}</p>
                    <p className="text-[7px] leading-tight truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>{s.org}</p>
                </div>
            ))}
        </div>
        
        <div className="mt-4 pt-2 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.2)', opacity: 0.5 }}>
            <span className="text-[7px] font-bold text-white uppercase italic">Brochify Gen-AI Engine</span>
            <span className="text-[7px] font-black" style={{ color: '#facc15' }}>SRM-KTR • 2026</span>
        </div>
      </div>
    </div>
  );
}
