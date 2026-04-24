"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, CircleUserRound, MonitorCog, MoonStar, Palette, Save, SunMedium, LogOut } from "lucide-react";
import { cn } from "@/lib/ui/cn";
import type { SessionUser } from "@/lib/server/types";

type SettingsWorkspaceProps = {
  user: SessionUser;
};

export default function SettingsWorkspace({ user }: SettingsWorkspaceProps) {
  const router = useRouter();
  const [theme, setTheme] = useState("system");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  };

  const handleSave = async () => {
    setSaving(true);
    window.setTimeout(() => setSaving(false), 500);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-indigo-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 px-6 py-5 backdrop-blur-lg md:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-700">
              <CircleUserRound className="h-3.5 w-3.5" />
              Faculty Settings
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Account preferences</h1>
            <p className="mt-1 text-sm text-slate-600">Manage profile details, theme, and account options.</p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={user.role === "faculty" ? "/faculty/modules" : "/admin/modules"}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Back to Modules
            </Link>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-5xl px-6 py-8 md:px-10">
        <div className="grid gap-5">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Profile Info</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">{user.username}</h2>
                <p className="mt-1 text-sm text-slate-600">{user.role === "faculty" ? "Faculty account" : "Admin account"}</p>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-lg font-black uppercase text-white">
                  {user.username.slice(0, 1)}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Avatar</p>
                  <p className="text-sm font-semibold text-slate-700">{user.username}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="block space-y-1">
                <span className="text-sm font-semibold text-slate-700">Name</span>
                <input
                  value={user.username}
                  readOnly
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-semibold text-slate-700">Email</span>
                <input
                  value={`${user.username}@brochify.app`}
                  readOnly
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none"
                />
              </label>
            </div>
          </article>

          <div className="grid gap-5 md:grid-cols-2">
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Theme Preferences</p>
              <div className="mt-4 grid gap-3">
                {[
                  { value: "system", label: "System", icon: MonitorCog },
                  { value: "light", label: "Light", icon: SunMedium },
                  { value: "dark", label: "Dark", icon: MoonStar },
                ].map((option) => {
                  const Icon = option.icon;
                  const selected = theme === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTheme(option.value)}
                      className={cn(
                        "flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition",
                        selected
                          ? "border-slate-900 bg-slate-900 text-white shadow-[0_18px_30px_-24px_rgba(15,23,42,0.95)]"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white",
                      )}
                    >
                      <span className="inline-flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-semibold">{option.label}</span>
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-[0.14em]">{selected ? "Active" : "Set"}</span>
                    </button>
                  );
                })}
              </div>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Account Settings</p>
              <div className="mt-4 space-y-4">
                <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="inline-flex items-center gap-3 text-sm font-semibold text-slate-700">
                    <Bell className="h-4 w-4 text-slate-500" />
                    Notifications
                  </span>
                  <input
                    type="checkbox"
                    checked={notificationsEnabled}
                    onChange={(event) => setNotificationsEnabled(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-slate-900"
                  />
                </label>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <p className="font-semibold text-slate-700">Current theme</p>
                  <p className="mt-1 capitalize">{theme}</p>
                </div>
              </div>
            </article>
          </div>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Logout</p>
            <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">End your current session</p>
                <p className="text-xs text-slate-500">You can sign back in anytime from the login screen.</p>
              </div>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                <LogOut className="mr-2 inline-flex h-4 w-4" />
                Logout
              </button>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
