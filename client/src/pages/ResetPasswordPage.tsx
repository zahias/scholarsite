import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { BookOpen } from "lucide-react";
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

  const cardClass = "bg-white rounded-2xl shadow-[0_24px_60px_-20px_rgba(11,31,58,.18)] p-10 w-full max-w-[440px]";

  if (!token) {
    return (
      <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center p-6">
        <div className={cardClass}>
          <p className="text-[#B33A3A] text-center">Invalid reset link. Please request a new one.</p>
          <a href="/forgot-password" className="block text-center mt-4 text-midnight font-semibold">Request new link</a>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO title="Reset Password — Scholar.name" description="Set a new password for your Scholar.name account." />
      <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center px-4 py-6">
        <div className={cardClass}>
          <div className="mb-8">
            <a href="/" className="inline-flex items-center gap-2 no-underline mb-6">
              <BookOpen className="w-6 h-6 text-midnight" />
              <span className="font-serif font-bold text-xl text-midnight">Scholar.name</span>
            </a>
            <h1 className="font-serif italic text-[28px] font-bold text-midnight m-0">
              Set a new password
            </h1>
          </div>

          {done ? (
            <div className="text-center py-6">
              <div className="text-5xl mb-4">✅</div>
              <p className="font-semibold text-midnight text-base mb-2">Password updated!</p>
              <p className="text-[#75777E] text-sm">Redirecting you to sign in…</p>
            </div>
          ) : (
            <form
              onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
              className="flex flex-col gap-5"
            >
              <div>
                <label className="block text-[13px] font-semibold text-midnight mb-1.5">
                  New password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full px-3.5 py-2.5 rounded-lg border-[1.5px] border-[#D4D9E2] text-sm outline-none box-border"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-midnight mb-1.5">
                  Confirm new password
                </label>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full px-3.5 py-2.5 rounded-lg border-[1.5px] border-[#D4D9E2] text-sm outline-none box-border"
                />
              </div>

              <button
                type="submit"
                disabled={mutation.isPending}
                className={`bg-midnight text-warm border-none rounded-[10px] py-3.5 text-[15px] font-bold font-serif ${mutation.isPending ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
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
