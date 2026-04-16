import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { setSessionCookie } from "@/lib/server/auth";
import { verifyUserCredentials } from "@/lib/server/data";

const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required."),
  password: z.string().min(1, "Password is required."),
  role: z.enum(["admin", "faculty"]),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid login payload." }, { status: 400 });
    }

    const user = await verifyUserCredentials(parsed.data.username, parsed.data.password, parsed.data.role);
    if (!user) {
      return NextResponse.json({ error: "Invalid username, password, or role." }, { status: 401 });
    }

    const response = NextResponse.json({ user });
    setSessionCookie(response, user);
    return response;
  } catch {
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}
