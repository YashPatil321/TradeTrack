"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export default function TestAuth() {
  const { data: session, status } = useSession();

  if (status === "loading") return <p>Loading...</p>;

  if (session) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Authentication Test - SUCCESS!</h1>
        <p className="mb-2">Signed in as: {session.user?.email}</p>
        <p className="mb-4">Name: {session.user?.name}</p>
        <button 
          onClick={() => signOut()}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Sign out
        </button>
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3 className="font-bold">Session Data:</h3>
          <pre>{JSON.stringify(session, null, 2)}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Authentication Test</h1>
      <p className="mb-4">Not signed in</p>
      <button 
        onClick={() => signIn("google")}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Sign in with Google
      </button>
      
      <div className="mt-8 p-4 bg-yellow-100 rounded">
        <h3 className="font-bold">Debug Info:</h3>
        <p>Status: {status}</p>
        <p>Session: {session ? "exists" : "null"}</p>
        <p>Current URL: {typeof window !== 'undefined' ? window.location.href : 'server'}</p>
      </div>
    </div>
  );
}
