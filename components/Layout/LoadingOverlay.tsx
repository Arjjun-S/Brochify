"use client";

import React from 'react';
import { Loader2, Sparkles, BrainCircuit } from 'lucide-react';

interface LoadingOverlayProps {
    isVisible: boolean;
    message?: string;
}

export default function LoadingOverlay({ isVisible, message }: LoadingOverlayProps) {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-2xl animate-in fade-in duration-500">
            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] animate-pulse delay-700"></div>

            <div className="relative flex flex-col items-center max-w-md w-full px-6 text-center">
                <div className="relative mb-12">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
                    <div className="w-32 h-32 rounded-[40px] border-2 border-white/10 flex items-center justify-center bg-white/5 relative z-10 p-6 shadow-2xl overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent"></div>
                        <BrainCircuit className="w-full h-full text-primary animate-pulse relative z-10" />
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary animate-progress"></div>
                    </div>
                    {/* Floating Orbs */}
                    <div className="absolute -top-4 -right-4 w-8 h-8 bg-amber-400/50 rounded-full blur-xl animate-bounce"></div>
                    <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-blue-400/30 rounded-full blur-2xl animate-bounce delay-300"></div>
                </div>
                
                <h3 className="text-3xl font-black text-white mb-4 tracking-tighter italic">
                    BROCHIFY<span className="text-primary not-italic">.</span>AI
                </h3>
                
                <div className="space-y-4">
                    <p className="text-slate-400 text-xs font-black uppercase tracking-[0.5em] animate-pulse opacity-70">
                        {message || "Materializing Architecture"}
                    </p>
                    
                    <div className="flex items-center justify-center gap-1.5 pt-4">
                        {[1,2,3,4,5].map(i => (
                            <div 
                                key={i} 
                                className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce shadow-[0_0_10px_rgba(0,71,171,0.5)]" 
                                style={{ animationDelay: `${i * 150}ms` }}
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
