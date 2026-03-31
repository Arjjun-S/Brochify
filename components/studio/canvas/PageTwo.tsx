"use client";

import React from 'react';
import MovableSegment from './MovableSegment';
import BrochureOverlay from './BrochureOverlay';
import { BrochureData, OverlayItem, SegmentPosition } from '@/lib/domains/brochure';

interface PageTwoProps {
        data: BrochureData;
        selectedLogos: string[];
        onEdit?: (path: string, value: string) => void;
    segmentPositions?: Record<string, SegmentPosition>;
    onSegmentMove?: (id: string, position: SegmentPosition) => void;
        overlayItems?: OverlayItem[];
        selectedOverlayId?: string | null;
        onSelectOverlay?: (id: string | null) => void;
        onUpdateOverlay?: (id: string, patch: Partial<OverlayItem>) => void;
    canvasScale?: number;
}

type EditableTextProps = {
    path: string;
    value?: string;
    onEdit?: (path: string, value: string) => void;
    className?: string;
    multiline?: boolean;
};

const EditableText = ({ path, value, onEdit, className, multiline = false }: EditableTextProps) => {
    const safeValue = value ?? '';
    const Tag = multiline ? 'div' : 'span';

    if (!onEdit) {
        return <Tag className={className}>{safeValue}</Tag>;
    }

    return (
        <Tag
            className={`${multiline ? 'editable-block' : 'editable-inline'} ${className ?? ''}`.trim()}
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
        >
            {safeValue}
        </Tag>
    );
};

export default function PageTwo({
    data,
    selectedLogos,
    onEdit,
    segmentPositions,
    onSegmentMove,
    overlayItems = [],
    selectedOverlayId = null,
    onSelectOverlay,
    onUpdateOverlay,
    canvasScale = 1,
}: PageTwoProps) {
        void selectedLogos;
    const headings = data.headings;
    return (
        <div id="brochure-page-2" className="brochure-page border border-gray-200" style={{ backgroundColor: '#ffffff' }}>
            <div className="column flex-[0.8] !p-5 flex flex-col gap-5" style={{ backgroundColor: '#0047AB', color: '#ffffff', fontSize: '11.5px' }}>
                <MovableSegment id="p2-about-srm" position={segmentPositions?.['p2-about-srm']} onMove={onSegmentMove} index={0}>
                <div className="text-center">
                    <h3 className="text-base font-black mb-3 uppercase tracking-tighter inline-block px-4 py-1 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.3)' }}>
                      <EditableText path="headings.aboutCollege" value={headings.aboutCollege} onEdit={onEdit} className="inline" />
                    </h3>
                                        <EditableText path="aboutCollege" value={data.aboutCollege} onEdit={onEdit} multiline className="block text-left leading-[1.34] whitespace-pre-wrap break-words" />
                </div>
                </MovableSegment>
                <MovableSegment id="p2-about-school" position={segmentPositions?.['p2-about-school']} onMove={onSegmentMove} index={1}>
                <div className="text-center">
                    <h3 className="text-[14px] font-black mb-3 uppercase tracking-tighter inline-block px-4 py-1 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.3)' }}>
                      <EditableText path="headings.aboutSchool" value={headings.aboutSchool} onEdit={onEdit} className="inline" />
                    </h3>
                                        <EditableText path="aboutSchool" value={data.aboutSchool} onEdit={onEdit} multiline className="block text-left leading-[1.34] whitespace-pre-wrap break-words" />
                </div>
                </MovableSegment>
            </div>

            {/* Column 2: About Dept & FDP (White) */}
            <div className="column border-x flex flex-col gap-5 !p-5" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#334155', fontSize: '10px' }}>
                <MovableSegment id="p2-about-dept" position={segmentPositions?.['p2-about-dept']} onMove={onSegmentMove} index={2}>
                <div className="text-center">
                                        <h3 className="text-[13px] font-black mb-3 uppercase tracking-tighter inline-block px-4 py-1 rounded-full" style={{ color: '#0047AB', backgroundColor: 'rgba(0, 71, 171, 0.1)', borderBottom: '1px solid rgba(0, 71, 171, 0.2)' }}>
                                            <EditableText path="headings.aboutDepartment" value={headings.aboutDepartment} onEdit={onEdit} className="inline" />
                                        </h3>
                    <EditableText path="aboutDepartment" value={data.aboutDepartment} onEdit={onEdit} multiline className="block text-left leading-[1.34] whitespace-pre-wrap break-words" />
                </div>
                </MovableSegment>
                <MovableSegment id="p2-about-fdp" position={segmentPositions?.['p2-about-fdp']} onMove={onSegmentMove} index={3}>
                <div className="text-center">
                                        <h3 className="text-[13px] font-black mb-3 uppercase tracking-tighter inline-block px-4 py-1 rounded-full" style={{ color: '#0047AB', backgroundColor: 'rgba(0, 71, 171, 0.1)', borderBottom: '1px solid rgba(0, 71, 171, 0.2)' }}>
                                            <EditableText path="headings.aboutFdp" value={headings.aboutFdp} onEdit={onEdit} className="inline" />
                                        </h3>
                    <EditableText path="aboutFdp" value={data.aboutFdp} onEdit={onEdit} multiline className="block text-left leading-[1.34] whitespace-pre-wrap break-words" />
                </div>
                </MovableSegment>

                <MovableSegment id="p2-highlights" position={segmentPositions?.['p2-highlights']} onMove={onSegmentMove} index={4}>
                <div className="mt-2 p-3 border rounded-2xl" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
                                        <p className="text-[10px] font-black uppercase mb-1 underline" style={{ color: '#0047AB' }}>
                                            <EditableText path="headings.programHighlights" value={headings.programHighlights} onEdit={onEdit} className="inline" />
                                        </p>
                    <ul className="text-[10px] space-y-1" style={{ color: '#475569' }}>
                        {data.topics?.slice(0, 5).map((t, i: number) => (
                            <li key={i} className="break-words whitespace-normal">• Day {i + 1}: <EditableText path={`topics.${i}.forenoon`} value={t.forenoon} onEdit={onEdit} className="inline whitespace-pre-wrap break-words" /></li>
                        ))}
                    </ul>
                </div>
                </MovableSegment>
            </div>

            {/* Column 3: Topics & Speakers (Blue) */}
            <div className="column column-blue flex flex-col !p-4 gap-2" style={{ backgroundColor: '#0047AB', color: '#ffffff' }}>
                <MovableSegment id="p2-topics" position={segmentPositions?.['p2-topics']} onMove={onSegmentMove} index={5}>
                                <h3 className="text-[11px] font-black text-center mb-3 pb-1 uppercase tracking-widest" style={{ borderBottom: '1px solid rgba(255,255,255,0.3)', color: '#fde047' }}>
                                    <EditableText path="headings.topics" value={headings.topics} onEdit={onEdit} className="inline" />
                                </h3>

                <div className="overflow-hidden rounded-md border mb-4" style={{ borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                    <table className="w-full text-[8.5px] border-collapse">
                        <thead className="uppercase font-black" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#ffffff' }}>
                            <tr>
                                <th className="p-1 text-center w-10" style={{ borderRight: '1px solid rgba(255,255,255,0.3)' }}>Date</th>
                                <th className="p-1 text-left">Forenoon / Afternoon Session</th>
                            </tr>
                        </thead>
                        <tbody style={{ color: 'rgba(255,255,255,0.9)' }}>
                            {data.topics?.slice(0, 5).map((t, i: number) => (
                                <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.3)' }}>
                                    <td className="p-1.5 text-center font-bold" style={{ borderRight: '1px solid rgba(255,255,255,0.3)' }}><EditableText path={`topics.${i}.date`} value={t.date} onEdit={onEdit} /></td>
                                    <td className="p-1.5">
                                        <div className="font-bold break-words whitespace-normal" style={{ color: '#fef9c3' }}><EditableText path={`topics.${i}.forenoon`} value={t.forenoon} onEdit={onEdit} className="inline whitespace-pre-wrap break-words" /></div>
                                        <div className="italic break-words whitespace-normal" style={{ opacity: 0.7 }}><EditableText path={`topics.${i}.afternoon`} value={t.afternoon} onEdit={onEdit} className="inline whitespace-pre-wrap break-words" /></div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                </MovableSegment>

                <MovableSegment id="p2-speakers" position={segmentPositions?.['p2-speakers']} onMove={onSegmentMove} index={6} className="flex-1">
                                <h3 className="text-[12px] font-black text-center mb-3 pb-1 uppercase tracking-widest" style={{ borderBottom: '1px solid rgba(255,255,255,0.3)', color: '#fde047' }}>
                                    <EditableText path="headings.speakers" value={headings.speakers} onEdit={onEdit} className="inline" />
                                </h3>
                <div className="grid grid-cols-2 gap-2 flex-1">
                    {data.speakers?.slice(0, 8).map((s, i: number) => (
                        <div key={i} className="p-1.5 rounded border flex flex-col justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}>
                            <p className="font-black text-[9.5px] leading-none mb-0.5" style={{ color: '#fde047' }}><EditableText path={`speakers.${i}.name`} value={s.name} onEdit={onEdit} /></p>
                            <p className="text-[8.5px] italic leading-tight break-words whitespace-normal" style={{ color: 'rgba(255,255,255,0.7)' }}><EditableText path={`speakers.${i}.role`} value={s.role} onEdit={onEdit} className="inline whitespace-pre-wrap break-words" /></p>
                            <p className="text-[8px] leading-tight break-words whitespace-normal" style={{ color: 'rgba(255,255,255,0.5)' }}><EditableText path={`speakers.${i}.org`} value={s.org} onEdit={onEdit} className="inline whitespace-pre-wrap break-words" /></p>
                        </div>
                    ))}
                </div>
                </MovableSegment>

                <MovableSegment id="p2-footer" position={segmentPositions?.['p2-footer']} onMove={onSegmentMove} index={7}>
                <div className="mt-4 pt-2 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.2)', opacity: 0.5 }}>
                    <span className="text-[7px] font-bold text-white uppercase italic">Brochify Gen-AI Engine</span>
                    <span className="text-[7px] font-black" style={{ color: '#facc15' }}>SRM-KTR • 2026</span>
                </div>
                </MovableSegment>
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
        </div>
    );
}
