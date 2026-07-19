import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { BookOpen } from "lucide-react";
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

  return (
    <>
      <SEO title="Forgot Password — Scholar.name" description="Reset your Scholar.name account password." />
      <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center px-4 py-6">
        <div className="bg-white rounded-2xl shadow-[0_24px_60px_-20px_rgba(11,31,58,.18)] p-10 w-full max-w-[440px]">
          <div className="mb-8">
            <a href="/" className="inline-flex items-center gap-2 no-underline mb-6">
              <BookOpen className="w-6 h-6 text-midnight" />
              <span className="font-serif font-bold text-xl text-midnight">Scholar.name</span>
            </a>
            <h1 className="font-serif italic text-[28px] font-bold text-midnight m-0">
              Forgot your password?
            </h1>
            <p className="text-[#75777E] text-sm mt-2">
              Enter your email and we'll send you a reset link.
            </p>
          </div>

          {submitted ? (
            <div className="text-center py-6">
              <div className="text-5xl mb-4">✉️</div>
              <p className="font-semibold text-midnight text-base mb-2">Check your inbox</p>
              <p className="text-[#75777E] text-sm">
                If <strong>{email}</strong> is registered, a reset link is on its way.
              </p>
              <a href="/dashboard/login" className="inline-block mt-6 text-midnight text-sm font-semibold">
                ← Back to sign in
              </a>
            </div>
          ) : (
            <form
              onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
              className="flex flex-col gap-5"
            >
              <div>
                <label className="block text-[13px] font-semibold text-midnight mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@university.edu"
                  className="w-full px-3.5 py-2.5 rounded-lg border-[1.5px] border-[#D4D9E2] text-sm outline-none box-border"
                />
              </div>

              <button
                type="submit"
                disabled={mutation.isPending}
                className={`bg-midnight text-warm border-none rounded-[10px] py-3.5 text-[15px] font-bold font-serif ${mutation.isPending ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
              >
                {mutation.isPending ? "Sending…" : "Send reset link"}
              </button>

              <p className="text-center text-[13px] text-[#75777E]">
                <a href="/dashboard/login" className="text-midnight font-semibold">← Back to sign in</a>
              </p>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
