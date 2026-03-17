"use client";

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import MovableSegment from './MovableSegment';

interface PageOneProps {
    data: BrochureData;
  selectedLogos: string[];
    onEdit?: (path: string, value: string) => void;
    segmentPositions?: Record<string, SegmentPosition>;
    onSegmentMove?: (id: string, position: SegmentPosition) => void;
}

type SegmentPosition = {
    x: number;
    y: number;
};

type CommitteeMember = {
    name?: string;
    role?: string;
};

type BrochureData = {
    eventTitle?: string;
    dates?: string;
    department?: string;
    googleForm?: string;
    eventImage?: string;
    contact?: {
        name?: string;
        mobile?: string;
    };
    accountDetails?: {
        bankName?: string;
        accountNo?: string;
        accountName?: string;
        ifscCode?: string;
    };
    registration?: {
        ieeePrice?: string;
        nonIeeePrice?: string;
        notes?: string[];
    };
    committee?: CommitteeMember[];
};

type EditableTextProps = {
    path: string;
    value?: string;
    onEdit?: (path: string, value: string) => void;
    className?: string;
    style?: React.CSSProperties;
    multiline?: boolean;
};

const EditableText = ({ path, value, onEdit, className, style, multiline = false }: EditableTextProps) => {
    const safeValue = value ?? '';

    if (!onEdit) {
        return (
            <span className={className} style={style}>
                {safeValue}
            </span>
        );
    }

    const Tag = multiline ? 'div' : 'span';
    return (
        <Tag
            className={className}
            style={style}
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onEdit(path, e.currentTarget.textContent ?? '')}
            onKeyDown={(e) => {
                if (!multiline && e.key === 'Enter') {
                    e.preventDefault();
                    (e.currentTarget as HTMLElement).blur();
                }
            }}
        >
            {safeValue}
        </Tag>
    );
};

const availableLogos = [
  { id: 'srm', src: '/logos/srm.svg' },
  { id: 'ieee', src: '/logos/ieee.svg' },
  { id: 'ctech', src: '/logos/ctech.svg' },
  { id: 'naac', src: '/logos/naac.svg' },
];

export default function PageOne({ data, selectedLogos, onEdit, segmentPositions, onSegmentMove }: PageOneProps) {
    const committee = data.committee ?? [];
    const committeeWithIndex = committee.map((member, index) => ({ member, index }));

    const chiefPatrons = committeeWithIndex.filter(({ member }) => member.role?.toLowerCase().includes('chief patron'));
    const patrons = committeeWithIndex.filter(
        ({ member }) => member.role?.toLowerCase().includes('patron') && !member.role?.toLowerCase().includes('chief'),
    );
    const convener = committeeWithIndex.find(
        ({ member }) => member.role?.toLowerCase().includes('convener') && !member.role?.toLowerCase().includes('co-'),
    );
    const coConvener = committeeWithIndex.find(({ member }) => member.role?.toLowerCase().includes('co-convener'));
    const advisory = committeeWithIndex.filter(({ member }) => member.role?.toLowerCase().includes('advisory'));
    const organizing = committeeWithIndex.filter(
        ({ member }) =>
            !member.role?.toLowerCase().includes('patron') &&
            !member.role?.toLowerCase().includes('advisory') &&
            !member.role?.toLowerCase().includes('convener'),
    );

  return (
    <div id="brochure-page-1" className="brochure-page border border-gray-200" style={{ backgroundColor: '#ffffff' }}>
      {/* Column 1: Committees (White) */}
      <div className="column !p-4 flex flex-col" style={{ backgroundColor: '#ffffff', borderRight: '1px solid #e2e8f0' }}>
        <div className="flex-1 p-5 rounded-[32px] border border-[#0047AB20] bg-[#f8fafc] space-y-6 shadow-sm" style={{ backgroundColor: '#f8fafc', borderColor: 'rgba(0, 71, 171, 0.2)' }}>
            {chiefPatrons.length > 0 && (
                <MovableSegment id="p1-chief-patrons" position={segmentPositions?.['p1-chief-patrons']} onMove={onSegmentMove} index={0}>
                <div>
                    <h4 className="text-white text-[12px] font-black px-2 py-0.5 rounded-sm inline-block mb-1 uppercase tracking-wider" style={{ backgroundColor: '#0047AB' }}>CHIEF PATRONS</h4>
                    <ul className="text-[11.5px] leading-tight" style={{ color: '#1e293b' }}>
                        {chiefPatrons.map(({ member, index }) => (
                            <li key={index}>
                              <EditableText path={`committee.${index}.name`} value={member.name} onEdit={onEdit} className="font-bold inline" />
                              {', '}
                              <EditableText path={`committee.${index}.role`} value={member.role} onEdit={onEdit} className="inline" />
                            </li>
                        ))}
                    </ul>
                </div>
                </MovableSegment>
            )}
            
            {patrons.length > 0 && (
                <MovableSegment id="p1-patrons" position={segmentPositions?.['p1-patrons']} onMove={onSegmentMove} index={1}>
                <div>
                    <h4 className="text-white text-[12px] font-black px-2 py-0.5 rounded-sm inline-block mb-1 uppercase tracking-wider" style={{ backgroundColor: '#0047AB' }}>PATRONS</h4>
                    <ul className="text-[11.5px] leading-tight" style={{ color: '#1e293b' }}>
                        {patrons.map(({ member, index }) => (
                            <li key={index}>
                              <EditableText path={`committee.${index}.name`} value={member.name} onEdit={onEdit} className="font-bold inline" />
                              {', '}
                              <EditableText path={`committee.${index}.role`} value={member.role} onEdit={onEdit} className="inline" />
                            </li>
                        ))}
                    </ul>
                </div>
                </MovableSegment>
            )}

            {(convener || coConvener) && (
                <MovableSegment id="p1-conveners" position={segmentPositions?.['p1-conveners']} onMove={onSegmentMove} index={2}>
                <div className="flex gap-4">
                    {convener && (
                        <div className="flex-1">
                            <h4 className="text-[#0047AB] text-[11px] font-black uppercase tracking-wider border-b border-[#0047AB]/20 mb-1">CONVENER</h4>
                                                        <p className="text-[11px] leading-tight font-bold" style={{ color: '#1e293b' }}>
                                                            <EditableText path={`committee.${convener.index}.name`} value={convener.member.name} onEdit={onEdit} />
                                                        </p>
                                                        <p className="text-[10px] leading-tight opacity-70" style={{ color: '#1e293b' }}>
                                                            <EditableText path={`committee.${convener.index}.role`} value={convener.member.role} onEdit={onEdit} />
                                                        </p>
                        </div>
                    )}
                    {coConvener && (
                        <div className="flex-1">
                            <h4 className="text-[#0047AB] text-[11px] font-black uppercase tracking-wider border-b border-[#0047AB]/20 mb-1">CO-CONVENER</h4>
                                                        <p className="text-[11px] leading-tight font-bold" style={{ color: '#1e293b' }}>
                                                            <EditableText path={`committee.${coConvener.index}.name`} value={coConvener.member.name} onEdit={onEdit} />
                                                        </p>
                                                        <p className="text-[10px] leading-tight opacity-70" style={{ color: '#1e293b' }}>
                                                            <EditableText path={`committee.${coConvener.index}.role`} value={coConvener.member.role} onEdit={onEdit} />
                                                        </p>
                        </div>
                    )}
                </div>
                </MovableSegment>
            )}

            <MovableSegment id="p1-advisory" position={segmentPositions?.['p1-advisory']} onMove={onSegmentMove} index={3}>
            <div>
                <h4 className="text-[12px] font-black mb-1 uppercase tracking-wider" style={{ color: '#0047AB', borderBottom: '2px solid #0047AB' }}>ACADEMIC ADVISORY COMMITTEE</h4>
                <ul className="text-[11px] leading-[1.1] space-y-0.5" style={{ color: '#334155' }}>
                    {advisory.slice(0, 10).map(({ member, index }) => (
                        <li key={index} className="truncate">
                          <EditableText path={`committee.${index}.name`} value={member.name} onEdit={onEdit} className="font-bold inline" />
                          {', '}
                          <EditableText path={`committee.${index}.role`} value={member.role} onEdit={onEdit} className="inline" />
                        </li>
                    ))}
                </ul>
            </div>
            </MovableSegment>

            <MovableSegment id="p1-organizing" position={segmentPositions?.['p1-organizing']} onMove={onSegmentMove} index={4}>
            <div>
                <h4 className="text-[12px] font-black mb-1 uppercase tracking-wider" style={{ color: '#0047AB', borderBottom: '2px solid #0047AB' }}>ORGANIZING COMMITTEE</h4>
                <ul className="text-[11px] leading-[1.1] space-y-0.5" style={{ color: '#334155' }}>
                    {organizing.slice(0, 15).map(({ member, index }) => (
                        <li key={index} className="truncate">
                          <EditableText path={`committee.${index}.name`} value={member.name} onEdit={onEdit} className="font-bold inline" />
                          {', '}
                          <EditableText path={`committee.${index}.role`} value={member.role} onEdit={onEdit} className="inline" />
                        </li>
                    ))}
                </ul>
            </div>
            </MovableSegment>
        </div>
      </div>

      {/* Column 2: Registration (Blue) */}
      <div className="column column-blue flex flex-col items-center !p-4" style={{ backgroundColor: '#0047AB', color: '#ffffff' }}>
        <h2 className="text-lg font-black bg-white px-4 py-1 rounded-full mb-4 uppercase tracking-tighter" style={{ color: '#0047AB' }}>
          REGISTRATION DETAIL
        </h2>
        
        <MovableSegment id="p1-registration-fee" position={segmentPositions?.['p1-registration-fee']} onMove={onSegmentMove} index={5} className="w-full">
        <div className="w-full space-y-2 mb-4">
            <div className="flex justify-between text-[12px] font-bold pb-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                <span style={{ color: '#fde047' }}>Registration Fee:</span>
            </div>
            <div className="flex justify-between text-[11px] text-white">
                <span>IEEE Member</span>
                <span className="font-bold">: Rs. <EditableText path="registration.ieeePrice" value={data.registration?.ieeePrice} onEdit={onEdit} className="inline" />/-</span>
            </div>
            <div className="flex justify-between text-[11px] text-white">
                <span>Non IEEE Member</span>
                <span className="font-bold">: Rs. <EditableText path="registration.nonIeeePrice" value={data.registration?.nonIeeePrice} onEdit={onEdit} className="inline" />/-</span>
            </div>
            <p className="text-[10px] italic" style={{ color: 'rgba(255,255,255,0.8)' }}>(Rs. 250 refundable upon IEEE Membership enrollment)</p>
        </div>
        </MovableSegment>

        <MovableSegment id="p1-registration-notes" position={segmentPositions?.['p1-registration-notes']} onMove={onSegmentMove} index={6} className="w-full">
        <div className="w-full text-left p-2 rounded-lg mb-4" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <p className="text-[11px] font-black mb-1 uppercase tracking-widest" style={{ color: '#fde047' }}>Note:</p>
            <ul className="text-[10.5px] space-y-1" style={{ color: 'rgba(255,255,255,0.9)' }}>
                {data.registration?.notes?.map((n, i: number) => (
                    <li key={i} className="flex gap-1">
                        <span style={{ color: '#fde047' }}>•</span>
                        <EditableText path={`registration.notes.${i}`} value={n} onEdit={onEdit} className="inline" />
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
                </MovableSegment>

                <MovableSegment id="p1-qr" position={segmentPositions?.['p1-qr']} onMove={onSegmentMove} index={7} className="w-full flex flex-col items-center">
        <div className="bg-white p-2 rounded-lg mb-2 shadow-inner">
          <QRCodeSVG value={data.googleForm || ""} size={96} marginSize={1} />
        </div>
                <p className="text-[9px] mb-4 break-all max-w-[120px] text-center" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    <EditableText path="googleForm" value={data.googleForm} onEdit={onEdit} className="inline" />
                </p>
                </MovableSegment>

                <MovableSegment id="p1-account" position={segmentPositions?.['p1-account']} onMove={onSegmentMove} index={8} className="mt-auto w-full">
        <div className="mt-auto w-full">
            <div className="bg-white text-[#0047AB] text-[12px] font-black py-0.5 px-4 rounded-full text-center mb-2 uppercase tracking-widest shadow-md">ACCOUNT DETAIL</div>
            <div className="text-[10px] space-y-0.5 font-medium leading-tight px-1" style={{ color: 'rgba(255,255,255,0.9)' }}>
                <p className="flex justify-between"><span>Bank Name</span> <span>: <EditableText path="accountDetails.bankName" value={data.accountDetails?.bankName || 'Indian Bank'} onEdit={onEdit} className="inline" /></span></p>
                <p className="flex justify-between"><span>Acc No</span> <span>: <EditableText path="accountDetails.accountNo" value={data.accountDetails?.accountNo || '7111751848'} onEdit={onEdit} className="inline" /></span></p>
                <p className="flex justify-between"><span>Acc Name</span> <span className="text-right truncate max-w-[80px]">: <EditableText path="accountDetails.accountName" value={data.accountDetails?.accountName || 'C TECH ASSOCIATION'} onEdit={onEdit} className="inline" /></span></p>
                <p className="flex justify-between"><span>IFSC Code</span> <span>: <EditableText path="accountDetails.ifscCode" value={data.accountDetails?.ifscCode || 'IDIB000S181'} onEdit={onEdit} className="inline" /></span></p>
            </div>
            <div className="mt-3 py-1 px-3 bg-white text-[#0047AB] rounded-sm text-center text-[10px] font-black uppercase tracking-tighter">
                Contact: <EditableText path="contact.name" value={data.contact?.name || 'Convener'} onEdit={onEdit} className="inline" />
                {' • '}
                <EditableText path="contact.mobile" value={data.contact?.mobile || '9999999999'} onEdit={onEdit} className="inline" />
            </div>
        </div>
                </MovableSegment>
      </div>

      {/* Column 3: Event Details (White) */}
      <div className="column column-white flex flex-col items-center !p-4" style={{ backgroundColor: '#ffffff' }}>
        <MovableSegment id="p1-logos" position={segmentPositions?.['p1-logos']} onMove={onSegmentMove} index={9} className="w-full">
        <div className="flex justify-center flex-wrap gap-2 w-full mb-4">
            {selectedLogos.slice(0, selectedLogos.length > 1 ? -1 : undefined).map(id => {
                const logo = availableLogos.find(l => l.id === id);
                return logo ? <img key={id} src={logo.src} className="h-8 object-contain" alt={id} /> : null;
            })}
        </div>
        </MovableSegment>

        <MovableSegment id="p1-title" position={segmentPositions?.['p1-title']} onMove={onSegmentMove} index={10} className="w-full flex flex-col items-center">
        <p className="text-[10px] font-black text-[#0047AB] uppercase tracking-[0.2em] mb-1">IEEE Madras Section Sponsored</p>
        <h1 className="text-2xl font-black text-center leading-[1.1] mb-2 uppercase tracking-tighter" style={{ color: '#0047AB' }}>
            <EditableText path="eventTitle" value={data.eventTitle} onEdit={onEdit} />
        </h1>
        <p className="text-[12px] font-bold text-[#0047AB] mb-4"><EditableText path="dates" value={data.dates} onEdit={onEdit} /></p>
        </MovableSegment>

        <MovableSegment id="p1-image" position={segmentPositions?.['p1-image']} onMove={onSegmentMove} index={11} className="w-full flex-1">
        <div className="flex-1 w-full rounded-xl overflow-hidden border shadow-inner mb-4 relative min-h-[160px]" style={{ backgroundColor: '#f8fafc', borderColor: '#f1f5f9' }}>
            {data.eventImage ? (
                <img src={data.eventImage} alt="Event AI" className="w-full h-full object-cover" />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[8px] uppercase tracking-widest" style={{ color: '#94a3b8' }}>Synthesizing Visual Identity...</div>
            )}
        </div>
        </MovableSegment>

        <MovableSegment id="p1-footer" position={segmentPositions?.['p1-footer']} onMove={onSegmentMove} index={12} className="w-full">
        <div className="text-center mt-auto pt-3 flex flex-col items-center w-full" style={{ borderTop: '1px solid #f1f5f9' }}>
            <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: '#94a3b8' }}>Organized by</p>
            <p className="text-[12px] font-black text-[#0047AB] uppercase leading-tight max-w-[180px] mb-4"><EditableText path="department" value={data.department} onEdit={onEdit} /></p>
            
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
                </MovableSegment>
      </div>
    </div>
  );
}

