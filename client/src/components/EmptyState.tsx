import { type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
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
  action,
  className = "",
  "data-testid": testId,
}: EmptyStateProps) {
  return (
    <div data-testid={testId} className={className}>
      <Card>
        <CardContent className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Icon className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
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
