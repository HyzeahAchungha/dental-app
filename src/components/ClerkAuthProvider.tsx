/**
 * Clerk authentication provider for the Expo mobile app.
 * Wraps the app with ClerkProvider so Apple/Google sign-in and session
 * management are available throughout the mobile experience.
 */

import { ClerkProvider, SignedOut, SignedIn, useAuth } from '@clerk/clerk-expo';
import { useEffect } from 'react';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

export function ClerkAuthProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoading } = useAuth();

  useEffect(() => {
    // No client-side side effects needed; auth state is managed by ClerkProvider
  }, [isSignedIn, isLoading]);

  if (isLoading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ThemedText type="small">Loading session...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ClerkProvider publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}>
      {isSignedIn ? <SignedIn>{children}</SignedIn> : <SignedOut>{children}</SignedOut>}
    </ClerkProvider>
  );
}
