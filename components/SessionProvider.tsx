"use client";

import { SessionProvider as NextAuthSessionProvider, useSession } from "next-auth/react";
import { Session } from "next-auth";
import { useEffect } from "react";

interface SessionProviderProps {
  children: React.ReactNode;
  session?: Session | null;
}

function UserSyncWrapper({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user?.email) {
      // Sync user to MongoDB when they log in
      fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }).catch(err => console.warn('Failed to sync user:', err));
    }
  }, [session?.user?.email]);

  return <>{children}</>;
}

export default function SessionProvider({ children, session }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider session={session}>
      <UserSyncWrapper>
        {children}
      </UserSyncWrapper>
    </NextAuthSessionProvider>
  );
}
