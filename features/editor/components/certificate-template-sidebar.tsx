"use client";

import { useEffect } from "react";
import Image from "next/image";
import { AlertTriangle, Loader, Check, Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ActiveTool, Editor } from "@/features/editor/types";
import { ToolSidebarClose } from "@/features/editor/components/tool-sidebar-close";
import { ToolSidebarHeader } from "@/features/editor/components/tool-sidebar-header";

import { useGetAssets } from "@/features/assets/api/use-get-assets";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useConfirm } from "@/hooks/use-confirm";

interface CertificateTemplateSidebarProps {
  editor: Editor | undefined;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
}

export const CertificateTemplateSidebar = ({ editor, activeTool, onChangeActiveTool }: CertificateTemplateSidebarProps) => {
  const { data, isLoading, isError } = useGetAssets("certificate_template");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (data?.data && editor) {
      const urls = data.data.map((asset) => asset.cloudinaryUrl);
      editor.preloadTemplates(urls);
    }
  }, [data, editor]);

  const onClose = () => {
    onChangeActiveTool("select");
  };

  const onSelectTemplate = (url: string) => {
    editor?.addBackgroundImage(url);
  };

  // Extract currently active background image URL from editor canvas
  const bgImage = editor?.canvas?.backgroundImage as any;
  const currentBgUrl = bgImage
    ? (typeof bgImage.getSrc === "function" ? bgImage.getSrc() : bgImage.src || bgImage._element?.src || "")
    : "";

  return (
    <aside
      className={cn(
        "bg-white relative border-r z-[40] w-[360px] h-full flex flex-col",
        activeTool === "certificate-templates" ? "visible" : "hidden"
      )}
    >
      <ToolSidebarHeader
        title="Certificate Templates"
        description="Add certificate template backgrounds"
      />
      {isLoading && (
        <div className="flex items-center justify-center flex-1">
          <Loader className="size-4 text-muted-foreground animate-spin" />
        </div>
      )}
      {isError && (
        <div className="flex flex-col gap-y-4 items-center justify-center flex-1">
          <AlertTriangle className="size-4 text-muted-foreground" />
          <p className="text-muted-foreground text-xs">Failed to fetch templates</p>
        </div>
      )}
      <ScrollArea>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4">
            {data?.data &&
              data.data.map((asset) => {
                const isSelected = currentBgUrl.split("?")[0] === asset.cloudinaryUrl.split("?")[0];
                return (
                  <button
                    onClick={() => onSelectTemplate(asset.cloudinaryUrl)}
                    key={asset.id}
                    className={cn(
                      "relative w-full h-[100px] group transition rounded-sm overflow-hidden border bg-muted",
                      isSelected 
                        ? "border-indigo-600 ring-2 ring-indigo-600/50 shadow-[0_0_12px_rgba(79,70,229,0.4)]" 
                        : "hover:opacity-75"
                    )}
                  >
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 bg-indigo-600 text-white rounded-full p-0.5 z-[10]">
                        <Check className="size-3" />
                      </div>
                    )}
                    <Image
                      src={asset.cloudinaryUrl}
                      alt={asset.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 180px"
                      className="object-cover"
                      loading="lazy"
                    />
                    <div className="opacity-0 group-hover:opacity-100 absolute left-0 bottom-0 w-full text-[10px] truncate text-white p-1 bg-black/50 text-left">
                      {asset.name}
                    </div>
                  </button>
                );
              })}
            {/* Custom Template Upload Card */}
            <button
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".png,.jpg,.jpeg,.webp";
                input.onchange = async (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (!file) return;

                  const toastId = toast.loading("Uploading custom template...");
                  try {
                    const formData = new FormData();
                    formData.append("file", file);
                    formData.append("name", file.name.split(".")[0]);
                    formData.append("type", "certificate_template");

                    const res = await fetch("/api/assets", {
                      method: "POST",
                      body: formData,
                    });
                    const result = await res.json();
                    if (!res.ok || !result.data?.cloudinaryUrl) {
                      throw new Error(result.error || "Upload failed");
                    }

                    toast.success("Template uploaded successfully!", { id: toastId });
                    queryClient.invalidateQueries({ queryKey: ["assets", "certificate_template"] });

                    const url = result.data.cloudinaryUrl;
                    editor?.preloadTemplates([url]);
                    editor?.addBackgroundImage(url);
                  } catch (err: any) {
                    toast.error(err.message || "Failed to upload custom template", { id: toastId });
                  }
                };
                input.click();
              }}
              className="relative w-full h-[100px] flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-sm hover:border-indigo-600 hover:bg-slate-50 transition cursor-pointer text-slate-500 hover:text-indigo-600"
            >
              <Plus className="size-6 mb-1" />
              <span className="text-xs font-semibold">Upload Custom</span>
            </button>
          </div>
        </div>
      </ScrollArea>
      <ToolSidebarClose onClick={onClose} />
    </aside>
  );
};