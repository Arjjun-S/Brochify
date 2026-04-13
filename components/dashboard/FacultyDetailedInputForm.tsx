"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import GuidedFlowPanel from "@/components/studio/editor/GuidedFlowPanel";
import { BrochureData, createEmptyBrochureData, normalizeBrochureData, setValueAtPath } from "@/lib/domains/brochure";
import { generateBrochureData } from "@/lib/services/ai/openrouterClient";
import type { BrochureRecord, EditorState } from "@/lib/server/types";

type FacultyDetailedInputFormProps = {
  brochureId: number;
};

function buildEnhancePrompt(data: BrochureData): string {
  return [
    "Enhance this brochure JSON while preserving keys and schema.",
    "Keep academic/professional tone and improve clarity.",
    "Return only JSON.",
    "",
    JSON.stringify(data, null, 2),
  ].join("\n");
}

export default function FacultyDetailedInputForm({ brochureId }: FacultyDetailedInputFormProps) {
  const router = useRouter();

  const [brochureMeta, setBrochureMeta] = useState<{ title: string; description: string } | null>(null);
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [brochureData, setBrochureData] = useState<BrochureData>(createEmptyBrochureData());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [aiEnhanced, setAiEnhanced] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBusy = loading || saving || enhancing;

  useEffect(() => {
    const loadBrochure = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/brochure/${brochureId}`, { cache: "no-store" });
        const data = (await response.json()) as { brochure?: BrochureRecord; error?: string };

        if (!response.ok || !data.brochure) {
          throw new Error(data.error || "Failed to load brochure details.");
        }

        setBrochureMeta({
          title: data.brochure.title,
          description: data.brochure.description,
        });
        setEditorState(data.brochure.content);
        setBrochureData(
          normalizeBrochureData(data.brochure.content?.brochureData as unknown as Record<string, unknown>),
        );
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : "Failed to load brochure details.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void loadBrochure();
  }, [brochureId]);

  const handleFieldChange = useCallback((path: string, value: unknown) => {
    setBrochureData((prev) => {
      const normalizedValue =
        path === "registration.notes" && typeof value === "string"
          ? value
              .split(/\r?\n/)
              .map((line) => line.replace(/^\s*(?:•|-|\*)\s?/, "").trim())
              .filter((line) => line.length > 0)
          : path === "programHighlightsText" && typeof value === "string"
            ? value
                .split(/\r?\n/)
                .map((line) => line.replace(/^\s*(?:•|-|\*)\s?/, "").trim())
                .filter((line) => line.length > 0)
                .join("\n")
            : value;

      return setValueAtPath(prev as unknown as Record<string, unknown>, path, normalizedValue) as BrochureData;
    });
  }, []);

  const handleEnhance = async () => {
    setEnhancing(true);
    setError(null);

    try {
      const result = await generateBrochureData(buildEnhancePrompt(brochureData));
      if (!result?.data || typeof result.data !== "object") {
        throw new Error("AI returned invalid brochure content.");
      }

      setBrochureData(normalizeBrochureData(result.data as Record<string, unknown>));
      setAiEnhanced(true);
    } catch (enhanceError) {
      const message = enhanceError instanceof Error ? enhanceError.message : "AI enhancement failed.";
      setError(message);
    } finally {
      setEnhancing(false);
    }
  };

  const handleOpenEditor = async () => {
    if (!editorState) {
      setError("Editor state is not ready yet.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const nextContent: EditorState = {
        ...editorState,
        brochureData,
      };

      const response = await fetch(`/api/brochure/${brochureId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: nextContent }),
      });

      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error || "Failed to save detailed input.");
      }

      router.replace(`/studio?brochureId=${brochureId}&animate=1`);
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Failed to save detailed input.";
      setError(message);
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Faculty Workflow</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Detailed Input Form</h1>
              <p className="mt-1 text-sm text-slate-600">
                Fill all brochure entities, optionally run AI enhancement, then open the editor with typed animation.
              </p>
            </div>
            <Link
              href="/faculty/dashboard"
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Back to Dashboard
            </Link>
          </div>

          {brochureMeta && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold text-slate-800">{brochureMeta.title}</p>
              <p className="mt-1 text-sm text-slate-600">{brochureMeta.description}</p>
            </div>
          )}

          {aiEnhanced && (
            <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              AI enhancement applied. Review the fields and open editor when ready.
            </p>
          )}

          {error && <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        </header>

        {loading ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Loading detailed form...</p>
          </section>
        ) : (
          <GuidedFlowPanel
            data={brochureData}
            onFieldChange={handleFieldChange}
            onEnhance={handleEnhance}
            onCreate={handleOpenEditor}
            isBusy={isBusy}
            fullPage
            createActionLabel={saving ? "Saving..." : "Save and Open Editor"}
          />
        )}
      </div>
    </main>
  );
}
