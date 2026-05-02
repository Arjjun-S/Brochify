import { useMemo } from "react";

import {
  ActiveTool,
  Editor,
} from "@/features/editor/types";
import { ToolSidebarClose } from "@/features/editor/components/tool-sidebar-close";
import { ToolSidebarHeader } from "@/features/editor/components/tool-sidebar-header";

import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";

interface OpacitySidebarProps {
  editor: Editor | undefined;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
};

export const OpacitySidebar = ({
  editor,
  activeTool,
  onChangeActiveTool,
}: OpacitySidebarProps) => {
  const selectedObject = useMemo(() => editor?.selectedObjects?.[0], [editor?.selectedObjects]);
  const selectedOpacity =
    typeof selectedObject?.get("opacity") === "number"
      ? (selectedObject.get("opacity") as number)
      : 1;
  const sliderKey = selectedObject
    ? `${selectedObject.type}-${selectedObject.left ?? 0}-${selectedObject.top ?? 0}-${selectedOpacity}`
    : "none";

  const onClose = () => {
    onChangeActiveTool("select");
  };

  const onChange = (value: number) => {
    editor?.changeOpacity(value);
  };

  return (
    <aside
      className={cn(
        "bg-white relative border-r z-[40] w-[360px] h-full flex flex-col",
        activeTool === "opacity" ? "visible" : "hidden",
      )}
    >
      <ToolSidebarHeader
        title="Opacity"
        description="Change the opacity of the selected object"
      />
      <ScrollArea>
        <div className="p-4 space-y-4 border-b">
          <Slider
            key={sliderKey}
            defaultValue={[selectedOpacity]}
            onValueChange={(values) => {
              const nextOpacity = values?.[0];
              if (typeof nextOpacity !== "number") {
                return;
              }
              onChange(nextOpacity);
            }}
            max={1}
            min={0}
            step={0.01}
          />
        </div>
      </ScrollArea>
      <ToolSidebarClose onClick={onClose} />
    </aside>
  );
};
