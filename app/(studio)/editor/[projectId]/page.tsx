"use client";

import { use } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Loader, TriangleAlert } from "lucide-react";

import { useGetProject } from "@/features/projects/api/use-get-project";

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

interface EditorProjectIdPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

const EditorProjectIdPage = ({
  params,
}: EditorProjectIdPageProps) => {
  const searchParams = useSearchParams();
  const { projectId } = use(params);
  const rawBrochureId = searchParams.get("brochureId");
  const parsedBrochureId = Number.parseInt(rawBrochureId || "", 10);

  const {
    data,
    isLoading,
    isError
  } = useGetProject(projectId);

  const brochureIdFromQuery =
    Number.isFinite(parsedBrochureId) && parsedBrochureId > 0
      ? parsedBrochureId
      : undefined;
  const brochureIdFromProject =
    typeof data?.data.brochureId === "number" && data.data.brochureId > 0
      ? data.data.brochureId
      : undefined;
  const brochureId = brochureIdFromQuery ?? brochureIdFromProject;

  if (isLoading || !data) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <Loader className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

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

  return <Editor initialData={data.data} brochureId={brochureId} />
};

export default EditorProjectIdPage;
