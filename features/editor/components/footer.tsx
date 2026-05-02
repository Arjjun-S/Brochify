import { useState } from "react";
import { ChevronLeft, ChevronRight, Minimize, Plus, ZoomIn, ZoomOut } from "lucide-react";

import { Editor } from "@/features/editor/types";

import { Hint } from "@/components/hint";
import { Button } from "@/components/ui/button";

interface FooterProps {
  editor: Editor | undefined;
};

export const Footer = ({ editor }: FooterProps) => {
  const [, forceRefresh] = useState(0);

  const refreshPages = () => {
    forceRefresh((value) => value + 1);
  };

  const pageCount = editor?.getPageCount?.() ?? 1;
  const activePage = editor?.getActivePage?.() ?? 1;
  const canGoToPrevious = activePage > 1;
  const canGoToNext = activePage < pageCount;

  return (
    <footer className="h-[52px] border-t bg-white w-full flex items-center overflow-x-auto z-[49] p-2 gap-x-1 shrink-0 px-4 flex-row-reverse">
      <div className="mr-auto flex items-center gap-x-1">
        <Hint label="Previous page" side="top" sideOffset={10}>
          <Button
            onClick={() => {
              if (!editor || !canGoToPrevious) return;
              editor.goToPage(activePage - 1);
              refreshPages();
            }}
            size="icon"
            variant="ghost"
            className="h-full"
            disabled={!canGoToPrevious}
          >
            <ChevronLeft className="size-4" />
          </Button>
        </Hint>
        <div className="min-w-[84px] text-center text-xs font-semibold text-slate-600">
          Page {activePage} / {pageCount}
        </div>
        <Hint label="Next page" side="top" sideOffset={10}>
          <Button
            onClick={() => {
              if (!editor || !canGoToNext) return;
              editor.goToPage(activePage + 1);
              refreshPages();
            }}
            size="icon"
            variant="ghost"
            className="h-full"
            disabled={!canGoToNext}
          >
            <ChevronRight className="size-4" />
          </Button>
        </Hint>
        <Hint label="Add page" side="top" sideOffset={10}>
          <Button
            onClick={() => {
              editor?.addPage();
              refreshPages();
            }}
            size="icon"
            variant="ghost"
            className="h-full"
          >
            <Plus className="size-4" />
          </Button>
        </Hint>
      </div>
      <Hint label="Reset" side="top" sideOffset={10}>
        <Button
          onClick={() => {
            editor?.autoZoom();
            refreshPages();
          }}
          size="icon"
          variant="ghost"
          className="h-full"
        >
          <Minimize className="size-4" />
        </Button>
      </Hint>
      <Hint label="Zoom in" side="top" sideOffset={10}>
        <Button
          onClick={() => editor?.zoomIn()}
          size="icon"
          variant="ghost"
          className="h-full"
        >
          <ZoomIn className="size-4" />
        </Button>
      </Hint>
      <Hint label="Zoom out" side="top" sideOffset={10}>
        <Button
          onClick={() => editor?.zoomOut()}
          size="icon"
          variant="ghost"
          className="h-full"
        >
          <ZoomOut className="size-4" />
        </Button>
      </Hint>
    </footer>
  );
};
