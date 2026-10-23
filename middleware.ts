import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// TradesMonk services are paused: every page shows the transition notice.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/paused") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    /\.(?:png|jpg|jpeg|gif|svg|webp|ico|txt|xml)$/.test(pathname)
  ) {
    return NextResponse.next();
  }
  return NextResponse.rewrite(new URL("/paused", request.url));
}

export const config = {
  matcher: ["/", "/:path*"],
};
