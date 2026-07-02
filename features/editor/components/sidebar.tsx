"use client";

import {
  QrCode,
  LayoutTemplate,
  ImageIcon,
  Pencil,
  Settings,
  Shapes,
  Sparkles,
  Type,
  BadgeIcon,
  FileText,
  Vote,
  PenTool,
} from "lucide-react";

import { ActiveTool } from "@/features/editor/types";
import { SidebarItem } from "@/features/editor/components/sidebar-item";

type EditorType = "brochure" | "certificate";

interface SidebarProps {
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
  editorType?: EditorType;
};

export const Sidebar = ({
  activeTool,
  onChangeActiveTool,
  editorType = "brochure",
}: SidebarProps) => {
  return (
    <aside className="bg-white flex flex-col w-[100px] h-full border-r overflow-y-auto">
      <ul className="flex flex-col">
        {editorType !== "certificate" && (
          <SidebarItem
            icon={LayoutTemplate}
            label="Design"
            isActive={activeTool === "templates"}
            onClick={() => onChangeActiveTool("templates")}
          />
        )}
        {editorType === "certificate" && (
          <SidebarItem
            icon={FileText}
            label="Templates"
            isActive={activeTool === "certificate-templates"}
            onClick={() => onChangeActiveTool("certificate-templates")}
          />
        )}
        {editorType === "certificate" && (
          <SidebarItem
            icon={PenTool}
            label="Signature"
            isActive={activeTool === "signatures"}
            onClick={() => onChangeActiveTool("signatures")}
          />
        )}
        <SidebarItem
          icon={Vote}
          label="Logos"
          isActive={activeTool === "logos"}
          onClick={() => onChangeActiveTool("logos")}
        />
        <SidebarItem
          icon={ImageIcon}
          label="Image"
          isActive={activeTool === "images"}
          onClick={() => onChangeActiveTool("images")}
        />
        {editorType === "certificate" && (
          <SidebarItem
            icon={BadgeIcon}
            label="Elements"
            isActive={activeTool === "elements"}
            onClick={() => onChangeActiveTool("elements")}
          />
        )}
        <SidebarItem
          icon={Type}
          label="Text"
          isActive={activeTool === "text"}
          onClick={() => onChangeActiveTool("text")}
        />
        {editorType !== "certificate" && (
          <SidebarItem
            icon={Shapes}
            label="Shapes"
            isActive={activeTool === "shapes"}
            onClick={() => onChangeActiveTool("shapes")}
          />
        )}
        <SidebarItem
          icon={Pencil}
          label="Draw"
          isActive={activeTool === "draw"}
          onClick={() => onChangeActiveTool("draw")}
        />
        
        {editorType !== "certificate" && (
          <SidebarItem
            icon={QrCode}
            label="QR Code"
            isActive={activeTool === "qr"}
            onClick={() => onChangeActiveTool("qr")}
          />
        )}
        <SidebarItem
          icon={Sparkles}
          label="AI"
          isActive={activeTool === "ai"}
          onClick={() => onChangeActiveTool("ai")}
        />
        <SidebarItem
          icon={Settings}
          label="Settings"
          isActive={activeTool === "settings"}
          onClick={() => onChangeActiveTool("settings")}
        />
      </ul>
    </aside>
  );
};
