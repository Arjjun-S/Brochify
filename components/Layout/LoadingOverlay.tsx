"use client";

import React from 'react';
import { Sparkles, BrainCircuit } from 'lucide-react';
import { getLoadingTaskMeta, LoadingTask } from '@/lib/loadingManager';

interface LoadingOverlayProps {
    isVisible: boolean;
    message?: string;
    task?: LoadingTask;
}

export default function LoadingOverlay({ isVisible, message, task = 'idle' }: LoadingOverlayProps) {
    if (!isVisible) return null;

    const meta = getLoadingTaskMeta(task);
    const title = meta?.title || 'Brochify Processing';
    const subtitle = message || meta?.subtitle || 'Running task pipeline';
    const accent = meta?.accent || '#0047ab';

    return (
        <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-2xl animate-in fade-in duration-500">
            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] animate-pulse" style={{ backgroundColor: `${accent}55` }}></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[120px] animate-pulse delay-700" style={{ backgroundColor: `${accent}22` }}></div>

            <div className="relative flex flex-col items-center max-w-md w-full px-6 text-center">
                <div className="relative mb-12">
                    <div className="absolute inset-0 rounded-full blur-3xl animate-pulse" style={{ backgroundColor: `${accent}44` }}></div>
                    <div className="w-32 h-32 rounded-[40px] border-2 border-white/10 flex items-center justify-center bg-white/5 relative z-10 p-6 shadow-2xl overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-tr to-transparent" style={{ backgroundImage: `linear-gradient(to top right, ${accent}44, transparent)` }}></div>
                        <BrainCircuit className="w-full h-full animate-pulse relative z-10" style={{ color: accent }} />
                        <div className="absolute bottom-0 left-0 right-0 h-1 animate-progress" style={{ backgroundColor: accent }}></div>
                    </div>
                    {/* Floating Orbs */}
                    <div className="absolute -top-4 -right-4 w-8 h-8 bg-amber-400/50 rounded-full blur-xl animate-bounce"></div>
                    <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-blue-400/30 rounded-full blur-2xl animate-bounce delay-300"></div>
                </div>
                
                <h3 className="text-3xl font-black text-white mb-4 tracking-tighter italic">
                    BROCHIFY<span className="not-italic" style={{ color: accent }}>.</span>AI
                </h3>
                <p className="text-sm font-bold text-white/90 tracking-wide">{title}</p>
                
                <div className="space-y-4">
                    <p className="text-slate-400 text-xs font-black uppercase tracking-[0.5em] animate-pulse opacity-70">
                        {subtitle}
                    </p>
                    
                    <div className="flex items-center justify-center gap-1.5 pt-4">
                        {[1,2,3,4,5].map(i => (
                            <div 
                                key={i} 
                                className="w-1.5 h-1.5 rounded-full animate-bounce" 
                                style={{ backgroundColor: accent, boxShadow: `0 0 10px ${accent}`, animationDelay: `${i * 150}ms` }}
                            ></div>
                        ))}
                    </div>
                </div>
                
                <div className="mt-16 pt-8 border-t border-white/5 w-full">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-600">
                        <span>Neural Buffer 88%</span>
                        <span className="flex items-center gap-2">
                             <Sparkles className="w-3 h-3 text-amber-500" />
                             Creative Sync Active
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
