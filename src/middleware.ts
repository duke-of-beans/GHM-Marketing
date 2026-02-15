export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    // Match all dashboard routes
    "/master/:path*",
    "/sales/:path*",
    "/leads/:path*",
    "/reports/:path*",
    // Match login (for redirect if already authenticated)
    "/login",
    // Match API routes (except auth)
    "/api/((?!auth).*)",
  ],
};
