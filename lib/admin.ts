import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

const ADMIN_HANDLES = ["SigNullBTC"];

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!session?.user?.id || !ADMIN_HANDLES.includes(user?.xHandle ?? "")) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), session: null };
  }
  return { error: null, session };
}

export function isAdmin(xHandle?: string | null) {
  return ADMIN_HANDLES.includes(xHandle ?? "");
}
