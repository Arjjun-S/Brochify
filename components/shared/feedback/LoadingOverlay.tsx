"use client";

import React from 'react';
import Image from 'next/image';
import { getLoadingTaskMeta, LoadingTask } from '@/lib/system/loading/loadingTaskManager';

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
    const accent = meta?.accent || '#cd8bf3';

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/70 px-8 py-10 w-[360px] max-w-[90vw] flex flex-col items-center gap-6 text-center">
                <Image src="/icon-logo.png" alt="Brochify" width={64} height={64} sizes="64px" className="h-16 w-16 object-contain" priority />

                <div className="flex items-center gap-3">
                    <div
                        className="h-9 w-9 rounded-full border-2 border-slate-200 border-t-[3px] animate-spin"
                        style={{ borderTopColor: accent }}
                        aria-hidden
                    ></div>
                    <div className="text-left">
                        <p className="text-sm font-semibold text-slate-700">{title}</p>
                        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">Please wait</p>
                    </div>
                </div>

                <p className="text-xs font-semibold text-slate-500 leading-relaxed tracking-wide">
                    {subtitle}
                </p>
            </div>
        </div>
    );
}
