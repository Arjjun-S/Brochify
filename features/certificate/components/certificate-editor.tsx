"use client";

import { fabric } from "fabric";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  ActiveTool,
  selectionDependentTools,
} from "@/features/editor/types";
import { Navbar } from "@/features/editor/components/navbar";
import { Footer } from "@/features/editor/components/footer";
import { useEditor } from "@/features/editor/hooks/use-editor";
import { Sidebar } from "@/features/editor/components/sidebar";
import { Toolbar } from "@/features/editor/components/toolbar";
import { ShapeSidebar } from "@/features/editor/components/shape-sidebar";
import { FillColorSidebar } from "@/features/editor/components/fill-color-sidebar";
import { StrokeColorSidebar } from "@/features/editor/components/stroke-color-sidebar";
import { StrokeWidthSidebar } from "@/features/editor/components/stroke-width-sidebar";
import { OpacitySidebar } from "@/features/editor/components/opacity-sidebar";
import { TextSidebar } from "@/features/editor/components/text-sidebar";
import { FontSidebar } from "@/features/editor/components/font-sidebar";
import { ImageSidebar } from "@/features/editor/components/image-sidebar";
import { FilterSidebar } from "@/features/editor/components/filter-sidebar";
import { DrawSidebar } from "@/features/editor/components/draw-sidebar";
import { AiSidebar } from "@/features/editor/components/ai-sidebar";
import { TemplateSidebar } from "@/features/editor/components/template-sidebar";
import { ElementsSidebar } from "@/features/editor/components/elements-sidebar";
import { LogoSidebar } from "@/features/editor/components/logo-sidebar";
import { CertificateTemplateSidebar } from "@/features/editor/components/certificate-template-sidebar";
import { RemoveBgSidebar } from "@/features/editor/components/remove-bg-sidebar";
import { SettingsSidebar } from "@/features/editor/components/settings-sidebar";
import { refreshFabricTextEditingAnchor } from "@/features/editor/utils";
import { CERTIFICATE_PAGE_HEIGHT, CERTIFICATE_PAGE_WIDTH } from "@/lib/domains/certificate";

interface CertificateEditorProps {
  initialData: {
    id: number;
    content: {
      overlayItems: unknown[];
      templateInput: unknown;
      template: string;
      background: {
        borderColor: string;
        backgroundImage: string;
      };
    };
    status: string;
  };
}

export const CertificateEditor = ({ initialData }: CertificateEditorProps) => {
  const [activeTool, setActiveTool] = useState<ActiveTool>("select");

  const onClearSelection = useCallback(() => {
    if (selectionDependentTools.includes(activeTool)) {
      setActiveTool("select");
    }
  }, [activeTool]);

  const defaultJson = JSON.stringify({
    version: "5.3.0",
    objects: initialData.content.overlayItems || [],
  });

  const { init, editor } = useEditor({
    defaultState: defaultJson,
    defaultWidth: CERTIFICATE_PAGE_WIDTH,
    defaultHeight: CERTIFICATE_PAGE_HEIGHT,
    clearSelectionCallback: onClearSelection,
    saveCallback: () => {},
  });

  const onChangeActiveTool = useCallback((tool: ActiveTool) => {
    if (tool === "draw") {
      editor?.enableDrawingMode();
    }

    if (activeTool === "draw") {
      editor?.disableDrawingMode();
    }

    if (tool === activeTool) {
      return setActiveTool("select");
    }

    setActiveTool(tool);
  }, [activeTool, editor]);

  const canvasRef = useRef(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mainScrollRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const canvas = new fabric.Canvas(canvasRef.current, {
      controlsAboveOverlay: true,
      preserveObjectStacking: true,
    });

    init({
      initialCanvas: canvas,
      initialContainer: containerRef.current!,
    });

    return () => {
      canvas.dispose();
    };
  }, [init]);

  useEffect(() => {
    const canvas = editor?.canvas;
    const mainEl = mainScrollRef.current;
    if (!canvas || !mainEl) {
      return;
    }

    const sync = () => {
      refreshFabricTextEditingAnchor(canvas);
    };

    mainEl.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);

    return () => {
      mainEl.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [editor]);

  return (
    <div className="h-full flex flex-col">
      <Navbar
        id={String(initialData.id)}
        editor={editor}
        activeTool={activeTool}
        onChangeActiveTool={onChangeActiveTool}
      />
      <div className="absolute h-[calc(100%-68px)] w-full top-[68px] flex">
        <Sidebar
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
          editorType="certificate"
        />
        <ShapeSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <FillColorSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <StrokeColorSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <StrokeWidthSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <OpacitySidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <TextSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <FontSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <ImageSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <TemplateSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <FilterSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <AiSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <CertificateTemplateSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <ElementsSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <LogoSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <RemoveBgSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <DrawSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <SettingsSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <main
          ref={mainScrollRef}
          className="bg-muted flex-1 min-h-0 overflow-auto relative flex flex-col"
        >
          <Toolbar
            editor={editor}
            activeTool={activeTool}
            onChangeActiveTool={onChangeActiveTool}
          />
          <div className="flex-1 min-h-0 h-[calc(100%-124px)] bg-muted relative flex items-center justify-center" ref={containerRef}>
            <canvas ref={canvasRef} className="block" />
          </div>
          <Footer editor={editor} />
        </main>
      </div>
    </div>
  );
};
