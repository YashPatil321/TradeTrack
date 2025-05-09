"use client";
import { SessionProvider, useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

function LoginContent() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  return (
    <div>
      {session ? (
        <div className="flex items-center">
          <p
            className="cursor-pointer text-blue-600 hover:underline"
            onClick={() => router.push("/profile")}
          >
            Welcome, {session.user?.name}!
          </p>
        </div>
      ) : (
        <button
          onClick={() =>
            signIn("google", { callbackUrl: "/list_your_service" })
          }
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Your Trade
        </button>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <SessionProvider>
      <LoginContent />
    </SessionProvider>
  );
}
