import Image from "next/image";
import { AlertTriangle, Loader, Crown, Sparkles } from "lucide-react";

import {
  ActiveTool,
  Editor,
  type BrochureType,
} from "@/features/editor/types";
import { ToolSidebarClose } from "@/features/editor/components/tool-sidebar-close";
import { ToolSidebarHeader } from "@/features/editor/components/tool-sidebar-header";
import { getBuiltInTemplates, type BuiltInTemplate } from "@/features/editor/built-in-templates";

import { ResponseType, useGetTemplates } from "@/features/projects/api/use-get-templates";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useConfirm } from "@/hooks/use-confirm";
import { useMemo } from "react";

interface TemplateSidebarProps {
  editor: Editor | undefined;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
  brochureType?: BrochureType;
}

function matchesType(
  template: { width: number; height: number },
  type: BrochureType | undefined,
): boolean {
  if (!type) return true;
  if (type === "trifold") return template.width > template.height;
  return template.height >= template.width;
}

export const TemplateSidebar = ({
  editor,
  activeTool,
  onChangeActiveTool,
  brochureType,
}: TemplateSidebarProps) => {
  const [ConfirmDialog, confirm] = useConfirm(
    "Are you sure?",
    "You are about to replace the current project with this template."
  );

  const { data, isLoading, isError } = useGetTemplates({
    limit: "20",
    page: "1",
  });

  const filteredDbTemplates = useMemo(() => {
    if (!data?.data) return [];
    return data.data.filter((t) => matchesType(t, brochureType));
  }, [data, brochureType]);

  const builtInTemplates = useMemo(
    () => getBuiltInTemplates(brochureType),
    [brochureType],
  );

  const onClose = () => {
    onChangeActiveTool("select");
  };

  const onClickDb = async (template: ResponseType["data"][0]) => {
    const ok = await confirm();
    if (ok) {
      editor?.loadJson(template.json);
    }
  };

  const onClickBuiltIn = async (template: BuiltInTemplate) => {
    const ok = await confirm();
    if (ok) {
      editor?.loadJson(template.json);
    }
  };

  const typeLabel = brochureType === "trifold"
    ? "Trifold Brochure"
    : brochureType === "poster"
      ? "Poster / Flyer"
      : "All";

  return (
    <aside
      className={cn(
        "bg-white relative border-r z-[40] w-[360px] h-full flex flex-col",
        activeTool === "templates" ? "visible" : "hidden",
      )}
    >
      <ConfirmDialog />
      <ToolSidebarHeader
        title="Templates"
        description={`Pick a template for your ${typeLabel} design`}
      />
      <ScrollArea>
        {/* Built-in starter templates */}
        {builtInTemplates.length > 0 && (
          <div className="p-4 pb-2">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="size-4 text-violet-500" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Starter Templates
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {builtInTemplates.map((template) => (
                <button
                  key={template.id}
                  style={{ aspectRatio: `${template.width}/${template.height}` }}
                  onClick={() => void onClickBuiltIn(template)}
                  className="relative w-full group hover:opacity-75 transition rounded-lg overflow-hidden border"
                >
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ backgroundColor: template.thumbnailColor }}
                  >
                    <span className="text-white text-[10px] font-bold px-2 text-center leading-tight">
                      {template.name}
                    </span>
                  </div>
                  <div
                    className="opacity-0 group-hover:opacity-100 absolute left-0 bottom-0 w-full text-[10px] truncate text-white p-1 bg-black/50 text-left"
                  >
                    {template.name}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Database templates */}
        <div className="p-4 pt-2">
          {filteredDbTemplates.length > 0 && (
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Saved Templates
            </p>
          )}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader className="size-4 text-muted-foreground animate-spin" />
            </div>
          )}
          {isError && (
            <div className="flex flex-col gap-y-4 items-center justify-center py-8">
              <AlertTriangle className="size-4 text-muted-foreground" />
              <p className="text-muted-foreground text-xs">
                Failed to fetch templates
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            {filteredDbTemplates.map((template) => (
              <button
                style={{ aspectRatio: `${template.width}/${template.height}` }}
                onClick={() => void onClickDb(template)}
                key={template.id}
                className="relative w-full group hover:opacity-75 transition bg-muted rounded-lg overflow-hidden border"
              >
                <Image
                  fill
                  src={template.thumbnailUrl || ""}
                  alt={template.name || "Template"}
                  className="object-cover"
                />
                {template.isPro && (
                  <div className="absolute top-2 right-2 size-8 items-center flex justify-center bg-black/50 rounded-full">
                    <Crown className="size-4 fill-yellow-500 text-yellow-500" />
                  </div>
                )}
                <div
                  className="opacity-0 group-hover:opacity-100 absolute left-0 bottom-0 w-full text-[10px] truncate text-white p-1 bg-black/50 text-left"
                >
                  {template.name}
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
