"use client";

import React, { CSSProperties } from 'react';
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

type FormLineStyle = {
    align?: 'left' | 'center' | 'right';
    fontSize?: number;
    color?: string;
};

interface PageTwoProps {
    data: BrochureData;
    selectedLogos: string[];
    onEdit?: (path: string, value: string) => void;
    segmentPositions?: Record<string, SegmentPosition>;
    onSegmentMove?: (id: string, position: SegmentPosition) => void;
    onSegmentInteractionStart?: (id: string, mode: 'move' | 'resize') => void;
    onSegmentInteractionEnd?: (id: string, mode: 'move' | 'resize') => void;
    selectedSegmentId?: string | null;
    onSelectSegment?: (id: string) => void;
    overlayItems?: OverlayItem[];
    selectedOverlayId?: string | null;
    onSelectOverlay?: (id: string | null) => void;
    onUpdateOverlay?: (id: string, patch: Partial<OverlayItem>) => void;
    onOverlayInteractionStart?: (id: string, mode: 'move' | 'resize') => void;
    onOverlayInteractionEnd?: (id: string, mode: 'move' | 'resize') => void;
    canvasScale?: number;
    pageStyle: CSSProperties;
    palette?: Palette;
    hiddenSegments?: string[];
    formLineStyles?: Record<string, FormLineStyle>;
    activeEditingLineKey?: string | null;
    onBeginEditLine?: (lineKey: string, segmentId: string | null) => void;
    onEndEditLine?: () => void;
}

type EditableTextProps = {
    path: string;
    value?: string;
    onEdit?: (path: string, value: string) => void;
    className?: string;
    multiline?: boolean;
};

type EditableTextContextValue = {
    lineStyles?: Record<string, FormLineStyle>;
    activeEditingLineKey?: string | null;
    onBeginEditLine?: (lineKey: string, segmentId: string | null) => void;
    onEndEditLine?: () => void;
};

const EditableTextContext = React.createContext<EditableTextContextValue>({});

const toLineStyle = (lineStyle?: FormLineStyle): React.CSSProperties => {
    if (!lineStyle) return {};

    return {
        ...(lineStyle.align ? { textAlign: lineStyle.align } : {}),
        ...(lineStyle.fontSize ? { fontSize: `${lineStyle.fontSize}px` } : {}),
        ...(lineStyle.color ? { color: lineStyle.color } : {}),
    };
};

const EditableText = ({ path, value, onEdit, className, multiline = false }: EditableTextProps) => {
    const safeValue = value ?? '';
    const {
        lineStyles,
        activeEditingLineKey,
        onBeginEditLine,
        onEndEditLine,
    } = React.useContext(EditableTextContext);

    const beginEdit = (lineKey: string, eventTarget: HTMLElement) => {
        const segmentId = (eventTarget.closest('.segment-shell') as HTMLElement | null)?.dataset.segmentId ?? null;
        onBeginEditLine?.(lineKey, segmentId);
        window.requestAnimationFrame(() => {
            eventTarget.focus();
        });
    };

    const resolveStyle = (lineKey: string): React.CSSProperties => ({
        ...toLineStyle(lineStyles?.[lineKey]),
    });

    if (!onEdit) {
        if (multiline) {
            const lines = safeValue.split('\n');
            return (
                <div className={className}>
                    {lines.map((line, lineIndex) => {
                        const lineKey = `${path}::${lineIndex}`;
                        return (
                            <div
                                key={lineKey}
                                className="editable-block"
                                style={resolveStyle(lineKey)}
                                data-editable-path={path}
                                data-editable-line={lineIndex}
                                data-form-line-key={lineKey}
                            >
                                {line}
                            </div>
                        );
                    })}
                </div>
            );
        }

        const lineKey = path;
        return (
            <span
                className={className}
                style={resolveStyle(lineKey)}
                data-editable-path={path}
                data-form-line-key={lineKey}
            >
                {safeValue}
            </span>
        );
    }

    if (multiline) {
        const lines = safeValue.split('\n');
        return (
            <div className={className}>
                {lines.map((line, lineIndex) => {
                    const lineKey = `${path}::${lineIndex}`;
                    const isEditing = activeEditingLineKey === lineKey;
                    return (
                        <div
                            key={lineKey}
                            className={`editable-block ${isEditing ? 'editable-line-editing' : ''}`.trim()}
                            style={resolveStyle(lineKey)}
                            contentEditable={isEditing}
                            suppressContentEditableWarning
                            spellCheck={false}
                            tabIndex={-1}
                            data-editable-path={path}
                            data-editable-line={lineIndex}
                            data-form-line-key={lineKey}
                            onDoubleClick={(event) => {
                                event.stopPropagation();
                                beginEdit(lineKey, event.currentTarget as HTMLElement);
                            }}
                            onBlur={(e) => {
                                if (!isEditing) return;
                                const nextLines = [...lines];
                                nextLines[lineIndex] = e.currentTarget.textContent ?? '';
                                onEdit(path, nextLines.join('\n'));
                                onEndEditLine?.();
                            }}
                            onKeyDown={(e) => {
                                if (!isEditing) return;
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    (e.currentTarget as HTMLElement).blur();
                                }
                                if (e.key === 'Escape') {
                                    e.preventDefault();
                                    onEndEditLine?.();
                                    (e.currentTarget as HTMLElement).blur();
                                }
                            }}
                        >
                            {line}
                        </div>
                    );
                })}
            </div>
        );
    }

    const lineKey = path;

    return (
        <span
            className={`editable-inline ${className ?? ''}`.trim()}
            style={resolveStyle(lineKey)}
            contentEditable={activeEditingLineKey === lineKey}
            suppressContentEditableWarning
            spellCheck={false}
            tabIndex={-1}
            data-editable-path={path}
            data-form-line-key={lineKey}
            onDoubleClick={(event) => {
                event.stopPropagation();
                beginEdit(lineKey, event.currentTarget as HTMLElement);
            }}
            onBlur={(e) => {
                if (activeEditingLineKey !== lineKey) return;
                onEdit(path, e.currentTarget.textContent ?? '');
                onEndEditLine?.();
            }}
            onKeyDown={(e) => {
                if (activeEditingLineKey !== lineKey) return;
                if (e.key === 'Enter') {
                    e.preventDefault();
                    (e.currentTarget as HTMLElement).blur();
                }
                if (e.key === 'Escape') {
                    e.preventDefault();
                    onEndEditLine?.();
                    (e.currentTarget as HTMLElement).blur();
                }
            }}
        >
            {safeValue}
        </span>
    );
};

export default function PageTwo({
    data,
    selectedLogos,
    onEdit,
    segmentPositions,
    onSegmentMove,
    onSegmentInteractionStart,
    onSegmentInteractionEnd,
    selectedSegmentId = null,
    onSelectSegment,
    overlayItems = [],
    selectedOverlayId = null,
    onSelectOverlay,
    onUpdateOverlay,
    onOverlayInteractionStart,
    onOverlayInteractionEnd,
    canvasScale = 1,
    pageStyle,
    palette,
    hiddenSegments = [],
    formLineStyles,
    activeEditingLineKey = null,
    onBeginEditLine,
    onEndEditLine,
}: PageTwoProps) {
        void selectedLogos;
    const headings = data.headings;
    const palettePrimary = palette?.primary ?? '#0b4da2';
    const palettePrimaryText = palette?.primaryText ?? '#ffffff';
    const paletteSurface = palette?.surface ?? '#ffffff';
    const paletteSurfaceBorder = palette?.surfaceBorder ?? '#e2e8f0';
    const paletteStrongSurface = palette?.strongSurface ?? palettePrimary;
    const paletteAccent = palette?.accent ?? '#facc15';
    const strongSurfaceToneIsDark = palettePrimaryText.toLowerCase() === '#ffffff';
    const columnHighlight = strongSurfaceToneIsDark ? palette?.secondary ?? '#93c5fd' : paletteAccent;
    const columnBorder = strongSurfaceToneIsDark ? 'rgba(255,255,255,0.3)' : 'rgba(15,23,42,0.2)';
    const columnCardBackground = strongSurfaceToneIsDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.58)';
    const columnHeadBackground = strongSurfaceToneIsDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.76)';
    const columnHeadText = strongSurfaceToneIsDark ? '#ffffff' : '#111827';
    const columnBodyText = strongSurfaceToneIsDark ? 'rgba(255,255,255,0.9)' : '#1f2937';
    const speakerRoleColor = strongSurfaceToneIsDark ? 'rgba(255,255,255,0.74)' : '#334155';
    const speakerOrgColor = strongSurfaceToneIsDark ? 'rgba(255,255,255,0.58)' : '#475569';
    const footerTextColor = strongSurfaceToneIsDark ? 'rgba(255,255,255,0.62)' : 'rgba(15,23,42,0.68)';
        const pageBackgroundStyle = { backgroundColor: paletteSurface, ...pageStyle };
        const isHidden = (id: string) => hiddenSegments.includes(id);
    return (
        <EditableTextContext.Provider
            value={{
                lineStyles: formLineStyles,
                activeEditingLineKey,
                onBeginEditLine,
                onEndEditLine,
            }}
        >
        <div id="brochure-page-2" className="brochure-page border border-gray-200" style={pageBackgroundStyle}>
            <div className="column flex-[0.8] !p-5 flex flex-col gap-5" style={{ backgroundColor: paletteStrongSurface, color: palettePrimaryText, fontSize: '11.5px' }}>
                                {!isHidden('p2-about-srm') && (
                                <MovableSegment id="p2-about-srm" position={segmentPositions?.['p2-about-srm']} onMove={onSegmentMove} selectedId={selectedSegmentId} onSelect={onSelectSegment} canvasScale={canvasScale} onInteractionStart={onSegmentInteractionStart} onInteractionEnd={onSegmentInteractionEnd} index={0}>
                <div className="text-center">
                    <h3 className="text-base font-black mb-3 uppercase tracking-tighter inline-block px-4 py-1 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.3)' }}>
                      <EditableText path="headings.aboutCollege" value={headings.aboutCollege} onEdit={onEdit} className="inline" />
                    </h3>
                                        <EditableText path="aboutCollege" value={data.aboutCollege} onEdit={onEdit} multiline className="block text-left leading-[1.34] whitespace-pre-wrap break-words" />
                </div>
                </MovableSegment>
                                )}
                                {!isHidden('p2-about-school') && (
                                <MovableSegment id="p2-about-school" position={segmentPositions?.['p2-about-school']} onMove={onSegmentMove} selectedId={selectedSegmentId} onSelect={onSelectSegment} canvasScale={canvasScale} onInteractionStart={onSegmentInteractionStart} onInteractionEnd={onSegmentInteractionEnd} index={1}>
                <div className="text-center">
                    <h3 className="text-[14px] font-black mb-3 uppercase tracking-tighter inline-block px-4 py-1 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.3)' }}>
                      <EditableText path="headings.aboutSchool" value={headings.aboutSchool} onEdit={onEdit} className="inline" />
                    </h3>
                                        <EditableText path="aboutSchool" value={data.aboutSchool} onEdit={onEdit} multiline className="block text-left leading-[1.34] whitespace-pre-wrap break-words" />
                </div>
                </MovableSegment>
                                )}
            </div>

            {/* Column 2: About Dept & FDP (White) */}
            <div className="column border-x flex flex-col gap-5 !p-5" style={{ backgroundColor: paletteSurface, borderColor: paletteSurfaceBorder, color: '#334155', fontSize: '10px' }}>
                {!isHidden('p2-about-dept') && (
                <MovableSegment id="p2-about-dept" position={segmentPositions?.['p2-about-dept']} onMove={onSegmentMove} selectedId={selectedSegmentId} onSelect={onSelectSegment} canvasScale={canvasScale} onInteractionStart={onSegmentInteractionStart} onInteractionEnd={onSegmentInteractionEnd} index={2}>
                <div className="text-center">
                                        <h3 className="text-[13px] font-black mb-3 uppercase tracking-tighter inline-block px-4 py-1 rounded-full" style={{ color: palettePrimary, backgroundColor: `${palettePrimary}14`, borderBottom: `1px solid ${palettePrimary}26` }}>
                                            <EditableText path="headings.aboutDepartment" value={headings.aboutDepartment} onEdit={onEdit} className="inline" />
                                        </h3>
                    <EditableText path="aboutDepartment" value={data.aboutDepartment} onEdit={onEdit} multiline className="block text-left leading-[1.34] whitespace-pre-wrap break-words" />
                </div>
                </MovableSegment>
                )}
                {!isHidden('p2-about-fdp') && (
                <MovableSegment id="p2-about-fdp" position={segmentPositions?.['p2-about-fdp']} onMove={onSegmentMove} selectedId={selectedSegmentId} onSelect={onSelectSegment} canvasScale={canvasScale} onInteractionStart={onSegmentInteractionStart} onInteractionEnd={onSegmentInteractionEnd} index={3}>
                <div className="text-center">
                                        <h3 className="text-[13px] font-black mb-3 uppercase tracking-tighter inline-block px-4 py-1 rounded-full" style={{ color: palettePrimary, backgroundColor: `${palettePrimary}14`, borderBottom: `1px solid ${palettePrimary}26` }}>
                                            <EditableText path="headings.aboutFdp" value={headings.aboutFdp} onEdit={onEdit} className="inline" />
                                        </h3>
                    <EditableText path="aboutFdp" value={data.aboutFdp} onEdit={onEdit} multiline className="block text-left leading-[1.34] whitespace-pre-wrap break-words" />
                </div>
                </MovableSegment>
                )}

                {!isHidden('p2-highlights') && (
                <MovableSegment id="p2-highlights" position={segmentPositions?.['p2-highlights']} onMove={onSegmentMove} selectedId={selectedSegmentId} onSelect={onSelectSegment} canvasScale={canvasScale} onInteractionStart={onSegmentInteractionStart} onInteractionEnd={onSegmentInteractionEnd} index={4}>
                <div className="mt-2 p-3 border rounded-2xl" style={{ backgroundColor: paletteSurface, borderColor: paletteSurfaceBorder }}>
                                        <p className="text-[10px] font-black uppercase mb-1 underline" style={{ color: palettePrimary }}>
                                            <EditableText path="headings.programHighlights" value={headings.programHighlights} onEdit={onEdit} className="inline" />
                                        </p>
                    <ul className="text-[10px] space-y-1" style={{ color: '#475569' }}>
                        {data.topics?.slice(0, 5).map((t, i: number) => (
                            <li key={i} className="break-words whitespace-normal">• Day {i + 1}: <EditableText path={`topics.${i}.forenoon`} value={t.forenoon} onEdit={onEdit} className="inline whitespace-pre-wrap break-words" /></li>
                        ))}
                    </ul>
                </div>
                </MovableSegment>
                )}
            </div>

            {/* Column 3: Topics & Speakers */}
            <div className="column column-blue flex flex-col !p-4 gap-2" style={{ backgroundColor: paletteStrongSurface, color: palettePrimaryText }}>
                {!isHidden('p2-topics') && (
                <MovableSegment id="p2-topics" position={segmentPositions?.['p2-topics']} onMove={onSegmentMove} selectedId={selectedSegmentId} onSelect={onSelectSegment} canvasScale={canvasScale} onInteractionStart={onSegmentInteractionStart} onInteractionEnd={onSegmentInteractionEnd} index={5}>
                                <h3 className="text-[11px] font-black text-center mb-3 pb-1 uppercase tracking-widest" style={{ borderBottom: '1px solid rgba(15,23,42,0.24)', color: '#111827', backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: '999px', padding: '4px 10px', boxShadow: '0 8px 24px -20px rgba(15,23,42,0.65)' }}>
                                    <EditableText path="headings.topics" value={headings.topics} onEdit={onEdit} className="inline" />
                                </h3>

                <div className="overflow-hidden rounded-md border mb-4" style={{ borderColor: columnBorder, backgroundColor: columnCardBackground }}>
                    <table className="w-full text-[8.5px] border-collapse">
                        <thead className="uppercase font-black" style={{ backgroundColor: columnHeadBackground, color: columnHeadText }}>
                            <tr>
                                <th className="p-1 text-center w-10" style={{ borderRight: `1px solid ${columnBorder}` }}>Date</th>
                                <th className="p-1 text-left">Forenoon / Afternoon Session</th>
                            </tr>
                        </thead>
                        <tbody style={{ color: columnBodyText }}>
                            {data.topics?.slice(0, 5).map((t, i: number) => (
                                <tr key={i} style={{ borderTop: `1px solid ${columnBorder}` }}>
                                    <td className="p-1.5 text-center font-bold" style={{ borderRight: `1px solid ${columnBorder}` }}><EditableText path={`topics.${i}.date`} value={t.date} onEdit={onEdit} /></td>
                                    <td className="p-1.5">
                                            <div className="font-bold break-words whitespace-normal" style={{ color: columnHighlight }}><EditableText path={`topics.${i}.forenoon`} value={t.forenoon} onEdit={onEdit} className="inline whitespace-pre-wrap break-words" /></div>
                                        <div className="italic break-words whitespace-normal" style={{ opacity: 0.7 }}><EditableText path={`topics.${i}.afternoon`} value={t.afternoon} onEdit={onEdit} className="inline whitespace-pre-wrap break-words" /></div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                </MovableSegment>
                )}

                {!isHidden('p2-speakers') && (
                <MovableSegment id="p2-speakers" position={segmentPositions?.['p2-speakers']} onMove={onSegmentMove} selectedId={selectedSegmentId} onSelect={onSelectSegment} canvasScale={canvasScale} onInteractionStart={onSegmentInteractionStart} onInteractionEnd={onSegmentInteractionEnd} index={6} className="flex-1">
                                <h3 className="text-[12px] font-black text-center mb-3 pb-1 uppercase tracking-widest" style={{ borderBottom: `1px solid ${columnBorder}`, color: columnHighlight }}>
                                    <EditableText path="headings.speakers" value={headings.speakers} onEdit={onEdit} className="inline" />
                                </h3>
                <div className="grid grid-cols-2 gap-2 flex-1">
                    {data.speakers?.slice(0, 8).map((s, i: number) => (
                            <div key={i} className="p-1.5 rounded border flex flex-col justify-center" style={{ backgroundColor: columnCardBackground, borderColor: columnBorder }}>
                                <p className="font-black text-[9.5px] leading-none mb-0.5" style={{ color: columnHighlight }}><EditableText path={`speakers.${i}.name`} value={s.name} onEdit={onEdit} /></p>
                            <p className="text-[8.5px] italic leading-tight break-words whitespace-normal" style={{ color: speakerRoleColor }}><EditableText path={`speakers.${i}.role`} value={s.role} onEdit={onEdit} className="inline whitespace-pre-wrap break-words" /></p>
                            <p className="text-[8px] leading-tight break-words whitespace-normal" style={{ color: speakerOrgColor }}><EditableText path={`speakers.${i}.org`} value={s.org} onEdit={onEdit} className="inline whitespace-pre-wrap break-words" /></p>
                        </div>
                    ))}
                </div>
                </MovableSegment>
                )}

                <div
                    className="mt-auto w-full pt-2 text-[9px] font-medium tracking-wide"
                    style={{ color: footerTextColor }}
                >
                    <div className="flex items-center justify-between">
                        <span>MADE WITH BROCHIFY</span>
                        <span>SRM-KTR</span>
                    </div>
                </div>
            </div>

            {onSelectOverlay && onUpdateOverlay && (
                <BrochureOverlay
                    items={overlayItems}
                    selectedId={selectedOverlayId}
                    onSelect={onSelectOverlay}
                    onUpdate={onUpdateOverlay}
                    onInteractionStart={onOverlayInteractionStart}
                    onInteractionEnd={onOverlayInteractionEnd}
                    canvasScale={canvasScale}
                />
            )}
        </div>
        </EditableTextContext.Provider>
    );
}
