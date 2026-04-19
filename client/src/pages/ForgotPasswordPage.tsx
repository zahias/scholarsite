import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Request failed");
      return data;
    },
    onSuccess: () => setSubmitted(true),
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const cardStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 24px 60px -20px rgba(11,31,58,.18)",
    padding: "48px 40px",
    width: "100%",
    maxWidth: 440,
  };

  return (
    <>
      <SEO title="Forgot Password — Scholar.name" description="Reset your Scholar.name account password." />
      <div style={{ minHeight: "100vh", background: "#F0F4F8", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
        <div style={cardStyle}>
          <div style={{ marginBottom: 32 }}>
            <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", marginBottom: 24 }}>
              <div style={{ width: 36, height: 36, background: "#0B1F3A", borderRadius: 10, display: "grid", placeItems: "center" }}>
                <span style={{ color: "#FFC72E", fontFamily: "'Newsreader', serif", fontStyle: "italic", fontWeight: 700, fontSize: 16 }}>S</span>
              </div>
              <span style={{ fontFamily: "'Newsreader', serif", fontWeight: 700, fontSize: 20, color: "#0B1F3A" }}>Scholar.name</span>
            </a>
            <h1 style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", fontSize: 28, fontWeight: 700, color: "#0B1F3A", margin: 0 }}>
              Forgot your password?
            </h1>
            <p style={{ color: "#75777E", fontSize: 14, marginTop: 8 }}>
              Enter your email and we'll send you a reset link.
            </p>
          </div>

          {submitted ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✉️</div>
              <p style={{ fontWeight: 600, color: "#0B1F3A", fontSize: 16, marginBottom: 8 }}>Check your inbox</p>
              <p style={{ color: "#75777E", fontSize: 14 }}>
                If <strong>{email}</strong> is registered, a reset link is on its way.
              </p>
              <a href="/dashboard/login" style={{ display: "inline-block", marginTop: 24, color: "#0B1F3A", fontSize: 14, fontWeight: 600 }}>
                ← Back to sign in
              </a>
            </div>
          ) : (
            <form
              onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
              style={{ display: "flex", flexDirection: "column", gap: 20 }}
            >
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#0B1F3A", marginBottom: 6 }}>
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@university.edu"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1.5px solid #D4D9E2", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <button
                type="submit"
                disabled={mutation.isPending}
                style={{ background: "#0B1F3A", color: "#FFC72E", border: "none", borderRadius: 10, padding: "13px 0", fontSize: 15, fontWeight: 700, cursor: mutation.isPending ? "not-allowed" : "pointer", opacity: mutation.isPending ? 0.7 : 1, fontFamily: "'Newsreader', serif" }}
              >
                {mutation.isPending ? "Sending…" : "Send reset link"}
              </button>

              <p style={{ textAlign: "center", fontSize: 13, color: "#75777E" }}>
                <a href="/dashboard/login" style={{ color: "#0B1F3A", fontWeight: 600 }}>← Back to sign in</a>
              </p>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
