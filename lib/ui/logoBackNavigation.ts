import type { UserRole } from "@/lib/server/types";

export function resolveLogoBackNavigation(pathname: string, role: UserRole): string {
  if (role === "admin") {
    if (pathname.startsWith("/certificate")) return "/admin/certificates";
    if (pathname.startsWith("/admin/certificates")) return "/admin/modules";
    if (pathname.startsWith("/studio") || pathname.startsWith("/brochure-studio")) return "/admin/dashboard";
    if (pathname.startsWith("/admin/dashboard")) return "/admin/modules";
    return "/admin/modules";
  }

  if (pathname.startsWith("/studio") || pathname.startsWith("/brochure-studio")) {
    return "/faculty/brochure";
  }

  if (pathname.startsWith("/certificate")) {
    return "/faculty/certificate";
  }

  if (pathname.startsWith("/faculty/brochure")) {
    return "/faculty/modules";
  }

  if (pathname.startsWith("/faculty/certificate")) {
    return "/faculty/modules";
  }

  if (pathname.startsWith("/faculty/certificate")) {
    return "/faculty/modules";
  }

  if (pathname.startsWith("/faculty/settings")) {
    return "/faculty/modules";
  }

  return "/faculty/modules";
}
