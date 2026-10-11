import { NextResponse, type NextRequest } from "next/server";

/**
 * Passes the requested path to server components (as `x-hk-path`) so protected layouts can send visitors to
 * /login?next=<where they were going> and bring them back after sign-in. It does NOT make any access decision.
 */
export function middleware(req: NextRequest) {
  const headers = new Headers(req.headers);
  headers.set("x-hk-path", req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.next({ request: { headers } });
}

export const config = { matcher: ["/((?!_next|api|.*\\..*).*)"] };
