import { useState, useEffect } from "react";
import { 
  ActiveTool, 
  Editor, 
} from "@/features/editor/types";
import { ToolSidebarClose } from "@/features/editor/components/tool-sidebar-close";
import { ToolSidebarHeader } from "@/features/editor/components/tool-sidebar-header";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { BrochiTextboxModal } from "@/features/editor/components/brochi-textbox-modal";

interface TextSidebarProps {
  editor: Editor | undefined;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
}

export const TextSidebar = ({
  editor,
  activeTool,
  onChangeActiveTool,
}: TextSidebarProps) => {
  const [isBrochiModalOpen, setIsBrochiModalOpen] = useState(false);
  const [hasBrochi, setHasBrochi] = useState(false);

  useEffect(() => {
    if (!editor?.canvas) return;

    const checkBrochi = () => {
      const exists = editor.canvas.getObjects().some((obj) => obj.name === "brochitextbox");
      setHasBrochi(exists);
    };

    checkBrochi();

    editor.canvas.on("object:added", checkBrochi);
    editor.canvas.on("object:removed", checkBrochi);

    return () => {
      editor.canvas?.off("object:added", checkBrochi);
      editor.canvas?.off("object:removed", checkBrochi);
    };
  }, [editor, editor?.canvas]);

  const onClose = () => {
    onChangeActiveTool("select");
  };

  return (
    <aside
      className={cn(
        "bg-white relative border-r z-[40] w-[360px] h-full flex flex-col",
        activeTool === "text" ? "visible" : "hidden",
      )}
    >
      <BrochiTextboxModal
        isOpen={isBrochiModalOpen}
        onClose={() => setIsBrochiModalOpen(false)}
        onApply={(text) => editor?.addBrochiTextBox(text)}
      />
      <ToolSidebarHeader
        title="Text"
        description="Add text to your canvas"
      />
      <ScrollArea>
        <div className="p-4 space-y-4 border-b">
          <Button
            className="w-full font-semibold"
            onClick={() => editor?.addText("Textbox")}
          >
            Add a textbox
          </Button>
          <Button
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed"
            onClick={() => setIsBrochiModalOpen(true)}
            disabled={hasBrochi}
          >
            Add a Placeholder Textbox (Brochi)
          </Button>
          {hasBrochi && (
            <p className="text-xs text-rose-500 font-semibold text-center mt-1">
              Only one Brochi TextBox is allowed per certificate.
            </p>
          )}
          <Button
            className="w-full h-16"
            variant="secondary"
            size="lg"
            onClick={() => editor?.addText("Heading", {
              fontSize: 80,
              fontWeight: 700,
            })}
          >
            <span className="text-3xl font-bold">
              Add a heading
            </span>
          </Button>
          <Button
            className="w-full h-16"
            variant="secondary"
            size="lg"
            onClick={() => editor?.addText("Subheading", {
              fontSize: 44,
              fontWeight: 600,
            })}
          >
            <span className="text-xl font-semibold">
              Add a subheading
            </span>
          </Button>
          <Button
            className="w-full h-16"
            variant="secondary"
            size="lg"
            onClick={() => editor?.addText("Paragraph", {
              fontSize: 32,
            })}
          >
            Paragraph
          </Button>
        </div>
      </ScrollArea>
      <ToolSidebarClose onClick={onClose} />
    </aside>
  );
};
