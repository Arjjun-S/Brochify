"use client";

import { CiFileOn } from "react-icons/ci";
import { BsCloudCheck, BsCloudSlash } from "react-icons/bs";
import { useFilePicker } from "use-file-picker";
import { useMutationState } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  Download,
  Loader,
  MousePointerClick,
  Redo2,
  Undo2
} from "lucide-react";

import { ActiveTool, Editor } from "@/features/editor/types";
import { Logo } from "@/features/editor/components/logo";

import { cn } from "@/lib/utils";
import { Hint } from "@/components/hint";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarProps {
  id: string;
  editor: Editor | undefined;
  brochureId?: number;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
}

type ReviewStatus = "draft" | "pending" | "approved" | "rejected";

type WorkflowState = {
  status: ReviewStatus;
  rejectionReason: string | null;
  template: string;
};

const workflowStatusClassMap: Record<ReviewStatus, string> = {
  draft: "border-slate-300 bg-slate-100 text-slate-700",
  pending: "border-amber-300 bg-amber-100 text-amber-700",
  approved: "border-emerald-300 bg-emerald-100 text-emerald-700",
  rejected: "border-rose-300 bg-rose-100 text-rose-700",
};

export const Navbar = ({
  id,
  editor,
  brochureId,
  activeTool,
  onChangeActiveTool,
}: NavbarProps) => {
  const data = useMutationState({
    filters: {
      mutationKey: ["project", { id }],
      exact: true,
    },
    select: (mutation) => mutation.state.status,
  });

  const currentStatus = data[data.length - 1];

  const isError = currentStatus === "error";
  const isPending = currentStatus === "pending";

  const [sessionRole, setSessionRole] = useState<"admin" | "faculty" | null>(null);
  const [workflow, setWorkflow] = useState<WorkflowState | null>(null);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [workflowBusy, setWorkflowBusy] = useState<"submit" | "approve" | "reject" | "export" | null>(null);
  const [workflowError, setWorkflowError] = useState<string | null>(null);

  const canShowWorkflow = Number.isFinite(brochureId);

  const watermarkText = useMemo(() => {
    if (!canShowWorkflow) {
      return null;
    }
    return workflow?.status === "approved" ? null : "Made with Brochify - Not Approved";
  }, [canShowWorkflow, workflow?.status]);

  useEffect(() => {
    if (!canShowWorkflow || !brochureId) {
      setWorkflow(null);
      setWorkflowError(null);
      return;
    }

    let active = true;

    const loadWorkflowContext = async () => {
      setWorkflowLoading(true);
      setWorkflowError(null);

      try {
        const [sessionResponse, brochureResponse] = await Promise.all([
          fetch("/api/auth/session", { cache: "no-store" }),
          fetch(`/api/brochure/${brochureId}`, { cache: "no-store" }),
        ]);

        const sessionPayload = (await sessionResponse.json()) as {
          user?: { role?: "admin" | "faculty" };
          error?: string;
        };
        const brochurePayload = (await brochureResponse.json()) as {
          brochure?: {
            status?: ReviewStatus;
            rejectionReason?: string | null;
            content?: { template?: string };
          };
          error?: string;
        };

        if (!sessionResponse.ok) {
          throw new Error(sessionPayload.error || "Failed to load session.");
        }
        if (!brochureResponse.ok || !brochurePayload.brochure?.status) {
          throw new Error(brochurePayload.error || "Failed to load brochure workflow.");
        }

        if (!active) {
          return;
        }

        setSessionRole(sessionPayload.user?.role || null);
        setWorkflow({
          status: brochurePayload.brochure.status,
          rejectionReason: brochurePayload.brochure.rejectionReason ?? null,
          template: brochurePayload.brochure.content?.template || "",
        });
      } catch (error) {
        if (!active) {
          return;
        }
        const message = error instanceof Error ? error.message : "Failed to load workflow context.";
        setWorkflowError(message);
      } finally {
        if (active) {
          setWorkflowLoading(false);
        }
      }
    };

    void loadWorkflowContext();

    return () => {
      active = false;
    };
  }, [brochureId, canShowWorkflow]);

  const runWorkflowAction = async (
    kind: "submit" | "approve" | "reject",
    endpoint: string,
    body: Record<string, unknown>,
  ) => {
    if (!brochureId) {
      return;
    }

    setWorkflowBusy(kind);
    setWorkflowError(null);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const payload = (await response.json()) as {
        brochure?: {
          status?: ReviewStatus;
          rejectionReason?: string | null;
          content?: { template?: string };
        };
        error?: string;
      };

      if (!response.ok || !payload.brochure?.status) {
        throw new Error(payload.error || "Workflow action failed.");
      }

      setWorkflow((current) => ({
        status: payload.brochure?.status || current?.status || "draft",
        rejectionReason: payload.brochure?.rejectionReason ?? null,
        template: payload.brochure?.content?.template || current?.template || "",
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Workflow action failed.";
      setWorkflowError(message);
    } finally {
      setWorkflowBusy(null);
    }
  };

  const handleSubmitForReview = () => {
    if (!brochureId) {
      return;
    }
    void runWorkflowAction("submit", `/api/brochure/${brochureId}/submit`, {});
  };

  const handleApprove = () => {
    if (!brochureId) {
      return;
    }
    void runWorkflowAction("approve", `/api/brochure/${brochureId}/approve`, {});
  };

  const handleReject = () => {
    if (!brochureId) {
      return;
    }

    const reason = window.prompt("Enter rejection reason")?.trim() || "";
    if (!reason) {
      setWorkflowError("Rejection reason is required.");
      return;
    }

    void runWorkflowAction("reject", `/api/brochure/${brochureId}/reject`, {
      rejectionReason: reason,
    });
  };

  const handlePdfExport = async () => {
    if (!editor) {
      return;
    }

    setWorkflowBusy("export");
    setWorkflowError(null);

    try {
      await editor.savePdf({
        watermarkText,
        template: workflow?.template || "",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to export PDF.";
      setWorkflowError(message);
    } finally {
      setWorkflowBusy(null);
    }
  };

  const canSubmitForReview =
    sessionRole === "faculty" &&
    (workflow?.status === "draft" || workflow?.status === "rejected");

  const canApproveOrReject =
    sessionRole === "admin" &&
    workflow?.status !== "approved";

  const { openFilePicker } = useFilePicker({
    accept: ".json",
    onFilesSuccessfullySelected: ({ plainFiles }: { plainFiles: File[] }) => {
      if (plainFiles && plainFiles.length > 0) {
        const file = plainFiles[0];
        const reader = new FileReader();
        reader.readAsText(file, "UTF-8");
        reader.onload = () => {
          editor?.loadJson(reader.result as string);
        };
      }
    },
  });

  return (
    <nav className="w-full flex items-center p-4 h-[68px] gap-x-8 border-b lg:pl-[34px]">
      <Logo />
      <div className="w-full flex items-center gap-x-1 h-full">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost">
              File
              <ChevronDown className="size-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-60">
            <DropdownMenuItem
              onClick={() => openFilePicker()}
              className="flex items-center gap-x-2"
            >
              <CiFileOn className="size-8" />
              <div>
                <p>Open</p>
                <p className="text-xs text-muted-foreground">
                  Open a JSON file
                </p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Separator orientation="vertical" className="mx-2" />
        <Hint label="Select" side="bottom" sideOffset={10}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onChangeActiveTool("select")}
            className={cn(activeTool === "select" && "bg-gray-100")}
          >
            <MousePointerClick className="size-4" />
          </Button>
        </Hint>
        <Hint label="Undo" side="bottom" sideOffset={10}>
          <Button
            disabled={!editor?.canUndo()}
            variant="ghost"
            size="icon"
            onClick={() => editor?.onUndo()}
          >
            <Undo2 className="size-4" />
          </Button>
        </Hint>
        <Hint label="Redo" side="bottom" sideOffset={10}>
          <Button
            disabled={!editor?.canRedo()}
            variant="ghost"
            size="icon"
            onClick={() => editor?.onRedo()}
          >
            <Redo2 className="size-4" />
          </Button>
        </Hint>
        <Separator orientation="vertical" className="mx-2" />
        {isPending && (
          <div className="flex items-center gap-x-2">
            <Loader className="size-4 animate-spin text-muted-foreground" />
            <div className="text-xs text-muted-foreground">
              Saving...
            </div>
          </div>
        )}
        {!isPending && isError && (
          <div className="flex items-center gap-x-2">
            <BsCloudSlash className="size-[20px] text-muted-foreground" />
            <div className="text-xs text-muted-foreground">
              Failed to save
            </div>
          </div>
        )}
        {!isPending && !isError && (
          <div className="flex items-center gap-x-2">
            <BsCloudCheck className="size-[20px] text-muted-foreground" />
            <div className="text-xs text-muted-foreground">
              Saved
            </div>
          </div>
        )}

        {canShowWorkflow && workflow && (
          <div className="ml-3 flex items-center gap-x-2">
            <span
              className={cn(
                "rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]",
                workflowStatusClassMap[workflow.status],
              )}
            >
              {workflow.status}
            </span>

            {canSubmitForReview && (
              <Button
                size="sm"
                variant="outline"
                disabled={workflowBusy !== null}
                onClick={handleSubmitForReview}
              >
                {workflowBusy === "submit" ? "Submitting..." : "Submit to Admin"}
              </Button>
            )}

            {canApproveOrReject && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={workflowBusy !== null}
                  onClick={handleApprove}
                >
                  {workflowBusy === "approve" ? "Approving..." : "Approve"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={workflowBusy !== null}
                  onClick={handleReject}
                >
                  {workflowBusy === "reject" ? "Rejecting..." : "Reject"}
                </Button>
              </>
            )}
          </div>
        )}

        {canShowWorkflow && workflowLoading && (
          <div className="ml-3 flex items-center gap-x-2 text-xs text-muted-foreground">
            <Loader className="size-3 animate-spin" />
            Loading workflow...
          </div>
        )}

        {workflowError && (
          <div className="ml-3 max-w-[360px] truncate text-xs text-rose-600" title={workflowError}>
            {workflowError}
          </div>
        )}

        <div className="ml-auto flex items-center gap-x-4">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost">
                Export
                <Download className="size-4 ml-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-60">
              <DropdownMenuItem
                className="flex items-center gap-x-2"
                onClick={() => editor?.saveJson()}
              >
                <CiFileOn className="size-8" />
                <div>
                  <p>JSON</p>
                  <p className="text-xs text-muted-foreground">
                    Save for later editing
                  </p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-x-2"
                onClick={() => {
                  void handlePdfExport();
                }}
              >
                <CiFileOn className="size-8" />
                <div>
                  <p>PDF</p>
                  <p className="text-xs text-muted-foreground">
                    {workflow?.status === "approved"
                      ? "Approved export (no watermark)"
                      : "Exports with review watermark"}
                  </p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-x-2"
                onClick={() => editor?.savePng()}
              >
                <CiFileOn className="size-8" />
                <div>
                  <p>PNG</p>
                  <p className="text-xs text-muted-foreground">
                    Best for sharing on the web
                  </p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-x-2"
                onClick={() => editor?.saveJpg()}
              >
                <CiFileOn className="size-8" />
                <div>
                  <p>JPG</p>
                  <p className="text-xs text-muted-foreground">
                    Best for printing
                  </p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-x-2"
                onClick={() => editor?.saveSvg()}
              >
                <CiFileOn className="size-8" />
                <div>
                  <p>SVG</p>
                  <p className="text-xs text-muted-foreground">
                    Best for editing in vector software
                  </p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};
