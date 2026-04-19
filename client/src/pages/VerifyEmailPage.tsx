import { useEffect, useState } from "react";
import { useSearch } from "wouter";
import SEO from "@/components/SEO";

type Status = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const search = useSearch();
  const token = new URLSearchParams(search).get("token") || "";
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link.");
      return;
    }
    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.message?.toLowerCase().includes("success")) {
          setStatus("success");
          setMessage(data.message);
        } else {
          setStatus("error");
          setMessage(data.message || "Verification failed.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      });
  }, [token]);

  const cardStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 24px 60px -20px rgba(11,31,58,.18)",
    padding: "48px 40px",
    width: "100%",
    maxWidth: 440,
    textAlign: "center",
  };

  return (
    <>
      <SEO title="Verify Email — Scholar.name" description="Verify your Scholar.name email address." />
      <div style={{ minHeight: "100vh", background: "#F0F4F8", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
        <div style={cardStyle}>
          <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", marginBottom: 32 }}>
            <div style={{ width: 36, height: 36, background: "#0B1F3A", borderRadius: 10, display: "grid", placeItems: "center" }}>
              <span style={{ color: "#FFC72E", fontFamily: "'Newsreader', serif", fontStyle: "italic", fontWeight: 700, fontSize: 16 }}>S</span>
            </div>
            <span style={{ fontFamily: "'Newsreader', serif", fontWeight: 700, fontSize: 20, color: "#0B1F3A" }}>Scholar.name</span>
          </a>

          {status === "loading" && (
            <>
              <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
              <p style={{ color: "#75777E", fontSize: 15 }}>Verifying your email…</p>
            </>
          )}

          {status === "success" && (
            <>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 24, fontWeight: 700, color: "#0B1F3A", marginBottom: 8 }}>
                Email verified!
              </h1>
              <p style={{ color: "#75777E", fontSize: 14, marginBottom: 28 }}>{message}</p>
              <a
                href="/dashboard"
                style={{ display: "inline-block", background: "#0B1F3A", color: "#FFC72E", borderRadius: 10, padding: "12px 32px", fontSize: 15, fontWeight: 700, textDecoration: "none", fontFamily: "'Newsreader', serif" }}
              >
                Go to dashboard →
              </a>
            </>
          )}

          {status === "error" && (
            <>
              <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
              <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 24, fontWeight: 700, color: "#0B1F3A", marginBottom: 8 }}>
                Verification failed
              </h1>
              <p style={{ color: "#75777E", fontSize: 14, marginBottom: 28 }}>{message}</p>
              <a
                href="/dashboard"
                style={{ display: "inline-block", color: "#0B1F3A", fontSize: 14, fontWeight: 600, textDecoration: "underline" }}
              >
                Go to dashboard to resend verification email
              </a>
            </>
          )}
        </div>
      </div>
    </>
  );
}
