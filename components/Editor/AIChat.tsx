"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, BrainCircuit, Sparkles, MessageCircle, Zap, Plus, Check } from 'lucide-react';
import { generateBrochureData } from '@/lib/openrouter';
import { generateEventImage } from '@/lib/imageGen';
import { cn } from '@/lib/utils';

const availableLogos = [
  { id: 'srm', name: 'SRM Institute of Tech', src: '/logos/srm.svg' },
  { id: 'ieee', name: 'IEEE Student Branch', src: '/logos/ieee.svg' },
  { id: 'ctech', name: 'Dept. of C. Tech', src: '/logos/ctech.svg' },
  { id: 'naac', name: 'NAAC Accredited', src: '/logos/naac.svg' },
];

interface AIChatProps {
  onDataGenerated: (data: any) => void;
  onLoading: (isLoading: boolean, message?: string) => void;
  selectedLogos: string[];
  onToggleLogo: (id: string) => void;
}

const renderReasoning = (details: any) => {
    if (!details) return null;
    if (typeof details === 'string') return details;
    if (Array.isArray(details)) {
        return details.map((block: any, idx: number) => (
            <div key={idx} className="mb-2 last:mb-0">
                {typeof block === 'string' ? block : (block.text || JSON.stringify(block))}
            </div>
        ));
    }
    if (typeof details === 'object') {
        return details.text || JSON.stringify(details, null, 2);
    }
    return String(details);
};

export default function AIChat({ onDataGenerated, onLoading, selectedLogos, onToggleLogo }: AIChatProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLogoSelect, setShowLogoSelect] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setMessages([
        { 
          role: 'assistant', 
          content: "System Initialized. I am your Neural Draftsman. Describe the university event you wish to architect, and I will synthesize a professional multi-page brochure instantly.",
          timestamp: new Date()
        }
    ]);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
  }, [messages, loading]);

  async function handleSend() {
    if (!input.trim() || loading) return;
    
    const userMessage = { role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    onLoading(true, "Decoding Event Latent Space...");

    try {
      const result = await generateBrochureData(input, messages);
      const { data, rawMessage } = result;
      
      if (data.eventTitle && data.department) {
        onLoading(true, "Synthesizing Visual Identity...");
        
        setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: "Architecture parameters verified. Now initializing generative visual engine for your cover illustration...",
            reasoning_details: rawMessage?.reasoning_details,
            timestamp: new Date()
        }]);
        
        const imageUrl = await generateEventImage(data.eventTitle);
        data.eventImage = imageUrl;
        
        onDataGenerated(data);
        setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: "Drafting complete. Your brochure has been materialized in the preview canvas. Review and finalize for PDF export.",
            timestamp: new Date()
        }]);
      } else {
         setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: "Broad architecture established. However, I require more granular data (Registration tokens, specific dates, or keynote speakers) to reach final production state.",
            reasoning_details: rawMessage?.reasoning_details,
            timestamp: new Date()
         }]);
      }
    } catch (error: any) {
       setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: "Signal termination encountered. Please re-initiate command or verify API availability.",
            timestamp: new Date()
       }]);
    } finally {
      setLoading(false);
      onLoading(false);
    }
  }

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-full bg-slate-900 border-none overflow-hidden relative">
      {/* Futuristic Message Area */}
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth scrollbar-hide bg-[url('https://www.transparenttextures.com/patterns/micro-carbon.png')]"
      >
        {messages.map((m, i) => (
          <div key={i} className={cn(
            "flex flex-col gap-3 group translate-y-0 transition-all duration-500 ease-out animate-in fade-in slide-in-from-bottom-2",
            m.role === 'user' ? "items-end" : "items-start"
          )}>
            <div className={cn(
                "flex items-center gap-2 opacity-30 group-hover:opacity-60 transition-opacity",
                m.role === 'user' ? "flex-row-reverse" : "flex-row"
            )}>
                {m.role === 'user' ? <User className="w-3 h-3 text-primary" /> : <Bot className="w-3 h-3 text-primary" />}
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    {m.role === 'user' ? "Operator" : "System"}
                </span>
            </div>
            
            <div className={cn(
              "px-5 py-4 rounded-[24px] text-sm leading-relaxed shadow-xl border relative",
              m.role === 'user' 
                ? "bg-primary text-white border-white/20 rounded-tr-none" 
                : "bg-white/5 backdrop-blur-xl border-white/5 text-slate-200 rounded-tl-none"
            )}>
              {m.content}
            </div>

            {m.reasoning_details && (
              <div className="w-full mt-2">
                <details className="group">
                    <summary className="text-[10px] cursor-pointer text-slate-500 hover:text-white transition-all font-black uppercase tracking-widest list-none flex items-center gap-3 bg-white/5 py-2 px-4 rounded-full border border-white/5 w-fit">
                        <Zap className="w-3 h-3 text-yellow-400 group-open:animate-bounce" />
                        Logic Trace
                    </summary>
                    <div className="mt-4 text-[11px] leading-relaxed text-slate-400 bg-black/50 p-5 rounded-[20px] border border-white/5 italic font-mono shadow-2xl backdrop-blur-2xl">
                        <div className="flex gap-1 mb-2">
                            <div className="w-1.5 h-1.5 bg-yellow-400/50 rounded-full"></div>
                            <div className="w-1.5 h-1.5 bg-green-400/50 rounded-full"></div>
                            <div className="w-1.5 h-1.5 bg-red-400/50 rounded-full"></div>
                        </div>
                        {renderReasoning(m.reasoning_details)}
                    </div>
                </details>
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex flex-col gap-3 animate-pulse">
            <div className="flex items-center gap-2 opacity-30">
                <Bot className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Synthesizing</span>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-[24px] p-5 flex items-center gap-4 max-w-[70%]">
                <div className="relative">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <Sparkles className="absolute inset-0 m-auto w-2 h-2 text-primary animate-pulse" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 italic">Neural Pathways Converging...</span>
            </div>
          </div>
        )}
      </div>

      {/* Cyber Input Area */}
      <div className="p-6 bg-slate-950/80 border-t border-white/10 backdrop-blur-3xl relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
        
        {/* Logo Selection Popover */}
        {showLogoSelect && (
            <div className="absolute bottom-full left-6 mb-4 w-64 bg-[#2D5B9A] text-white p-5 rounded-[24px] shadow-2xl animate-in zoom-in-95 fade-in slide-in-from-bottom-4 duration-300 z-50 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest">Logo select</h3>
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                </div>
                <div className="space-y-3">
                    {availableLogos.map(logo => (
                        <button 
                            key={logo.id} 
                            onClick={() => onToggleLogo(logo.id)}
                            className="w-full flex items-center justify-between group/logo"
                        >
                            <span className={cn(
                                "text-xs font-bold transition-all",
                                selectedLogos.includes(logo.id) ? "text-white" : "text-white/40 group-hover/logo:text-white/60"
                            )}>
                                • {logo.id}
                            </span>
                            {selectedLogos.includes(logo.id) && <Check className="w-3 h-3 text-blue-300" />}
                        </button>
                    ))}
                </div>
                {/* Speech bubble tail */}
                <div className="absolute top-full left-6 w-4 h-4 bg-[#2D5B9A] rotate-45 -translate-y-2 border-r border-b border-white/10"></div>
            </div>
        )}

        <div className="relative flex items-center gap-3">
            <button 
                onClick={() => setShowLogoSelect(!showLogoSelect)}
                className={cn(
                    "w-12 h-12 rounded-[18px] flex items-center justify-center transition-all border shrink-0",
                    showLogoSelect ? "bg-primary border-primary text-white" : "bg-white/5 border-white/10 text-primary hover:border-primary/50"
                )}
            >
                <Plus className={cn("w-6 h-6 transition-transform", showLogoSelect && "rotate-45")} />
            </button>
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Inject event parameters..."
              className="w-full bg-white/5 border border-white/10 rounded-[20px] px-6 py-5 text-sm text-slate-100 focus:border-primary/50 outline-none transition-all placeholder:text-slate-600 focus:ring-4 focus:ring-primary/5"
            />
            <button 
              onClick={handleSend}
              disabled={loading}
              className="absolute right-2 p-3.5 bg-primary hover:bg-blue-600 text-white rounded-[16px] transition-all shadow-[0_4px_20px_rgba(0,71,171,0.4)] active:scale-95 disabled:opacity-50 group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Send className="w-4 h-4 relative z-10" />
            </button>
        </div>
      </div>
    </div>
  );
}
