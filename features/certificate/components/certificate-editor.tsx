"use client";

import { fabric } from "fabric";
import { useCallback, useEffect, useRef, useState } from "react";
import debounce from "lodash.debounce";
import { useUpdateCertificate } from "@/features/certificate/api/use-update-certificate";

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
import { CertificateTemplateSidebar } from "@/features/editor/components/certificate-template-sidebar";
import { ElementsSidebar } from "@/features/editor/components/elements-sidebar";
import { LogoSidebar } from "@/features/editor/components/logo-sidebar";
import { SignatureSidebar } from "@/features/editor/components/signature-sidebar";
import { RemoveBgSidebar } from "@/features/editor/components/remove-bg-sidebar";
import { SettingsSidebar } from "@/features/editor/components/settings-sidebar";
import { refreshFabricTextEditingAnchor } from "@/features/editor/utils";
import { JSON_KEYS } from "@/features/editor/types";
import { CERTIFICATE_PAGE_HEIGHT, CERTIFICATE_PAGE_WIDTH, applyCertificatePlaceholders } from "@/lib/domains/certificate";
import { BrochiTextboxModal } from "@/features/editor/components/brochi-textbox-modal";

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
      customSignatures?: Array<{ name: string; designation: string; src: string }>;
    };
    status: string;
  };
}

export const CertificateEditor = ({ initialData }: CertificateEditorProps) => {
  const [activeTool, setActiveTool] = useState<ActiveTool>("select");
  const [customSignatures, setCustomSignatures] = useState<Array<{ name: string; designation: string; src: string }>>(
    initialData.content.customSignatures || []
  );
  const customSignaturesRef = useRef(customSignatures);
  customSignaturesRef.current = customSignatures;

  const [editingBrochiObject, setEditingBrochiObject] = useState<fabric.Textbox | null>(null);

  const onClearSelection = useCallback(() => {
    if (selectionDependentTools.includes(activeTool)) {
      setActiveTool("select");
    }
  }, [activeTool]);

  const { mutate } = useUpdateCertificate(initialData.id);

  const debouncedSave = useCallback(
    debounce(
      (values: {
        json: string;
        height: number;
        width: number;
      }) => {
        // We need to merge the new fabric JSON with the existing CertificateEditorState structure
        const parsed = JSON.parse(values.json);
        const backgroundImage = parsed.backgroundImage?.src || "";
        
        const templateMatch = backgroundImage.match(/template\d+/);
        const template = templateMatch ? templateMatch[0] : (initialData.content.template || "template1");
        
        mutate({
          content: {
            ...initialData.content,
            overlayItems: parsed.objects || [],
            background: {
              ...initialData.content.background,
              backgroundImage,
            },
            template,
            customSignatures: customSignaturesRef.current,
          },
        });
      },
      500
    ),
    [mutate, initialData.content]
  );

  const defaultBg = "https://res.cloudinary.com/duftjklnm/image/upload/v1777743759/brochify/certificate/template1.png";
  const bgImage = initialData.content.background?.backgroundImage || defaultBg;
  const bgImageWithCache = bgImage.split("?")[0] + "?c_cache=1";

  const defaultJson = JSON.stringify({
    version: "5.3.0",
    objects: initialData.content.overlayItems || [],
    backgroundImage: {
      type: "image",
      src: bgImageWithCache,
      originX: "left",
      originY: "top",
      crossOrigin: "anonymous",
    },
  });

  const isApproved = initialData.status === "approved";

  const { init, editor } = useEditor({
    defaultState: defaultJson,
    defaultWidth: CERTIFICATE_PAGE_WIDTH,
    defaultHeight: CERTIFICATE_PAGE_HEIGHT,
    clearSelectionCallback: onClearSelection,
    saveCallback: debouncedSave,
    isApproved,
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

  useEffect(() => {
    const canvas = editor?.canvas;
    if (!canvas) return;

    const handleDblClick = (e: fabric.IEvent) => {
      const target = e.target;
      if (target && target.name === "brochitextbox" && target.type === "textbox") {
        (target as fabric.Textbox).exitEditing();
        setEditingBrochiObject(target as fabric.Textbox);
      }
    };

    canvas.on("mouse:dblclick", handleDblClick);

    return () => {
      canvas.off("mouse:dblclick", handleDblClick);
    };
  }, [editor?.canvas]);

  return (
    <div className="h-full flex flex-col">
      <Navbar
        id={String(initialData.id)}
        editor={editor}
        activeTool={activeTool}
        onChangeActiveTool={onChangeActiveTool}
        editorType="certificate"
        certificateContent={initialData.content}
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
         <CertificateTemplateSidebar
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
        <SignatureSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
          customSignatures={customSignatures}
          onAddCustomSignature={(sig) => {
            const nextSigs = [...customSignatures, sig];
            setCustomSignatures(nextSigs);
            if (editor) {
              mutate({
                content: {
                  ...initialData.content,
                  overlayItems: editor.canvas.getObjects().map(o => o.toJSON(JSON_KEYS)),
                  background: {
                    ...initialData.content.background,
                    backgroundImage: editor.canvas.backgroundImage ? (editor.canvas.backgroundImage as any).src : "",
                  },
                  template: initialData.content.template || "template1",
                  customSignatures: nextSigs,
                }
              });
            }
          }}
          onDeleteCustomSignature={(index) => {
            const nextSigs = customSignatures.filter((_, i) => i !== index);
            setCustomSignatures(nextSigs);
            if (editor) {
              mutate({
                content: {
                  ...initialData.content,
                  overlayItems: editor.canvas.getObjects().map(o => o.toJSON(JSON_KEYS)),
                  background: {
                    ...initialData.content.background,
                    backgroundImage: editor.canvas.backgroundImage ? (editor.canvas.backgroundImage as any).src : "",
                  },
                  template: initialData.content.template || "template1",
                  customSignatures: nextSigs,
                }
              });
            }
          }}
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
      <BrochiTextboxModal
        isOpen={!!editingBrochiObject}
        onClose={() => setEditingBrochiObject(null)}
        initialText={editingBrochiObject?.originalText || ""}
        onApply={(text) => {
          if (editingBrochiObject && editor) {
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
            const previewText = applyCertificatePlaceholders(text, mockStudent);

            editingBrochiObject.set({
              originalText: text,
              text: previewText
            });
            editor.canvas.renderAll();
            (editor as any).save();
          }
          setEditingBrochiObject(null);
        }}
      />
    </div>
  );
};
