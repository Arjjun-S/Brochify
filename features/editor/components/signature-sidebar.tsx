"use client";

import { useState } from "react";
import { Loader, Plus, Trash2, Award } from "lucide-react";
import { ActiveTool, Editor } from "@/features/editor/types";
import { ToolSidebarClose } from "@/features/editor/components/tool-sidebar-close";
import { ToolSidebarHeader } from "@/features/editor/components/tool-sidebar-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface SignatureSidebarProps {
  editor: Editor | undefined;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
  customSignatures: Array<{ name: string; designation: string; src: string }>;
  onAddCustomSignature: (sig: { name: string; designation: string; src: string }) => void;
  onDeleteCustomSignature?: (index: number) => void;
}

export const SignatureSidebar = ({
  editor,
  activeTool,
  onChangeActiveTool,
  customSignatures,
  onAddCustomSignature,
  onDeleteCustomSignature,
}: SignatureSidebarProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const defaultSignatures = [
    { name: "HOD (CTECH)", designation: "Head of Dept", src: "sign" },
    { name: "HOD (CINTEL)", designation: "Head of Dept", src: "sign" },
  ];

  const onClose = () => {
    onChangeActiveTool("select");
  };

  const handleSelectSignature = (sig: { name: string; src: string }) => {
    editor?.addSignature(sig.name, sig.src);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !designation || !file) {
      alert("Please fill in all fields.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", `${name} (${designation})`);
      formData.append("type", "signature");

      const response = await fetch("/api/assets", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (!response.ok || !result.data?.cloudinaryUrl) {
        throw new Error(result.error || "Upload failed");
      }

      onAddCustomSignature({
        name,
        designation,
        src: result.data.cloudinaryUrl,
      });

      setIsModalOpen(false);
      setName("");
      setDesignation("");
      setFile(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to upload signature");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <aside
      className={cn(
        "bg-white relative border-r z-[40] w-[360px] h-full flex flex-col",
        activeTool === "signatures" ? "visible" : "hidden"
      )}
    >
      <ToolSidebarHeader
        title="Signatures"
        description="Insert placeholders or upload custom signatures"
      />

      <div className="p-4 border-b">
        <Button
          onClick={() => setIsModalOpen(true)}
          className="w-full flex items-center justify-center gap-2"
        >
          <Plus className="size-4" />
          Add Signature
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Default signatures */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Default Signatures
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {defaultSignatures.map((sig, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectSignature(sig)}
                  className="relative w-full h-[90px] flex flex-col items-center justify-center border rounded-md hover:bg-slate-50 transition p-2"
                >
                  <Award className="size-5 text-slate-400 mb-1" />
                  <span className="text-[11px] font-bold text-slate-700 truncate w-full text-center">
                    {sig.name}
                  </span>
                  <span className="text-[9px] text-slate-500 truncate w-full text-center">
                    {sig.designation}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom signatures */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Custom Signatures
            </h4>
            {customSignatures.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No custom signatures added yet.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {customSignatures.map((sig, i) => (
                  <div
                    key={i}
                    className="relative w-full h-[100px] flex flex-col border rounded-md group hover:border-indigo-400 transition overflow-hidden"
                  >
                    <button
                      onClick={() => handleSelectSignature(sig)}
                      className="flex-1 w-full flex flex-col items-center justify-center p-2 bg-slate-50"
                    >
                      <img src={sig.src} alt={sig.name} className="h-[40px] object-contain mb-1" />
                      <span className="text-[10px] font-bold text-slate-700 truncate w-full text-center">
                        {sig.name}
                      </span>
                    </button>
                    {onDeleteCustomSignature && (
                      <button
                        onClick={() => onDeleteCustomSignature(i)}
                        className="absolute top-1 right-1 p-1 bg-white border rounded hover:bg-red-50 hover:text-red-600 transition"
                        title="Delete custom signature"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      <ToolSidebarClose onClick={onClose} />

      {/* Upload Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Signature</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="sig-name">Name</Label>
              <Input
                id="sig-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dr. Jane Doe"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sig-desig">Designation</Label>
              <Input
                id="sig-desig"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Head of Department"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sig-file">Signature Image</Label>
              <Input
                id="sig-file"
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader className="size-4 animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  "Create & Add"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </aside>
  );
};
