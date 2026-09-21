import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api/admin");
  const isAuthRoute = pathname === "/admin/login";
  const isLoginApi = pathname === "/api/admin/login";

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  if (isLoginApi) {
    return NextResponse.next();
  }

  if (isApi && !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isApi && !isAuthRoute && !session) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
