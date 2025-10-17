import { Button } from "@/components/ui/button";
import { Share2, Linkedin, Mail, QrCode } from "lucide-react";
import { FaXTwitter } from "react-icons/fa6";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface ShareButtonsProps {
  url: string;
  title: string;
  description: string;
  openalexId: string;
}

export default function ShareButtons({ url, title, description, openalexId }: ShareButtonsProps) {
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const { toast } = useToast();

  const shareUrl = url || window.location.href;
  const shareTitle = `${title} - Research Profile`;
  const shareText = description || `Check out ${title}'s research profile`;

  const handleLinkedInShare = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(linkedInUrl, '_blank', 'width=600,height=600');
  };

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=600');
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(shareTitle);
    const body = encodeURIComponent(`${shareText}\n\n${shareUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied!",
        description: "Profile URL copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please copy the URL manually",
        variant: "destructive",
      });
    }
  };

  const handleGenerateQR = async () => {
    // Generate QR code via API
    const qrUrl = `/api/researcher/${openalexId}/qr-code?url=${encodeURIComponent(shareUrl)}`;
    setQrCodeUrl(qrUrl);
    setQrDialogOpen(true);
  };

  return (
    <div className="flex flex-wrap gap-2" data-testid="section-share-buttons">
      <Button
        variant="outline"
        size="sm"
        onClick={handleLinkedInShare}
        className="gap-2"
        data-testid="button-share-linkedin"
        aria-label="Share on LinkedIn"
      >
        <Linkedin className="h-4 w-4" />
        <span className="hidden sm:inline">LinkedIn</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleTwitterShare}
        className="gap-2"
        data-testid="button-share-twitter"
        aria-label="Share on Twitter"
      >
        <FaXTwitter className="h-4 w-4" />
        <span className="hidden sm:inline">Twitter</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleEmailShare}
        className="gap-2"
        data-testid="button-share-email"
        aria-label="Share via Email"
      >
        <Mail className="h-4 w-4" />
        <span className="hidden sm:inline">Email</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleCopyLink}
        className="gap-2"
        data-testid="button-copy-link"
        aria-label="Copy link to clipboard"
      >
        <Share2 className="h-4 w-4" />
        <span className="hidden sm:inline">Copy Link</span>
      </Button>

      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateQR}
            className="gap-2"
            data-testid="button-generate-qr"
            aria-label="Generate QR code for profile"
          >
            <QrCode className="h-4 w-4" />
            <span className="hidden sm:inline">QR Code</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code for Profile</DialogTitle>
            <DialogDescription>
              Scan this QR code to share the profile at conferences or on posters
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {qrCodeUrl && (
              <img 
                src={qrCodeUrl} 
                alt="QR Code for profile" 
                className="w-64 h-64 border rounded-lg"
                data-testid="img-qr-code"
              />
            )}
            <Button
              variant="outline"
              onClick={() => {
                const link = document.createElement('a');
                link.href = qrCodeUrl;
                link.download = `${openalexId}-qr-code.png`;
                link.click();
              }}
              data-testid="button-download-qr"
            >
              Download QR Code
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
