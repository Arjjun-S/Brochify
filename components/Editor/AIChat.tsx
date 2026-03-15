"use client";

import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { generateBrochureData } from '@/lib/openrouter';
import { generateEventImage } from '@/lib/imageGen';

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
      const data = await generateBrochureData(input, messages);
      
      if (data.eventTitle && data.department) {
        setMessages(prev => [...prev, { role: 'assistant', content: "Great! I've generated the brochure data. Now generating an AI image for the cover..." }]);
        
        const imageUrl = await generateEventImage(data.eventTitle);
        data.eventImage = imageUrl;
        
        onDataGenerated(data);
        setMessages(prev => [...prev, { role: 'assistant', content: "Done! Check the preview on the right. You can still edit anything manually." }]);
      } else {
         setMessages(prev => [...prev, { role: 'assistant', content: "I need a bit more information. Please provide the registration fees and speakers if possible." }]);
      }
    } catch (error) {
       setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I hit a snag. Please check your API keys or try again." }]);
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
          <div key={i} className={cn(
            "max-w-[80%] p-3 rounded-2xl text-sm",
            m.role === 'user' ? "bg-[#0047AB] ml-auto rounded-tr-none" : "bg-slate-800 rounded-tl-none"
          )}>
            {m.content}
          </div>
        ))}
        {loading && <div className="flex gap-2 text-slate-400 text-xs italic"><Loader2 className="w-3 h-3 animate-spin"/> AI is thinking...</div>}
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

import { cn } from '@/lib/utils';
