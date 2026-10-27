import { authMiddleware } from '@clerk/nextjs';

// Protect all dashboard routes except public ones.
// Server-side authorization based on database-backed roles + clinic membership
// is enforced in each API route (see src/lib/auth.ts).
export default authMiddleware({
  publicRoutes: ['/sign-in', '/sign-up', '/api/webhooks/clerk'],
  afterAuth(auth, req) {
    // Redirect unauthenticated users to sign-in for protected routes
    if (!auth.userId && !auth.isPublicRoute) {
      return auth.redirectToSignIn();
    }
    return null;
  },
});

export const config = {
  matcher: ['/((?!_next|.*?\\..*).*)'],
};
