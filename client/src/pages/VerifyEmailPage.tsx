import { useEffect, useState } from "react";
import { useSearch } from "wouter";
import { BookOpen } from "lucide-react";
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

  return (
    <>
      <SEO title="Verify Email — Scholar.name" description="Verify your Scholar.name email address." />
      <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center px-4 py-6">
        <div className="bg-white rounded-2xl shadow-[0_24px_60px_-20px_rgba(11,31,58,.18)] p-10 w-full max-w-[440px] text-center">
          <a href="/" className="inline-flex items-center gap-2 no-underline mb-8">
            <BookOpen className="w-6 h-6 text-midnight" />
            <span className="font-serif font-bold text-xl text-midnight">Scholar.name</span>
          </a>

          {status === "loading" && (
            <>
              <div className="text-5xl mb-4">⏳</div>
              <p className="text-[#75777E] text-[15px]">Verifying your email…</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="text-5xl mb-4">✅</div>
              <h1 className="font-serif text-2xl font-bold text-midnight mb-2">
                Email verified!
              </h1>
              <p className="text-[#75777E] text-sm mb-7">{message}</p>
              <a
                href="/dashboard"
                className="inline-block bg-midnight text-warm rounded-[10px] px-8 py-3 text-[15px] font-bold no-underline font-serif"
              >
                Go to dashboard →
              </a>
            </>
          )}

          {status === "error" && (
            <>
              <div className="text-5xl mb-4">❌</div>
              <h1 className="font-serif text-2xl font-bold text-midnight mb-2">
                Verification failed
              </h1>
              <p className="text-[#75777E] text-sm mb-7">{message}</p>
              <a
                href="/dashboard"
                className="inline-block text-midnight text-sm font-semibold underline"
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
