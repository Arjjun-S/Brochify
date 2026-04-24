import type { SessionRole } from "@/lib/server/types";

export function resolveLogoBackNavigation(pathname: string, role: SessionRole): string {
  if (role === "admin") {
    if (pathname.startsWith("/certificate")) return "/admin/certificates";
    if (pathname.startsWith("/admin/certificates")) return "/admin/modules";
    if (pathname.startsWith("/studio") || pathname.startsWith("/brochure-studio")) return "/admin/dashboard";
    if (pathname.startsWith("/admin/dashboard")) return "/admin/modules";
    return "/admin/modules";
  }

  if (pathname.startsWith("/studio") || pathname.startsWith("/brochure-studio")) {
    return "/faculty/dashboard";
  }

  if (pathname.startsWith("/certificate")) {
    return "/faculty/certificates";
  }

  if (pathname.startsWith("/faculty/dashboard")) {
    return "/faculty/modules";
  }

  if (pathname.startsWith("/faculty/certificates")) {
    return "/faculty/modules";
  }

  if (pathname.startsWith("/faculty/settings")) {
    return "/faculty/modules";
  }

  return "/faculty/modules";
}
