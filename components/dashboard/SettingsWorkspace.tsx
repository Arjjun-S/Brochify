"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Bell,
  CircleUserRound,
  FolderKanban,
  Home,
  LayoutTemplate,
  LogOut,
  MoonStar,
  Palette,
  Save,
  Settings2,
  SunMedium,
} from "lucide-react";
import { cn } from "@/lib/ui/cn";
import type { SessionUser } from "@/lib/server/types";
import { resolveLogoBackNavigation } from "@/lib/ui/logoBackNavigation";
import { useThemePreference } from "./useThemePreference";

type SettingsWorkspaceProps = {
  user: SessionUser;
};

export default function SettingsWorkspace({ user }: SettingsWorkspaceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, isDark, setTheme } = useThemePreference();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  const logoBackHref = resolveLogoBackNavigation(pathname || "/faculty/settings", user.role);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  };

  const handleSave = async () => {
    setSaving(true);
    window.setTimeout(() => setSaving(false), 500);
  };

  return (
    <main
      className={cn(
        "min-h-screen text-slate-900 transition-colors duration-300",
        isDark
          ? "bg-gradient-to-br from-[#0B0F1A] via-[#0f172a] to-[#111827] text-[#E5E7EB]"
          : "bg-gradient-to-br from-slate-100 via-white to-indigo-50",
      )}
    >
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r p-6 backdrop-blur-lg transition-colors duration-300 lg:flex",
          isDark ? "border-slate-700 bg-[#111827]/85" : "border-slate-200 bg-white/85",
        )}
      >
        <Link href={logoBackHref} className="mb-8 flex items-center gap-3">
          <Image src="/icon-logo.png" alt="Brochify Icon" width={38} height={38} className="h-9 w-9 object-contain" priority />
          <Image src="/text-logo.png" alt="Brochify Wordmark" width={158} height={34} className="h-8 w-auto object-contain" priority />
        </Link>

        <nav className="space-y-1.5">
          <button
            type="button"
            disabled
            className={cn(
              "flex w-full cursor-not-allowed items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold",
              isDark ? "text-slate-500" : "text-slate-400",
            )}
          >
            <Palette className="h-4 w-4" />
            Create
          </button>

          <Link
            href="/faculty/dashboard"
            className={cn(
              "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
              isDark
                ? "text-slate-300 hover:bg-slate-800 hover:text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            <Home className="h-4 w-4" />
            Home
          </Link>

          <Link
            href="/faculty/dashboard"
            className={cn(
              "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
              isDark
                ? "text-slate-300 hover:bg-slate-800 hover:text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            <FolderKanban className="h-4 w-4" />
            My Brochures
          </Link>

          <button
            type="button"
            disabled
            className={cn(
              "flex w-full cursor-not-allowed items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold",
              isDark ? "text-slate-500" : "text-slate-400",
            )}
          >
            <LayoutTemplate className="h-4 w-4" />
            Templates
          </button>

          <Link
            href="/faculty/settings"
            className={cn(
              "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
              isDark
                ? "bg-slate-800 text-white"
                : "bg-slate-100 text-slate-900",
            )}
          >
            <Settings2 className="h-4 w-4" />
            Settings
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => void handleLogout()}
          className={cn(
            "mt-auto flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition",
            isDark
              ? "border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
              : "border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900",
          )}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </aside>

      <div className="lg:pl-72">
      <header
        className={cn(
          "sticky top-0 z-30 border-b px-6 py-5 backdrop-blur-lg transition-colors duration-300 md:px-10",
          isDark ? "border-slate-700 bg-[#111827]/80" : "border-slate-200 bg-white/80",
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em]",
              isDark ? "border-indigo-700 bg-indigo-950 text-indigo-200" : "border-indigo-200 bg-indigo-50 text-indigo-700",
            )}>
              <CircleUserRound className="h-3.5 w-3.5" />
              Faculty Settings
            </p>
            <h1 className={cn("mt-2 text-3xl font-black tracking-tight", isDark ? "text-slate-100" : "text-slate-950")}>Account preferences</h1>
            <p className={cn("mt-1 text-sm", isDark ? "text-slate-300" : "text-slate-600")}>Manage profile details, theme, and account options.</p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={user.role === "faculty" ? "/faculty/modules" : "/admin/modules"}
              className={cn(
                "rounded-2xl border px-4 py-2.5 text-sm font-semibold transition",
                isDark
                  ? "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
              )}
            >
              Back to Modules
            </Link>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className={cn(
                "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-70",
                isDark ? "bg-indigo-600 text-white hover:bg-indigo-500" : "bg-slate-900 text-white hover:bg-slate-800",
              )}
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-5xl px-6 py-8 md:px-10">
        <div className="grid gap-5">
          <article className={cn(
            "rounded-3xl border p-6 shadow-sm transition-colors duration-300",
            isDark ? "border-slate-700 bg-[#111827]" : "border-slate-200 bg-white",
          )}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className={cn("text-xs font-black uppercase tracking-[0.18em]", isDark ? "text-slate-400" : "text-slate-500")}>Profile Info</p>
                <h2 className={cn("mt-2 text-2xl font-black tracking-tight", isDark ? "text-slate-100" : "text-slate-900")}>{user.username}</h2>
                <p className={cn("mt-1 text-sm", isDark ? "text-slate-300" : "text-slate-600")}>{user.role === "faculty" ? "Faculty account" : "Admin account"}</p>
              </div>

              <div className={cn(
                "flex items-center gap-3 rounded-2xl border px-4 py-3",
                isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-slate-50",
              )}>
                <div className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-full text-lg font-black uppercase",
                  isDark ? "bg-indigo-600 text-white" : "bg-slate-900 text-white",
                )}>
                  {user.username.slice(0, 1)}
                </div>
                <div>
                  <p className={cn("text-[10px] font-black uppercase tracking-[0.16em]", isDark ? "text-slate-400" : "text-slate-500")}>Avatar</p>
                  <p className={cn("text-sm font-semibold", isDark ? "text-slate-200" : "text-slate-700")}>{user.username}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="block space-y-1">
                <span className={cn("text-sm font-semibold", isDark ? "text-slate-200" : "text-slate-700")}>Name</span>
                <input
                  value={user.username}
                  readOnly
                  className={cn(
                    "w-full rounded-2xl border px-3 py-2.5 text-sm outline-none",
                    isDark
                      ? "border-slate-700 bg-slate-900 text-slate-200"
                      : "border-slate-200 bg-slate-50 text-slate-700",
                  )}
                />
              </label>
              <label className="block space-y-1">
                <span className={cn("text-sm font-semibold", isDark ? "text-slate-200" : "text-slate-700")}>Email</span>
                <input
                  value={`${user.username}@brochify.app`}
                  readOnly
                  className={cn(
                    "w-full rounded-2xl border px-3 py-2.5 text-sm outline-none",
                    isDark
                      ? "border-slate-700 bg-slate-900 text-slate-200"
                      : "border-slate-200 bg-slate-50 text-slate-700",
                  )}
                />
              </label>
            </div>
          </article>

          <div className="grid gap-5 md:grid-cols-2">
            <article className={cn(
              "rounded-3xl border p-6 shadow-sm transition-colors duration-300",
              isDark ? "border-slate-700 bg-[#111827]" : "border-slate-200 bg-white",
            )}>
              <p className={cn("text-xs font-black uppercase tracking-[0.18em]", isDark ? "text-slate-400" : "text-slate-500")}>Theme Preferences</p>
              <div className="mt-4 grid gap-3">
                {[
                  { value: "light", label: "Light", icon: SunMedium },
                  { value: "dark", label: "Dark", icon: MoonStar },
                ].map((option) => {
                  const Icon = option.icon;
                  const selected = theme === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTheme(option.value as "light" | "dark")}
                      className={cn(
                        "flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition",
                        selected
                          ? isDark
                            ? "border-indigo-400 bg-indigo-600 text-white shadow-[0_18px_30px_-24px_rgba(79,70,229,0.95)]"
                            : "border-slate-900 bg-slate-900 text-white shadow-[0_18px_30px_-24px_rgba(15,23,42,0.95)]"
                          : isDark
                            ? "border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-600 hover:bg-slate-800"
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

            <article className={cn(
              "rounded-3xl border p-6 shadow-sm transition-colors duration-300",
              isDark ? "border-slate-700 bg-[#111827]" : "border-slate-200 bg-white",
            )}>
              <p className={cn("text-xs font-black uppercase tracking-[0.18em]", isDark ? "text-slate-400" : "text-slate-500")}>Account Settings</p>
              <div className="mt-4 space-y-4">
                <label className={cn(
                  "flex items-center justify-between rounded-2xl border px-4 py-3",
                  isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-slate-50",
                )}>
                  <span className={cn("inline-flex items-center gap-3 text-sm font-semibold", isDark ? "text-slate-200" : "text-slate-700")}>
                    <Bell className={cn("h-4 w-4", isDark ? "text-slate-300" : "text-slate-500")} />
                    Notifications
                  </span>
                  <input
                    type="checkbox"
                    checked={notificationsEnabled}
                    onChange={(event) => setNotificationsEnabled(event.target.checked)}
                    className={cn("h-4 w-4 rounded", isDark ? "border-slate-600 bg-slate-800 text-indigo-500" : "border-slate-300 text-slate-900")}
                  />
                </label>

                <div className={cn(
                  "rounded-2xl border px-4 py-3 text-sm",
                  isDark ? "border-slate-700 bg-slate-900 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-600",
                )}>
                  <p className={cn("font-semibold", isDark ? "text-slate-100" : "text-slate-700")}>Current theme</p>
                  <p className="mt-1 capitalize">{theme}</p>
                </div>
              </div>
            </article>
          </div>

          <article className={cn(
            "rounded-3xl border p-6 shadow-sm transition-colors duration-300",
            isDark ? "border-slate-700 bg-[#111827]" : "border-slate-200 bg-white",
          )}>
            <p className={cn("text-xs font-black uppercase tracking-[0.18em]", isDark ? "text-slate-400" : "text-slate-500")}>Logout</p>
            <div className={cn(
              "mt-4 flex items-center justify-between gap-4 rounded-2xl border px-4 py-3",
              isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-slate-50",
            )}>
              <div>
                <p className={cn("text-sm font-semibold", isDark ? "text-slate-100" : "text-slate-800")}>End your current session</p>
                <p className={cn("text-xs", isDark ? "text-slate-400" : "text-slate-500")}>You can sign back in anytime from the login screen.</p>
              </div>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className={cn(
                  "rounded-2xl border px-4 py-2 text-sm font-semibold transition",
                  isDark
                    ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
                )}
              >
                <LogOut className="mr-2 inline-flex h-4 w-4" />
                Logout
              </button>
            </div>
          </article>
        </div>
      </section>
      </div>
    </main>
  );
}
