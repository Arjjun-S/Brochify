"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface PageTwoProps {
  data: any;
  onEdit?: (path: string, value: any) => void;
}

export default function PageTwo({ data, onEdit }: PageTwoProps) {
  return (
    <div id="brochure-page-2" className="brochure-page border border-gray-200">
      {/* Column 1: About (Blue) */}
      <div className="column column-blue text-[9px] flex flex-col gap-4">
        <div>
            <h3 className="text-lg font-bold border-b border-white/30 mb-2">About SRM</h3>
            <p className="leading-tight text-white/90">{data.aboutCollege}</p>
        </div>
        <div>
            <h3 className="text-lg font-bold border-b border-white/30 mb-2">About School</h3>
            <p className="leading-tight text-white/90">{data.aboutSchool}</p>
        </div>
      </div>

      {/* Column 2: About Dept & FDP (White) */}
      <div className="column column-white text-[9px] border-x flex flex-col gap-4">
         <div>
            <h3 className="text-lg font-bold text-primary border-b border-primary/20 mb-2">About Department</h3>
            <p className="leading-tight">{data.aboutDepartment}</p>
        </div>
        <div>
            <h3 className="text-lg font-bold text-primary border-b border-primary/20 mb-2">About the FDP</h3>
            <ul className="list-disc pl-4 space-y-1">
                {data.topics?.map((t: any, i: number) => (
                    <li key={i}><strong>Day {i+1}:</strong> {t.forenoon} & {t.afternoon}</li>
                ))}
            </ul>
        </div>
      </div>

      {/* Column 3: Topics & Speakers (Blue) */}
      <div className="column column-blue flex flex-col">
        <h3 className="text-lg font-bold text-center border-b border-white/30 mb-4 pb-2">Topics & Schedule</h3>
        
        <table className="w-full text-[8px] border-collapse mb-6">
            <thead>
                <tr>
                    <th className="border border-white/30 p-1">Date</th>
                    <th className="border border-white/30 p-1">Topic</th>
                </tr>
            </thead>
            <tbody>
                {data.topics?.map((t: any, i: number) => (
                    <tr key={i}>
                        <td className="border border-white/30 p-1 font-bold">{t.date}</td>
                        <td className="border border-white/30 p-1">{t.forenoon}</td>
                    </tr>
                ))}
            </tbody>
        </table>

        <h3 className="text-lg font-bold text-center border-b border-white/30 mb-4 pb-2">Eminent Speakers</h3>
        <div className="grid grid-cols-2 gap-2">
            {data.speakers?.map((s: any, i: number) => (
                <div key={i} className="bg-white/10 p-2 rounded">
                    <p className="font-bold text-[9px]">{s.name}</p>
                    <p className="text-[7px] text-blue-200">{s.role}</p>
                    <p className="text-[7px] text-blue-200">{s.org}</p>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
