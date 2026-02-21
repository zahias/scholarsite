import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, CheckCircle, Loader2, Mail } from "lucide-react";
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Confirming your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <SEO
        title="Payment Successful — Scholar.name"
        description="Your payment was successful. Welcome to Scholar.name."
        type="website"
      />
      <GlobalNav mode="auth" />

      <div className="max-w-lg mx-auto px-4 py-16">
        <Card className="text-center">
          <CardHeader>
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Payment Successful!</CardTitle>
            <CardDescription>
              Welcome to Scholar.name. Your research portfolio is being set up.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {paymentStatus && (
              <div className="bg-muted/50 rounded-lg p-4 text-left">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Order Number:</span>
                  <span className="font-medium">{paymentStatus.orderNumber}</span>
                  <span className="text-muted-foreground">Plan:</span>
                  <span className="font-medium capitalize">{paymentStatus.plan}</span>
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-medium">${paymentStatus.amount} USD</span>
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium text-green-600 capitalize">{paymentStatus.status}</span>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 text-left bg-blue-50 rounded-lg p-4">
              <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">Check your email</p>
                <p className="text-blue-700">
                  We've sent setup instructions to your email. Follow them to customize your portfolio.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Button className="w-full" onClick={() => navigate("/")} data-testid="button-go-home">
                Go to Homepage
              </Button>
              <Button variant="outline" className="w-full" onClick={() => navigate("/contact")} data-testid="button-need-help">
                Need Help?
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
