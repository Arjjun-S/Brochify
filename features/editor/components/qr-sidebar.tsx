import { useState } from "react";
import Image from "next/image";
import { Loader2, QrCode } from "lucide-react";

import { ActiveTool, Editor } from "@/features/editor/types";
import { ToolSidebarClose } from "@/features/editor/components/tool-sidebar-close";
import { ToolSidebarHeader } from "@/features/editor/components/tool-sidebar-header";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface QRSidebarProps {
  editor: Editor | undefined;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
}

export const QRSidebar = ({ editor, activeTool, onChangeActiveTool }: QRSidebarProps) => {
  const [url, setUrl] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const onClose = () => onChangeActiveTool("select");

  const buildQRUrl = (value: string) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=512x512&margin=16&data=${encodeURIComponent(value)}`;

  const onGenerate = () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setQrUrl("");
      return;
    }

    setIsGenerating(true);
    setQrUrl(buildQRUrl(trimmedUrl));
  };

  const onAddQR = () => {
    const generatedUrl = qrUrl || (url.trim() ? buildQRUrl(url.trim()) : "");
    if (!generatedUrl) {
      return;
    }

    editor?.addImage(generatedUrl);
  };

  return (
    <aside className={cn(
      "bg-white relative border-r z-[40] w-[360px] h-full flex flex-col",
      activeTool === "qr" ? "visible" : "hidden",
    )}>
      <ToolSidebarHeader title="QR Code" description="Add a QR code to your design" />
      <ScrollArea>
        <div className="p-4 space-y-4">
          <Input
            placeholder="Enter URL here"
            value={url}
            onChange={(event) => {
              setUrl(event.target.value);
              setQrUrl("");
            }}
          />
          <Button onClick={onGenerate} className="w-full" disabled={!url.trim() || isGenerating}>
            {isGenerating ? <Loader2 className="mr-2 size-4 animate-spin" /> : <QrCode className="mr-2 size-4" />}
            Generate
          </Button>

          {qrUrl ? (
            <div className="rounded-md border bg-muted/40 p-4">
              <div className="relative mx-auto aspect-square w-40 overflow-hidden rounded-sm bg-white">
                <Image
                  src={qrUrl}
                  alt="Generated QR code preview"
                  fill
                  sizes="160px"
                  className="object-contain"
                  unoptimized
                  onLoad={() => setIsGenerating(false)}
                  onError={() => setIsGenerating(false)}
                />
              </div>
            </div>
          ) : null}

          <Button onClick={onAddQR} variant="secondary" className="w-full" disabled={!qrUrl && !url.trim()}>
            Add To Canvas
          </Button>
        </div>
      </ScrollArea>
      <ToolSidebarClose onClick={onClose} />
    </aside>
  );
};
