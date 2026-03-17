"use client";

import React, { useState, useEffect } from 'react';
import { logger, APILog } from '@/lib/logger';
import { Terminal, Clock, ChevronDown, ChevronUp, Trash2, ShieldCheck, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DevLogs() {
  const [logs, setLogs] = useState<APILog[]>(() => logger.getLogs());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    return logger.subscribe(setLogs);
  }, []);

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-300 font-mono text-[10px] border-l border-white/5 shadow-2xl">
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg border border-primary/30">
            <Terminal className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Neural Telemetry</h3>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">API Response Stream</p>
          </div>
        </div>
        <button 
          onClick={() => logger.clear()}
          className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-hide">
        {logs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 opacity-20 text-center px-6">
            <Zap className="w-8 h-8 mb-4 animate-pulse" />
            <p className="font-bold uppercase tracking-widest leading-relaxed">No telemetry detected.<br/>Initiate AI protocol to begin stream.</p>
          </div>
        )}
        {logs.map((log) => (
          <div 
            key={log.id} 
            className={cn(
              "border rounded-xl transition-all overflow-hidden",
              log.status === 'ERROR' ? "border-red-500/20 bg-red-500/5" : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]"
            )}
          >
            <button 
              onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
              className="w-full text-left p-3 flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3 flex-1 overflow-hidden">
                <div className={cn(
                  "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tight whitespace-nowrap",
                  log.type === 'OPENROUTER' ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                )}>
                  {log.type}
                </div>
                <span className="truncate font-bold text-slate-400 tracking-tight">{log.event}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-600 text-[8px] whitespace-nowrap flex items-center gap-1 font-bold italic">
                  <Clock className="w-3 h-3" />
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                {expandedId === log.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </div>
            </button>

            {expandedId === log.id && (
              <div className="p-4 border-t border-white/5 bg-black/40 space-y-4 text-slate-400 animate-in fade-in slide-in-from-top-2">
                <div>
                  <div className="text-[9px] font-black uppercase text-slate-600 mb-2 flex items-center gap-2">
                    <div className="w-1 h-1 bg-primary rounded-full"></div>
                    Payload Ingest
                  </div>
                  <pre className="bg-white/[0.03] p-3 rounded-lg overflow-x-auto border border-white/5 text-[9px] shadow-inner font-mono">
                    {JSON.stringify(log.input, null, 2)}
                  </pre>
                </div>
                <div>
                  <div className="text-[9px] font-black uppercase text-slate-600 mb-2 flex items-center gap-2">
                    <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                    Response Synthesis
                  </div>
                  <pre className="bg-white/[0.03] p-3 rounded-lg overflow-x-auto border border-white/5 text-[9px] shadow-inner font-mono">
                    {JSON.stringify(log.output, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="p-3 bg-slate-900 border-t border-white/5 flex items-center justify-center opacity-30 group hover:opacity-100 transition-opacity">
        <ShieldCheck className="w-3 h-3 text-primary mr-2" />
        <span className="text-[8px] font-black uppercase tracking-[0.2em]">Encrypted Diagnostic Link Active</span>
      </div>
    </div>
  );
}
