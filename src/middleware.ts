import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    /*
     * Match all routes EXCEPT:
     * - _next (static files, images, etc.)
     * - favicon.ico, robots.txt, manifest, icons
     * - Public API auth endpoints
     */
    "/((?!_next|favicon\\.ico|robots\\.txt|manifest\\.json|icons/).*)",
  ],
};
