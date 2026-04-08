"use client";

import React, { CSSProperties } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Image from 'next/image';
import MovableSegment from './MovableSegment';
import BrochureOverlay from './BrochureOverlay';
import { BrochureData, OverlayItem, SegmentPosition } from '@/lib/domains/brochure';

type Palette = {
    primary: string;
    secondary: string;
    primaryText: string;
    surface: string;
    surfaceBorder: string;
    accent: string;
    mutedText: string;
    strongSurface?: string;
};

interface PageOneProps {
    data: BrochureData;
  selectedLogos: string[];
        logoCatalog?: Record<string, string>;
    onEdit?: (path: string, value: string) => void;
    segmentPositions?: Record<string, SegmentPosition>;
    onSegmentMove?: (id: string, position: SegmentPosition) => void;
    onDeleteSegment?: (id: string) => void;
    overlayItems?: OverlayItem[];
    selectedOverlayId?: string | null;
    onSelectOverlay?: (id: string | null) => void;
    onUpdateOverlay?: (id: string, patch: Partial<OverlayItem>) => void;
        canvasScale?: number;
    pageStyle: CSSProperties;
    palette?: Palette;
    hiddenSegments?: string[];
}

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
        const StaticTag = multiline ? 'div' : 'span';
        return (
            <StaticTag className={className} style={style}>
                {safeValue}
            </StaticTag>
        );
    }

    const Tag = multiline ? 'div' : 'span';
    return (
        <Tag
            className={`${multiline ? 'editable-block' : 'editable-inline'} ${className ?? ''}`.trim()}
            style={style}
            contentEditable
            suppressContentEditableWarning
            spellCheck={false}
            onInput={(e) => {
                if (multiline) {
                    const node = e.currentTarget as HTMLElement;
                    node.style.height = 'auto';
                    node.style.height = `${node.scrollHeight}px`;
                }
            }}
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
    { id: 'ieeetems', src: '/logos/ieeetems.png' },
    { id: 'ctech', src: '/logos/ctech.jpeg' },
    { id: 'ieee', src: '/logos/ieee.png' },
    { id: 'srm', src: '/logos/srm.svg' },
    { id: 'iicm', src: '/logos/iicm.png' },
    { id: 'soct', src: '/logos/soct.jpeg' },
];

export default function PageOne({
    data,
    selectedLogos,
    logoCatalog,
    onEdit,
    segmentPositions,
    onSegmentMove,
    onDeleteSegment,
    overlayItems = [],
    selectedOverlayId = null,
    onSelectOverlay,
    onUpdateOverlay,
    canvasScale = 1,
    pageStyle,
    palette,
    hiddenSegments = [],
}: PageOneProps) {
    const committee = data.committee ?? [];
    const committeeWithIndex = committee.map((member, index) => ({ member, index }));
    const headings = data.headings;

    const palettePrimary = palette?.primary ?? '#0b4da2';
    const paletteSecondary = palette?.secondary ?? '#5fa8ff';
    const palettePrimaryText = palette?.primaryText ?? '#ffffff';
    const paletteSurface = palette?.surface ?? '#ffffff';
    const paletteSurfaceBorder = palette?.surfaceBorder ?? '#e2e8f0';
    const paletteStrongSurface = palette?.strongSurface ?? palettePrimary;
    const paletteAccent = palette?.accent ?? '#facc15';
    const paletteMuted = palette?.mutedText ?? '#64748b';

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

    const resolveLogoSrc = (id: string): string | undefined => {
        if (logoCatalog?.[id]) return logoCatalog[id];
        return availableLogos.find((logo) => logo.id === id)?.src;
    };

    const pageBackgroundStyle = { backgroundColor: paletteSurface, ...pageStyle };
    const isHidden = (id: string) => hiddenSegments.includes(id);

    return (
        <div id="brochure-page-1" className="brochure-page border border-gray-200" style={pageBackgroundStyle}>
            {/* Column 1: Committees (White) */}
                        <div className="column !p-4 flex flex-col" style={{ backgroundColor: paletteSurface, borderRight: `1px solid ${paletteSurfaceBorder}` }}>
                                <div className="flex-1 p-5 rounded-[32px] border space-y-6 shadow-sm" style={{ backgroundColor: paletteSurface, borderColor: `${paletteSurfaceBorder}` }}>
            {chiefPatrons.length > 0 && !isHidden('p1-chief-patrons') && (
                <MovableSegment id="p1-chief-patrons" position={segmentPositions?.['p1-chief-patrons']} onMove={onSegmentMove} index={0} onDelete={onDeleteSegment}>
                <div>
                                        <h4 className="text-white text-[12px] font-black px-2 py-0.5 rounded-sm inline-block mb-1 uppercase tracking-wider" style={{ backgroundColor: palettePrimary }}>
                                            <EditableText path="headings.chiefPatrons" value={headings.chiefPatrons} onEdit={onEdit} />
                                        </h4>
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
            
            {patrons.length > 0 && !isHidden('p1-patrons') && (
                <MovableSegment id="p1-patrons" position={segmentPositions?.['p1-patrons']} onMove={onSegmentMove} index={1} onDelete={onDeleteSegment}>
                <div>
                                        <h4 className="text-white text-[12px] font-black px-2 py-0.5 rounded-sm inline-block mb-1 uppercase tracking-wider" style={{ backgroundColor: palettePrimary }}>
                                            <EditableText path="headings.patrons" value={headings.patrons} onEdit={onEdit} />
                                        </h4>
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

            {(convener || coConvener) && !isHidden('p1-conveners') && (
                <MovableSegment id="p1-conveners" position={segmentPositions?.['p1-conveners']} onMove={onSegmentMove} index={2} onDelete={onDeleteSegment}>
                <div className="flex gap-4">
                    {convener && (
                        <div className="flex-1">
                                                        <h4 className="text-[11px] font-black uppercase tracking-wider border-b mb-1" style={{ color: palettePrimary, borderColor: `${palettePrimary}33` }}>
                                                            <EditableText path="headings.convener" value={headings.convener} onEdit={onEdit} />
                                                        </h4>
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
                                                        <h4 className="text-[11px] font-black uppercase tracking-wider border-b mb-1" style={{ color: palettePrimary, borderColor: `${palettePrimary}33` }}>
                                                            <EditableText path="headings.coConvener" value={headings.coConvener} onEdit={onEdit} />
                                                        </h4>
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

            {!isHidden('p1-advisory') && (
            <MovableSegment id="p1-advisory" position={segmentPositions?.['p1-advisory']} onMove={onSegmentMove} index={3} onDelete={onDeleteSegment}>
            <div>
                                <h4 className="text-[12px] font-black mb-1 uppercase tracking-wider" style={{ color: palettePrimary, borderBottom: `2px solid ${palettePrimary}` }}>
                                    <EditableText path="headings.advisoryCommittee" value={headings.advisoryCommittee} onEdit={onEdit} />
                                </h4>
                <ul className="text-[11px] leading-[1.1] space-y-0.5" style={{ color: '#334155' }}>
                    {advisory.slice(0, 10).map(({ member, index }) => (
                                                <li key={index} className="break-words whitespace-normal">
                          <EditableText path={`committee.${index}.name`} value={member.name} onEdit={onEdit} className="font-bold inline" />
                          {', '}
                                                    <EditableText path={`committee.${index}.role`} value={member.role} onEdit={onEdit} className="inline" />
                        </li>
                    ))}
                </ul>
            </div>
            </MovableSegment>
            )}

            {!isHidden('p1-organizing') && (
            <MovableSegment id="p1-organizing" position={segmentPositions?.['p1-organizing']} onMove={onSegmentMove} index={4} onDelete={onDeleteSegment}>
            <div>
                                <h4 className="text-[12px] font-black mb-1 uppercase tracking-wider" style={{ color: palettePrimary, borderBottom: `2px solid ${palettePrimary}` }}>
                                    <EditableText path="headings.organizingCommittee" value={headings.organizingCommittee} onEdit={onEdit} />
                                </h4>
                <ul className="text-[11px] leading-[1.1] space-y-0.5" style={{ color: '#334155' }}>
                    {organizing.slice(0, 15).map(({ member, index }) => (
                                                <li key={index} className="break-words whitespace-normal">
                          <EditableText path={`committee.${index}.name`} value={member.name} onEdit={onEdit} className="font-bold inline" />
                          {', '}
                                                    <EditableText path={`committee.${index}.role`} value={member.role} onEdit={onEdit} className="inline" />
                        </li>
                    ))}
                </ul>
            </div>
            </MovableSegment>
            )}
        </div>
      </div>

      {/* Column 2: Registration (Blue) */}
    <div className="column column-blue flex flex-col items-center !p-4" style={{ backgroundColor: paletteStrongSurface, color: palettePrimaryText }}>
                <h2 className="text-lg font-black bg-white px-4 py-1 rounded-full mb-4 uppercase tracking-tighter" style={{ color: palettePrimary }}>
                    <EditableText path="headings.registrationDetail" value={headings.registrationDetail} onEdit={onEdit} />
                </h2>
        
        {!isHidden('p1-registration-fee') && (
        <MovableSegment id="p1-registration-fee" position={segmentPositions?.['p1-registration-fee']} onMove={onSegmentMove} index={5} className="w-full" onDelete={onDeleteSegment}>
        <div className="w-full space-y-2 mb-4">
            <div className="flex justify-between text-[12px] font-bold pb-1" style={{ borderBottom: `1px solid ${paletteSurfaceBorder}` }}>
                <span style={{ color: paletteAccent }}><EditableText path="headings.registrationFee" value={headings.registrationFee} onEdit={onEdit} className="inline" /></span>
            </div>
            <div className="flex justify-between text-[11px]" style={{ color: palettePrimaryText }}>
                <span>IEEE Member</span>
                <span className="font-bold">: Rs. <EditableText path="registration.ieeePrice" value={data.registration?.ieeePrice} onEdit={onEdit} className="inline" />/-</span>
            </div>
            <div className="flex justify-between text-[11px]" style={{ color: palettePrimaryText }}>
                <span>Non IEEE Member</span>
                <span className="font-bold">: Rs. <EditableText path="registration.nonIeeePrice" value={data.registration?.nonIeeePrice} onEdit={onEdit} className="inline" />/-</span>
            </div>
            <p className="text-[10px] italic" style={{ color: paletteMuted }}>(Rs. 250 refundable upon IEEE Membership enrollment)</p>
        </div>
        </MovableSegment>
        )}

        {!isHidden('p1-registration-notes') && (
        <MovableSegment id="p1-registration-notes" position={segmentPositions?.['p1-registration-notes']} onMove={onSegmentMove} index={6} className="w-full" onDelete={onDeleteSegment}>
        <div className="w-full text-left p-2 rounded-lg mb-4" style={{ backgroundColor: `${paletteSurface}AA`, border: `1px solid ${paletteSurfaceBorder}` }}>
                        <p className="text-[11px] font-black mb-1 uppercase tracking-widest" style={{ color: paletteAccent }}>
                            <EditableText path="headings.registrationNote" value={headings.registrationNote} onEdit={onEdit} className="inline" />
                        </p>
            <ul className="text-[10.5px] space-y-1" style={{ color: palettePrimaryText }}>
                {data.registration?.notes?.map((n, i: number) => (
                    <li key={i} className="flex gap-1">
                        <span style={{ color: paletteAccent }}>•</span>
                        <EditableText path={`registration.notes.${i}`} value={n} onEdit={onEdit} className="inline whitespace-pre-wrap break-words" />
                    </li>
                )) || (
                    <>
                        <li><span style={{ color: paletteAccent }}>•</span> Registration Confirmation: 21st March 2026</li>
                        <li><span style={{ color: paletteAccent }}>•</span> Session Timings: 9:30 AM - 4:00 PM</li>
                        <li><span style={{ color: paletteAccent }}>•</span> Registration is compulsory for all</li>
                        <li><span style={{ color: paletteAccent }}>•</span> Certificates will be provided by IEEE</li>
                    </>
                )}
            </ul>
        </div>
                </MovableSegment>
        )}

                                {!isHidden('p1-qr') && (
                <MovableSegment id="p1-qr" position={segmentPositions?.['p1-qr']} onMove={onSegmentMove} index={7} className="w-full flex flex-col items-center" onDelete={onDeleteSegment}>
                            <div className="bg-white p-2 rounded-lg mb-2 shadow-inner flex items-center justify-center">
                    <QRCodeSVG value={data.googleForm || ""} size={96} marginSize={1} />
                </div>
                                <p className="text-[9px] mb-4 break-all max-w-[120px] text-center" style={{ color: paletteMuted }}>
                    <EditableText path="googleForm" value={data.googleForm} onEdit={onEdit} className="inline" />
                </p>
                </MovableSegment>
                                )}

                {!isHidden('p1-account') && (
                <MovableSegment id="p1-account" position={segmentPositions?.['p1-account']} onMove={onSegmentMove} index={8} className="mt-auto w-full" onDelete={onDeleteSegment}>
        <div className="mt-auto w-full">
                        <div className="bg-white text-[12px] font-black py-0.5 px-4 rounded-full text-center mb-2 uppercase tracking-widest shadow-md" style={{ color: palettePrimary }}>
                            <EditableText path="headings.accountDetail" value={headings.accountDetail} onEdit={onEdit} className="inline" />
                        </div>
            <div className="text-[10px] space-y-0.5 font-medium leading-tight px-1" style={{ color: palettePrimaryText }}>
                <p className="flex justify-between"><span>Bank Name</span> <span>: <EditableText path="accountDetails.bankName" value={data.accountDetails?.bankName || 'Indian Bank'} onEdit={onEdit} className="inline" /></span></p>
                <p className="flex justify-between"><span>Acc No</span> <span>: <EditableText path="accountDetails.accountNo" value={data.accountDetails?.accountNo || '7111751848'} onEdit={onEdit} className="inline" /></span></p>
                <p className="flex justify-between gap-2"><span>Acc Name</span> <span className="text-right max-w-[140px] break-words">: <EditableText path="accountDetails.accountName" value={data.accountDetails?.accountName || 'C TECH ASSOCIATION'} onEdit={onEdit} className="inline" /></span></p>
                <p className="flex justify-between"><span>IFSC Code</span> <span>: <EditableText path="accountDetails.ifscCode" value={data.accountDetails?.ifscCode || 'IDIB000S181'} onEdit={onEdit} className="inline" /></span></p>
            </div>
            <div className="mt-3 py-1 px-3 bg-white rounded-sm text-center text-[10px] font-black uppercase tracking-tighter" style={{ color: palettePrimary }}>
                Contact: <EditableText path="contact.name" value={data.contact?.name || 'Convener'} onEdit={onEdit} className="inline" />
                {' • '}
                <EditableText path="contact.mobile" value={data.contact?.mobile || '9999999999'} onEdit={onEdit} className="inline" />
            </div>
        </div>
                </MovableSegment>
                )}
      </div>

            {/* Column 3: Event Details (White) */}
            <div className="column column-white flex flex-col items-center !p-4" style={{ backgroundColor: paletteSurface }}>
        {!isHidden('p1-logos') && (
        <MovableSegment id="p1-logos" position={segmentPositions?.['p1-logos']} onMove={onSegmentMove} index={9} className="w-full" onDelete={onDeleteSegment}>
        <div className="flex justify-center flex-wrap gap-2 w-full mb-4">
            {selectedLogos.slice(0, selectedLogos.length > 1 ? -1 : undefined).map(id => {
                const src = resolveLogoSrc(id);
                                return src ? (
                                    <Image key={id} src={src} width={72} height={32} className="h-8 w-auto object-contain" alt={id} unoptimized />
                                ) : null;
            })}
        </div>
        </MovableSegment>
        )}

        {!isHidden('p1-title') && (
        <MovableSegment id="p1-title" position={segmentPositions?.['p1-title']} onMove={onSegmentMove} index={10} className="w-full flex flex-col items-center" style={{ backgroundColor: paletteSurface }} onDelete={onDeleteSegment}>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: palettePrimary }}>
                    <EditableText path="headings.sponsoredBy" value={headings.sponsoredBy} onEdit={onEdit} className="inline" />
                </p>
        <h1 className="text-2xl font-black text-center leading-[1.1] mb-2 uppercase tracking-tighter" style={{ color: palettePrimary }}>
            <EditableText path="eventTitle" value={data.eventTitle} onEdit={onEdit} className="whitespace-pre-wrap break-words" />
        </h1>
        <p className="text-[12px] font-bold mb-4" style={{ color: palettePrimary }}><EditableText path="dates" value={data.dates} onEdit={onEdit} /></p>
        </MovableSegment>
        )}

        {!isHidden('p1-image') && (
        <MovableSegment id="p1-image" position={segmentPositions?.['p1-image']} onMove={onSegmentMove} index={11} className="w-full flex-1" onDelete={onDeleteSegment}>
        <div className="flex-1 w-full rounded-xl overflow-hidden border shadow-inner mb-4 relative min-h-[160px]" style={{ backgroundColor: paletteSurface, borderColor: paletteSurfaceBorder }}>
            {data.eventImage ? (
                <Image src={data.eventImage} alt="Event AI" className="w-full h-full object-cover" fill unoptimized />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-28 h-28 rounded-xl border border-slate-200 bg-slate-50 shadow-inner flex items-center justify-center">
                        <Image src="/icon-logo.png" alt="Placeholder" width={72} height={72} className="opacity-70" />
                    </div>
                </div>
            )}
        </div>
        </MovableSegment>
        )}

        {!isHidden('p1-footer') && (
        <MovableSegment id="p1-footer" position={segmentPositions?.['p1-footer']} onMove={onSegmentMove} index={12} className="w-full" onDelete={onDeleteSegment}>
            <div className="text-center mt-auto pt-3 flex flex-col items-center w-full" style={{ borderTop: `1px solid ${paletteSurfaceBorder}` }}>
                        <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: paletteMuted }}>
                            <EditableText path="headings.organizedBy" value={headings.organizedBy} onEdit={onEdit} className="inline" />
                        </p>
            <p className="text-[12px] font-black uppercase leading-tight max-w-[180px] mb-4" style={{ color: palettePrimary }}><EditableText path="department" value={data.department} onEdit={onEdit} /></p>
            
            {selectedLogos.length > 1 && (
                <div className="mt-2 mb-4">
                    {(() => {
                        const lastId = selectedLogos[selectedLogos.length - 1];
                        const src = resolveLogoSrc(lastId);
                        return src ? <Image src={src} width={96} height={40} className="h-10 w-auto object-contain" alt="Bottom Logo" unoptimized /> : null;
                    })()}
                </div>
            )}
            
            <p className="text-[10px] font-bold mt-0.5" style={{ color: paletteMuted }}>SRM Institute of Science and Technology</p>
        </div>
                </MovableSegment>
        )}
      </div>

            {onSelectOverlay && onUpdateOverlay && (
                <BrochureOverlay
                    items={overlayItems}
                    selectedId={selectedOverlayId}
                    onSelect={onSelectOverlay}
                    onUpdate={onUpdateOverlay}
                    canvasScale={canvasScale}
                />
            )}

                        <div className="pointer-events-none absolute bottom-4 right-4 text-[9px] font-black uppercase tracking-[0.28em]" style={{ color: `${paletteMuted}66` }}>
                                made with Brochify
                        </div>
    </div>
  );
}

