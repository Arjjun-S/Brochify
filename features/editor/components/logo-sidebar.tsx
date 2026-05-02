"use client";

import Image from "next/image";
import { AlertTriangle, Loader } from "lucide-react";

import { ActiveTool, Editor } from "@/features/editor/types";
import { ToolSidebarClose } from "@/features/editor/components/tool-sidebar-close";
import { ToolSidebarHeader } from "@/features/editor/components/tool-sidebar-header";
import { useQuery } from "@tanstack/react-query";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LogoSidebarProps {
  editor: Editor | undefined;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
}

type LogoResponse = {
  logos: Array<{
    id: string;
    name: string;
    src: string;
  }>;
};

export const LogoSidebar = ({ editor, activeTool, onChangeActiveTool }: LogoSidebarProps) => {
  const { data, isLoading, isError } = useQuery<LogoResponse>({
    queryKey: ["logos"],
    queryFn: async () => {
      const response = await fetch("/api/logos");
      if (!response.ok) {
        throw new Error("Failed to fetch logos");
      }
      return response.json();
    },
  });

  const onClose = () => {
    onChangeActiveTool("select");
  };

  const onSelectLogo = (src: string) => {
    editor?.addImage(src);
  };

  return (
    <aside
      className={cn(
        "bg-white relative border-r z-[40] w-[360px] h-full flex flex-col",
        activeTool === "logos" ? "visible" : "hidden"
      )}
    >
      <ToolSidebarHeader
        title="Logos"
        description="Add logos to your design"
      />
      {isLoading && (
        <div className="flex items-center justify-center flex-1">
          <Loader className="size-4 text-muted-foreground animate-spin" />
        </div>
      )}
      {isError && (
        <div className="flex flex-col gap-y-4 items-center justify-center flex-1">
          <AlertTriangle className="size-4 text-muted-foreground" />
          <p className="text-muted-foreground text-xs">Failed to fetch logos</p>
        </div>
      )}
      <ScrollArea>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4">
            {data?.logos &&
              data.logos.map((logo) => (
                <button
                  onClick={() => onSelectLogo(logo.src)}
                  key={logo.id}
                  className="relative w-full h-[100px] group hover:opacity-75 transition bg-muted rounded-sm overflow-hidden border"
                >
                  <Image
                    src={logo.src}
                    alt={logo.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 180px"
                    className="object-contain p-2"
                    loading="lazy"
                  />
                  <div className="opacity-0 group-hover:opacity-100 absolute left-0 bottom-0 w-full text-[10px] truncate text-white p-1 bg-black/50 text-left">
                    {logo.name}
                  </div>
                </button>
              ))}
          </div>
        </div>
      </ScrollArea>
      <ToolSidebarClose onClick={onClose} />
    </aside>
  );
};