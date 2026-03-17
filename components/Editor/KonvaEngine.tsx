"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Text, Rect, Image as KonvaImage, Transformer } from 'react-konva';
import useImage from 'use-image';

const PAGE_WIDTH = 983; // 260mm at 96dpi
const PAGE_HEIGHT = 680; // 180mm at 96dpi
const COL_WIDTH = PAGE_WIDTH / 3;

interface Element {
    id: string;
    type: 'text' | 'rect' | 'image' | 'qrcode';
    page: 1 | 2;
    x: number;
    y: number;
    width?: number;
    height?: number;
    text?: string;
    fontSize?: number;
    fontFamily?: string;
    fontStyle?: string;
    fill?: string;
    align?: 'left' | 'center' | 'right' | 'justify';
    src?: string;
    draggable?: boolean;
}

// Helper to load images
const URLImage = ({ element, isSelected, onSelect }: { element: Element, isSelected: boolean, onSelect: () => void }) => {
    const [image] = useImage(element.src || '');
    const shapeRef = useRef<any>(null);
    const trRef = useRef<any>(null);

    useEffect(() => {
        if (isSelected && trRef.current && shapeRef.current) {
            trRef.current.nodes([shapeRef.current]);
            trRef.current.getLayer().batchDraw();
        }
    }, [isSelected]);

    return (
        <React.Fragment>
            <KonvaImage
                image={image}
                x={element.x}
                y={element.y}
                width={element.width}
                height={element.height}
                draggable={element.draggable}
                onClick={onSelect}
                onTap={onSelect}
                ref={shapeRef}
            />
            {isSelected && (
                <Transformer
                    ref={trRef}
                    boundBoxFunc={(oldBox, newBox) => {
                        if (newBox.width < 10 || newBox.height < 10) return oldBox;
                        return newBox;
                    }}
                />
            )}
        </React.Fragment>
    );
};

// Generate coordinates for all elements based on the data
const generateDefaultLayout = (data: any, selectedLogos: string[]): Element[] => {
    const elements: Element[] = [];

    // --- PAGE 1 ---
    
    // Column 1 Box
    elements.push({ id: 'p1_c1_bg', type: 'rect', page: 1, x: 0, y: 0, width: COL_WIDTH, height: PAGE_HEIGHT, fill: '#ffffff', draggable: false });
    // Inner rounded box
    const innerBoxPad = 24;
    elements.push({ id: 'p1_c1_inner', type: 'rect', page: 1, x: innerBoxPad, y: innerBoxPad, width: COL_WIDTH - (innerBoxPad*2), height: PAGE_HEIGHT - (innerBoxPad*2), fill: '#f8fafc', draggable: false });

    let currentY = 40;
    const leftMargin = 40;
    const maxTextWidth = COL_WIDTH - 80;

    const chiefPatrons = data.committee?.filter((c: any) => c.role?.toLowerCase().includes('chief patron')) || [];
    if (chiefPatrons.length > 0) {
        elements.push({ id: 'cp_title', type: 'text', page: 1, x: leftMargin, y: currentY, text: 'CHIEF PATRONS', fontSize: 12, fill: '#0047AB', fontStyle: '900', fontFamily: 'Inter', width: maxTextWidth });
        currentY += 20;
        let pText = chiefPatrons.map((c: any) => `${c.name}, ${c.role}`).join('\n');
        elements.push({ id: 'cp_text', type: 'text', page: 1, x: leftMargin, y: currentY, text: pText, fontSize: 11.5, fill: '#1e293b', fontFamily: 'Inter', width: maxTextWidth, draggable: true });
        currentY += chiefPatrons.length * 16 + 15;
    }

    const patrons = data.committee?.filter((c: any) => c.role?.toLowerCase().includes('patron') && !c.role?.toLowerCase().includes('chief')) || [];
    if (patrons.length > 0) {
        elements.push({ id: 'p_title', type: 'text', page: 1, x: leftMargin, y: currentY, text: 'PATRONS', fontSize: 12, fill: '#0047AB', fontStyle: '900', fontFamily: 'Inter', width: maxTextWidth });
        currentY += 20;
        let pText = patrons.map((c: any) => `${c.name}, ${c.role}`).join('\n');
        elements.push({ id: 'p_text', type: 'text', page: 1, x: leftMargin, y: currentY, text: pText, fontSize: 11.5, fill: '#1e293b', fontFamily: 'Inter', width: maxTextWidth, draggable: true });
        currentY += patrons.length * 16 + 15;
    }

    const advisory = data.committee?.filter((c: any) => c.role?.toLowerCase().includes('advisory')) || [];
    if (advisory.length > 0) {
        elements.push({ id: 'adv_title', type: 'text', page: 1, x: leftMargin, y: currentY, text: 'ACADEMIC ADVISORY COMMITTEE', fontSize: 12, fill: '#0047AB', fontStyle: '900', fontFamily: 'Inter', width: maxTextWidth });
        currentY += 20;
        let pText = advisory.slice(0, 10).map((c: any) => `${c.name}, ${c.role}`).join('\n');
        elements.push({ id: 'adv_text', type: 'text', page: 1, x: leftMargin, y: currentY, text: pText, fontSize: 11, fill: '#334155', fontFamily: 'Inter', width: maxTextWidth, draggable: true });
        currentY += advisory.slice(0,10).length * 14 + 15;
    }

    const organizing = data.committee?.filter((c: any) => !c.role?.toLowerCase().includes('patron') && !c.role?.toLowerCase().includes('advisory') && !c.role?.toLowerCase().includes('convener')) || [];
    if (organizing.length > 0) {
        elements.push({ id: 'org_title', type: 'text', page: 1, x: leftMargin, y: currentY, text: 'ORGANIZING COMMITTEE', fontSize: 12, fill: '#0047AB', fontStyle: '900', fontFamily: 'Inter', width: maxTextWidth });
        currentY += 20;
        let pText = organizing.slice(0, 15).map((c: any) => `${c.name}, ${c.role}`).join('\n');
        elements.push({ id: 'org_text', type: 'text', page: 1, x: leftMargin, y: currentY, text: pText, fontSize: 11, fill: '#334155', fontFamily: 'Inter', width: maxTextWidth, draggable: true });
    }

    // Column 2 Box (Blue)
    const c2Start = COL_WIDTH;
    elements.push({ id: 'p1_c2_bg', type: 'rect', page: 1, x: c2Start, y: 0, width: COL_WIDTH, height: PAGE_HEIGHT, fill: '#0047AB', draggable: false });
    
    let c2Y = 60;
    elements.push({ id: 'reg_title', type: 'text', page: 1, x: c2Start + 40, y: c2Y, text: 'REGISTRATION DETAIL', fontSize: 16, fill: '#0047AB', fontStyle: '900', fontFamily: 'Inter', width: COL_WIDTH - 80, align: 'center', draggable: true });
    // Note: We need a white background for this title... simplified for canvas.
    // Let's just make text yellow
    elements.push({ id: 'reg_title_bg', type: 'rect', page: 1, x: c2Start + 40, y: c2Y - 5, width: COL_WIDTH - 80, height: 26, fill: '#ffffff', draggable: true });
    
    c2Y += 50;
    elements.push({ id: 'reg_fee_title', type: 'text', page: 1, x: c2Start + 40, y: c2Y, text: 'Registration Fee:', fontSize: 12, fill: '#fde047', fontStyle: 'bold', fontFamily: 'Inter', width: COL_WIDTH - 80, draggable: true });
    c2Y += 25;
    elements.push({ id: 'reg_ieee', type: 'text', page: 1, x: c2Start + 40, y: c2Y, text: `IEEE Member: Rs. ${data.registration?.ieeePrice}/-`, fontSize: 11, fill: '#ffffff', fontFamily: 'Inter', width: COL_WIDTH - 80, draggable: true });
    c2Y += 20;
    elements.push({ id: 'reg_non_ieee', type: 'text', page: 1, x: c2Start + 40, y: c2Y, text: `Non IEEE Member: Rs. ${data.registration?.nonIeeePrice}/-`, fontSize: 11, fill: '#ffffff', fontFamily: 'Inter', width: COL_WIDTH - 80, draggable: true });
    c2Y += 25;

    elements.push({ id: 'reg_note_title', type: 'text', page: 1, x: c2Start + 40, y: c2Y, text: 'Note:', fontSize: 11, fill: '#fde047', fontStyle: 'bold', fontFamily: 'Inter', width: COL_WIDTH - 80, draggable: true });
    c2Y += 20;
    const notesText = data.registration?.notes?.map((n: string) => `• ${n}`).join('\n\n') || '';
    elements.push({ id: 'reg_notes', type: 'text', page: 1, x: c2Start + 40, y: c2Y, text: notesText, fontSize: 10.5, fill: '#ffffff', fontFamily: 'Inter', width: COL_WIDTH - 80, draggable: true });
    
    c2Y += 120;
    // In actual production we'd need a real QR code image. Using an image placeholder.
    elements.push({ id: 'qr_code', type: 'image', src: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data.googleForm || 'https://google.com')}`, page: 1, x: c2Start + (COL_WIDTH/2) - 45, y: c2Y + 5, width: 90, height: 90, draggable: true });

    c2Y += 120;
    elements.push({ id: 'acc_title', type: 'text', page: 1, x: c2Start + 40, y: c2Y, text: 'ACCOUNT DETAIL', fontSize: 12, fill: '#0047AB', fontStyle: '900', fontFamily: 'Inter', width: COL_WIDTH - 80, align: 'center', draggable: true });
    elements.push({ id: 'acc_title_bg', type: 'rect', page: 1, x: c2Start + 60, y: c2Y - 5, width: COL_WIDTH - 120, height: 26, fill: '#ffffff', draggable: true });

    c2Y += 40;
    const { accountDetails } = data;
    const accText = `Bank Name: ${accountDetails?.bankName}\nAcc No: ${accountDetails?.accountNo}\nAcc Name: ${accountDetails?.accountName}\nIFSC: ${accountDetails?.ifscCode}`;
    elements.push({ id: 'acc_details', type: 'text', page: 1, x: c2Start + 40, y: c2Y, text: accText, fontSize: 10, fill: '#ffffff', fontFamily: 'Inter', width: COL_WIDTH - 80, draggable: true });


    // Column 3 Box
    const c3Start = COL_WIDTH * 2;
    elements.push({ id: 'p1_c3_bg', type: 'rect', page: 1, x: c3Start, y: 0, width: COL_WIDTH, height: PAGE_HEIGHT, fill: '#ffffff', draggable: false });
    
    let c3Y = 100;
    elements.push({ id: 'event_sponsor', type: 'text', page: 1, x: c3Start + 40, y: c3Y, text: 'IEEE Madras Section Sponsored', fontSize: 10, fill: '#0047AB', fontStyle: '900', fontFamily: 'Inter', width: COL_WIDTH - 80, align: 'center', draggable: true });
    c3Y += 30;
    elements.push({ id: 'event_title', type: 'text', page: 1, x: c3Start + 40, y: c3Y, text: (data.eventTitle || '').toUpperCase(), fontSize: 22, fill: '#0047AB', fontStyle: '900', fontFamily: 'Inter', width: COL_WIDTH - 80, align: 'center', draggable: true });
    c3Y += 100;
    elements.push({ id: 'event_dates', type: 'text', page: 1, x: c3Start + 40, y: c3Y, text: data.dates, fontSize: 14, fill: '#0047AB', fontStyle: '900', fontFamily: 'Inter', width: COL_WIDTH - 80, align: 'center', draggable: true });
    
    c3Y += 50;
    elements.push({ id: 'event_img_placeholder', type: 'rect', page: 1, x: c3Start + 40, y: c3Y, width: COL_WIDTH - 80, height: 160, fill: '#f1f5f9', draggable: true });
    if (data.eventImage) {
        elements.push({ id: 'event_img', type: 'image', src: data.eventImage, page: 1, x: c3Start + 40, y: c3Y, width: COL_WIDTH - 80, height: 160, draggable: true });
    } else {
        elements.push({ id: 'event_img_text', type: 'text', page: 1, x: c3Start + 40, y: c3Y + 70, text: 'IMAGE PLACEHOLDER', fontSize: 12, fill: '#94a3b8', fontStyle: 'bold', fontFamily: 'Inter', width: COL_WIDTH - 80, align: 'center', draggable: true });
    }

    c3Y += 200;
    elements.push({ id: 'org_by_title', type: 'text', page: 1, x: c3Start + 40, y: c3Y, text: 'Organized by', fontSize: 9, fill: '#94a3b8', fontStyle: '900', fontFamily: 'Inter', width: COL_WIDTH - 80, align: 'center', draggable: true });
    c3Y += 20;
    elements.push({ id: 'org_dept', type: 'text', page: 1, x: c3Start + 40, y: c3Y, text: (data.department || '').toUpperCase(), fontSize: 14, fill: '#0047AB', fontStyle: '900', fontFamily: 'Inter', width: COL_WIDTH - 80, align: 'center', draggable: true });


    // --- PAGE 2 ---
    // Col 1
    elements.push({ id: 'p2_c1_bg', type: 'rect', page: 2, x: 0, y: 0, width: COL_WIDTH, height: PAGE_HEIGHT, fill: '#0047AB', draggable: false });
    elements.push({ id: 'p2_c1_title1', type: 'text', page: 2, x: 40, y: 50, text: 'ABOUT SRM', fontSize: 16, fill: '#ffffff', fontStyle: '900', fontFamily: 'Inter', width: COL_WIDTH - 80, align: 'center', draggable: true });
    elements.push({ id: 'p2_c1_desc1', type: 'text', page: 2, x: 40, y: 80, text: data.aboutCollege || '', fontSize: 11.5, fill: '#ffffff', fontFamily: 'Inter', width: COL_WIDTH - 80, align: 'justify', draggable: true });

    elements.push({ id: 'p2_c1_title2', type: 'text', page: 2, x: 40, y: 380, text: 'ABOUT THE SCHOOL', fontSize: 14, fill: '#ffffff', fontStyle: '900', fontFamily: 'Inter', width: COL_WIDTH - 80, align: 'center', draggable: true });
    elements.push({ id: 'p2_c1_desc2', type: 'text', page: 2, x: 40, y: 410, text: data.aboutSchool || '', fontSize: 11.5, fill: '#ffffff', fontFamily: 'Inter', width: COL_WIDTH - 80, align: 'justify', draggable: true });

    // Col 2
    elements.push({ id: 'p2_c2_bg', type: 'rect', page: 2, x: c2Start, y: 0, width: COL_WIDTH, height: PAGE_HEIGHT, fill: '#ffffff', draggable: false });
    elements.push({ id: 'p2_c2_title1', type: 'text', page: 2, x: c2Start + 40, y: 50, text: 'ABOUT DEPARTMENT', fontSize: 13, fill: '#0047AB', fontStyle: '900', fontFamily: 'Inter', width: COL_WIDTH - 80, align: 'center', draggable: true });
    elements.push({ id: 'p2_c2_desc1', type: 'text', page: 2, x: c2Start + 40, y: 80, text: data.aboutDepartment || '', fontSize: 10, fill: '#334155', fontFamily: 'Inter', width: COL_WIDTH - 80, align: 'justify', draggable: true });

    elements.push({ id: 'p2_c2_title2', type: 'text', page: 2, x: c2Start + 40, y: 280, text: 'ABOUT THE FDP', fontSize: 13, fill: '#0047AB', fontStyle: '900', fontFamily: 'Inter', width: COL_WIDTH - 80, align: 'center', draggable: true });
    elements.push({ id: 'p2_c2_desc2', type: 'text', page: 2, x: c2Start + 40, y: 310, text: data.aboutFdp || '', fontSize: 10, fill: '#334155', fontFamily: 'Inter', width: COL_WIDTH - 80, align: 'justify', draggable: true });


    // Col 3
    elements.push({ id: 'p2_c3_bg', type: 'rect', page: 2, x: c3Start, y: 0, width: COL_WIDTH, height: PAGE_HEIGHT, fill: '#0047AB', draggable: false });
    elements.push({ id: 'p2_c3_title1', type: 'text', page: 2, x: c3Start + 40, y: 50, text: 'TOPICS TO BE COVERED', fontSize: 11, fill: '#fde047', fontStyle: '900', fontFamily: 'Inter', width: COL_WIDTH - 80, align: 'center', draggable: true });
    
    let tY = 90;
    data.topics?.slice(0, 5).forEach((t: any, i: number) => {
        elements.push({ id: `topic_${i}`, type: 'text', page: 2, x: c3Start + 40, y: tY, text: `${t.date}: ${t.forenoon}`, fontSize: 9, fill: '#ffffff', fontFamily: 'Inter', width: COL_WIDTH - 80, draggable: true });
        tY += 20;
    });

    tY += 20;
    elements.push({ id: 'p2_c3_title2', type: 'text', page: 2, x: c3Start + 40, y: tY, text: 'EMINENT SPEAKERS', fontSize: 12, fill: '#fde047', fontStyle: '900', fontFamily: 'Inter', width: COL_WIDTH - 80, align: 'center', draggable: true });
    tY += 30;

    data.speakers?.slice(0, 8).forEach((s: any, i: number) => {
        elements.push({ id: `speaker_${i}`, type: 'text', page: 2, x: c3Start + 40, y: tY, text: `${s.name} - ${s.org}`, fontSize: 9.5, fill: '#ffffff', fontFamily: 'Inter', width: COL_WIDTH - 80, draggable: true });
        tY += 25;
    });

    return elements;
};

export default function KonvaEngine({ initialData, selectedLogos }: { initialData: any, selectedLogos: string[] }) {
    const [elements, setElements] = useState<Element[]>([]);
    const [selectedId, selectShape] = useState<string | null>(null);

    // Text Editing State
    const [editingElementId, setEditingElementId] = useState<string | null>(null);
    const [editorValue, setEditorValue] = useState<string>('');
    const [editorStyle, setEditorStyle] = useState<any>({});

    // Ref to the top-level container for absolute positioning offsets
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (initialData) {
            setElements(generateDefaultLayout(initialData, selectedLogos));
        }
    }, [initialData, selectedLogos]);

    const checkDeselect = (e: any) => {
        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) {
            selectShape(null);
        }
    };

    const handleDragEnd = (e: any, id: string) => {
        setElements(
            elements.map(el => {
                if (el.id === id) {
                    return { ...el, x: e.target.x(), y: e.target.y() };
                }
                return el;
            })
        );
    };

    // Floating Toolbar State
    const [toolbarPos, setToolbarPos] = useState<{ top: number, left: number } | null>(null);

    // Watch selectedId to position toolbar
    useEffect(() => {
        if (!selectedId) {
            setToolbarPos(null);
            return;
        }
        
        // Find the node in the stage to get its absolute position
        const stage1 = document.querySelector('.konva-container-export:nth-of-type(1) canvas') as any;
        // In a real sophisticated Konva app we'd keep refs to layers,
        // but since we just need approximate top-right position of the selected element:
        const el = elements.find(e => e.id === selectedId);
        if (el && el.type === 'text') {
            const containerOffset = containerRef.current?.getBoundingClientRect() || { top: 0, left: 0 };
            
            // Approximate based on state coordinates + scale
            const cssScale = 0.85;
            // The first stage is page 1, the second is page 2. 
            // The gap between them is roughly gap-10 (40px)
            const stageHeight = PAGE_HEIGHT * cssScale;
            const pageOffset = el.page === 1 ? 0 : stageHeight + 40; 
            
            setToolbarPos({
                top: (el.y * cssScale) + pageOffset - 45, // 45px above the element
                left: el.x * cssScale
            });
        } else {
            setToolbarPos(null);
        }

    }, [selectedId, elements]);

    const handleDoubleClick = (e: any, id: string) => {
        const textElement = elements.find(el => el.id === id);
        if (textElement?.type !== 'text') return;

        // Hide the transformer while editing
        selectShape(null);
        setEditingElementId(id);
        setEditorValue(textElement.text || '');

        // Calculate absolute position on the screen
        const textNode = e.target;
        const stage = textNode.getStage();
        const containerOffset = containerRef.current?.getBoundingClientRect() || { top: 0, left: 0 };
        const stageOffset = stage.container().getBoundingClientRect();

        // The exact position relative to the main container wrapper
        const absolutePosition = textNode.absolutePosition();
        
        // Compute where the textarea should appear (factoring in the wrapper's css transform/scale)
        // Since we scale the canvas down using CSS `scale-[0.85]`, we must apply that scale to the dimensions
        const cssScale = 0.85;

        // Which page clicked? Top stage offset is different for page 2
        const pageRelativeTop = textElement.page === 1 ? stageOffset.top : stageOffset.top;
        
        setEditorStyle({
            position: 'absolute',
            top: `${(pageRelativeTop - containerOffset.top) + (absolutePosition.y * cssScale)}px`,
            left: `${(stageOffset.left - containerOffset.left) + (absolutePosition.x * cssScale)}px`,
            width: `${(textElement.width || textNode.width()) * cssScale}px`,
            height: `${textNode.height() * cssScale + 20}px`,
            fontSize: `${(textElement.fontSize || 12) * cssScale}px`,
            border: '2px solid #0ea5e9',
            padding: '0px',
            margin: '0px',
            overflow: 'hidden',
            background: 'white',
            outline: 'none',
            resize: 'none',
            lineHeight: textNode.lineHeight(),
            fontFamily: textElement.fontFamily || 'Inter',
            transformOrigin: 'left top',
            textAlign: textElement.align || 'left',
            color: '#0f172a',
            zIndex: 100,
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            borderRadius: '4px'
        });
    };

    const handleTextareaBlur = () => {
        if (!editingElementId) return;

        setElements(
            elements.map(el => {
                if (el.id === editingElementId) {
                    return { ...el, text: editorValue };
                }
                return el;
            })
        );
        setEditingElementId(null);
    };

    const page1Elements = elements.filter(e => e.page === 1);
    const page2Elements = elements.filter(e => e.page === 2);

    const handleFontSize = (delta: number) => {
        if (!selectedId) return;
        setElements(
            elements.map(el => {
                if (el.id === selectedId && el.fontSize) {
                    return { ...el, fontSize: Math.max(6, el.fontSize + delta) };
                }
                return el;
            })
        );
    };

    const renderElements = (pageElements: Element[]) => {
        return pageElements.map((element, i) => {
            if (element.type === 'rect') {
                return (
                    <Rect
                        key={element.id}
                        {...element}
                        onClick={() => element.draggable && selectShape(element.id)}
                        onTap={() => element.draggable && selectShape(element.id)}
                        onDragEnd={(e) => handleDragEnd(e, element.id)}
                    />
                );
            } else if (element.type === 'text') {
                return (
                    <Text
                        key={element.id}
                        {...element}
                        visible={editingElementId !== element.id}
                        onClick={() => element.draggable && selectShape(element.id)}
                        onTap={() => element.draggable && selectShape(element.id)}
                        onDblClick={(e) => handleDoubleClick(e, element.id)}
                        onDblTap={(e) => handleDoubleClick(e, element.id)}
                        onDragEnd={(e) => handleDragEnd(e, element.id)}
                    />
                );
            } else if (element.type === 'image') {
                return (
                    <URLImage 
                        key={element.id}
                        element={element}
                        isSelected={element.id === selectedId}
                        onSelect={() => selectShape(element.id)}
                    />
                );
            }
            return null;
        });
    };

    return (
        <div className="flex flex-col items-center gap-10 relative" ref={containerRef}>
            
            {/* HTML WYSIWYG Editor Overlay */}
            {editingElementId && (
                <textarea
                    value={editorValue}
                    onChange={(e) => setEditorValue(e.target.value)}
                    onBlur={handleTextareaBlur}
                    style={editorStyle}
                    autoFocus
                />
            )}
            <div className="border border-slate-300 shadow-[0_20px_50px_rgba(0,0,0,0.2)] bg-white konva-container-export transform scale-[0.85] origin-top hover:scale-[0.88] transition-all duration-700" style={{ width: PAGE_WIDTH, height: PAGE_HEIGHT }}>
                <Stage 
                    width={PAGE_WIDTH} 
                    height={PAGE_HEIGHT} 
                    onMouseDown={checkDeselect}
                    onTouchStart={checkDeselect}
                >
                    <Layer>
                        {renderElements(page1Elements)}
                    </Layer>
                </Stage>
            </div>

            <div className="border border-slate-300 shadow-[0_20px_50px_rgba(0,0,0,0.2)] bg-white konva-container-export transform scale-[0.85] origin-top hover:scale-[0.88] transition-all duration-700" style={{ width: PAGE_WIDTH, height: PAGE_HEIGHT }}>
                <Stage 
                    width={PAGE_WIDTH} 
                    height={PAGE_HEIGHT} 
                    onMouseDown={checkDeselect}
                    onTouchStart={checkDeselect}
                >
                    <Layer>
                        {renderElements(page2Elements)}
                    </Layer>
                </Stage>
            </div>

            <p className="text-xs text-slate-400 mt-4 mb-20 font-bold uppercase tracking-widest text-center">
                Double-click text to edit. <br/>Drag elements anywhere to reposition.
            </p>
        </div>
    );
}
