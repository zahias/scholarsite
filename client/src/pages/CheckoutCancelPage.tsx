import { useLocation } from "wouter";
import GlobalNav from "@/components/GlobalNav";
import SEO from "@/components/SEO";
import { XCircle, ArrowLeft, MessageCircle } from "lucide-react";

export default function CheckoutCancelPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      <SEO
        title="Payment Cancelled — Scholar.name"
        description="Your payment was cancelled. No charges were made."
        type="website"
      />
      <GlobalNav mode="auth" />

      <div className="max-w-[500px] mx-auto px-6 pt-20 pb-12">
        <div className="bg-white rounded-[20px] border border-midnight/[.08] shadow-[0_20px_60px_-20px_rgba(11,31,58,.12)] px-10 pt-11 pb-10 text-center">

          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-[#F0F4F8] border border-midnight/[.08] grid place-items-center mx-auto mb-6">
            <XCircle size={28} className="text-midnight opacity-50" />
          </div>

          <h1 className="font-serif font-medium text-midnight mb-2.5 tracking-[-0.015em]" style={{ fontSize: "clamp(22px,3vw,30px)" }}>
            Payment Cancelled
          </h1>
          <p className="text-[15px] text-[#44474D] leading-relaxed mb-7">
            Your payment was not completed. No charges were made to your account.
          </p>

          {/* Divider */}
          <div className="h-px bg-midnight/[.06] mb-7" />

          <p className="text-sm text-[#75777E] leading-relaxed mb-8">
            If you experienced any issues or have questions about our plans, we're happy to help.
          </p>

          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => navigate("/pricing")}
              className="w-full px-5 py-3 bg-warm text-on-secondary-container border-none rounded-[10px] text-[14.5px] font-bold cursor-pointer"
              data-testid="button-try-again"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate("/contact")}
              className="w-full px-5 py-3 bg-white text-midnight border border-midnight/[.14] rounded-[10px] text-[14.5px] font-semibold cursor-pointer flex items-center justify-center gap-1.5"
              data-testid="button-contact-support"
            >
              <MessageCircle size={15} /> Contact Support
            </button>
            <button
              onClick={() => navigate("/")}
              className="w-full px-5 py-3 bg-transparent text-[#75777E] border-none rounded-[10px] text-sm font-medium cursor-pointer flex items-center justify-center gap-1.5"
              data-testid="button-back-home"
            >
              <ArrowLeft size={14} /> Back to Homepage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
