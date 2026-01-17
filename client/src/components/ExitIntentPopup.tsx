import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Gift, ArrowRight } from "lucide-react";

interface ExitIntentPopupProps {
  onClose?: () => void;
}

export default function ExitIntentPopup({ onClose }: ExitIntentPopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [, navigate] = useLocation();

  const handleClose = useCallback(() => {
    setIsVisible(false);
    // Set cookie to prevent showing again for 7 days
    document.cookie = "exitIntentShown=true; max-age=604800; path=/";
    onClose?.();
  }, [onClose]);

  useEffect(() => {
    // Check if popup was already shown
    if (document.cookie.includes("exitIntentShown=true")) {
      return;
    }

    // Only show on landing page
    if (window.location.pathname !== "/") {
      return;
    }

    let timeoutId: NodeJS.Timeout;
    let hasTriggered = false;

    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger when mouse leaves from the top of the page
      if (e.clientY <= 0 && !hasTriggered) {
        hasTriggered = true;
        setIsVisible(true);
      }
    };

    // Also trigger after 30 seconds of inactivity
    const resetTimeout = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (!hasTriggered) {
          hasTriggered = true;
          setIsVisible(true);
        }
      }, 30000);
    };

    // Wait a bit before enabling the trigger
    const enableTimeout = setTimeout(() => {
      document.addEventListener("mouseleave", handleMouseLeave);
      document.addEventListener("mousemove", resetTimeout);
      document.addEventListener("scroll", resetTimeout);
      resetTimeout();
    }, 5000);

    return () => {
      clearTimeout(enableTimeout);
      clearTimeout(timeoutId);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mousemove", resetTimeout);
      document.removeEventListener("scroll", resetTimeout);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    
    try {
      // Submit to contact endpoint with minimal data
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: "Exit Intent Lead",
          email: email.trim(),
          planInterest: "interested",
          biography: "Lead captured via exit intent popup",
        }),
      });
      
      setIsSubmitted(true);
      
      // Close after showing success message
      setTimeout(() => {
        handleClose();
      }, 3000);
    } catch (error) {
      console.error("Failed to submit:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted/80 hover:bg-muted flex items-center justify-center transition-colors z-10"
          aria-label="Close popup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-primary to-primary/80 px-6 py-8 text-white text-center">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
            <Gift className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Wait! Don't miss out</h2>
          <p className="text-white/90 text-sm">
            Get founder pricing before it's gone
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {isSubmitted ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-2">You're on the list!</h3>
              <p className="text-muted-foreground text-sm">
                We'll keep you updated on special offers.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">50% off</strong> for founding members
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Lock in rates</strong> for life
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Early access</strong> to new features
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12"
                  data-testid="exit-intent-email"
                />
                <Button 
                  type="submit" 
                  className="w-full h-12 btn-premium"
                  disabled={isSubmitting}
                  data-testid="exit-intent-submit"
                >
                  {isSubmitting ? "Saving..." : (
                    <>
                      Keep Me Updated
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              <p className="text-xs text-muted-foreground text-center mt-4">
                No spam, ever. Unsubscribe anytime.
              </p>
            </>
          )}
        </div>

        {/* Skip link */}
        {!isSubmitted && (
          <div className="border-t px-6 py-4 bg-muted/30">
            <button
              onClick={() => { handleClose(); navigate('/contact'); }}
              className="text-sm text-primary hover:underline w-full text-center"
            >
              Or get started now →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
