import { useEffect, useRef, type JSX } from "react";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";

export function LoginPage(): JSX.Element {
  const { isAuthenticated, loginWithToken } = useAuth();
  const gsiInitialized = useRef(false);

  const handleGmailSignIn = (): void => {
    const googleId = window.google?.accounts?.id;
    if (!googleId) {
      toast.error("Google sign-in is not ready yet");
      return;
    }

    try {
      googleId.prompt();
    } catch (err) {
      console.warn("Google prompt request failed", err);
      toast.error("Unable to open Google sign-in. Try again in a moment.");
    }
  };

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
    if (!clientId || gsiInitialized.current) return;

    const googleAccountsId = window.google?.accounts?.id;
    if (!googleAccountsId) return;

    try {
      googleAccountsId.initialize({
        client_id: clientId,
        callback: async (response: any) => {
          const credential = response?.credential;
          if (!credential) return;

          // Basic JWT shape check
          if (typeof credential !== "string" || credential.split('.').length !== 3) {
            toast.error("Received invalid credential from Google");
            console.warn("Invalid credential from Google callback:", credential);
            return;
          }

          // Decode JWT payload to inspect audience
          try {
            const payloadJson = atob(credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'));
            const payload = JSON.parse(decodeURIComponent(escape(payloadJson)));
            console.info("Google ID token payload:", payload);

            if (payload.aud !== clientId) {
              toast.error("Received ID token audience does not match app client ID. Check your OAuth client configuration.");
              console.warn("Audience mismatch", { tokenAud: payload.aud, clientId });
              return;
            }
          } catch (err) {
            console.warn("Failed to decode Google ID token payload", err);
          }

          try {
            await loginWithToken(credential);
          } catch {
            toast.error("Google sign-in failed");
          }
        }
      });

      googleAccountsId.renderButton(
        document.getElementById("google-signin-button"),
        { theme: "outline", size: "large" }
      );

      gsiInitialized.current = true;
    } catch (err) {
      // Ignore if script not ready yet
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

        <div className="mt-7 space-y-4">
          <div className="mb-4 flex flex-col items-center gap-4">
            <div id="google-signin-button" />
            <button
              type="button"
              onClick={handleGmailSignIn}
              className="w-full max-w-xs rounded-xl bg-slate-800 px-4 py-2.5 font-semibold text-white transition hover:bg-slate-700"
            >
              Sign in with Gmail
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
