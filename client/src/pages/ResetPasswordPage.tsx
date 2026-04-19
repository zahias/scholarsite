import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";

export default function ResetPasswordPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const search = useSearch();
  const token = new URLSearchParams(search).get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      if (newPassword !== confirm) throw new Error("Passwords do not match.");
      if (newPassword.length < 8) throw new Error("Password must be at least 8 characters.");
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Reset failed");
      return data;
    },
    onSuccess: () => {
      setDone(true);
      setTimeout(() => navigate("/dashboard/login"), 2500);
    },
    onError: (err: Error) => toast({ title: "Reset failed", description: err.message, variant: "destructive" }),
  });

  const cardStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 24px 60px -20px rgba(11,31,58,.18)",
    padding: "48px 40px",
    width: "100%",
    maxWidth: 440,
  };

  if (!token) {
    return (
      <div style={{ minHeight: "100vh", background: "#F0F4F8", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={cardStyle}>
          <p style={{ color: "#B33A3A", textAlign: "center" }}>Invalid reset link. Please request a new one.</p>
          <a href="/forgot-password" style={{ display: "block", textAlign: "center", marginTop: 16, color: "#0B1F3A", fontWeight: 600 }}>Request new link</a>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO title="Reset Password — Scholar.name" description="Set a new password for your Scholar.name account." />
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
              Set a new password
            </h1>
          </div>

          {done ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <p style={{ fontWeight: 600, color: "#0B1F3A", fontSize: 16, marginBottom: 8 }}>Password updated!</p>
              <p style={{ color: "#75777E", fontSize: 14 }}>Redirecting you to sign in…</p>
            </div>
          ) : (
            <form
              onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
              style={{ display: "flex", flexDirection: "column", gap: 20 }}
            >
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#0B1F3A", marginBottom: 6 }}>
                  New password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1.5px solid #D4D9E2", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#0B1F3A", marginBottom: 6 }}>
                  Confirm new password
                </label>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat password"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1.5px solid #D4D9E2", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <button
                type="submit"
                disabled={mutation.isPending}
                style={{ background: "#0B1F3A", color: "#FFC72E", border: "none", borderRadius: 10, padding: "13px 0", fontSize: 15, fontWeight: 700, cursor: mutation.isPending ? "not-allowed" : "pointer", opacity: mutation.isPending ? 0.7 : 1, fontFamily: "'Newsreader', serif" }}
              >
                {mutation.isPending ? "Updating…" : "Update password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
