"use client";

import Image from "next/image";
import { AlertTriangle, Loader, Square, Circle as CircleIcon, Triangle, Minus, QrCode, Image as ImageIcon } from "lucide-react";

import { ActiveTool, Editor } from "@/features/editor/types";
import { ToolSidebarClose } from "@/features/editor/components/tool-sidebar-close";
import { ToolSidebarHeader } from "@/features/editor/components/tool-sidebar-header";

import { useGetAssets } from "@/features/assets/api/use-get-assets";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ElementsSidebarProps {
  editor: Editor | undefined;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
}

export const ElementsSidebar = ({ editor, activeTool, onChangeActiveTool }: ElementsSidebarProps) => {
  const { data, isLoading, isError } = useGetAssets("badge");

  const onClose = () => {
    onChangeActiveTool("select");
  };

  const onSelectBadge = (url: string) => {
    editor?.addImage(url);
  };

  return (
    <aside
      className={cn(
        "bg-white relative border-r z-[40] w-[360px] h-full flex flex-col",
        activeTool === "elements" ? "visible" : "hidden"
      )}
    >
      <ToolSidebarHeader
        title="Elements"
        description="Add shapes, frames, and badge elements to your certificate"
      />
      
      <ScrollArea>
        <div className="p-4 space-y-6">
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Shapes & Frames</h3>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => editor?.addRectangle()}
                className="flex flex-col items-center justify-center p-3 border rounded-lg hover:bg-slate-50 transition gap-y-1 text-slate-700"
              >
                <Square className="size-5" />
                <span className="text-[10px] font-medium">Rectangle</span>
              </button>
              <button
                onClick={() => editor?.addCircle()}
                className="flex flex-col items-center justify-center p-3 border rounded-lg hover:bg-slate-50 transition gap-y-1 text-slate-700"
              >
                <CircleIcon className="size-5" />
                <span className="text-[10px] font-medium">Circle</span>
              </button>
              <button
                onClick={() => editor?.addTriangle()}
                className="flex flex-col items-center justify-center p-3 border rounded-lg hover:bg-slate-50 transition gap-y-1 text-slate-700"
              >
                <Triangle className="size-5" />
                <span className="text-[10px] font-medium">Triangle</span>
              </button>
              <button
                onClick={() => (editor as any)?.addLine()}
                className="flex flex-col items-center justify-center p-3 border rounded-lg hover:bg-slate-50 transition gap-y-1 text-slate-700"
              >
                <Minus className="size-5" />
                <span className="text-[10px] font-medium">Line</span>
              </button>
              <button
                onClick={() => (editor as any)?.addQrBox()}
                title="Make our event certificate valid with verification."
                className="flex flex-col items-center justify-center p-3 border rounded-lg hover:bg-slate-50 transition gap-y-1 text-slate-700 relative group"
              >
                <QrCode className="size-5 text-indigo-600" />
                <span className="text-[10px] font-medium">QR Box</span>
                <div className="absolute bottom-full mb-2 hidden group-hover:block w-48 bg-slate-900 text-white text-[10px] rounded p-2 z-50 pointer-events-none shadow-md">
                  Make our event certificate valid with verification.
                </div>
              </button>
              <button
                onClick={() => (editor as any)?.addImageBox()}
                className="flex flex-col items-center justify-center p-3 border rounded-lg hover:bg-slate-50 transition gap-y-1 text-slate-700"
              >
                <ImageIcon className="size-5 text-emerald-600" />
                <span className="text-[10px] font-medium">Image Box</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Badges</h3>
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader className="size-4 text-muted-foreground animate-spin" />
              </div>
            )}
            {isError && (
              <div className="flex flex-col gap-y-2 items-center justify-center py-8">
                <AlertTriangle className="size-4 text-rose-500" />
                <p className="text-muted-foreground text-xs">Failed to fetch elements</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              {data?.data &&
                data.data.map((asset) => (
                  <button
                    onClick={() => onSelectBadge(asset.cloudinaryUrl)}
                    key={asset.id}
                    className="relative w-full h-[100px] group hover:opacity-75 transition bg-muted rounded-sm overflow-hidden border"
                  >
                    <Image
                      src={asset.cloudinaryUrl}
                      alt={asset.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 180px"
                      className="object-contain"
                      loading="lazy"
                    />
                    <div className="opacity-0 group-hover:opacity-100 absolute left-0 bottom-0 w-full text-[10px] truncate text-white p-1 bg-black/50 text-left">
                      {asset.name}
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      </ScrollArea>
      <ToolSidebarClose onClick={onClose} />
    </aside>
  );
};