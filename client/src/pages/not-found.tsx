import { Card, CardContent } from "@/components/ui/card";
import { FileQuestion, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import SEO from "@/components/SEO";

export default function NotFound() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <SEO title="Page Not Found — Scholar.name" description="The page you're looking for doesn't exist." />
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <FileQuestion className="h-7 w-7 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Page Not Found</h1>
          <p className="text-muted-foreground text-sm mb-6">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Button onClick={() => navigate("/")} className="gap-2">
            <Home className="h-4 w-4" />
            Go Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
