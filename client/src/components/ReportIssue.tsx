import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Flag, AlertTriangle, Users, FileText, Building2, CheckCircle, Loader2, ExternalLink } from "lucide-react";

interface ReportIssueProps {
  openalexId: string;
  researcherName: string;
}

type IssueType = "wrong_person" | "wrong_publications" | "wrong_affiliation" | "missing_publications" | "other";

const issueTypes = [
  { value: "wrong_person", label: "This isn't me / wrong person", icon: Users, description: "Profile shows a different researcher" },
  { value: "wrong_publications", label: "Wrong publications listed", icon: FileText, description: "Papers I didn't author are included" },
  { value: "missing_publications", label: "Missing publications", icon: FileText, description: "My papers are not showing up" },
  { value: "wrong_affiliation", label: "Wrong affiliation", icon: Building2, description: "Institution information is incorrect" },
  { value: "other", label: "Other issue", icon: AlertTriangle, description: "Something else is wrong" },
] as const;

export default function ReportIssue({ openalexId, researcherName }: ReportIssueProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [issueType, setIssueType] = useState<IssueType | "">("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const submitMutation = useMutation({
    mutationFn: async (data: { openalexId: string; issueType: string; email: string; description: string }) => {
      const response = await fetch("/api/report-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to submit report");
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
    },
    onError: () => {
      toast({
        title: "Failed to submit",
        description: "Please try again or email us directly at support@scholar.name",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!issueType || !email || !description) {
      toast({
        title: "Please fill all fields",
        description: "All fields are required to submit a report",
        variant: "destructive",
      });
      return;
    }
    submitMutation.mutate({ openalexId, issueType, email, description });
  };

  const resetForm = () => {
    setIssueType("");
    setEmail("");
    setDescription("");
    setIsSubmitted(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-muted-foreground hover:text-foreground gap-1.5"
        >
          <Flag className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Report Issue</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        {isSubmitted ? (
          <>
            <DialogHeader>
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <DialogTitle className="text-center">Report Submitted</DialogTitle>
              <DialogDescription className="text-center">
                Thank you for letting us know. We'll review this within 24-48 hours and 
                follow up at {email}.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
              <p className="font-medium mb-2">What happens next?</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>We'll investigate the issue with OpenAlex data</li>
                <li>If the issue is in source data, we'll guide you on how to request a correction</li>
                <li>For profile-specific issues, we'll fix them directly</li>
              </ul>
            </div>
            <DialogFooter>
              <Button onClick={resetForm} className="w-full">Close</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-amber-600" />
                Report a Data Issue
              </DialogTitle>
              <DialogDescription>
                Found incorrect information on this profile? Let us know and we'll investigate. 
                Data comes from OpenAlex and may need correction at the source.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Issue Type Selection */}
              <div className="space-y-3">
                <Label>What's wrong?</Label>
                <RadioGroup 
                  value={issueType} 
                  onValueChange={(v) => setIssueType(v as IssueType)}
                  className="grid gap-2"
                >
                  {issueTypes.map((type) => (
                    <div key={type.value} className="flex items-center space-x-3">
                      <RadioGroupItem value={type.value} id={type.value} />
                      <Label 
                        htmlFor={type.value} 
                        className="flex items-center gap-2 cursor-pointer font-normal"
                      >
                        <type.icon className="w-4 h-4 text-muted-foreground" />
                        <span>{type.label}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Your email (for follow-up)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Describe the issue</Label>
                <Textarea
                  id="description"
                  placeholder={
                    issueType === "wrong_publications" 
                      ? "List the titles or DOIs of papers that shouldn't be here..."
                      : issueType === "missing_publications"
                      ? "List the titles or DOIs of your missing papers..."
                      : "Please describe what's incorrect and what the correct information should be..."
                  }
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              {/* OpenAlex Note */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm">
                <p className="text-blue-800 mb-2">
                  <strong>About data corrections:</strong>
                </p>
                <p className="text-blue-700 text-xs leading-relaxed">
                  Publication data is sourced from{" "}
                  <a 
                    href={`https://openalex.org/authors/${openalexId}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline inline-flex items-center gap-0.5"
                  >
                    OpenAlex <ExternalLink className="w-3 h-3" />
                  </a>. 
                  For major data corrections, we may need to help you submit a request to OpenAlex directly.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleSubmit} 
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Report"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
