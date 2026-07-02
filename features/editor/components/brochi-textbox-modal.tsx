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
      <DialogContent className="max-w-xl bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-white">
            <Sparkles className="size-5 text-indigo-400 animate-pulse" />
            Configure Brochi Textbox
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {/* Placeholders list */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-300">Click to insert placeholder columns:</Label>
            <div className="flex flex-wrap gap-2 p-3 bg-slate-950/60 rounded-lg border border-slate-800">
              {columns.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => handleAddPlaceholder(col)}
                  className="px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-200 rounded-md border border-slate-700/60 transition"
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
                className="h-9 bg-slate-950 border-slate-800 focus-visible:ring-indigo-600 text-white placeholder-slate-500"
              />
            </div>
            <Button type="submit" size="sm" className="h-9 bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="size-4 mr-1" /> Add
            </Button>
          </form>

          {/* Template text area */}
          <div className="space-y-1.5">
            <Label htmlFor="template-text" className="text-xs text-slate-300 font-semibold">Template text:</Label>
            <textarea
              id="template-text"
              ref={textareaRef}
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full p-3 text-sm bg-slate-950 rounded-lg border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 placeholder-slate-500 font-mono"
              placeholder="e.g. This is to certify that {name}..."
            />
          </div>

          {/* Dynamic Preview Box */}
          <div className="space-y-1.5 bg-indigo-950/20 border border-indigo-900/40 rounded-lg p-3.5">
            <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Live Canvas Preview
            </span>
            <p className="text-sm text-slate-200 mt-1 leading-relaxed">{preview || <span className="text-slate-500 italic">No text entered...</span>}</p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-800">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
            Apply to Canvas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
