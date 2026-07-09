import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Sparkles } from "lucide-react";
import { applyCertificatePlaceholders } from "@/lib/domains/certificate";

interface BrochiTextboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (text: string) => void;
  initialText?: string;
}

export const BrochiTextboxModal = ({
  isOpen,
  onClose,
  onApply,
  initialText,
}: BrochiTextboxModalProps) => {
  const defaultText = "This is to certify that {salutation} {name} of {year} has secured {prize} in {event} held on {date}.";
  const [text, setText] = useState(initialText || defaultText);

  React.useEffect(() => {
    if (isOpen) {
      setText(initialText || defaultText);
    }
  }, [isOpen, initialText]);
  const [customColumn, setCustomColumn] = useState("");
  const [columns, setColumns] = useState([
    "salutation",
    "name",
    "year",
    "gender",
    "prize",
    "event",
    "date",
    "organization",
  ]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleAddPlaceholder = (col: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const placeholder = `{${col}}`;

    const newText = text.substring(0, start) + placeholder + text.substring(end);
    setText(newText);

    // Reposition cursor after the placeholder
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
    }, 0);
  };

  const handleAddCustomColumn = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCol = customColumn.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (cleanCol && !columns.includes(cleanCol)) {
      setColumns([...columns, cleanCol]);
      setCustomColumn("");
    }
  };

  const mockStudent = {
    serialNo: "001",
    salutation: "Mr",
    name: "Student",
    year: "2026",
    gender: "Mr" as const,
    prize: "First Place",
    event: "Web Dev Hackathon",
    date: "29 June 2026",
    organization: "SRM Institute of Science and Technology",
  };

  // Compile mock preview
  const preview = applyCertificatePlaceholders(text, mockStudent);

  const handleSubmit = () => {
    onApply(text);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl bg-slate-900 border border-slate-800/80 text-white rounded-2xl shadow-2xl p-6">
        <DialogHeader className="border-b border-slate-800/60 pb-4">
          <DialogTitle className="text-xl font-extrabold flex items-center gap-2 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            <Sparkles className="size-5 text-indigo-400 animate-pulse" />
            Configure Brochi Textbox
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 my-4">
          {/* Placeholders list */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-300">Click to insert placeholder columns:</Label>
            <div className="flex flex-wrap gap-2 p-3.5 bg-slate-950/40 backdrop-blur-md rounded-xl border border-slate-800/60">
              {columns.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => handleAddPlaceholder(col)}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-indigo-500/10 hover:text-indigo-400 hover:border-indigo-500/50 text-slate-300 rounded-full border border-slate-800 transition-all duration-200 shadow-sm"
                >
                  {`{${col}}`}
                </button>
              ))}
            </div>
          </div>

          {/* Add custom placeholder */}
          <form onSubmit={handleAddCustomColumn} className="flex gap-2 items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="custom-col" className="text-xs text-slate-300">Add custom column name:</Label>
              <Input
                id="custom-col"
                placeholder="e.g. grade, subject"
                value={customColumn}
                onChange={(e) => setCustomColumn(e.target.value)}
                className="h-10 bg-slate-950 border-slate-800 focus-visible:ring-indigo-500/40 focus-visible:ring-2 focus-visible:border-indigo-500 text-white rounded-lg placeholder-slate-600 transition"
              />
            </div>
            <Button type="submit" size="sm" className="h-10 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold shadow-md shadow-indigo-500/10 rounded-lg px-4 transition-all duration-250">
              <Plus className="size-4 mr-1" /> Add
            </Button>
          </form>

          {/* Template text area */}
          <div className="space-y-1.5">
            <Label htmlFor="template-text" className="text-xs text-slate-300 font-semibold">Template text:</Label>
            <textarea
              id="template-text"
              ref={textareaRef}
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full p-4 text-sm bg-slate-950 rounded-xl border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 placeholder-slate-600 font-sans leading-relaxed resize-none transition"
              placeholder="e.g. This is to certify that {name}..."
            />
          </div>

          {/* Dynamic Preview Box */}
          <div className="space-y-1.5 bg-indigo-950/10 border border-indigo-900/30 backdrop-blur-md rounded-xl p-4 shadow-inner shadow-indigo-500/5">
            <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Live Canvas Preview
            </span>
            <p className="text-sm text-slate-200 mt-1 leading-relaxed font-serif">{preview || <span className="text-slate-500 italic">No text entered...</span>}</p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 border-t border-slate-800/60 pt-4 mt-2">
          <Button variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold shadow-lg shadow-indigo-500/20 py-2 rounded-lg px-6 transition-all duration-300">
            Apply to Canvas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
