import { type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  headingLevel?: "h1" | "h2" | "h3";
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  "data-testid"?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  headingLevel = "h2",
  action,
  className = "",
  "data-testid": testId,
}: EmptyStateProps) {
  const Heading = headingLevel;

  return (
    <div data-testid={testId} className={className}>
      <Card className="empty-state-panel">
        <CardContent className="px-8 py-10 text-center">
          <div className="empty-state-icon mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
            <Icon className="h-6 w-6" />
          </div>
          <Heading className="text-xl font-semibold mb-2 font-serif text-primary-container">{title}</Heading>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            {description}
          </p>
          {action && (
            <Button
              variant="outline"
              onClick={action.onClick}
              className="mt-4"
            >
              {action.label}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
