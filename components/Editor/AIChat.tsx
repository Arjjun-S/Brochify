"use client";

import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { generateBrochureData } from '@/lib/openrouter';
import { generateEventImage } from '@/lib/imageGen';
import { cn } from '@/lib/utils';

interface AIChatProps {
  onDataGenerated: (data: any) => void;
}

export default function AIChat({ onDataGenerated }: AIChatProps) {
  const [messages, setMessages] = useState<any[]>([
    { role: 'assistant', content: "Hello! I'm Brochify AI. Tell me about your event (Title, Department, Dates, etc.) and I'll generate a professional brochure for you." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!input.trim() || loading) return;
    
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const result = await generateBrochureData(input, messages);
      const { data, rawMessage } = result;
      
      if (data.eventTitle && data.department) {
        setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: "Great! I've generated the brochure data. Now generating an AI image for the cover...",
            reasoning_details: rawMessage?.reasoning_details 
        }]);
        
        const imageUrl = await generateEventImage(data.eventTitle);
        data.eventImage = imageUrl;
        
        onDataGenerated(data);
        setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: "Done! Check the preview on the right. You can still edit anything manually." 
        }]);
      } else {
         setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: "I need a bit more information. Please provide the registration fees and speakers if possible.",
            reasoning_details: rawMessage?.reasoning_details
         }]);
      }
    } catch (error: any) {
       console.error('Error during generation:', error);
       let errorMsg = "Sorry, I hit a snag. Please try again.";
       if (error.response?.status === 429) {
         errorMsg = "API Rate Limit reached (429). Please wait a few moments and try again.";
       } else if (error.message?.includes('network')) {
         errorMsg = "Network error. Please check your connection.";
       }
       
       setMessages(prev => [...prev, { 
           role: 'assistant', 
           content: errorMsg 
       }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white rounded-xl overflow-hidden shadow-2xl">
      <div className="p-4 bg-primary flex items-center gap-2">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <h2 className="font-bold">Brochify AI Assistant</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className="space-y-2">
            <div className={cn(
              "max-w-[80%] p-3 rounded-2xl text-sm shadow-sm",
              m.role === 'user' ? "bg-[#0047AB] ml-auto rounded-tr-none text-white" : "bg-slate-800 rounded-tl-none text-slate-100"
            )}>
              {m.content}
            </div>
            {m.reasoning_details && (
              <details className="text-[10px] text-slate-500 bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                <summary className="cursor-pointer hover:text-slate-400 transition-colors font-bold uppercase tracking-wider">Reasoning Process</summary>
                <div className="mt-2 whitespace-pre-wrap leading-relaxed opacity-70">
                  {m.reasoning_details}
                </div>
              </details>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-3 text-slate-400 text-xs italic animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-[#0047AB]"/> 
            AI is analyzing your request...
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-800 flex gap-2">
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="e.g. FDP on GenAI March 23-27..."
          className="flex-1 bg-slate-800 border-none rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-[#0047AB] outline-none"
        />
        <button 
          onClick={handleSend}
          disabled={loading}
          className="p-2 bg-[#0047AB] hover:bg-blue-600 rounded-lg transition-colors"
        >
          <Send className="w-4 h-4"/>
        </button>
      </div>
    </div>
  );
}
