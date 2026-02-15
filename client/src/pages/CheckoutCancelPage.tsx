import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, XCircle } from "lucide-react";

export default function CheckoutCancelPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <nav className="sticky top-0 z-50 nav-premium">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center cursor-pointer" onClick={() => navigate("/")}>
              <BookOpen className="h-7 w-7 text-white mr-2" />
              <span className="text-lg font-semibold text-white">Scholar.name</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-16">
        <Card className="text-center">
          <CardHeader>
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-amber-600" />
            </div>
            <CardTitle className="text-2xl">Payment Cancelled</CardTitle>
            <CardDescription>
              Your payment was not completed. No charges were made.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">
              If you experienced any issues or have questions, please don't hesitate to contact us.
            </p>

            <div className="space-y-3">
              <Button className="w-full" onClick={() => navigate("/#pricing")} data-testid="button-try-again">
                Try Again
              </Button>
              <Button variant="outline" className="w-full" onClick={() => navigate("/contact")} data-testid="button-contact-support">
                Contact Support
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => navigate("/")} data-testid="button-back-home">
                Back to Homepage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
