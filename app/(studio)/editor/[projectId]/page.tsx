"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useParams, useSearchParams } from "next/navigation";
import { Loader, TriangleAlert } from "lucide-react";

import { useGetProject } from "@/features/projects/api/use-get-project";
import type { BrochureType } from "@/features/editor/types";

import { Button } from "@/components/ui/button";

const Editor = dynamic(
  () => import("@/features/editor/components/editor").then((mod) => mod.Editor),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex flex-col items-center justify-center">
        <Loader className="size-6 animate-spin text-muted-foreground" />
      </div>
    ),
  },
);

const EditorProjectIdPage = () => {
  const params = useParams<{ projectId?: string | string[] }>();
  const searchParams = useSearchParams();
  const projectIdParam = Array.isArray(params?.projectId)
    ? params.projectId[0]
    : params?.projectId;
  const projectId = typeof projectIdParam === "string" ? projectIdParam : "";
  const hasValidProjectId = projectId.length > 0;
  const rawBrochureId = searchParams.get("brochureId");
  const parsedBrochureId = Number.parseInt(rawBrochureId || "", 10);
  const rawType = searchParams.get("type");
  const brochureType = (rawType === "trifold" || rawType === "poster") ? rawType as BrochureType : undefined;

  const {
    data,
    isLoading,
    isError
  } = useGetProject(projectId);

  if (!hasValidProjectId) {
    return (
      <div className="h-full flex flex-col gap-y-5 items-center justify-center">
        <TriangleAlert className="size-6 text-muted-foreground" />
        <p className="text-muted-foreground text-sm">
          Invalid project URL
        </p>
        <Button asChild variant="secondary">
          <Link href="/">
            Back to Home
          </Link>
        </Button>
      </div>
    );
  }

  const project = data?.data;
  const hasValidProject =
    !!project
    && typeof project.id === "number"
    && typeof project.name === "string"
    && typeof project.json === "string"
    && typeof project.width === "number"
    && typeof project.height === "number";

  const brochureIdFromQuery =
    Number.isFinite(parsedBrochureId) && parsedBrochureId > 0
      ? parsedBrochureId
      : undefined;
  const brochureIdFromProject =
    typeof project?.brochureId === "number" && project.brochureId > 0
      ? project.brochureId
      : undefined;
  const brochureId = brochureIdFromQuery ?? brochureIdFromProject;

  if (isError) {
    return (
      <div className="h-full flex flex-col gap-y-5 items-center justify-center">
        <TriangleAlert className="size-6 text-muted-foreground" />
        <p className="text-muted-foreground text-sm">
          Failed to fetch project
        </p>
        <Button asChild variant="secondary">
          <Link href="/">
            Back to Home
          </Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <Loader className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hasValidProject) {
    return (
      <div className="h-full flex flex-col gap-y-5 items-center justify-center">
        <TriangleAlert className="size-6 text-muted-foreground" />
        <p className="text-muted-foreground text-sm">
          Project data is unavailable
        </p>
        <Button asChild variant="secondary">
          <Link href="/">
            Back to Home
          </Link>
        </Button>
      </div>
    );
  }

  return <Editor initialData={project} brochureId={brochureId} brochureType={brochureType} />
};

export default EditorProjectIdPage;
