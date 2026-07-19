import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Loader2, Mail, ArrowRight, MessageCircle } from "lucide-react";
import GlobalNav from "@/components/GlobalNav";
import SEO from "@/components/SEO";

export default function CheckoutSuccessPage() {
  const [, navigate] = useLocation();
  const urlParams = new URLSearchParams(window.location.search);
  const orderNumber = urlParams.get("order");

  const { data: paymentStatus, isLoading } = useQuery<{
    orderNumber: string;
    status: string;
    plan: string;
    amount: string;
  }>({
    queryKey: ["/api/checkout/status", orderNumber],
    queryFn: async () => {
      const response = await fetch(`/api/checkout/status/${orderNumber}`);
      if (!response.ok) throw new Error("Failed to fetch payment status");
      return response.json();
    },
    enabled: !!orderNumber,
    refetchInterval: (query) => {
      if (query.state.data?.status === "completed") return false;
      return 3000;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="text-warm animate-spin mx-auto mb-4 block" />
          <p className="text-[#44474D] text-[15px]">Confirming your payment…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      <SEO
        title="Payment Successful — Scholar.name"
        description="Your payment was successful. Welcome to Scholar.name."
        type="website"
      />
      <GlobalNav mode="auth" />

      <div className="max-w-[520px] mx-auto px-6 pt-20 pb-12">
        <div className="bg-white rounded-[20px] border border-midnight/[.08] shadow-[0_20px_60px_-20px_rgba(11,31,58,.12)] px-10 pt-11 pb-10 text-center">

          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-warm/15 border border-warm/30 grid place-items-center mx-auto mb-6">
            <CheckCircle size={28} className="text-warm" />
          </div>

          <h1 className="font-serif font-medium text-midnight mb-2.5 tracking-[-0.015em]" style={{ fontSize: "clamp(22px,3vw,30px)" }}>
            Payment Successful!
          </h1>
          <p className="text-[15px] text-[#44474D] leading-relaxed mb-7">
            Welcome to Scholar.name. Your research portfolio is being set up.
          </p>

          {/* Order details */}
          {paymentStatus && (
            <div className="bg-[#F0F4F8] rounded-xl px-5 py-4 mb-5 text-left">
              <div className="grid grid-cols-2 gap-y-2 text-[13.5px]">
                <span className="text-[#75777E]">Order Number</span>
                <span className="text-midnight font-semibold text-right">{paymentStatus.orderNumber}</span>
                <span className="text-[#75777E]">Plan</span>
                <span className="text-midnight font-semibold text-right capitalize">{paymentStatus.plan}</span>
                <span className="text-[#75777E]">Amount</span>
                <span className="text-midnight font-semibold text-right">${paymentStatus.amount} USD</span>
                <span className="text-[#75777E]">Status</span>
                <span className="text-[#059669] font-semibold text-right capitalize">{paymentStatus.status}</span>
              </div>
            </div>
          )}

          {/* Email notice — navy callout */}
          <div className="bg-midnight rounded-xl px-5 py-4 mb-7 text-left relative overflow-hidden">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse at 85% 0%, rgba(255,199,46,.18), transparent 60%)" }}
            />
            <div className="relative flex items-start gap-3">
              <Mail size={17} className="text-warm shrink-0 mt-px" />
              <div>
                <p className="text-[13.5px] font-semibold text-white mb-[3px]">Check your email</p>
                <p className="text-[13px] text-white/70 leading-normal m-0">
                  We've sent setup instructions to your email. Follow them to customize your portfolio.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => navigate("/")}
              className="w-full px-5 py-3 bg-warm text-on-secondary-container border-none rounded-[10px] text-[14.5px] font-bold cursor-pointer flex items-center justify-center gap-1.5"
              data-testid="button-go-home"
            >
              Go to Homepage <ArrowRight size={15} />
            </button>
            <button
              onClick={() => navigate("/contact")}
              className="w-full px-5 py-3 bg-white text-midnight border border-midnight/[.14] rounded-[10px] text-[14.5px] font-semibold cursor-pointer flex items-center justify-center gap-1.5"
              data-testid="button-need-help"
            >
              <MessageCircle size={15} /> Need Help?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
