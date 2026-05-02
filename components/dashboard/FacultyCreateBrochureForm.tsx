"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SelectBox } from "@/components/ui/SelectBox";

type AdminOption = {
  id: number;
  username: string;
};

export default function FacultyCreateBrochureForm() {
  const router = useRouter();
  const [admins, setAdmins] = useState<AdminOption[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedAdminId, setAssignedAdminId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAdmins = async () => {
      try {
        const response = await fetch("/api/users/admins", { cache: "no-store" });
        const data = (await response.json()) as { admins?: AdminOption[]; error?: string };
        if (!response.ok) {
          throw new Error(data.error || "Failed to load admins.");
        }

        const nextAdmins = data.admins || [];
        setAdmins(nextAdmins);
        if (nextAdmins.length > 0) {
          setAssignedAdminId(String(nextAdmins[0].id));
        }
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : "Failed to load admins.";
        setError(message);
      }
    };

    void loadAdmins();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/brochure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          assignedAdminId: Number(assignedAdminId),
        }),
      });

      const data = (await response.json()) as { id?: number; error?: string };
      if (!response.ok || !data.id) {
        throw new Error(data.error || "Failed to create brochure.");
      }

      router.replace(`/faculty/brochures/${data.id}/details`);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Failed to create brochure.";
      setError(message);
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Faculty Workflow</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Create Brochure</h1>
          <p className="mt-1 text-sm text-slate-600">
            Provide basic details and pick an admin reviewer. You will continue to the detailed input form next.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Title</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Description</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="h-32 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
                required
              />
            </label>

            <div className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Select Admin</span>
              <SelectBox
                value={assignedAdminId}
                onChange={setAssignedAdminId}
                options={
                  admins.length > 0 
                    ? admins.map(a => ({ label: a.username, value: String(a.id) }))
                    : [{ label: "No admins found", value: "" }]
                }
                placeholder="Select Admin"
                disabled={admins.length === 0}
              />
            </div>

            {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-70"
              >
                {submitting ? "Creating..." : "Create and Continue"}
              </button>

              <Link
                href="/faculty/brochures"
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
