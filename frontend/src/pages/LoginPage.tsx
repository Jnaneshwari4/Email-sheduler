import { useEffect, useRef, type JSX } from "react";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";

export function LoginPage(): JSX.Element {
  const { isAuthenticated, loginWithToken } = useAuth();
  const gsiInitialized = useRef(false);

 useEffect(() => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  if (!clientId || gsiInitialized.current) return;

  const initializeGoogle = () => {
    const googleAccountsId = window.google?.accounts?.id;

    if (!googleAccountsId || gsiInitialized.current) return;

    googleAccountsId.initialize({
      client_id: clientId,
      callback: async (response: any) => {
        const credential = response?.credential;

        if (!credential) return;

        if (
          typeof credential !== "string" ||
          credential.split(".").length !== 3
        ) {
          toast.error("Received invalid credential from Google");
          return;
        }

        try {
          await loginWithToken(credential);
        } catch {
          toast.error("Google sign-in failed");
        }
      },
    });

    const button = document.getElementById("google-signin-button");

    if (button) {
      googleAccountsId.renderButton(button, {
        theme: "outline",
        size: "large",
      });
    }

    gsiInitialized.current = true;
  };

  if (window.google?.accounts?.id) {
    initializeGoogle();
  } else {
    const timer = window.setInterval(() => {
      if (window.google?.accounts?.id) {
        initializeGoogle();
        window.clearInterval(timer);
      }
    }, 100);

    return () => window.clearInterval(timer);
  }
}, [loginWithToken]);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-10 text-slate-100">
      <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-orange-500/25 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-red-500/20 blur-3xl" />

      <div className="mx-auto max-w-md rounded-3xl border border-orange-400/20 bg-slate-900/80 p-8 shadow-2xl backdrop-blur">
        <h1 className="text-3xl font-bold tracking-tight text-white">Email Scheduler</h1>
        <p className="mt-2 text-sm text-slate-300">Sign in with your Google OAuth token to access your dashboard.</p>

        <div className="mt-7 flex justify-center">
          <div id="google-signin-button" />
        </div>
      </div>
    </main>
  );
}
