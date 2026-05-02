"use client";

import React, { CSSProperties } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Image from 'next/image';
import MovableSegment from './MovableSegment';
import BrochureOverlay from './BrochureOverlay';
import { BrochureData, OverlayItem, SegmentPosition, TextEntity } from '@/lib/domains/brochure';

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
    fontFamily?: string;
    align?: 'left' | 'center' | 'right' | 'justify';
    fontSize?: number;
    color?: string;
};

interface PosterPageProps {
    data: BrochureData;
  selectedLogos: string[];
        logoCatalog?: Record<string, string>;
    onEdit?: (path: string, value: string) => void;
    activeTypingPath?: string | null;
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
    style?: React.CSSProperties;
    multiline?: boolean;
    groupAsSingleEntity?: boolean;
    listMode?: 'plain' | 'bullets';
};

type EditableTextContextValue = {
    lineStyles?: Record<string, FormLineStyle>;
    activeEditingLineKey?: string | null;
    activeTypingPath?: string | null;
    onBeginEditLine?: (lineKey: string, segmentId: string | null) => void;
    onEndEditLine?: () => void;
    textEntityPositions?: Record<string, SegmentPosition>;
    onMoveTextEntity?: (id: string, position: SegmentPosition) => void;
    onTextEntityInteractionStart?: (id: string, mode: 'move' | 'resize') => void;
    onTextEntityInteractionEnd?: (id: string, mode: 'move' | 'resize') => void;
    selectedTextEntityId?: string | null;
    onSelectTextEntity?: (id: string) => void;
    textEntityPrefix?: string;
    textEntityCanvasScale?: number;
};

const EditableTextContext = React.createContext<EditableTextContextValue>({});

const toLineStyle = (lineStyle?: FormLineStyle): React.CSSProperties => {
    if (!lineStyle) return {};

    return {
        ...(lineStyle.fontFamily ? { fontFamily: lineStyle.fontFamily } : {}),
        ...(lineStyle.align ? { textAlign: lineStyle.align } : {}),
        ...(lineStyle.fontSize ? { fontSize: `${lineStyle.fontSize}px` } : {}),
        ...(lineStyle.color ? { color: lineStyle.color } : {}),
    };
};

const EditableText = ({
    path,
    value,
    onEdit,
    className,
    style,
    multiline = false,
    groupAsSingleEntity = false,
    listMode = 'plain',
}: EditableTextProps) => {
    const safeValue = value ?? '';
    const {
        lineStyles,
        activeEditingLineKey,
        activeTypingPath,
        onBeginEditLine,
        onEndEditLine,
        textEntityPositions,
        onMoveTextEntity,
        onTextEntityInteractionStart,
        onTextEntityInteractionEnd,
        selectedTextEntityId,
        onSelectTextEntity,
        textEntityPrefix = 'p1-text::',
        textEntityCanvasScale = 1,
    } = React.useContext(EditableTextContext);

    type PointerPoint = { x: number; y: number };
    type CaretLookupDocument = Document & {
        caretRangeFromPoint?: (x: number, y: number) => Range | null;
        caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
    };

    const resolveEditableNode = (lineKey: string, fallbackTarget: HTMLElement): HTMLElement => {
        const matches = Array.from(document.querySelectorAll<HTMLElement>('[data-form-line-key]'));
        return matches.find((node) => node.getAttribute('data-form-line-key') === lineKey) ?? fallbackTarget;
    };

    const placeCaretAtEnd = (node: HTMLElement) => {
        const selection = window.getSelection();
        if (!selection) return;
        const range = node.ownerDocument.createRange();
        range.selectNodeContents(node);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
    };

    const placeCaretFromPoint = (node: HTMLElement, point?: PointerPoint): boolean => {
        if (!point) return false;
        const selection = window.getSelection();
        if (!selection) return false;

        const doc = node.ownerDocument as CaretLookupDocument;
        let range: Range | null = null;

        if (typeof doc.caretRangeFromPoint === 'function') {
            range = doc.caretRangeFromPoint(point.x, point.y);
        } else if (typeof doc.caretPositionFromPoint === 'function') {
            const position = doc.caretPositionFromPoint(point.x, point.y);
            if (position) {
                range = doc.createRange();
                range.setStart(position.offsetNode, position.offset);
                range.collapse(true);
            }
        }

        if (!range || !node.contains(range.startContainer)) {
            return false;
        }

        selection.removeAllRanges();
        selection.addRange(range);
        return true;
    };

    const focusEditableNode = (lineKey: string, fallbackTarget: HTMLElement, point?: PointerPoint) => {
        const applyFocus = () => {
            const node = resolveEditableNode(lineKey, fallbackTarget);
            if (node.getAttribute('contenteditable') !== 'true') return;
            node.focus({ preventScroll: true });
            const placedFromClick = placeCaretFromPoint(node, point);
            if (!placedFromClick) {
                placeCaretAtEnd(node);
            }
        };

        window.requestAnimationFrame(() => {
            applyFocus();
            window.setTimeout(applyFocus, 0);
        });
    };

    const beginEdit = (lineKey: string, eventTarget: HTMLElement, point?: PointerPoint) => {
        const segmentId = (eventTarget.closest('.segment-shell') as HTMLElement | null)?.dataset.segmentId ?? null;
        onBeginEditLine?.(lineKey, segmentId);
        focusEditableNode(lineKey, eventTarget, point);
    };

    const resolveStyle = (lineKey: string): React.CSSProperties => ({
        ...(style ?? {}),
        ...toLineStyle(lineStyles?.[lineKey]),
    });

    const isPathTypingActive = (candidatePath: string | null | undefined, basePath: string) => {
        if (!candidatePath) return false;
        return candidatePath === basePath || candidatePath.startsWith(`${basePath}.`);
    };

    const normalizeBulletLine = (line: string): string => line.replace(/^\s*(?:•|-|\*)\s?/, '');

    const extractListLines = (root: HTMLElement): string[] => {
        const listItems = Array.from(root.querySelectorAll('li'));
        const rawLines =
            listItems.length > 0
                ? listItems.map((item) => (item.textContent ?? '').replace(/\u00a0/g, ' ').trim())
                : (root.innerText ?? '')
                      .split('\n')
                      .map((line) => line.replace(/\u00a0/g, ' ').trim());

        return rawLines.map(normalizeBulletLine).filter((line) => line.length > 0);
    };

    const createEmptyBulletItem = (): HTMLLIElement => {
        const item = document.createElement('li');
        item.className = 'whitespace-pre-wrap break-words';
        item.textContent = '\u00a0';
        return item;
    };

    const insertBulletAfterSelection = (root: HTMLElement) => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            root.appendChild(createEmptyBulletItem());
            return;
        }

        const anchorElement =
            selection.anchorNode instanceof Element
                ? selection.anchorNode
                : selection.anchorNode?.parentElement ?? null;

        const currentItem = anchorElement?.closest('li');
        const nextItem = createEmptyBulletItem();

        if (currentItem && currentItem.parentElement === root) {
            if (currentItem.nextSibling) {
                root.insertBefore(nextItem, currentItem.nextSibling);
            } else {
                root.appendChild(nextItem);
            }
        } else {
            root.appendChild(nextItem);
        }

        const range = document.createRange();
        range.selectNodeContents(nextItem);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
    };

    const removeCurrentEmptyBullet = (root: HTMLElement): boolean => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return false;

        const anchorElement =
            selection.anchorNode instanceof Element
                ? selection.anchorNode
                : selection.anchorNode?.parentElement ?? null;

        const currentItem = anchorElement?.closest('li') as HTMLLIElement | null;
        if (!currentItem || currentItem.parentElement !== root) return false;

        const normalizedText = (currentItem.textContent ?? '').replace(/\u00a0/g, '').trim();
        if (normalizedText.length > 0) return false;

        const previous = currentItem.previousElementSibling as HTMLElement | null;
        const next = currentItem.nextElementSibling as HTMLElement | null;
        currentItem.remove();

        let focusTarget = previous ?? next;
        if (!focusTarget) {
            const replacement = createEmptyBulletItem();
            root.appendChild(replacement);
            focusTarget = replacement;
        }

        const range = document.createRange();
        range.selectNodeContents(focusTarget);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
        return true;
    };

    const toEntity = (lineKey: string, text: string, isEditing: boolean): TextEntity => {
        const entityId = `${textEntityPrefix}${lineKey}`;
        const position = textEntityPositions?.[entityId];
        const inlineFontSize = typeof style?.fontSize === 'number' ? style.fontSize : 16;
        const inlineColor = typeof style?.color === 'string' ? style.color : '#0f172a';
        const inlineFontFamily = typeof style?.fontFamily === 'string' ? style.fontFamily : 'Inter, sans-serif';
        const inlineAlign =
            style?.textAlign === 'left' || style?.textAlign === 'center' || style?.textAlign === 'right' || style?.textAlign === 'justify'
                ? style.textAlign
                : 'left';

        return {
            id: entityId,
            text,
            position: {
                x: position?.x ?? 0,
                y: position?.y ?? 0,
            },
            style: {
                fontFamily: lineStyles?.[lineKey]?.fontFamily ?? inlineFontFamily,
                fontSize: lineStyles?.[lineKey]?.fontSize ?? inlineFontSize,
                color: lineStyles?.[lineKey]?.color ?? inlineColor,
                align: lineStyles?.[lineKey]?.align ?? inlineAlign,
            },
            isEditing,
        };
    };

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
        const StaticTag = 'span';
        return (
            <StaticTag
                className={className}
                style={resolveStyle(lineKey)}
                data-editable-path={path}
                data-form-line-key={lineKey}
            >
                {safeValue}
            </StaticTag>
        );
    }

    if (multiline && groupAsSingleEntity) {
        const lineKey = path;
        const isEditing = activeEditingLineKey === lineKey;
        const isTypingActive = isPathTypingActive(activeTypingPath, path);
        const rawLines = safeValue.split('\n');
        const lines = listMode === 'bullets' ? rawLines.map(normalizeBulletLine) : rawLines;
        const textEntity = toEntity(lineKey, safeValue, isEditing);

        const groupedNode = listMode === 'bullets' ? (
            <ul
                className={`editable-block ${isEditing ? 'editable-line-editing' : ''} ${isTypingActive ? 'ai-typing-active' : ''} list-disc pl-5 ${className ?? ''}`.trim()}
                style={resolveStyle(lineKey)}
                contentEditable={isEditing}
                suppressContentEditableWarning
                spellCheck={false}
                tabIndex={-1}
                data-editable-path={path}
                data-form-line-key={lineKey}
                onPointerDown={(event) => {
                    if (event.detail >= 2) {
                        event.stopPropagation();
                        beginEdit(lineKey, event.currentTarget as HTMLElement, {
                            x: event.clientX,
                            y: event.clientY,
                        });
                    }
                }}
                onDoubleClick={(event) => {
                    event.stopPropagation();
                    beginEdit(lineKey, event.currentTarget as HTMLElement, {
                        x: event.clientX,
                        y: event.clientY,
                    });
                }}
                onBlur={(event) => {
                    if (!isEditing) return;
                    const nextLines = extractListLines(event.currentTarget as HTMLElement);
                    onEdit(path, nextLines.join('\n'));
                    onEndEditLine?.();
                }}
                onKeyDown={(event) => {
                    if (!isEditing) return;
                    if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        insertBulletAfterSelection(event.currentTarget as HTMLElement);
                        return;
                    }
                    if (event.key === 'Backspace' && removeCurrentEmptyBullet(event.currentTarget as HTMLElement)) {
                        event.preventDefault();
                        return;
                    }
                    if (event.key === 'Escape') {
                        event.preventDefault();
                        onEndEditLine?.();
                        (event.currentTarget as HTMLElement).blur();
                    }
                }}
            >
                {(lines.length > 0 ? lines : ['']).map((line, lineIndex) => (
                    <li key={`${lineKey}::${lineIndex}`} className="whitespace-pre-wrap break-words">
                        {line || '\u00a0'}
                    </li>
                ))}
            </ul>
        ) : (
            <div
                className={`editable-block ${isEditing ? 'editable-line-editing' : ''} ${isTypingActive ? 'ai-typing-active' : ''} ${className ?? ''}`.trim()}
                style={resolveStyle(lineKey)}
                contentEditable={isEditing}
                suppressContentEditableWarning
                spellCheck={false}
                tabIndex={-1}
                data-editable-path={path}
                data-form-line-key={lineKey}
                onPointerDown={(event) => {
                    if (event.detail >= 2) {
                        event.stopPropagation();
                        beginEdit(lineKey, event.currentTarget as HTMLElement);
                    }
                }}
                onDoubleClick={(event) => {
                    event.stopPropagation();
                    beginEdit(lineKey, event.currentTarget as HTMLElement);
                }}
                onBlur={(event) => {
                    if (!isEditing) return;
                    onEdit(path, event.currentTarget.innerText ?? '');
                    onEndEditLine?.();
                }}
                onKeyDown={(event) => {
                    if (!isEditing) return;
                    if (event.key === 'Escape') {
                        event.preventDefault();
                        onEndEditLine?.();
                        (event.currentTarget as HTMLElement).blur();
                    }
                }}
            >
                {lines.map((line, lineIndex) => (
                    <div key={`${lineKey}::${lineIndex}`} className="whitespace-pre-wrap break-words">
                        {line}
                    </div>
                ))}
            </div>
        );

        if (!onMoveTextEntity || !onSelectTextEntity) {
            return groupedNode;
        }

        return (
            <MovableSegment
                id={textEntity.id}
                position={textEntityPositions?.[textEntity.id]}
                onMove={isEditing ? undefined : onMoveTextEntity}
                onInteractionStart={isEditing ? undefined : onTextEntityInteractionStart}
                onInteractionEnd={isEditing ? undefined : onTextEntityInteractionEnd}
                selectedId={selectedTextEntityId}
                onSelect={onSelectTextEntity}
                canvasScale={textEntityCanvasScale}
                className="w-full"
                minWidth={140}
                minHeight={72}
            >
                {groupedNode}
            </MovableSegment>
        );
    }

    if (multiline) {
        const lines = safeValue.split('\n');
        return (
            <div className={className}>
                {lines.map((line, lineIndex) => {
                    const lineKey = `${path}::${lineIndex}`;
                    const isEditing = activeEditingLineKey === lineKey;
                    const isTypingActive = isPathTypingActive(activeTypingPath, path);
                    const textEntity = toEntity(lineKey, line, isEditing);
                    const lineNode = (
                        <div
                            key={lineKey}
                            className={`editable-block ${isEditing ? 'editable-line-editing' : ''} ${isTypingActive ? 'ai-typing-active' : ''}`.trim()}
                            style={resolveStyle(lineKey)}
                            contentEditable={isEditing}
                            suppressContentEditableWarning
                            spellCheck={false}
                            tabIndex={-1}
                            data-editable-path={path}
                            data-editable-line={lineIndex}
                            data-form-line-key={lineKey}
                            onPointerDown={(event) => {
                                if (event.detail >= 2) {
                                    event.stopPropagation();
                                    beginEdit(lineKey, event.currentTarget as HTMLElement, {
                                        x: event.clientX,
                                        y: event.clientY,
                                    });
                                }
                            }}
                            onDoubleClick={(event) => {
                                event.stopPropagation();
                                beginEdit(lineKey, event.currentTarget as HTMLElement, {
                                    x: event.clientX,
                                    y: event.clientY,
                                });
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

                    if (!onMoveTextEntity || !onSelectTextEntity) {
                        return lineNode;
                    }

                    return (
                        <MovableSegment
                            key={textEntity.id}
                            id={textEntity.id}
                            position={textEntityPositions?.[textEntity.id]}
                            onMove={isEditing ? undefined : onMoveTextEntity}
                            onInteractionStart={isEditing ? undefined : onTextEntityInteractionStart}
                            onInteractionEnd={isEditing ? undefined : onTextEntityInteractionEnd}
                            selectedId={selectedTextEntityId}
                            onSelect={onSelectTextEntity}
                            canvasScale={textEntityCanvasScale}
                            index={lineIndex}
                            className="w-full"
                            minWidth={96}
                            minHeight={32}
                        >
                            {lineNode}
                        </MovableSegment>
                    );
                })}
            </div>
        );
    }

    const lineKey = path;
    const Tag = 'span';
    const isTypingActive = isPathTypingActive(activeTypingPath, path);
    const isInlineEditing = activeEditingLineKey === lineKey;
    const textEntity = toEntity(lineKey, safeValue, isInlineEditing);
    const inlineNode = (
        <Tag
            className={`editable-inline ${className ?? ''} ${isTypingActive ? 'ai-typing-active' : ''}`.trim()}
            style={resolveStyle(lineKey)}
            contentEditable={isInlineEditing}
            suppressContentEditableWarning
            spellCheck={false}
            tabIndex={-1}
            data-editable-path={path}
            data-form-line-key={lineKey}
            onPointerDown={(event) => {
                if (event.detail >= 2) {
                    event.stopPropagation();
                    beginEdit(lineKey, event.currentTarget as HTMLElement, {
                        x: event.clientX,
                        y: event.clientY,
                    });
                }
            }}
            onDoubleClick={(event) => {
                event.stopPropagation();
                beginEdit(lineKey, event.currentTarget as HTMLElement, {
                    x: event.clientX,
                    y: event.clientY,
                });
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
        </Tag>
    );

    if (!onMoveTextEntity || !onSelectTextEntity) {
        return inlineNode;
    }

    return (
        <MovableSegment
            id={textEntity.id}
            position={textEntityPositions?.[textEntity.id]}
            onMove={isInlineEditing ? undefined : onMoveTextEntity}
            onInteractionStart={isInlineEditing ? undefined : onTextEntityInteractionStart}
            onInteractionEnd={isInlineEditing ? undefined : onTextEntityInteractionEnd}
            selectedId={selectedTextEntityId}
            onSelect={onSelectTextEntity}
            canvasScale={textEntityCanvasScale}
            className="inline-block align-baseline"
            minWidth={48}
            minHeight={24}
            hostAs="span"
            surfaceAs="span"
        >
            {inlineNode}
        </MovableSegment>
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

export default function PosterPage({
    data,
    selectedLogos,
    logoCatalog,
    onEdit,
    activeTypingPath = null,
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
}: PosterPageProps) {
    const headings = data.headings;

    const palettePrimary = palette?.primary ?? '#0b4da2';
    const palettePrimaryText = palette?.primaryText ?? '#ffffff';
    const paletteSurface = palette?.surface ?? '#ffffff';
    const paletteSurfaceBorder = palette?.surfaceBorder ?? '#e2e8f0';
    const paletteStrongSurface = palette?.strongSurface ?? palettePrimary;
    const paletteAccent = palette?.accent ?? '#facc15';
    const paletteMuted = palette?.mutedText ?? '#64748b';

    const resolveLogoSrc = (id: string): string | undefined => {
        if (logoCatalog?.[id]) return logoCatalog[id];
        return availableLogos.find((logo) => logo.id === id)?.src;
    };

    const qrPosition = segmentPositions?.['p1-qr-code'] ?? segmentPositions?.['p1-qr'];
    const qrVisualSize = Math.max(
        72,
        Math.min(
            260,
            Math.round(Math.min((qrPosition?.width ?? 116) - 20, (qrPosition?.height ?? 116) - 20)),
        ),
    );

    const pageBackgroundStyle = { backgroundColor: paletteSurface, ...pageStyle };
    const isHidden = (id: string) =>
        hiddenSegments.includes(id) ||
        ((id === 'p1-qr-code' || id === 'p1-qr-link') && hiddenSegments.includes('p1-qr'));

    return (
        <EditableTextContext.Provider
            value={{
                lineStyles: formLineStyles,
                activeEditingLineKey,
                activeTypingPath,
                onBeginEditLine,
                onEndEditLine,
                textEntityPositions: segmentPositions,
                onMoveTextEntity: onSegmentMove,
                onTextEntityInteractionStart: onSegmentInteractionStart,
                onTextEntityInteractionEnd: onSegmentInteractionEnd,
                selectedTextEntityId: selectedSegmentId,
                onSelectTextEntity: onSelectSegment,
                textEntityPrefix: 'p1-text::',
                textEntityCanvasScale: canvasScale,
            }}
        >
        
        <div id="poster-page-1" className="brochure-page-poster border border-gray-200" style={pageBackgroundStyle}>
            <div className="w-full flex flex-col items-center p-12 bg-transparent">
                {!isHidden('p1-logos') && (
                <div className="flex justify-center flex-wrap gap-6 w-full mb-8">
                    {selectedLogos.slice(0, selectedLogos.length > 1 ? -1 : undefined).map((id, logoIndex) => {
                        const src = resolveLogoSrc(id);
                        if (!src) return null;

                        const segmentId = `p1-logo-top::${id}`;
                        if (isHidden(segmentId)) return null;

                        const logoPosition = segmentPositions?.[segmentId];
                        const logoWidth = logoPosition?.width ?? 96;
                        const logoHeight = logoPosition?.height ?? 48;

                        return (
                            <MovableSegment
                                key={segmentId}
                                id={segmentId}
                                position={logoPosition}
                                onMove={onSegmentMove}
                                selectedId={selectedSegmentId}
                                onSelect={onSelectSegment}
                                canvasScale={canvasScale}
                                onInteractionStart={onSegmentInteractionStart}
                                onInteractionEnd={onSegmentInteractionEnd}
                                index={10 + logoIndex}
                                className="flex items-center justify-center"
                                minWidth={72}
                                minHeight={32}
                            >
                                <div className="relative" style={{ width: `${logoWidth}px`, height: `${logoHeight}px` }}>
                                    <Image src={src} fill className="object-contain" alt={id} unoptimized />
                                </div>
                            </MovableSegment>
                        );
                    })}
                </div>
                )}

                {!isHidden('p1-title') && (
                <MovableSegment id="p1-title" position={segmentPositions?.['p1-title']} onMove={onSegmentMove} selectedId={selectedSegmentId} onSelect={onSelectSegment} canvasScale={canvasScale} onInteractionStart={onSegmentInteractionStart} onInteractionEnd={onSegmentInteractionEnd} index={11} className="w-full flex flex-col items-center bg-transparent mb-8">
                        <p className="text-[14px] font-black uppercase tracking-[0.2em] mb-2" style={{ color: palettePrimary }}>
                            <EditableText path="headings.sponsoredBy" value={headings.sponsoredBy} onEdit={onEdit} className="inline" />
                        </p>
                <h1 className="text-[44px] font-black text-center leading-[1.1] mb-4 uppercase tracking-tighter" style={{ color: palettePrimary }}>
                    <EditableText path="eventTitle" value={data.eventTitle} onEdit={onEdit} className="whitespace-pre-wrap break-words" />
                </h1>
                <p className="text-[20px] font-bold" style={{ color: palettePrimary }}><EditableText path="dates" value={data.dates} onEdit={onEdit} /></p>
                </MovableSegment>
                )}

                {!isHidden('p1-image') && (
                <MovableSegment id="p1-image" position={segmentPositions?.['p1-image']} onMove={onSegmentMove} selectedId={selectedSegmentId} onSelect={onSelectSegment} canvasScale={canvasScale} onInteractionStart={onSegmentInteractionStart} onInteractionEnd={onSegmentInteractionEnd} index={12} className="w-full flex justify-center mb-10">
                <div className="w-[85%] rounded-[32px] overflow-hidden border-[6px] shadow-2xl relative min-h-[340px]" style={{ borderColor: paletteSurfaceBorder }}>
                    {data.eventImage ? (
                        <Image src={data.eventImage} alt="Event AI" className="w-full h-full object-cover" fill unoptimized />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                            <div className="w-32 h-32 rounded-2xl border border-slate-200 bg-white shadow-inner flex items-center justify-center">
                                <Image src="/icon-logo.png" alt="Placeholder" width={80} height={80} className="opacity-70" />
                            </div>
                        </div>
                    )}
                </div>
                </MovableSegment>
                )}
            </div>

            <div className="w-full flex p-10 gap-8" style={{ backgroundColor: paletteStrongSurface, color: palettePrimaryText }}>
                <div className="flex-1 space-y-8">
                    {!isHidden('p1-registration-fee') && (
                    <MovableSegment id="p1-registration-fee" position={segmentPositions?.['p1-registration-fee']} onMove={onSegmentMove} selectedId={selectedSegmentId} onSelect={onSelectSegment} canvasScale={canvasScale} onInteractionStart={onSegmentInteractionStart} onInteractionEnd={onSegmentInteractionEnd} index={5} className="w-full">
                    <div className="w-full space-y-3 bg-black/10 p-5 rounded-2xl border border-white/20">
                        <div className="flex justify-between text-[16px] font-bold pb-2 border-b border-white/20">
                            <span style={{ color: paletteAccent }}><EditableText path="headings.registrationFee" value={headings.registrationFee} onEdit={onEdit} className="inline" /></span>
                        </div>
                        <div className="flex justify-between text-[14px]">
                            <span><EditableText path="templateText.p1_ieeeMemberLabel" value={data.templateText?.p1_ieeeMemberLabel} onEdit={onEdit} className="inline" /></span>
                            <span className="font-bold">: Rs. <EditableText path="registration.ieeePrice" value={data.registration?.ieeePrice} onEdit={onEdit} className="inline" />/-</span>
                        </div>
                        <div className="flex justify-between text-[14px]">
                            <span><EditableText path="templateText.p1_nonIeeeMemberLabel" value={data.templateText?.p1_nonIeeeMemberLabel} onEdit={onEdit} className="inline" /></span>
                            <span className="font-bold">: Rs. <EditableText path="registration.nonIeeePrice" value={data.registration?.nonIeeePrice} onEdit={onEdit} className="inline" />/-</span>
                        </div>
                    </div>
                    </MovableSegment>
                    )}

                    {!isHidden('p1-registration-notes') && (
                    <MovableSegment id="p1-registration-notes" position={segmentPositions?.['p1-registration-notes']} onMove={activeEditingLineKey === 'registration.notes' || activeEditingLineKey === 'headings.registrationNote' ? undefined : onSegmentMove} selectedId={selectedSegmentId} onSelect={onSelectSegment} canvasScale={canvasScale} onInteractionStart={activeEditingLineKey === 'registration.notes' || activeEditingLineKey === 'headings.registrationNote' ? undefined : onSegmentInteractionStart} onInteractionEnd={activeEditingLineKey === 'registration.notes' || activeEditingLineKey === 'headings.registrationNote' ? undefined : onSegmentInteractionEnd} index={6} className="w-full">
                    <div className="w-full text-left p-4 rounded-2xl bg-black/10 border border-white/20">
                        <EditableTextContext.Provider
                            value={{
                                lineStyles: formLineStyles,
                                activeEditingLineKey,
                                activeTypingPath,
                                onBeginEditLine,
                                onEndEditLine,
                            }}
                        >
                            <p className="text-[14px] font-black mb-2 uppercase tracking-widest" style={{ color: paletteAccent }}>
                                <EditableText path="headings.registrationNote" value={headings.registrationNote} onEdit={onEdit} className="inline" />
                            </p>
                            <EditableText
                                path="registration.notes"
                                value={data.registration?.notes?.join('\n') ?? ''}
                                onEdit={onEdit}
                                multiline
                                groupAsSingleEntity
                                listMode="bullets"
                                className="text-[13px] space-y-1.5"
                                style={{ color: palettePrimaryText }}
                            />
                        </EditableTextContext.Provider>
                    </div>
                            </MovableSegment>
                    )}
                </div>

                <div className="flex-1 space-y-8">
                    {!isHidden('p1-account') && (
                    <MovableSegment id="p1-account" position={segmentPositions?.['p1-account']} onMove={onSegmentMove} selectedId={selectedSegmentId} onSelect={onSelectSegment} canvasScale={canvasScale} onInteractionStart={onSegmentInteractionStart} onInteractionEnd={onSegmentInteractionEnd} index={9} className="w-full">
                    <div className="w-full">
                        <div className="bg-white text-[14px] font-black py-2 px-6 rounded-full text-center mb-4 uppercase tracking-widest shadow-md" style={{ color: palettePrimary }}>
                            <EditableText path="headings.accountDetail" value={headings.accountDetail} onEdit={onEdit} className="inline" />
                        </div>
                        <div className="text-[13px] space-y-1.5 font-medium leading-tight px-2 bg-black/10 p-5 rounded-2xl border border-white/20">
                            <p className="flex justify-between"><span><EditableText path="templateText.p1_bankNameLabel" value={data.templateText?.p1_bankNameLabel} onEdit={onEdit} className="inline" /></span> <span>: <EditableText path="accountDetails.bankName" value={data.accountDetails?.bankName || 'Indian Bank'} onEdit={onEdit} className="inline" /></span></p>
                            <p className="flex justify-between"><span><EditableText path="templateText.p1_accountNoLabel" value={data.templateText?.p1_accountNoLabel} onEdit={onEdit} className="inline" /></span> <span>: <EditableText path="accountDetails.accountNo" value={data.accountDetails?.accountNo || '7111751848'} onEdit={onEdit} className="inline" /></span></p>
                            <p className="flex justify-between gap-2"><span><EditableText path="templateText.p1_accountNameLabel" value={data.templateText?.p1_accountNameLabel} onEdit={onEdit} className="inline" /></span> <span className="text-right max-w-[180px] break-words">: <EditableText path="accountDetails.accountName" value={data.accountDetails?.accountName || 'C TECH ASSOCIATION'} onEdit={onEdit} className="inline" /></span></p>
                            <p className="flex justify-between"><span><EditableText path="templateText.p1_ifscLabel" value={data.templateText?.p1_ifscLabel} onEdit={onEdit} className="inline" /></span> <span>: <EditableText path="accountDetails.ifscCode" value={data.accountDetails?.ifscCode || 'IDIB000S181'} onEdit={onEdit} className="inline" /></span></p>
                        </div>
                    </div>
                    </MovableSegment>
                    )}

                    <div className="flex gap-4">
                        {!isHidden('p1-qr-code') && (
                            <MovableSegment
                                id="p1-qr-code"
                                position={segmentPositions?.['p1-qr-code'] ?? segmentPositions?.['p1-qr']}
                                onMove={onSegmentMove}
                                selectedId={selectedSegmentId}
                                onSelect={onSelectSegment}
                                canvasScale={canvasScale}
                                onInteractionStart={onSegmentInteractionStart}
                                onInteractionEnd={onSegmentInteractionEnd}
                                index={7}
                                className="bg-white p-3 rounded-2xl shadow-xl flex-shrink-0"
                                minWidth={116}
                                minHeight={116}
                            >
                                <QRCodeSVG value={data.googleForm || ""} size={qrVisualSize} marginSize={1} />
                            </MovableSegment>
                        )}
                        {!isHidden('p1-qr-link') && (
                            <MovableSegment
                                id="p1-qr-link"
                                position={segmentPositions?.['p1-qr-link']}
                                onMove={onSegmentMove}
                                selectedId={selectedSegmentId}
                                onSelect={onSelectSegment}
                                canvasScale={canvasScale}
                                onInteractionStart={onSegmentInteractionStart}
                                onInteractionEnd={onSegmentInteractionEnd}
                                index={8}
                                className="flex items-center"
                                minWidth={128}
                                minHeight={28}
                            >
                                <p className="text-[12px] break-all max-w-[160px] font-semibold opacity-90">
                                    <EditableText path="googleForm" value={data.googleForm} onEdit={onEdit} className="inline" />
                                </p>
                            </MovableSegment>
                        )}
                    </div>
                </div>
            </div>

            <div className="w-full flex flex-col items-center p-10 bg-transparent mt-auto">
                {!isHidden('p1-footer') && (
                <MovableSegment id="p1-footer" position={segmentPositions?.['p1-footer']} onMove={onSegmentMove} selectedId={selectedSegmentId} onSelect={onSelectSegment} canvasScale={canvasScale} onInteractionStart={onSegmentInteractionStart} onInteractionEnd={onSegmentInteractionEnd} index={13} className="w-full">
                    <div className="text-center w-full">
                                <p className="text-[12px] font-black uppercase tracking-widest mb-1" style={{ color: paletteMuted }}>
                                    <EditableText path="headings.organizedBy" value={headings.organizedBy} onEdit={onEdit} className="inline" />
                                </p>
                    <p className="text-[18px] font-black uppercase leading-tight max-w-[400px] mx-auto mb-6" style={{ color: palettePrimary }}><EditableText path="department" value={data.department} onEdit={onEdit} /></p>
                    
                    {selectedLogos.length > 1 && (
                        <div className="mb-6 w-full flex justify-center">
                            {(() => {
                                const lastId = selectedLogos[selectedLogos.length - 1];
                                const src = resolveLogoSrc(lastId);
                                if (!src) return null;

                                const segmentId = `p1-logo-bottom::${lastId}`;
                                if (isHidden(segmentId)) return null;

                                const logoPosition = segmentPositions?.[segmentId];
                                const logoWidth = logoPosition?.width ?? 120;
                                const logoHeight = logoPosition?.height ?? 50;

                                return (
                                    <MovableSegment
                                        id={segmentId}
                                        position={logoPosition}
                                        onMove={onSegmentMove}
                                        selectedId={selectedSegmentId}
                                        onSelect={onSelectSegment}
                                        canvasScale={canvasScale}
                                        onInteractionStart={onSegmentInteractionStart}
                                        onInteractionEnd={onSegmentInteractionEnd}
                                        index={14}
                                        className="flex items-center justify-center"
                                        minWidth={96}
                                        minHeight={36}
                                    >
                                        <div className="relative" style={{ width: `${logoWidth}px`, height: `${logoHeight}px` }}>
                                            <Image src={src} fill className="object-contain" alt="Bottom Logo" unoptimized />
                                        </div>
                                    </MovableSegment>
                                );
                            })()}
                        </div>
                    )}
                    
                        <p className="text-[14px] font-bold" style={{ color: paletteMuted }}><EditableText path="templateText.p1_institutionName" value={data.templateText?.p1_institutionName} onEdit={onEdit} className="inline" /></p>
                </div>
                        </MovableSegment>
                )}
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
        </EditableTextContext.Provider>
  );
}

