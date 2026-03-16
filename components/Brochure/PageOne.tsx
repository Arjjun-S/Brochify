"use client";

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';

interface PageOneProps {
  data: any;
  selectedLogos: string[];
  onEdit?: (path: string, value: any) => void;
}

const availableLogos = [
  { id: 'srm', src: '/logos/srm.svg' },
  { id: 'ieee', src: '/logos/ieee.svg' },
  { id: 'ctech', src: '/logos/ctech.svg' },
  { id: 'naac', src: '/logos/naac.svg' },
];

import { truncateWords, LIMITS } from '@/lib/limits';

export default function PageOne({ data, selectedLogos, onEdit }: PageOneProps) {
  const chiefPatrons = data.committee?.filter((c: any) => c.role?.toLowerCase().includes('chief patron')) || [];
  const patrons = data.committee?.filter((c: any) => c.role?.toLowerCase().includes('patron') && !c.role?.toLowerCase().includes('chief')) || [];
  const advisory = data.committee?.filter((c: any) => c.role?.toLowerCase().includes('advisory')) || [];
  const organizing = data.committee?.filter((c: any) => !c.role?.toLowerCase().includes('patron') && !c.role?.toLowerCase().includes('advisory')) || [];

  return (
    <div id="brochure-page-1" className="brochure-page border border-gray-200" style={{ backgroundColor: '#ffffff' }}>
      {/* Column 1: Committees (White) */}
      <div className="column column-white border-r !p-4 flex flex-col" style={{ backgroundColor: '#ffffff' }}>
        <div className="flex-1 p-5 rounded-[32px] border border-[#0047AB]/20 bg-slate-50/80 space-y-6 shadow-sm">
            {chiefPatrons.length > 0 && (
                <div>
                    <h4 className="text-white text-[10px] font-black px-2 py-0.5 rounded-sm inline-block mb-1 uppercase tracking-wider" style={{ backgroundColor: '#0047AB' }}>CHIEF PATRONS</h4>
                    <ul className="text-[10px] leading-tight" style={{ color: '#1e293b' }}>
                        {chiefPatrons.map((c: any, i: number) => (
                            <li key={i}><span className="font-bold">{c.name}</span>, {c.role}</li>
                        ))}
                    </ul>
                </div>
            )}
            
            {patrons.length > 0 && (
                <div>
                    <h4 className="text-white text-[10px] font-black px-2 py-0.5 rounded-sm inline-block mb-1 uppercase tracking-wider" style={{ backgroundColor: '#0047AB' }}>PATRONS</h4>
                    <ul className="text-[10px] leading-tight" style={{ color: '#1e293b' }}>
                        {patrons.map((c: any, i: number) => (
                            <li key={i}><span className="font-bold">{c.name}</span>, {c.role}</li>
                        ))}
                    </ul>
                </div>
            )}

            <div>
                <h4 className="text-[10px] font-black mb-1 uppercase tracking-wider" style={{ color: '#0047AB', borderBottom: '2px solid #0047AB' }}>ACADEMIC ADVISORY COMMITTEE</h4>
                <ul className="text-[9px] leading-[1.1] space-y-0.5" style={{ color: '#334155' }}>
                    {advisory.slice(0, 10).map((c: any, i: number) => (
                        <li key={i} className="truncate"><span className="font-bold">{c.name}</span>, {c.role}</li>
                    ))}
                </ul>
            </div>

            <div>
                <h4 className="text-[10px] font-black mb-1 uppercase tracking-wider" style={{ color: '#0047AB', borderBottom: '2px solid #0047AB' }}>ORGANIZING COMMITTEE</h4>
                <ul className="text-[9px] leading-[1.1] space-y-0.5" style={{ color: '#334155' }}>
                    {organizing.slice(0, 15).map((c: any, i: number) => (
                        <li key={i} className="truncate"><span className="font-bold">{c.name}</span>, {c.role}</li>
                    ))}
                </ul>
            </div>
        </div>
      </div>

      {/* Column 2: Registration (Blue) */}
      <div className="column column-blue flex flex-col items-center !p-4" style={{ backgroundColor: '#0047AB', color: '#ffffff' }}>
        <h2 className="text-sm font-black bg-white px-4 py-1 rounded-full mb-4 uppercase tracking-tighter" style={{ color: '#0047AB' }}>
          REGISTRATION DETAIL
        </h2>
        
        <div className="w-full space-y-2 mb-4">
            <div className="flex justify-between text-[10px] font-bold pb-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                <span style={{ color: '#fde047' }}>Registration Fee:</span>
            </div>
            <div className="flex justify-between text-[9px] text-white">
                <span>IEEE Member</span>
                <span className="font-bold">: Rs. {data.registration?.ieeePrice}/-</span>
            </div>
            <div className="flex justify-between text-[9px] text-white">
                <span>Non IEEE Member</span>
                <span className="font-bold">: Rs. {data.registration?.nonIeeePrice}/-</span>
            </div>
            <p className="text-[8px] italic" style={{ color: 'rgba(255,255,255,0.8)' }}>(Rs. 250 refundable upon IEEE Membership enrollment)</p>
        </div>

        <div className="w-full text-left p-2 rounded-lg mb-4" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <p className="text-[8px] font-black mb-1 uppercase tracking-widest" style={{ color: '#fde047' }}>Note:</p>
            <ul className="text-[7.5px] space-y-1" style={{ color: 'rgba(255,255,255,0.9)' }}>
                {data.registration?.notes?.map((n: string, i: number) => (
                    <li key={i} className="flex gap-1">
                        <span style={{ color: '#fde047' }}>•</span> {n}
                    </li>
                )) || (
                    <>
                        <li><span style={{ color: '#fde047' }}>•</span> Registration Confirmation: 21st March 2026</li>
                        <li><span style={{ color: '#fde047' }}>•</span> Session Timings: 9:30 AM - 4:00 PM</li>
                        <li><span style={{ color: '#fde047' }}>•</span> Registration is compulsory for all</li>
                        <li><span style={{ color: '#fde047' }}>•</span> Certificates will be provided by IEEE</li>
                    </>
                )}
            </ul>
        </div>

        <div className="bg-white p-2 rounded-lg mb-2 shadow-inner">
          <QRCodeSVG value={data.googleForm || ""} size={64} marginSize={1} />
        </div>
        <p className="text-[7px] mb-4 break-all max-w-[120px] text-center" style={{ color: 'rgba(255,255,255,0.6)' }}>{data.googleForm}</p>

        <div className="mt-auto w-full">
            <div className="bg-white text-[#0047AB] text-[10px] font-black py-0.5 px-4 rounded-full text-center mb-2 uppercase tracking-widest shadow-md">ACCOUNT DETAIL</div>
            <div className="text-[8px] space-y-0.5 font-medium leading-tight px-1" style={{ color: 'rgba(255,255,255,0.9)' }}>
                <p className="flex justify-between"><span>Bank Name</span> <span>: {data.accountDetails?.bankName || 'Indian Bank'}</span></p>
                <p className="flex justify-between"><span>Acc No</span> <span>: {data.accountDetails?.accountNo || '7111751848'}</span></p>
                <p className="flex justify-between"><span>Acc Name</span> <span className="text-right truncate max-w-[80px]">: {data.accountDetails?.accountName || 'C TECH ASSOCIATION'}</span></p>
                <p className="flex justify-between"><span>IFSC Code</span> <span>: {data.accountDetails?.ifscCode || 'IDIB000S181'}</span></p>
            </div>
            <div className="mt-3 py-1 px-3 bg-white text-[#0047AB] rounded-sm text-center text-[8px] font-black uppercase tracking-tighter">
                Contact: {data.contact?.name || 'Convener'} • {data.contact?.mobile || '9999999999'}
            </div>
        </div>
      </div>

      {/* Column 3: Event Details (White) */}
      <div className="column column-white flex flex-col items-center !p-4" style={{ backgroundColor: '#ffffff' }}>
        <div className="flex justify-center flex-wrap gap-2 w-full mb-4">
            {selectedLogos.slice(0, selectedLogos.length > 1 ? -1 : undefined).map(id => {
                const logo = availableLogos.find(l => l.id === id);
                return logo ? <img key={id} src={logo.src} className="h-8 object-contain" alt={id} /> : null;
            })}
        </div>

        <p className="text-[10px] font-black text-[#0047AB] uppercase tracking-[0.2em] mb-1">IEEE Madras Section Sponsored</p>
        <h1 className="text-2xl font-black text-center leading-[1.1] mb-2 uppercase tracking-tighter" style={{ color: '#0047AB' }}>
            {data.eventTitle}
        </h1>
        <p className="text-[12px] font-bold text-[#0047AB] mb-4">{data.dates}</p>

        <div className="flex-1 w-full rounded-xl overflow-hidden border shadow-inner mb-4 relative min-h-[160px]" style={{ backgroundColor: '#f8fafc', borderColor: '#f1f5f9' }}>
            {data.eventImage ? (
                <img src={data.eventImage} alt="Event AI" className="w-full h-full object-cover" />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[8px] uppercase tracking-widest" style={{ color: '#94a3b8' }}>Synthesizing Visual Identity...</div>
            )}
        </div>

        <div className="text-center mt-auto pt-3 flex flex-col items-center w-full" style={{ borderTop: '1px solid #f1f5f9' }}>
            <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: '#94a3b8' }}>Organized by</p>
            <p className="text-[12px] font-black text-[#0047AB] uppercase leading-tight max-w-[180px] mb-4">{data.department}</p>
            
            {selectedLogos.length > 1 && (
                <div className="mt-2 mb-4">
                    {(() => {
                        const lastId = selectedLogos[selectedLogos.length - 1];
                        const logo = availableLogos.find(l => l.id === lastId);
                        return logo ? <img src={logo.src} className="h-10 object-contain" alt="Bottom Logo" /> : null;
                    })()}
                </div>
            )}
            
            <p className="text-[10px] font-bold mt-0.5" style={{ color: '#64748b' }}>SRM Institute of Science and Technology</p>
        </div>
      </div>
    </div>
  );
}

