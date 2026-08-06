import { useEffect, useState, type FormEvent, type JSX } from "react";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";

export function LoginPage(): JSX.Element {
  const [idToken, setIdToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated, loginWithToken } = useAuth();

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
    if (!clientId) return;

    // Initialize Google Identity Services
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
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

        window.google.accounts.id.renderButton(
          document.getElementById("google-signin-button"),
          { theme: "outline", size: "large" }
        );

        window.google.accounts.id.prompt();
      } catch (err) {
        // Ignore if script not ready yet
      }
    }
  }, [loginWithToken]);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!idToken.trim()) {
      toast.error("Google ID token is required");
      return;
    }

    // Basic JWT shape check to avoid sending the client ID or other invalid values
    if (idToken.trim().split('.').length !== 3) {
      toast.error('Invalid token format — paste a full ID token or use the Google sign-in button');
      return;
    }

    setIsSubmitting(true);

    try {
      await loginWithToken(idToken.trim());
    } catch {
      toast.error("Login failed. Please verify your Google ID token.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-10 text-slate-100">
      <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-orange-500/25 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-red-500/20 blur-3xl" />

      <div className="mx-auto max-w-md rounded-3xl border border-orange-400/20 bg-slate-900/80 p-8 shadow-2xl backdrop-blur">
        <h1 className="text-3xl font-bold tracking-tight text-white">Email Scheduler</h1>
        <p className="mt-2 text-sm text-slate-300">Sign in with your Google OAuth token to access your dashboard.</p>

        <form className="mt-7 space-y-4" onSubmit={(event) => void submit(event)}>
          <div className="mb-4 flex justify-center">
            <div id="google-signin-button" />
          </div>

          {/* Keep manual paste fallback for testing */}
          <label className="block">
            <span className="mb-1 block text-sm text-slate-300">Google ID Token</span>
            <textarea
              value={idToken}
              onChange={(event) => {
                setIdToken(event.target.value);
              }}
              rows={5}
              placeholder="Paste Google ID token"
              className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm outline-none ring-orange-400 focus:ring"
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2.5 font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
          >
            {isSubmitting ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </main>
  );
}
