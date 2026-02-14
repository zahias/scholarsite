import { useLocation } from "wouter";
import GlobalNav from "@/components/GlobalNav";
import GlobalFooter from "@/components/GlobalFooter";
import ResearcherProfile from "@/components/ResearcherProfile";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default function DemoPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <GlobalNav mode="landing" />

      {/* Profile Preview */}
      <div className="flex-1">
        <ResearcherProfile />
      </div>

      {/* CTA Footer */}
      <div className="bg-muted/30 border-t border-border py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Like what you see?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Create your own professional research portfolio in minutes. We'll automatically populate it from OpenAlex.
          </p>
          <Button
            size="lg"
            className="btn-premium"
            onClick={() => {
              window.scrollTo(0, 0);
              navigate("/signup");
            }}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Create Your Portfolio
          </Button>
        </div>
      </div>

      <GlobalFooter mode="landing" />
    </div>
  );
}
