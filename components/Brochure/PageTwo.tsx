"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface PageTwoProps {
  data: any;
  selectedLogos: string[];
  onEdit?: (path: string, value: any) => void;
}

import { truncateWords, LIMITS } from '@/lib/limits';

export default function PageTwo({ data, onEdit }: PageTwoProps) {
  return (
    <div id="brochure-page-2" className="brochure-page border border-gray-200">
      {/* Column 1: About (Blue) */}
      <div className="column column-blue text-[9px] flex flex-col gap-4">
        <div>
            <h3 className="text-lg font-bold border-b border-white/30 mb-2">About SRM</h3>
            <p className="leading-snug text-white/90">{truncateWords(data.aboutCollege, LIMITS.aboutCollege)}</p>
        </div>
        <div>
            <h3 className="text-lg font-bold border-b border-white/30 mb-2">About School</h3>
            <p className="leading-snug text-white/90">{truncateWords(data.aboutSchool, LIMITS.aboutSchool)}</p>
        </div>
      </div>

      {/* Column 2: About Dept & FDP (White) */}
      <div className="column column-white text-[9px] border-x flex flex-col gap-4">
         <div>
            <h3 className="text-lg font-bold text-[#0047AB] border-b border-[#0047AB]/20 mb-2 uppercase">About Department</h3>
            <p className="leading-snug">{truncateWords(data.aboutDepartment, LIMITS.aboutDepartment)}</p>
        </div>
        <div>
            <h3 className="text-lg font-bold text-[#0047AB] border-b border-[#0047AB]/20 mb-2 uppercase">About the FDP</h3>
            <ul className="list-disc pl-4 space-y-1">
                {data.topics?.slice(0, 5).map((t: any, i: number) => (
                    <li key={i}><strong>Day {i+1}:</strong> {truncateWords(t.forenoon, 10)}</li>
                ))}
            </ul>
        </div>
      </div>

      {/* Column 3: Topics & Speakers (Blue) */}
      <div className="column column-blue flex flex-col">
        <h3 className="text-lg font-bold text-center border-b border-white/30 mb-4 pb-2 uppercase">Schedule</h3>
        
        <div className="overflow-hidden rounded-lg border border-white/20 mb-4">
            <table className="w-full text-[8px] border-collapse">
                <thead className="bg-white/10 uppercase">
                    <tr>
                        <th className="border-r border-white/30 p-1">Date</th>
                        <th className="p-1 text-left">Forenoon Session</th>
                    </tr>
                </thead>
                <tbody>
                    {data.topics?.slice(0, 5).map((t: any, i: number) => (
                        <tr key={i} className="border-t border-white/30">
                            <td className="border-r border-white/30 p-1 font-bold whitespace-nowrap">{t.date}</td>
                            <td className="p-1">{truncateWords(t.forenoon, 12)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        <h3 className="text-lg font-bold text-center border-b border-white/30 mb-4 pb-2 uppercase">Speakers</h3>
        <div className="grid grid-cols-2 gap-2">
            {data.speakers?.slice(0, 6).map((s: any, i: number) => (
                <div key={i} className="bg-white/10 p-2 rounded flex flex-col justify-center min-h-[40px]">
                    <p className="font-bold text-[9px] leading-tight text-yellow-300">{truncateWords(s.name, 4)}</p>
                    <p className="text-[7px] text-blue-100 italic">{truncateWords(s.org, 6)}</p>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}

